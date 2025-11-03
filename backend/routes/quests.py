"""
Rotas de quests semanais.
Gerencia visualização e refresh de quests da semana.
"""
from fastapi import APIRouter, Request, Cookie
from typing import Optional

from dependencies import get_current_user
from services.quest_service import get_current_week_quests, ensure_weekly_quests

router = APIRouter(prefix="/quests")


@router.get("")
async def get_quests(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna as quests da semana atual do usuário.
    Cria automaticamente se não existirem.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        list: Lista de quests da semana
    """
    user = await get_current_user(request, session_token)
    doc = await get_current_week_quests(user.id)
    return doc["quests"]


@router.post("/refresh")
async def refresh_quests(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Força atualização das quests da semana.
    Útil quando há mudanças nas matérias ou metas.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Documento completo de quests atualizado
    """
    user = await get_current_user(request, session_token)
    doc = await ensure_weekly_quests(user.id)
    return doc
