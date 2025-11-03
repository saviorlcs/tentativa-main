"""
Rotas de Devocional.
Gerencia plano e progresso devocional do usuário.
"""
from fastapi import APIRouter, Request, Cookie
from typing import Optional
from datetime import datetime, timezone

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/devocional")


@router.get("/progress")
async def get_devocional_progress(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna progresso do plano devocional do usuário.
    
    Returns:
        dict: Dados de progresso (dias completados, streak, etc)
    """
    user = await get_current_user(request, session_token)
    
    doc = await db.devocional.find_one(
        {"user_id": user.id},
        {"_id": 0}
    )
    
    if not doc:
        return {
            "plan_id": None,
            "progress": {},
            "streak": 0,
            "total_completed": 0
        }
    
    return {
        "plan_id": doc.get("plan_id"),
        "progress": doc.get("progress", {}),
        "streak": doc.get("streak", 0),
        "total_completed": doc.get("total_completed", 0),
        "last_completed": doc.get("last_completed")
    }


@router.post("/update")
async def update_devocional_progress(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza progresso devocional.
    
    Body JSON:
        - day: Dia completado
        - plan_id: ID do plano (opcional)
    
    Returns:
        dict: {"success": True, "streak": int}
    """
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    day = body.get("day")
    plan_id = body.get("plan_id")
    
    now = datetime.now(timezone.utc)
    today_str = now.date().isoformat()
    
    # Busca documento existente
    doc = await db.devocional.find_one({"user_id": user.id})
    
    if not doc:
        # Cria novo documento
        await db.devocional.insert_one({
            "user_id": user.id,
            "plan_id": plan_id,
            "progress": {str(day): today_str},
            "streak": 1,
            "total_completed": 1,
            "last_completed": today_str,
            "created_at": now.isoformat()
        })
        return {"success": True, "streak": 1}
    
    # Atualiza documento existente
    progress = doc.get("progress", {})
    progress[str(day)] = today_str
    
    # Calcula streak
    last_completed = doc.get("last_completed")
    streak = doc.get("streak", 0)
    
    if last_completed:
        from datetime import date, timedelta
        last_date = date.fromisoformat(last_completed)
        today_date = now.date()
        days_diff = (today_date - last_date).days
        
        if days_diff == 1:
            streak += 1
        elif days_diff == 0:
            # Mesmo dia, mantém streak
            pass
        else:
            streak = 1
    else:
        streak = 1
    
    total_completed = len(progress)
    
    await db.devocional.update_one(
        {"user_id": user.id},
        {"$set": {
            "progress": progress,
            "streak": streak,
            "total_completed": total_completed,
            "last_completed": today_str,
            "updated_at": now.isoformat()
        }}
    )
    
    return {"success": True, "streak": streak}


@router.get("/plan")
async def get_devocional_plan(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    plan_id: str = "default"
):
    """
    Retorna detalhes de um plano devocional.
    
    Args:
        plan_id: ID do plano (default: "default")
    
    Returns:
        dict: Informações do plano (título, descrição, dias, etc)
    """
    user = await get_current_user(request, session_token)
    
    # Busca plano no banco
    plan = await db.devocional_plans.find_one(
        {"id": plan_id},
        {"_id": 0}
    )
    
    if not plan:
        return {
            "id": "default",
            "title": "Plano Padrão",
            "description": "Plano devocional básico",
            "total_days": 30,
            "days": []
        }
    
    return plan
