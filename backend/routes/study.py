"""
Rotas de sessões de estudo.
Gerencia início, fim e estado de sessões de estudo com timer.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from typing import Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import logging

from database import db
from dependencies import get_current_user
from models.study import StudySession
from services.reward_service import (
    _get_user_settings_minutes,
    _week_minutes_accumulated,
    _fatigue_multiplier,
    _completion_multiplier,
    _update_and_get_streak,
    _streak_multiplier,
    _softcap_multiplier,
    _coins_raw,
    _session_xp_raw,
    _apply_mults,
    _xp_curve_per_level
)
from services.calendar_service import _try_autocomplete_events
from services.quest_service import update_weekly_quests_after_study

logger = logging.getLogger("pomociclo")

router = APIRouter(prefix="/study")


class StudySessionStart(BaseModel):
    """Payload para iniciar sessão de estudo."""
    subject_id: str


class StudySessionEnd(BaseModel):
    """Payload para finalizar sessão de estudo."""
    session_id: str
    duration: int  # minutos efetivos estudados
    skipped: bool = False


class TimerStateBody(BaseModel):
    """Payload para atualizar estado do timer."""
    state: Optional[str] = None  # "focus" | "break" | "paused" | None
    seconds_left: Optional[int] = None
    subject_id: Optional[str] = None


def utcnow():
    """Retorna datetime UTC atual."""
    return datetime.now(timezone.utc)


@router.post("/start", response_model=StudySession)
async def start_study_session(
    input: StudySessionStart,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Inicia uma nova sessão de estudo.
    Atualiza status do usuário para online e configura timer.
    
    Args:
        input: Dados da sessão (subject_id)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        StudySession: Sessão criada
    """
    user = await get_current_user(request, session_token)

    session = StudySession(
        user_id=user.id,
        subject_id=input.subject_id,
        start_time=datetime.now(timezone.utc)
    )
    
    session_dict = session.model_dump()
    session_dict["start_time"] = session_dict["start_time"].isoformat()
    if session_dict.get("end_time"):
        session_dict["end_time"] = session_dict["end_time"].isoformat()

    await db.study_sessions.insert_one(session_dict)

    # Status online + snapshot do que está estudando
    block_minutes = await _get_user_settings_minutes(user.id)
    est_end = datetime.now(timezone.utc) + timedelta(minutes=block_minutes)

    await db.users.update_one(
        {"id": user.id},
        {"$set": {
            "online_status": "online",
            "active_session": {
                "session_id": session.id,
                "subject_id": input.subject_id,
                "start_time": session_dict["start_time"],
                "estimated_end": est_end.isoformat(),
                "timer": {
                    "state": "focus",
                    "phase_until": est_end.isoformat(),
                    "seconds_left": int(block_minutes * 60),
                }
            }
        }},
        upsert=True
    )

    return session


