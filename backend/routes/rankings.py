"""
Rotas de rankings.
Gerencia rankings global, de amigos e de grupos.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from typing import Optional
from datetime import datetime, timezone, timedelta

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/rankings")


async def _get_period_range(period: str) -> tuple:
    """
    Calcula range de datas para o período solicitado.
    
    Args:
        period: Período (week, month, all)
    
    Returns:
        Tuple[datetime, datetime]: (start, end)
    """
    now = datetime.now(timezone.utc)
    
    if period == "week":
        # Semana começa na segunda-feira
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # all
        start = datetime(2020, 1, 1, tzinfo=timezone.utc)
    
    return start, now


async def _calculate_user_minutes(user_id: str, start: datetime, end: datetime) -> int:
    """
    Calcula total de minutos estudados por um usuário no período.
    
    Args:
        user_id: ID do usuário
        start: Data de início
        end: Data de fim
    
    Returns:
        int: Total de minutos
    """
    sessions = await db.study_sessions.find(
        {
            "user_id": user_id,
            "completed": True,
            "start_time": {"$gte": start.isoformat(), "$lte": end.isoformat()}
        },
        {"_id": 0, "duration": 1}
    ).to_list(100000)
    
    return sum(int(s.get("duration", 0)) for s in sessions)


@router.get("/global")
async def rankings_global(period: str = "week"):
    """
    Retorna ranking global de todos os usuários.
    
    Args:
        period: Período de análise (week, month, all)
    
    Returns:
        dict: Ranking com top usuários
    """
    start, end = await _get_period_range(period)
    
    # Busca todas as sessões do período
    sessions = await db.study_sessions.find(
        {
            "completed": True,
            "start_time": {"$gte": start.isoformat(), "$lte": end.isoformat()}
        },
        {"_id": 0, "user_id": 1, "duration": 1}
    ).to_list(1000000)
    
    # Agrupa por usuário
    user_minutes = {}
    for session in sessions:
        uid = session.get("user_id")
        duration = int(session.get("duration", 0))
        user_minutes[uid] = user_minutes.get(uid, 0) + duration
    
    # Ordena e pega top 100
    sorted_users = sorted(user_minutes.items(), key=lambda x: x[1], reverse=True)[:100]
    
    # Enriquece com dados dos usuários
    ranking = []
    for idx, (uid, minutes) in enumerate(sorted_users, 1):
        user_doc = await db.users.find_one(
            {"id": uid},
            {"_id": 0, "nickname": 1, "tag": 1, "name": 1, "avatar": 1, "picture": 1, "level": 1}
        )
        
        if user_doc:
            ranking.append({
                "rank": idx,
                "user_id": uid,
                "nickname": user_doc.get("nickname"),
                "tag": user_doc.get("tag"),
                "name": user_doc.get("name"),
                "avatar": user_doc.get("avatar") or user_doc.get("picture"),
                "level": user_doc.get("level", 1),
                "minutes": minutes,
                "hours": round(minutes / 60, 1)
            })
    
    return {
        "period": period,
        "ranking": ranking,
        "total_users": len(user_minutes)
    }


@router.get("/friends")
async def rankings_friends(
    period: str = "week",
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna ranking apenas dos amigos do usuário logado.
    
    Args:
        period: Período de análise (week, month, all)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Ranking de amigos
    """
    user = await get_current_user(request, session_token)
    
    # Busca amigos
    friends = await db.friends.find(
        {"user_id": user.id},
        {"_id": 0, "friend_id": 1}
    ).to_list(1000)
    
    friend_ids = [f["friend_id"] for f in friends]
    friend_ids.append(user.id)  # Inclui o próprio usuário
    
    start, end = await _get_period_range(period)
    
    # Busca sessões dos amigos
    sessions = await db.study_sessions.find(
        {
            "user_id": {"$in": friend_ids},
            "completed": True,
            "start_time": {"$gte": start.isoformat(), "$lte": end.isoformat()}
        },
        {"_id": 0, "user_id": 1, "duration": 1}
    ).to_list(100000)
    
    # Agrupa por usuário
    user_minutes = {}
    for session in sessions:
        uid = session.get("user_id")
        duration = int(session.get("duration", 0))
        user_minutes[uid] = user_minutes.get(uid, 0) + duration
    
    # Ordena
    sorted_users = sorted(user_minutes.items(), key=lambda x: x[1], reverse=True)
    
    # Enriquece com dados
    ranking = []
    for idx, (uid, minutes) in enumerate(sorted_users, 1):
        user_doc = await db.users.find_one(
            {"id": uid},
            {"_id": 0, "nickname": 1, "tag": 1, "name": 1, "avatar": 1, "picture": 1, "level": 1}
        )
        
        if user_doc:
            ranking.append({
                "rank": idx,
                "user_id": uid,
                "nickname": user_doc.get("nickname"),
                "tag": user_doc.get("tag"),
                "name": user_doc.get("name"),
                "avatar": user_doc.get("avatar") or user_doc.get("picture"),
                "level": user_doc.get("level", 1),
                "minutes": minutes,
                "hours": round(minutes / 60, 1),
                "is_me": uid == user.id
            })
    
    return {
        "period": period,
        "ranking": ranking
    }


