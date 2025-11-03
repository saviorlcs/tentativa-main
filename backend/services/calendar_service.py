"""
Serviço de calendário.
Contém lógica para autocompletar eventos baseado em sessões de estudo.
"""
from datetime import datetime, timezone, timedelta
from typing import Optional
import logging

from database import db
from services.reward_service import _week_bounds_utc

logger = logging.getLogger("pomociclo")


def _expand_tolerance(
    start: datetime,
    end: datetime,
    tolerance_minutes: int = 60
) -> tuple[datetime, datetime]:
    """
    Expande janela de tempo com tolerância.
    
    Args:
        start: Início da janela
        end: Fim da janela
        tolerance_minutes: Minutos de tolerância
    
    Returns:
        tuple: (início expandido, fim expandido)
    """
    return (
        start - timedelta(minutes=tolerance_minutes),
        end + timedelta(minutes=tolerance_minutes)
    )


def _overlap_minutes(
    a_start: datetime,
    a_end: datetime,
    b_start: datetime,
    b_end: datetime
) -> int:
    """
    Calcula minutos de sobreposição entre duas janelas de tempo.
    
    Args:
        a_start: Início da janela A
        a_end: Fim da janela A
        b_start: Início da janela B
        b_end: Fim da janela B
    
    Returns:
        int: Minutos de sobreposição
    """
    s = max(a_start, b_start)
    e = min(a_end, b_end)
    if e <= s:
        return 0
    return int((e - s).total_seconds() // 60)


async def _subject_week_minutes(
    user_id: str,
    subject_id: str,
    until: Optional[datetime] = None
) -> int:
    """
    Minutos estudados da matéria nesta semana (segunda 00:00) até 'until' (ou agora).
    
    Args:
        user_id: ID do usuário
        subject_id: ID da matéria
        until: Data limite (padrão: agora)
    
    Returns:
        int: Total de minutos estudados
    """
    now = until or datetime.now(timezone.utc)
    week_start, week_end = _week_bounds_utc(now)
    # Limita janela até 'until'
    hi = min(week_end, now)
    
    sessions = await db.study_sessions.find(
        {"user_id": user_id, "completed": True, "subject_id": subject_id},
        {"_id": 0, "start_time": 1, "duration": 1}
    ).to_list(10000)
    
    total = 0
    for s in sessions:
        try:
            st = datetime.fromisoformat(s["start_time"])
            dur = int(s.get("duration", 0))
            # Sessão considerada no intervalo [week_start, hi)
            endt = st + timedelta(minutes=dur)
            total += _overlap_minutes(week_start, hi, st, endt)
        except Exception:
            pass
    
    return total


async def _effective_minutes_in_window(
    user_id: str,
    window_start: datetime,
    window_end: datetime,
    subject_id: Optional[str]
) -> int:
    """
    Soma dos minutos 'efetivos' na janela.
    Pausas contam: ajusta estudo com fator (study+break)/study.
    Se subject_id for None, considera todas as matérias.
    
    Args:
        user_id: ID do usuário
        window_start: Início da janela
        window_end: Fim da janela
        subject_id: ID da matéria (None = todas)
    
    Returns:
        int: Minutos efetivos
    """
    # Fator de pausa
    cfg = await db.user_settings.find_one({"user_id": user_id}, {"_id": 0})
    study_len = int(cfg.get("study_duration", 50)) if cfg else 50
    break_len = int(cfg.get("break_duration", 10)) if cfg else 10
    factor = (study_len + break_len) / max(1, study_len)

    q = {"user_id": user_id, "completed": True}
    if subject_id:
        q["subject_id"] = subject_id

    sessions = await db.study_sessions.find(
        q,
        {"_id": 0, "start_time": 1, "duration": 1}
    ).to_list(10000)
    
    total = 0
    for s in sessions:
        try:
            st = datetime.fromisoformat(s["start_time"])
            dur = int(s.get("duration", 0))
            endt = st + timedelta(minutes=dur)
            ov = _overlap_minutes(window_start, window_end, st, endt)
            total += ov
        except Exception:
            pass
    
    return int(total * factor)


async def _try_autocomplete_events(
    user_id: str,
    subject_id: Optional[str],
    session_start: datetime,
    session_end: datetime
):
    """
    Verifica eventos do usuário que se sobrepõem à janela [session_start-1h, session_end+1h]
    e marca como concluído se atender:
      Regra 1: minutos_efetivos >= 75% da duração do evento; OU
      Regra 2: (se tem subject_id) a meta semanal daquela matéria foi alcançada dentro da janela ±1h.
    
    Args:
        user_id: ID do usuário
        subject_id: ID da matéria (pode ser None)
        session_start: Início da sessão de estudo
        session_end: Fim da sessão de estudo
    """
    # Janela "grande" para filtrar eventos candidatos
    ws, we = _expand_tolerance(session_start, session_end, 60)

    # Pega eventos que tocam essa janela
    candidates = await db.calendar_events.find(
        {
            "user_id": user_id,
            "$or": [
                {"start": {"$lte": we.isoformat()}, "end": {"$gte": ws.isoformat()}},
                {"start": {"$gte": ws.isoformat(), "$lte": we.isoformat()}},
            ],
        },
        {"_id": 0}
    ).to_list(1000)

    for ev in candidates:
        if ev.get("completed"):
            continue

        ev_start = datetime.fromisoformat(ev["start"])
        ev_end = datetime.fromisoformat(ev["end"])
        # Janela de tolerância do próprio evento
        ev_ws, ev_we = _expand_tolerance(ev_start, ev_end, 60)

        # Minutos efetivos na janela (respeita subject_id se houver)
        eff = await _effective_minutes_in_window(
            user_id, ev_ws, ev_we, ev.get("subject_id")
        )
        ev_duration = max(0, int((ev_end - ev_start).total_seconds() // 60))

        rule1_ok = (eff >= int(0.75 * ev_duration))

        rule2_ok = False
        if ev.get("subject_id"):
            # Minutos semanais ANTES e DEPOIS, recortando por 'limites' da janela do evento
            before = await _subject_week_minutes(user_id, ev["subject_id"], until=ev_ws)
            after = await _subject_week_minutes(user_id, ev["subject_id"], until=ev_we)

            subj = await db.subjects.find_one(
                {"id": ev["subject_id"], "user_id": user_id},
                {"_id": 0, "time_goal": 1}
            )
            goal = int(subj.get("time_goal", 0)) if subj else 0
            # Atingiu a meta dentro da janela (antes < goal <= depois)
            rule2_ok = (goal > 0 and before < goal <= after)

        if rule1_ok or rule2_ok:
            await db.calendar_events.update_one(
                {"id": ev["id"], "user_id": user_id},
                {"$set": {"completed": True}}
            )
