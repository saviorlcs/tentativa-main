"""
Rotas de configurações do usuário (settings).
Gerencia preferências de timer, sons e outras configurações.
"""
from fastapi import APIRouter, Request, Cookie
from typing import Optional
from pydantic import BaseModel

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/settings")


class SettingsUpdate(BaseModel):
    """Payload para atualizar configurações."""
    study_duration: Optional[int] = None
    break_duration: Optional[int] = None
    long_break_duration: Optional[int] = None
    long_break_interval: Optional[int] = None
    sound_enabled: Optional[bool] = None
    sound_id: Optional[str] = None
    sound_duration: Optional[float] = None


@router.get("")
async def get_settings(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna as configurações do usuário.
    Se não existirem, retorna valores padrão.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Configurações do usuário
    """
    user = await get_current_user(request, session_token)
    
    settings = await db.user_settings.find_one(
        {"user_id": user.id},
        {"_id": 0}
    )
    
    # Retorna valores padrão se não existir
    if not settings:
        settings = {
            "user_id": user.id,
            "study_duration": 50,
            "break_duration": 10,
            "long_break_duration": 30,
            "long_break_interval": 4,
            "sound_enabled": True,
            "sound_id": "bell",
            "sound_duration": 2.0
        }
    
    return settings


@router.patch("")
async def update_settings(
    body: SettingsUpdate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza as configurações do usuário.
    Apenas campos fornecidos serão atualizados.
    
    Args:
        body: Campos para atualizar
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    """
    user = await get_current_user(request, session_token)
    
    # Monta update apenas com campos não-None
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    
    if not update_data:
        return {"ok": True}
    
    await db.user_settings.update_one(
        {"user_id": user.id},
        {"$set": update_data},
        upsert=True
    )
    
    return {"ok": True}
