"""
Rotas de Hábitos.
Gerencia hábitos diários do usuário.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, date
import uuid

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/habits")


# ================== MODELOS ==================

class Habit(BaseModel):
    """Modelo de hábito."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    description: Optional[str] = None
    frequency: str = "daily"  # daily, weekly
    target_days: List[int] = Field(default_factory=lambda: [0, 1, 2, 3, 4, 5, 6])  # 0=segunda
    color: str = "#3b82f6"
    icon: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class HabitCreate(BaseModel):
    """Modelo para criar hábito."""
    name: str
    description: Optional[str] = None
    frequency: str = "daily"
    target_days: Optional[List[int]] = None
    color: Optional[str] = "#3b82f6"
    icon: Optional[str] = None


class HabitUpdate(BaseModel):
    """Modelo para atualizar hábito."""
    name: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    target_days: Optional[List[int]] = None
    color: Optional[str] = None
    icon: Optional[str] = None


# ================== ROTAS ==================

@router.get("")
async def list_habits(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Lista todos os hábitos do usuário.
    
    Returns:
        List[dict]: Lista de hábitos com progresso
    """
    user = await get_current_user(request, session_token)
    
    habits = await db.habits.find(
        {"user_id": user.id},
        {"_id": 0}
    ).to_list(1000)
    
    # Enriquece com dados de progresso de hoje
    today = date.today().isoformat()
    
    for habit in habits:
        completion = await db.habit_completions.find_one({
            "user_id": user.id,
            "habit_id": habit["id"],
            "date": today
        })
        habit["completed_today"] = completion is not None
    
    return habits


@router.post("")
async def create_habit(
    input: HabitCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria um novo hábito.
    
    Returns:
        dict: Hábito criado
    """
    user = await get_current_user(request, session_token)
    
    habit = Habit(
        user_id=user.id,
        name=input.name,
        description=input.description,
        frequency=input.frequency,
        target_days=input.target_days or [0, 1, 2, 3, 4, 5, 6],
        color=input.color or "#3b82f6",
        icon=input.icon
    )
    
    habit_dict = habit.model_dump()
    habit_dict["created_at"] = habit_dict["created_at"].isoformat()
    
    await db.habits.insert_one(habit_dict)
    
    return habit_dict


@router.patch("/{habit_id}")
async def update_habit(
    habit_id: str,
    input: HabitUpdate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza um hábito existente.
    
    Returns:
        dict: {"success": True}
    """
    user = await get_current_user(request, session_token)
    
    # Verifica se o hábito existe e pertence ao usuário
    habit = await db.habits.find_one({"id": habit_id, "user_id": user.id})
    if not habit:
        raise HTTPException(status_code=404, detail="Hábito não encontrado")
    
    # Monta dados de atualização
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    
    if update_data:
        await db.habits.update_one(
            {"id": habit_id},
            {"$set": update_data}
        )
    
    return {"success": True}


@router.delete("/{habit_id}")
async def delete_habit(
    habit_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Deleta um hábito e todos seus registros de conclusão.
    
    Returns:
        dict: {"success": True}
    """
    user = await get_current_user(request, session_token)
    
    result = await db.habits.delete_one({"id": habit_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hábito não encontrado")
    
    # Deleta todas as conclusões deste hábito
    await db.habit_completions.delete_many({
        "user_id": user.id,
        "habit_id": habit_id
    })
    
    return {"success": True}


@router.post("/{habit_id}/complete")
async def complete_habit(
    habit_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Marca um hábito como completo para hoje.
    
    Returns:
        dict: {"success": True, "streak": int}
    """
    user = await get_current_user(request, session_token)
    
    # Verifica se o hábito existe
    habit = await db.habits.find_one({"id": habit_id, "user_id": user.id})
    if not habit:
        raise HTTPException(status_code=404, detail="Hábito não encontrado")
    
    today = date.today().isoformat()
    
    # Verifica se já foi completado hoje
    existing = await db.habit_completions.find_one({
        "user_id": user.id,
        "habit_id": habit_id,
        "date": today
    })
    
    if existing:
        return {"success": True, "message": "Já completado hoje", "streak": 0}
    
    # Registra conclusão
    now = datetime.now(timezone.utc)
    await db.habit_completions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user.id,
        "habit_id": habit_id,
        "date": today,
        "completed_at": now.isoformat()
    })
    
    # Calcula streak
    from datetime import timedelta
    completions = await db.habit_completions.find({
        "user_id": user.id,
        "habit_id": habit_id
    }).sort("date", -1).to_list(365)
    
    streak = 1
    current_date = date.today()
    
    for comp in completions[1:]:
        comp_date = date.fromisoformat(comp["date"])
        expected_date = current_date - timedelta(days=1)
        
        if comp_date == expected_date:
            streak += 1
            current_date = comp_date
        else:
            break
    
    return {"success": True, "streak": streak}


@router.delete("/{habit_id}/complete")
async def uncomplete_habit(
    habit_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Remove a conclusão de hoje de um hábito.
    
    Returns:
        dict: {"success": True}
    """
    user = await get_current_user(request, session_token)
    
    today = date.today().isoformat()
    
    result = await db.habit_completions.delete_one({
        "user_id": user.id,
        "habit_id": habit_id,
        "date": today
    })
    
    return {"success": True, "was_completed": result.deleted_count > 0}
