"""
Serviço de autenticação.
Contém lógica de negócio para Google OAuth e gestão de sessões.
"""
import secrets
import jwt
from datetime import datetime, timezone, timedelta
from typing import Optional
import httpx
from fastapi import HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
import os

from database import db
from config import JWT_SECRET

# Configurações Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo"

# URLs da aplicação
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000/")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8001")
IS_PRODUCTION = BACKEND_URL.startswith("https://")
SESSION_TTL_DAYS = 30


def make_cookie(response, token: str):
    """
    Adiciona cookie de sessão à resposta.
    
    Args:
        response: Response do FastAPI
        token: Token JWT a ser armazenado no cookie
    """
    response.set_cookie(
        key="session_token",
        value=token,
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax",
        path="/"
    )
    
    # Cookie CSRF (opcional, para proteção adicional)
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        key="csrf_token",
        value=csrf_token,
        max_age=SESSION_TTL_DAYS * 24 * 60 * 60,
        httponly=False,
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax",
        path="/"
    )


async def create_oauth_state() -> str:
    """
    Cria e armazena state OAuth para validação.
    
    Returns:
        str: State gerado
    """
    state = secrets.token_urlsafe(24)
    
    # Salva no banco com TTL de 10 minutos
    await db.oauth_states.insert_one({
        "state": state,
        "created_at": datetime.now(timezone.utc),
        "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)
    })
    
    return state


async def validate_oauth_state(state: str, cookie_state: Optional[str] = None) -> bool:
    """
    Valida o state OAuth.
    
    Args:
        state: State recebido no callback
        cookie_state: State armazenado no cookie (fallback)
    
    Returns:
        bool: True se válido
    """
    # Tenta validar via cookie (compatibilidade)
    if cookie_state and state == cookie_state:
        return True
    
    # Valida via banco de dados (mais robusto)
    db_state = await db.oauth_states.find_one({
        "state": state,
        "expires_at": {"$gt": datetime.now(timezone.utc)}
    })
    
    if db_state:
        # Limpa o state usado
        await db.oauth_states.delete_one({"state": state})
        return True
    
    return False


async def exchange_code_for_token(code: str) -> dict:
    """
    Troca o código OAuth por tokens de acesso.
    
    Args:
        code: Código de autorização do Google
    
    Returns:
        dict: Dados com access_token
    
    Raises:
        HTTPException: Se a troca falhar
    """
    async with httpx.AsyncClient(timeout=15) as client:
        token_res = await client.post(GOOGLE_TOKEN, data={
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": f"{BACKEND_URL}/api/auth/google/callback",
        })
    
    if token_res.status_code != 200:
        raise HTTPException(status_code=400, detail="Token exchange failed")
    
    return token_res.json()


async def get_google_user_info(access_token: str) -> dict:
    """
    Obtém informações do usuário do Google.
    
    Args:
        access_token: Token de acesso do Google
    
    Returns:
        dict: Informações do usuário (sub, email, name, picture)
    
    Raises:
        HTTPException: Se a requisição falhar
    """
    async with httpx.AsyncClient(timeout=15) as client:
        ui = await client.get(
            GOOGLE_USERINFO,
            headers={"Authorization": f"Bearer {access_token}"}
        )
    
    if ui.status_code != 200:
        raise HTTPException(status_code=400, detail="Userinfo failed")
    
    return ui.json()


async def create_or_update_user(google_user_info: dict) -> str:
    """
    Cria ou atualiza usuário no banco de dados.
    
    Args:
        google_user_info: Informações do usuário do Google
    
    Returns:
        str: ID do usuário (formato: google:<google_id>)
    
    Raises:
        HTTPException: Se não houver sub no userinfo
    """
    google_id = google_user_info.get("sub")
    if not google_id:
        raise HTTPException(status_code=400, detail="No sub in userinfo")
    
    uid = f"google:{google_id}"
    user_doc = {
        "id": uid,
        "email": google_user_info.get("email"),
        "name": google_user_info.get("name") or "User",
        "picture": google_user_info.get("picture"),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    
    await db.users.update_one(
        {"id": uid},
        {
            "$setOnInsert": {
                "coins": 0,
                "xp": 0,
                "level": 1,
                "items_owned": [],
                "equipped_items": {"seal": None, "border": None, "theme": None}
            },
            "$set": user_doc
        },
        upsert=True
    )
    
    return uid


def create_jwt_token(user_id: str) -> str:
    """
    Cria um token JWT para o usuário.
    
    Args:
        user_id: ID do usuário
    
    Returns:
        str: Token JWT
    """
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=SESSION_TTL_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


async def validate_jwt_token(token: str) -> Optional[str]:
    """
    Valida um token JWT e retorna o user_id.
    
    Args:
        token: Token JWT
    
    Returns:
        Optional[str]: User ID se válido, None caso contrário
    """
    try:
        data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        uid = data.get("sub")
        if not uid:
            return None
        
        # Verifica se o usuário existe
        user = await db.users.find_one({"id": uid}, {"_id": 0, "id": 1})
        if not user:
            return None
        
        return uid
    except jwt.InvalidTokenError:
        return None
