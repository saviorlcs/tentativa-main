"""
Rotas de autenticação.
Gerencia login, logout, callback OAuth e informações do usuário.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException, Header
from fastapi.responses import RedirectResponse, JSONResponse
from typing import Optional
from urllib.parse import urlencode
import os

from database import db
from dependencies import get_current_user
from services.auth_service import (
    create_oauth_state,
    validate_oauth_state,
    exchange_code_for_token,
    get_google_user_info,
    create_or_update_user,
    create_jwt_token,
    validate_jwt_token,
    make_cookie,
    GOOGLE_CLIENT_ID,
    GOOGLE_AUTH,
    BACKEND_URL,
    FRONTEND_URL,
    IS_PRODUCTION
)

router = APIRouter(prefix="/auth")


@router.get("/google/login")
async def google_login(request: Request):
    """
    Inicia fluxo de autenticação OAuth com Google.
    Redireciona usuário para página de login do Google.
    """
    # Gera state e grava no banco (dupla segurança)
    state = await create_oauth_state()
    
    # Monta parâmetros de autenticação
    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": f"{BACKEND_URL}/api/auth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "include_granted_scopes": "true",
        "state": state,
        "prompt": "consent",
    }
    
    url = f"{GOOGLE_AUTH}?{urlencode(params)}"
    resp = RedirectResponse(url, status_code=302)
    
    # Cookie como fallback
    resp.set_cookie(
        "oauth_state",
        state,
        max_age=600,
        httponly=True,
        samesite="lax",
        path="/"
    )
    
    return resp


@router.get("/google/callback")
async def google_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None,
    oauth_state: str | None = Cookie(None)
):
    """
    Callback OAuth do Google.
    Recebe código de autorização, valida, cria/atualiza usuário e emite JWT.
    """
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing code or state")
    
    # Valida state OAuth
    state_valid = await validate_oauth_state(state, oauth_state)
    if not state_valid:
        raise HTTPException(status_code=400, detail="Invalid OAuth state")
    
    # Troca code por tokens
    tokens = await exchange_code_for_token(code)
    access_token = tokens.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="No access token")
    
    # Obtém informações do usuário
    info = await get_google_user_info(access_token)
    
    # Cria/atualiza usuário no banco
    uid = await create_or_update_user(info)
    
    # Gera JWT
    token = create_jwt_token(uid)
    
    # Redireciona para página intermediária que aguarda o cookie ser setado
    resp = RedirectResponse(f"{FRONTEND_URL}/auth/callback", status_code=302)
    make_cookie(resp, token)
    
    # Limpa state cookie
    resp.delete_cookie("oauth_state", path="/")
    
    return resp


@router.get("/me")
async def auth_me(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(default=None)
):
    """
    Retorna o usuário logado a partir do cookie session_token (JWT).
    Mantém caminho de DEV via Authorization: Bearer <qualquer_coisa>, se você usar.
    Nunca retorna 401: devolve {"ok": False, "anon": True} quando não logado.
    """
    try:
        # Caminho DEV opcional (mantém seu comportamento anterior)
        if authorization and authorization.lower().startswith("bearer "):
            return {
                "ok": True,
                "user": {
                    "id": "dev-user",
                    "nickname": "savior",
                    "tag": "lcs",
                    "coins": 100000,
                    "level": 6,
                    "equipped_items": {"seal": None, "border": None, "theme": None},
                    "name": "Dev User",
                },
            }

        # Caminho normal: usa cookie session_token
        me = await get_current_user(request, session_token)
        return {
            "ok": True,
            "user": {
                "id": me.id,
                "email": getattr(me, "email", None),
                "name": getattr(me, "name", None),
                "nickname": getattr(me, "nickname", None),
                "tag": getattr(me, "tag", None),
                "level": getattr(me, "level", 1),
                "coins": getattr(me, "coins", 0),
                "items_owned": getattr(me, "items_owned", []),
                "xp": getattr(me, "xp", 0),
                "equipped_items": getattr(me, "equipped_items", {"seal": None, "border": None, "theme": None}),
            },
        }
    except HTTPException as e:
        if e.status_code == 401:
            return {"ok": False, "anon": True}
        raise
    except Exception:
        return {"ok": False, "anon": True}


@router.post("/set-session")
async def set_session(request: Request):
    """
    Endpoint para setar o cookie de sessão após OAuth.
    Recebe o token no body e seta como cookie.
    """
    body = await request.json()
    token = body.get("token")
    
    if not token:
        raise HTTPException(status_code=400, detail="Token missing")
    
    # Valida o token
    uid = await validate_jwt_token(token)
    if not uid:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    # Cria response e seta cookie
    resp = JSONResponse({"ok": True, "user_id": uid})
    make_cookie(resp, token)
    
    return resp


@router.post("/logout")
async def logout(request: Request, session_token: Optional[str] = Cookie(None)):
    """
    Faz logout do usuário.
    Remove sessão do banco e apaga cookies.
    """
    if session_token:
        await db.sessions.delete_one({"id": session_token})
    
    resp = JSONResponse({"ok": True})
    
    # Apaga cookies usando a mesma configuração de criação
    resp.delete_cookie(
        "session_token",
        path="/",
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax"
    )
    resp.delete_cookie(
        "csrf_token",
        path="/",
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax"
    )
    
    return resp


@router.delete("/me")
async def delete_account(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Deleta permanentemente a conta do usuário e todos os seus dados.
    Remove:
    - Dados do usuário
    - Configurações
    - Matérias e sessões de estudo
    - Quests
    - Eventos de calendário
    - Presença
    - Participação em grupos
    - Amizades
    """
    user = await get_current_user(request, session_token)
    
    # Deleta todos os dados do usuário
    await db.users.delete_one({"id": user.id})
    await db.user_settings.delete_many({"user_id": user.id})
    await db.subjects.delete_many({"user_id": user.id})
    await db.study_sessions.delete_many({"user_id": user.id})
    await db.cycles.delete_many({"user_id": user.id})
    await db.user_quests.delete_many({"user_id": user.id})
    await db.sessions.delete_many({"user_id": user.id})
    await db.review_subjects.delete_many({"user_id": user.id})
    await db.review_sessions.delete_many({"user_id": user.id})
    await db.calendar_events.delete_many({"user_id": user.id})
    await db.presence.delete_many({"user_id": user.id})
    
    # Remove de grupos
    await db.group_members.delete_many({"user_id": user.id})
    await db.group_join_requests.delete_many({"user_id": user.id})
    
    # Remove amizades
    await db.friends.delete_many({"$or": [{"user_id": user.id}, {"friend_id": user.id}]})
    await db.friend_requests.delete_many({"$or": [{"from_user_id": user.id}, {"to_user_id": user.id}]})
    
    # Deleta a sessão
    if session_token:
        await db.sessions.delete_one({"id": session_token})
    
    resp = JSONResponse({"ok": True, "message": "Conta excluída com sucesso"})
    
    # Apaga cookies
    resp.delete_cookie(
        "session_token",
        path="/",
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax"
    )
    resp.delete_cookie(
        "csrf_token",
        path="/",
        secure=IS_PRODUCTION,
        samesite="None" if IS_PRODUCTION else "Lax"
    )
    
    return resp


@router.post("/admin/seed-shop")
async def admin_seed_shop():
    """
    Endpoint administrativo para popular a loja com itens.
    CUIDADO: Reseta a coleção de itens da loja.
    """
    from shop_seed import build_items
    
    # Reseta a coleção
    await db.shop_items.delete_many({})
    
    # Usa a função que já existe
    items = build_items()  # retorna lista de itens
    if items:
        await db.shop_items.insert_many(items)
    
    return {"ok": True, "count": len(items or [])}