@router.get("/recent-sessions")
async def get_recent_study_sessions(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna as sessões de estudo recentes do usuário (últimas 10 completadas).
    Enriquece com o nome da matéria.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        list: Lista de sessões recentes com nome da matéria
    """
    user = await get_current_user(request, session_token)
    
    # Busca as últimas 10 sessões completadas, ordenadas por data
    sessions = await db.study_sessions.find(
        {"user_id": user.id, "completed": True},
        {"_id": 0}
    ).sort("start_time", -1).limit(10).to_list(10)
    
    # Enriquece com o nome da matéria
    for session in sessions:
        if session.get("subject_id"):
            subject = await db.subjects.find_one(
                {"id": session["subject_id"], "user_id": user.id},
                {"_id": 0, "name": 1}
            )
            session["subject_name"] = subject.get("name") if subject else "Matéria desconhecida"
        else:
            session["subject_name"] = "Sem matéria"
    
    return sessions


@router.post("/end")
async def end_study_session(
    input: StudySessionEnd,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Finaliza uma sessão de estudo.
    Calcula recompensas, atualiza matéria, usuário e quests.
    Tenta autocompletar eventos do calendário.
    
    Args:
        input: Dados de finalização (session_id, duration, skipped)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Resultado com recompensas ganhas
    
    Raises:
        HTTPException: 404 se sessão não encontrada
    """
    user = await get_current_user(request, session_token)

    # Busca a sessão
    session = await db.study_sessions.find_one(
        {"id": input.session_id, "user_id": user.id}
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # --- NOVA FÓRMULA DE RECOMPENSAS ---
    duration = max(0, int(input.duration))
    block_minutes = await _get_user_settings_minutes(user.id)

    NINETY = int(block_minutes * 0.9)
    counted_duration = duration
    completed_flag = not input.skipped

    if input.skipped and duration >= NINETY:
        # Conta só 90% e considera "completed"
        counted_duration = NINETY
        completed_flag = True

    # Usa counted_duration + completed_flag no resto
    week_before = await _week_minutes_accumulated(user.id)
    fatigue_mult = _fatigue_multiplier(counted_duration)
    completion_mult = _completion_multiplier(counted_duration, block_minutes, not completed_flag)
    streak_days = await _update_and_get_streak(
        user.id,
        counted_duration if completed_flag else 0
    )
    streak_mult = _streak_multiplier(streak_days)
    softcap_mult = _softcap_multiplier(week_before)

    coins_base = _coins_raw(counted_duration)
    xp_base = _session_xp_raw(counted_duration, block_minutes)

    coins = _apply_mults(coins_base, completion_mult, fatigue_mult, streak_mult, softcap_mult)
    xp = _apply_mults(xp_base, completion_mult, fatigue_mult, streak_mult)

    await db.study_sessions.update_one(
        {"id": input.session_id},
        {"$set": {
            "end_time": datetime.now(timezone.utc).isoformat(),
            "duration": int(counted_duration),
            "completed": bool(completed_flag),
            "skipped": bool(input.skipped),
            "coins_earned": int(coins),
            "xp_earned": int(xp)
        }}
    )

    # Limpar estado de sessão ativa do usuário
    await db.users.update_one(
        {"id": user.id},
        {"$unset": {"active_session": ""}}
    )
    # --- FIM NOVA FÓRMULA ---

    # Auto-completar eventos de agenda (±1h)
    subject_id = session.get("subject_id")
    try:
        st_iso = session.get("start_time")
        st = datetime.fromisoformat(st_iso) if st_iso else datetime.now(timezone.utc) - timedelta(minutes=duration)
        en = st + timedelta(minutes=duration)
        await _try_autocomplete_events(user.id, subject_id, st, en)
    except Exception as _e:
        logger.warning(f"calendar autocompletion warn: {_e}")

    # Atualiza a matéria
    if subject_id:
        await db.subjects.update_one(
            {"id": subject_id, "user_id": user.id},
            {
                "$inc": {
                    "time_spent": (duration if not input.skipped else 0),
                    "sessions_count": (0 if input.skipped else 1),
                },
                "$setOnInsert": {"created_at": datetime.now(timezone.utc).isoformat()}
            },
            upsert=True
        )

    # Atualiza usuário (coins/xp/level)
    if coins or xp:
        udoc = await db.users.find_one({"id": user.id}, {"_id": 0}) or {
            "id": user.id, "coins": 0, "xp": 0, "level": 1
        }
        new_xp = int(udoc.get("xp", 0)) + int(xp)
        new_lvl = int(udoc.get("level", 1))
        need_xp = _xp_curve_per_level(new_lvl)
        
        while new_xp >= need_xp:
            new_xp -= need_xp
            new_lvl += 1
            need_xp = _xp_curve_per_level(new_lvl)

        await db.users.update_one(
            {"id": user.id},
            {
                "$inc": {"coins": int(coins)},
                "$set": {"xp": int(new_xp), "level": int(new_lvl)}
            },
            upsert=True
        )

    # Atualiza quests semanais
    try:
        await update_weekly_quests_after_study(
            user_id=user.id,
            subject_id=subject_id,
            duration=duration,
            completed=not input.skipped
        )
    except Exception as e:
        logger.warning(f"update_weekly_quests_after_study warning: {e}")

    # Resposta
    return {
        "ok": True,
        "session_id": input.session_id,
        "coins_earned": int(coins),
        "xp_earned": int(xp),
        "skipped": bool(input.skipped),
    }


@router.post("/timer/state")
async def study_timer_state(
    body: TimerStateBody,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza o estado do timer de estudo do usuário.
    Mantém sincronização do estado focus/break/paused.
    
    Args:
        body: Estado do timer
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    """
    user = await get_current_user(request, session_token)

    update = {
        "active_session.timer.state": body.state,
        "active_session.timer.updated_at": utcnow(),
        "last_activity": datetime.now(timezone.utc).isoformat(),
    }
    
    # (opcional) se você também quiser atualizar a matéria aqui:
    if body.subject_id:
        update["active_session.subject_id"] = body.subject_id

    if body.state == "paused":
        # Congela no backend
        if body.seconds_left is not None and body.seconds_left >= 0:
            update["active_session.timer.seconds_left"] = int(body.seconds_left)
        update["active_session.timer.phase_until"] = None
    else:
        # focus/break: ancora com hora absoluta
        secs = max(0, int(body.seconds_left or 0))
        update["active_session.timer.seconds_left"] = secs
        update["active_session.timer.phase_until"] = (
            datetime.now(timezone.utc) + timedelta(seconds=secs)
        ).isoformat()

    await db.users.update_one(
        {"id": user.id},
        {"$set": update},
        upsert=True
    )
    
    return {"ok": True}
