"""
Rotas de presença online (presence).
Gerencia status online/offline/away dos usuários.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException, Depends
from typing import Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/presence")


class PresencePingPayload(BaseModel):
    """Payload para atualizar presença."""
    status: Optional[str] = "online"  # "online" | "away" | "offline"


class PresenceLeavePayload(BaseModel):
    """Payload para sair (offline)."""
    reason: Optional[str] = None


async def require_user(request: Request, session_token: Optional[str] = Cookie(None)):
    """
    Dependência para exigir usuário autenticado.
    Wrapper em torno de get_current_user.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        CurrentUser: Usuário autenticado
    """
    return await get_current_user(request, session_token)


@router.post("/open")
async def presence_open(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Marca o usuário como online.
    Registra presença inicial ou atualiza última atividade.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True, "status": "online"}
    """
    user = await get_current_user(request, session_token)
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Atualiza ou cria presença
    await db.presence.update_one(
        {"user_id": user.id},
        {
            "$set": {
                "status": "online",
                "last_seen": now,
                "updated_at": now
            },
            "$setOnInsert": {"created_at": now}
        },
        upsert=True
    )
    
    # Atualiza status no documento do usuário também
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"online_status": "online", "last_activity": now}}
    )
    
    return {"ok": True, "status": "online"}


@router.post("/ping")
async def presence_ping(
    payload: PresencePingPayload,
    user = Depends(require_user)
):
    """
    Atualiza o status de presença do usuário.
    Usado para manter o usuário como online/away.
    
    Args:
        payload: Status (online, away, offline)
        user: Usuário autenticado (dependência)
    
    Returns:
        dict: {"ok": True, "status": str}
    """
    now = datetime.now(timezone.utc).isoformat()
    status = payload.status or "online"
    
    # Atualiza presença
    await db.presence.update_one(
        {"user_id": user.id},
        {
            "$set": {
                "status": status,
                "last_seen": now,
                "updated_at": now
            },
            "$setOnInsert": {"created_at": now}
        },
        upsert=True
    )
    
    # Atualiza no documento do usuário
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"online_status": status, "last_activity": now}}
    )
    
    return {"ok": True, "status": status}


@router.post("/leave")
async def presence_leave(
    payload: PresenceLeavePayload,
    user = Depends(require_user)
):
    """
    Marca o usuário como offline.
    
    Args:
        payload: Razão opcional para sair
        user: Usuário autenticado (dependência)
    
    Returns:
        dict: {"ok": True, "status": "offline"}
    """
    now = datetime.now(timezone.utc).isoformat()
    
    # Atualiza presença para offline
    await db.presence.update_one(
        {"user_id": user.id},
        {
            "$set": {
                "status": "offline",
                "last_seen": now,
                "updated_at": now
            }
        }
    )
    
    # Atualiza no documento do usuário
    await db.users.update_one(
        {"id": user.id},
        {"$set": {"online_status": "offline", "last_activity": now}}
    )
    
    return {"ok": True, "status": "offline"}


@router.get("/status/{user_id}")
async def get_user_presence_status(
    user_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Obtém o status de presença de um usuário específico.
    
    Args:
        user_id: ID do usuário
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"status": str, "last_seen": str}
    
    Raises:
        HTTPException: 404 se usuário não encontrado
    """
    # Verifica se está logado
    me = await get_current_user(request, session_token)
    
    # Busca presença do usuário
    presence = await db.presence.find_one(
        {"user_id": user_id},
        {"_id": 0, "status": 1, "last_seen": 1}
    )
    
    if not presence:
        # Se não tem presença, busca no documento do usuário
        user_doc = await db.users.find_one(
            {"id": user_id},
            {"_id": 0, "online_status": 1, "last_activity": 1}
        )
        
        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "status": user_doc.get("online_status", "offline"),
            "last_seen": user_doc.get("last_activity")
        }
    
    return {
        "status": presence.get("status", "offline"),
        "last_seen": presence.get("last_seen")
    }
