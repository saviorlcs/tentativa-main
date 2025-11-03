"""
Utilitários de autenticação.
Funções para gerenciar cookies, tokens e sessões.
"""
import secrets
import jwt
from fastapi import Request, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from typing import Union
import os

# Constantes de configuração
IS_PRODUCTION = os.getenv("IS_PRODUCTION", "false").lower() == "true"
SESSION_TTL_DAYS = 30
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")


def make_cookie(response: Union[RedirectResponse, JSONResponse], token: str) -> None:
    """
    Define cookies de sessão e CSRF de forma segura e consistente.
    
    - Em HTTPS (produção): Secure=True, SameSite=None (permite cross-site)
    - Em HTTP (dev): Secure=False, SameSite=Lax (navegadores bloqueiam None sem Secure)
    
    Args:
        response: Objeto de resposta FastAPI
        token: Token JWT da sessão
    """
    # Define o cookie de sessão (HttpOnly para segurança)
    response.set_cookie(
        "session_token",
        token,
        max_age=60*60*24*SESSION_TTL_DAYS,
        httponly=True,
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax",
        path="/",
    )
    
    # Define o CSRF token (NÃO-HttpOnly para o frontend poder ler)
    csrf_token = secrets.token_urlsafe(32)
    response.set_cookie(
        "csrf_token",
        csrf_token,
        max_age=60*60*24*SESSION_TTL_DAYS,
        httponly=False,
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax",
        path="/",
    )


def current_user_id(request: Request) -> str:
    """
    Extrai o ID do usuário atual da requisição.
    Suporta tanto header Authorization quanto cookie session_token.
    
    Args:
        request: Objeto de requisição FastAPI
    
    Returns:
        ID do usuário autenticado
    
    Raises:
        HTTPException: Se não autorizado (401)
    """
    # Tenta Authorization header
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth.split(" ", 1)[1].strip()
    
    # Tenta cookie de sessão
    try:
        tok = request.cookies.get("session_token")
        data = jwt.decode(tok, JWT_SECRET, algorithms=["HS256"])
        return data.get("sub")
    except Exception:
        pass
    
    raise HTTPException(status_code=401, detail="unauthorized")
