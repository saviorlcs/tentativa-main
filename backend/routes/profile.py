"""
Rotas de perfil do usuário.
Gerencia estatísticas, calendário de consistência, nickname, e aparência.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid

from database import db
from dependencies import get_current_user
from services.reward_service import _xp_curve_per_level

router = APIRouter(prefix="/profile")


class NicknameTagCreate(BaseModel):
    """Payload para criar/atualizar nickname."""
    nickname: str
    tag: str


class AppearanceUpdate(BaseModel):
    """Payload para atualizar aparência do usuário."""
    avatar: Optional[str] = None
    banner: Optional[str] = None
    bio: Optional[str] = None


@router.get("/{user_id}/stats")
async def get_profile_stats(
    user_id: str,
    period: str = Query(default="30d", pattern="^(7d|14d|30d|90d|180d|360d|all)$"),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna estatísticas do perfil de um usuário.
    Usuário deve estar logado. Pode ver próprio perfil ou de amigos.
    
    Args:
        user_id: ID do usuário
        period: Período de análise (7d, 14d, 30d, 90d, 180d, 360d, all)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Estatísticas do usuário
    
    Raises:
        HTTPException: 404 se usuário não encontrado
    """
    # Verifica se está logado
    me = await get_current_user(request, session_token)
    
    # Busca o usuário alvo
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Calcula período em dias
    period_days_map = {
        "7d": 7,
        "14d": 14,
        "30d": 30,
        "90d": 90,
        "180d": 180,
        "360d": 360,
        "all": 36500  # ~100 anos
    }
    days = period_days_map.get(period, 30)
    
    # Data de início do período
    now = datetime.now(timezone.utc)
    start_date = now - timedelta(days=days)
    start_iso = start_date.isoformat()
    
    # Busca todas as sessões completas no período
    sessions = await db.study_sessions.find(
        {
            "user_id": user_id,
            "completed": True,
            "start_time": {"$gte": start_iso}
        },
        {"_id": 0, "start_time": 1, "duration": 1, "skipped": 1, "subject_id": 1}
    ).to_list(100000)
    
    # Calcula estatísticas
    total_minutes = 0
    blocks_completed = 0
    active_dates = set()
    subject_minutes = {}  # Para calcular matéria mais estudada
    
    for session in sessions:
        duration = int(session.get("duration", 0))
        skipped = session.get("skipped", False)
        subject_id = session.get("subject_id")
        
        total_minutes += duration
        
        # Acumula minutos por matéria
        if subject_id:
            subject_minutes[subject_id] = subject_minutes.get(subject_id, 0) + duration
        
        # Bloco completo = sessão completa e não pulada
        if not skipped:
            blocks_completed += 1
        
        # Extrai data (sem hora) para contar dias únicos
        try:
            start_time = datetime.fromisoformat(session["start_time"])
            date_only = start_time.date().isoformat()
            active_dates.add(date_only)
        except:
            pass
    
    active_days = len(active_dates)
    average_per_day = (total_minutes / active_days) if active_days > 0 else 0
    
    # Encontra a matéria mais estudada
    most_studied = None
    if subject_minutes:
        most_studied_id = max(subject_minutes, key=subject_minutes.get)
        most_studied_minutes = subject_minutes[most_studied_id]
        
        # Busca informações da matéria
        subject_doc = await db.subjects.find_one(
            {"id": most_studied_id, "user_id": user_id},
            {"_id": 0, "name": 1}
        )
        
        if subject_doc:
            most_studied = {
                "name": subject_doc.get("name", "Desconhecida"),
                "minutes": most_studied_minutes
            }
    
    # Busca streak atual do usuário
    streak_days = int(target_user.get("streak_days", 0))
    
    # Busca ciclos completos no período
    cycles = await db.cycles.find(
        {
            "user_id": user_id,
            "status": "completed",
            "week_start": {"$gte": start_iso}
        },
        {"_id": 0}
    ).to_list(10000)
    
    # Conta apenas ciclos que atingiram 100% da meta
    cycles_completed = 0
    for cycle in cycles:
        goal = cycle.get("total_time_goal", 0)
        studied = cycle.get("total_time_studied", 0)
        if goal > 0 and studied >= goal:
            cycles_completed += 1
    
    # Calcula XP necessário para próximo nível
    current_level = target_user.get("level", 1)
    current_xp = target_user.get("xp", 0)
    xp_for_next = _xp_curve_per_level(current_level)
    
    return {
        "user": {
            "id": target_user["id"],
            "nickname": target_user.get("nickname"),
            "tag": target_user.get("tag"),
            "name": target_user.get("name"),
            "avatar": target_user.get("avatar") or target_user.get("picture"),
            "level": current_level,
            "xp": current_xp,
            "xp_for_next_level": xp_for_next,
            "coins": target_user.get("coins", 0)
        },
        "stats": {
            "total_focus_time_minutes": total_minutes,
            "total_focus_time_hours": round(total_minutes / 60, 1),
            "streak_days": streak_days,
            "active_days": active_days,
            "average_per_day_minutes": round(average_per_day, 1),
            "cycles_completed": cycles_completed,
            "blocks_completed": blocks_completed,
            "most_studied_subject": most_studied
        },
        "period": period,
        "period_days": days
    }