@router.get("/groups")
async def rankings_groups(period: str = "week"):
    """
    Retorna ranking de grupos (soma dos minutos de todos os membros).
    
    Args:
        period: Período de análise (week, month, all)
    
    Returns:
        dict: Ranking de grupos
    """
    start, end = await _get_period_range(period)
    
    # Busca todos os grupos
    groups = await db.groups.find({}, {"_id": 0, "id": 1, "name": 1, "avatar": 1}).to_list(1000)
    
    group_data = []
    
    for group in groups:
        # Busca membros do grupo
        members = await db.group_members.find(
            {"group_id": group["id"]},
            {"_id": 0, "user_id": 1}
        ).to_list(10000)
        
        member_ids = [m["user_id"] for m in members]
        
        if not member_ids:
            continue
        
        # Calcula total de minutos do grupo
        sessions = await db.study_sessions.find(
            {
                "user_id": {"$in": member_ids},
                "completed": True,
                "start_time": {"$gte": start.isoformat(), "$lte": end.isoformat()}
            },
            {"_id": 0, "duration": 1}
        ).to_list(100000)
        
        total_minutes = sum(int(s.get("duration", 0)) for s in sessions)
        
        group_data.append({
            "group_id": group["id"],
            "name": group["name"],
            "avatar": group.get("avatar"),
            "members_count": len(member_ids),
            "minutes": total_minutes,
            "hours": round(total_minutes / 60, 1)
        })
    
    # Ordena por minutos
    group_data.sort(key=lambda x: x["minutes"], reverse=True)
    
    # Adiciona ranking
    for idx, group in enumerate(group_data, 1):
        group["rank"] = idx
    
    return {
        "period": period,
        "ranking": group_data[:100]  # Top 100 grupos
    }


@router.get("/my-groups")
async def rankings_my_groups(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna ranking dos grupos que o usuário participa.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Rankings dos grupos do usuário
    """
    user = await get_current_user(request, session_token)
    
    # Busca grupos do usuário
    memberships = await db.group_members.find(
        {"user_id": user.id},
        {"_id": 0, "group_id": 1}
    ).to_list(100)
    
    group_ids = [m["group_id"] for m in memberships]
    
    if not group_ids:
        return {"groups": []}
    
    # Para cada grupo, busca o ranking interno
    result = []
    
    for group_id in group_ids:
        group_doc = await db.groups.find_one(
            {"id": group_id},
            {"_id": 0, "id": 1, "name": 1, "avatar": 1}
        )
        
        if not group_doc:
            continue
        
        # Busca ranking interno do grupo (semana)
        start, end = await _get_period_range("week")
        
        members = await db.group_members.find(
            {"group_id": group_id},
            {"_id": 0, "user_id": 1}
        ).to_list(10000)
        
        member_ids = [m["user_id"] for m in members]
        
        # Calcula minutos por membro
        user_minutes = {}
        for mid in member_ids:
            minutes = await _calculate_user_minutes(mid, start, end)
            if minutes > 0:
                user_minutes[mid] = minutes
        
        # Ordena
        sorted_members = sorted(user_minutes.items(), key=lambda x: x[1], reverse=True)[:10]
        
        result.append({
            "group_id": group_id,
            "group_name": group_doc["name"],
            "top_members": [
                {"user_id": uid, "minutes": mins, "rank": idx}
                for idx, (uid, mins) in enumerate(sorted_members, 1)
            ]
        })
    
    return {"groups": result}


@router.get("/groups/{group_id}")
async def rankings_inside_group(
    group_id: str,
    period: str = "week"
):
    """
    Retorna ranking interno de um grupo específico.
    
    Args:
        group_id: ID do grupo
        period: Período de análise (week, month, all)
    
    Returns:
        dict: Ranking dos membros do grupo
    
    Raises:
        HTTPException: 404 se grupo não encontrado
    """
    # Busca grupo
    group = await db.groups.find_one(
        {"id": group_id},
        {"_id": 0, "id": 1, "name": 1}
    )
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Busca membros
    members = await db.group_members.find(
        {"group_id": group_id},
        {"_id": 0, "user_id": 1}
    ).to_list(10000)
    
    member_ids = [m["user_id"] for m in members]
    
    if not member_ids:
        return {
            "group_id": group_id,
            "group_name": group["name"],
            "period": period,
            "ranking": []
        }
    
    start, end = await _get_period_range(period)
    
    # Busca sessões dos membros
    sessions = await db.study_sessions.find(
        {
            "user_id": {"$in": member_ids},
            "completed": True,
            "start_time": {"$gte": start.isoformat(), "$lte": end.isoformat()}
        },
        {"_id": 0, "user_id": 1, "duration": 1}
    ).to_list(100000)
    
    # Agrupa por usuário
    user_minutes = {}
    for session in sessions:
        uid = session.get("user_id")
        duration = int(session.get("duration", 0))
        user_minutes[uid] = user_minutes.get(uid, 0) + duration
    
    # Ordena
    sorted_users = sorted(user_minutes.items(), key=lambda x: x[1], reverse=True)
    
    # Enriquece com dados
    ranking = []
    for idx, (uid, minutes) in enumerate(sorted_users, 1):
        user_doc = await db.users.find_one(
            {"id": uid},
            {"_id": 0, "nickname": 1, "tag": 1, "name": 1, "avatar": 1, "picture": 1, "level": 1}
        )
        
        if user_doc:
            ranking.append({
                "rank": idx,
                "user_id": uid,
                "nickname": user_doc.get("nickname"),
                "tag": user_doc.get("tag"),
                "name": user_doc.get("name"),
                "avatar": user_doc.get("avatar") or user_doc.get("picture"),
                "level": user_doc.get("level", 1),
                "minutes": minutes,
                "hours": round(minutes / 60, 1)
            })
    
    return {
        "group_id": group_id,
        "group_name": group["name"],
        "period": period,
        "ranking": ranking
    }
