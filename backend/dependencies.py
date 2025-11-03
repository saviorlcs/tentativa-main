"""
Dependências e helpers de autenticação.
Contém funções utilitárias para verificar usuários autenticados.
"""
from fastapi import Request, Cookie, HTTPException
from typing import Optional
import jwt
from datetime import datetime, timezone

from database import db
from config import JWT_SECRET


class CurrentUser:
    """Classe que representa o usuário atual autenticado."""
    def __init__(self):
        self.id: str = ""
        self.email: Optional[str] = None
        self.name: Optional[str] = None
        self.level: int = 1
        self.coins: int = 0
        self.xp: int = 0
        self.items_owned: list = []
        self.equipped_items: dict = {"seal": None, "border": None, "theme": None}
        self.nickname: Optional[str] = None
        self.tag: Optional[str] = None
        self.last_nickname_change: Optional[datetime] = None


async def get_current_user(request: Request, session_token: str | None = Cookie(None)) -> CurrentUser:
    """
    Obtém o usuário atual a partir do token de sessão.
    
    Aceita:
      - Cookie: session_token (JWT)
      - Header: Authorization: Bearer <jwt> (produção)
      - Header: Authorization: Bearer <user_id> (dev fallback)
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        CurrentUser: Objeto com dados do usuário autenticado
    
    Raises:
        HTTPException: 401 se não autenticado ou token inválido
    """
    token = session_token
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(status_code=401, detail="no-session")

    # Tenta decodificar JWT primeiro
    uid = None
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        uid = data.get("sub")
    except jwt.InvalidTokenError:
        # Dev fallback: se não for JWT, trata como user_id direto
        uid = token

    if not uid:
        raise HTTPException(status_code=401, detail="invalid-token")

    # Busca usuário no banco
    user = await db.users.find_one({"id": uid}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="invalid-user")

    # Atualiza última atividade
    await db.users.update_one(
        {"id": uid},
        {"$set": {"last_activity": datetime.now(timezone.utc).isoformat()}}
    )

    # Cria objeto CurrentUser
    cu = CurrentUser()
    cu.id = user["id"]
    cu.email = user.get("email")
    cu.name = user.get("name")
    cu.level = user.get("level", 1)
    cu.coins = user.get("coins", 0)
    cu.xp = user.get("xp", 0)
    cu.items_owned = user.get("items_owned", [])
    cu.equipped_items = user.get("equipped_items", {"seal": None, "border": None, "theme": None})
    cu.nickname = user.get("nickname")
    cu.tag = user.get("tag")
    cu.last_nickname_change = user.get("last_nickname_change")
    
    return cu
