"""
Rotas de Recompensas.
Gerencia bônus e recompensas por level.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from typing import Optional

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/rewards")


@router.get("/level-bonus")
async def get_level_bonus(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna bônus disponíveis para o nível atual do usuário.
    
    Returns:
        dict: {
            "current_level": int,
            "bonus_coins": int,
            "bonus_items": List[str],
            "next_level_at": int (XP necessário)
        }
    """
    user = await get_current_user(request, session_token)
    
    # Busca dados completos do usuário
    user_data = await db.users.find_one({"id": user.id}, {"_id": 0})
    if not user_data:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    level = user_data.get("level", 1)
    xp = user_data.get("xp", 0)
    
    # Calcula XP necessário para o próximo nível
    # Fórmula: 100 * (level ^ 1.5)
    next_level_xp = int(100 * (level ** 1.5))
    
    # Calcula bônus de moedas por level
    # Cada 5 níveis ganha um bônus
    bonus_coins = 0
    if level % 5 == 0:
        bonus_coins = level * 50
    
    # Itens desbloqueados por nível (exemplo)
    bonus_items = []
    if level >= 5:
        bonus_items.append("seal_bronze")
    if level >= 10:
        bonus_items.append("seal_silver")
    if level >= 20:
        bonus_items.append("seal_gold")
    if level >= 30:
        bonus_items.append("seal_diamond")
    if level >= 50:
        bonus_items.append("seal_legendary")
    
    return {
        "current_level": level,
        "current_xp": xp,
        "next_level_at": next_level_xp,
        "xp_to_next": max(0, next_level_xp - xp),
        "bonus_coins": bonus_coins,
        "bonus_items": bonus_items,
        "progress_percent": min(100, (xp / next_level_xp) * 100) if next_level_xp > 0 else 0
    }