@router.get("/{user_id}/calendar")
async def get_profile_calendar(
    user_id: str,
    year: int = Query(default=None),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna dados do calendário de consistência (heatmap) para o ano especificado.
    
    Args:
        user_id: ID do usuário
        year: Ano para buscar dados (padrão: ano atual)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Dados do calendário por dia
    
    Raises:
        HTTPException: 404 se usuário não encontrado
    """
    # Verifica se está logado
    me = await get_current_user(request, session_token)
    
    # Busca o usuário alvo
    target_user = await db.users.find_one({"id": user_id}, {"_id": 0, "id": 1})
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Ano padrão = ano atual
    if year is None:
        year = datetime.now(timezone.utc).year
    
    # Datas de início e fim do ano
    start_of_year = datetime(year, 1, 1, tzinfo=timezone.utc)
    end_of_year = datetime(year, 12, 31, 23, 59, 59, tzinfo=timezone.utc)
    
    start_iso = start_of_year.isoformat()
    end_iso = end_of_year.isoformat()
    
    # Busca todas as sessões do ano
    sessions = await db.study_sessions.find(
        {
            "user_id": user_id,
            "completed": True,
            "start_time": {"$gte": start_iso, "$lte": end_iso}
        },
        {"_id": 0, "start_time": 1, "duration": 1}
    ).to_list(100000)
    
    # Agrupa por data
    days_data = {}
    for session in sessions:
        try:
            start_time = datetime.fromisoformat(session["start_time"])
            date_only = start_time.date().isoformat()
            duration = int(session.get("duration", 0))
            
            if date_only not in days_data:
                days_data[date_only] = 0
            days_data[date_only] += duration
        except:
            pass
    
    # Converte para lista
    days_list = [
        {"date": date, "minutes": minutes}
        for date, minutes in sorted(days_data.items())
    ]
    
    return {
        "year": year,
        "days": days_list,
        "total_days_active": len(days_list)
    }


@router.get("/export")
async def export_profile_data(
    format: str = Query(default="json", pattern="^(json|csv)$"),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Exporta todos os dados do perfil do usuário logado.
    
    Args:
        format: Formato de exportação (json ou csv)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Todos os dados do usuário
    """
    user = await get_current_user(request, session_token)
    
    # Busca todos os dados do usuário
    user_data = await db.users.find_one({"id": user.id}, {"_id": 0})
    subjects = await db.subjects.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    sessions = await db.study_sessions.find({"user_id": user.id}, {"_id": 0}).to_list(10000)
    tasks = await db.tasks.find({"user_id": user.id}, {"_id": 0}).to_list(1000)
    settings = await db.user_settings.find_one({"user_id": user.id}, {"_id": 0})
    calendar_events = await db.calendar_events.find({"user_id": user.id}, {"_id": 0}).to_list(10000)
    
    export_data = {
        "user": user_data,
        "subjects": subjects,
        "study_sessions": sessions,
        "tasks": tasks,
        "settings": settings,
        "calendar_events": calendar_events,
        "exported_at": datetime.now(timezone.utc).isoformat()
    }
    
    return export_data


@router.post("/nickname")
async def create_or_update_nickname(
    input: NicknameTagCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria ou atualiza nickname#tag do usuário.
    Permite alteração apenas a cada 30 dias.
    
    Args:
        input: Dados do nickname (nickname, tag)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True, "nickname": str, "tag": str}
    
    Raises:
        HTTPException: 400 se já existe ou mudança recente
    """
    user = await get_current_user(request, session_token)
    
    # Verifica se já existe outro usuário com esse nickname#tag
    existing = await db.users.find_one({
        "nickname": {"$regex": f"^{input.nickname}$", "$options": "i"},
        "tag": {"$regex": f"^{input.tag}$", "$options": "i"},
        "id": {"$ne": user.id}
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Nickname#tag já está em uso")
    
    # Verifica cooldown de 30 dias
    if user.last_nickname_change:
        last_change = user.last_nickname_change
        if isinstance(last_change, str):
            last_change = datetime.fromisoformat(last_change)
        
        days_since = (datetime.now(timezone.utc) - last_change).days
        if days_since < 30:
            raise HTTPException(
                status_code=400,
                detail=f"Você só pode mudar o nickname a cada 30 dias. Faltam {30 - days_since} dias."
            )
    
    # Atualiza nickname
    await db.users.update_one(
        {"id": user.id},
        {
            "$set": {
                "nickname": input.nickname,
                "tag": input.tag,
                "last_nickname_change": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    return {"ok": True, "nickname": input.nickname, "tag": input.tag}


@router.get("/nickname/check")
async def check_nickname_available(nickname: str, tag: str):
    """
    Verifica se um nickname#tag está disponível.
    
    Args:
        nickname: Nickname desejado
        tag: Tag desejada
    
    Returns:
        dict: {"available": bool}
    """
    existing = await db.users.find_one({
        "nickname": {"$regex": f"^{nickname}$", "$options": "i"},
        "tag": {"$regex": f"^{tag}$", "$options": "i"}
    })
    
    return {"available": existing is None}


@router.get("/appearance")
async def get_user_appearance(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna dados de aparência do usuário (avatar, banner, bio).
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Dados de aparência
    """
    user = await get_current_user(request, session_token)
    
    user_doc = await db.users.find_one(
        {"id": user.id},
        {"_id": 0, "avatar": 1, "picture": 1, "banner": 1, "bio": 1}
    )
    
    return {
        "avatar": user_doc.get("avatar") or user_doc.get("picture"),
        "banner": user_doc.get("banner"),
        "bio": user_doc.get("bio")
    }


@router.patch("/appearance")
async def save_user_appearance(
    body: AppearanceUpdate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza dados de aparência do usuário.
    
    Args:
        body: Dados para atualizar
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    """
    user = await get_current_user(request, session_token)
    
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    
    if update_data:
        await db.users.update_one(
            {"id": user.id},
            {"$set": update_data}
        )
    
    return {"ok": True}
