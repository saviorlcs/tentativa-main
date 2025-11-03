"""
Rotas de Estatísticas.
Retorna estatísticas gerais do usuário.
"""
from fastapi import APIRouter, Request, Cookie
from typing import Optional
from datetime import datetime, timezone, timedelta

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/stats")


@router.get("")
async def get_user_stats(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna estatísticas gerais do usuário.
    
    Returns:
        dict: {
            "total_study_time": int (minutos),
            "sessions_completed": int,
            "current_streak": int (dias),
            "subjects_count": int,
            "quests_completed": int,
            "habits_count": int,
            "level": int,
            "xp": int,
            "coins": int
        }
    """
    user = await get_current_user(request, session_token)
    
    # Dados básicos do usuário
    user_data = await db.users.find_one({"id": user.id}, {"_id": 0})
    
    # Total de tempo de estudo
    total_minutes = 0
    sessions = await db.study_sessions.find({"user_id": user.id}).to_list(10000)
    for session in sessions:
        if session.get("duration"):
            total_minutes += session["duration"]
    
    # Número de sessões completadas
    sessions_completed = len([s for s in sessions if s.get("completed")])
    
    # Streak atual (dias consecutivos de estudo)
    streak = await calculate_current_streak(user.id)
    
    # Contagem de matérias
    subjects_count = await db.subjects.count_documents({"user_id": user.id})
    
    # Quests completadas
    quests_completed = await db.user_quests.count_documents({
        "user_id": user.id,
        "completed": True
    })
    
    # Hábitos ativos
    habits_count = await db.habits.count_documents({"user_id": user.id})
    
    return {
        "total_study_time": total_minutes,
        "total_study_hours": round(total_minutes / 60, 1),
        "sessions_completed": sessions_completed,
        "current_streak": streak,
        "subjects_count": subjects_count,
        "quests_completed": quests_completed,
        "habits_count": habits_count,
        "level": user_data.get("level", 1),
        "xp": user_data.get("xp", 0),
        "coins": user_data.get("coins", 0)
    }


async def calculate_current_streak(user_id: str) -> int:
    """
    Calcula o streak atual de dias consecutivos de estudo.
    
    Args:
        user_id: ID do usuário
    
    Returns:
        int: Número de dias consecutivos
    """
    from datetime import date, timedelta
    
    # Busca sessões dos últimos 365 dias, ordenadas por data decrescente
    one_year_ago = datetime.now(timezone.utc) - timedelta(days=365)
    
    sessions = await db.study_sessions.find({
        "user_id": user_id,
        "start_time": {"$gte": one_year_ago.isoformat()}
    }).sort("start_time", -1).to_list(10000)
    
    if not sessions:
        return 0
    
    # Extrai datas únicas
    dates_studied = set()
    for session in sessions:
        if session.get("start_time"):
            start = datetime.fromisoformat(session["start_time"])
            dates_studied.add(start.date())
    
    if not dates_studied:
        return 0
    
    # Ordena datas
    sorted_dates = sorted(dates_studied, reverse=True)
    
    # Verifica se estudou hoje ou ontem
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    if sorted_dates[0] not in (today, yesterday):
        return 0  # Streak quebrado
    
    # Conta dias consecutivos
    streak = 1
    expected_date = sorted_dates[0] - timedelta(days=1)
    
    for study_date in sorted_dates[1:]:
        if study_date == expected_date:
            streak += 1
            expected_date -= timedelta(days=1)
        else:
            break
    
    return streak
