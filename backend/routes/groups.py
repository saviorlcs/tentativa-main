"""
Rotas de grupos.
Gerencia criação, busca, entrada, saída e administração de grupos de estudo.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException, Body
from typing import Optional, Literal
from datetime import datetime, timezone
from pydantic import BaseModel, Field
import secrets
import uuid

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/groups")


class GroupCreate(BaseModel):
    """Payload para criar grupo."""
    name: str = Field(..., min_length=3, max_length=40)
    description: Optional[str] = ""
    visibility: Literal["public", "private", "hidden"] = "public"
    emoji: Optional[str] = None
    color: Optional[str] = None


class GroupOut(BaseModel):
    """Resposta de grupo criado."""
    id: str
    name: str
    description: Optional[str] = None
    visibility: str
    emoji: Optional[str] = None
    color: Optional[str] = None
    owner_id: str
    invite_code: str
    created_at: datetime


class GroupUpdate(BaseModel):
    """Payload para atualizar grupo."""
    name: Optional[str] = None
    description: Optional[str] = None
    visibility: Optional[Literal["public", "private", "hidden"]] = None
    emoji: Optional[str] = None
    color: Optional[str] = None


class InviteJoin(BaseModel):
    """Payload para entrar em grupo via convite."""
    invite_code: str


class MemberRoleChange(BaseModel):
    """Payload para mudar role de membro."""
    user_id: str
    role: Literal["admin", "mod", "member"]


class GroupLeave(BaseModel):
    """Payload para sair de grupo."""
    group_id: str


def _new_invite() -> str:
    """
    Gera um novo código de convite aleatório.
    
    Returns:
        str: Código de convite (6 caracteres)
    """
    return secrets.token_urlsafe(6).replace("_", "").lower()[:6]


async def ensure_member(group_id: str, uid: str):
    """
    Verifica se usuário é membro do grupo.
    
    Args:
        group_id: ID do grupo
        uid: ID do usuário
    
    Returns:
        dict: Documento de membership
    
    Raises:
        HTTPException: 403 se não for membro
    """
    m = await db.group_members.find_one({"group_id": group_id, "user_id": uid})
    if not m:
        raise HTTPException(status_code=403, detail="Você não é membro deste grupo")
    return m


async def ensure_admin(group_id: str, uid: str):
    """
    Verifica se usuário é admin do grupo.
    
    Args:
        group_id: ID do grupo
        uid: ID do usuário
    
    Returns:
        dict: Documento de membership
    
    Raises:
        HTTPException: 403 se não for admin
    """
    m = await ensure_member(group_id, uid)
    if m.get("role") not in ("admin",):
        raise HTTPException(status_code=403, detail="Apenas administradores podem fazer isso")
    return m


@router.post("", status_code=201, response_model=GroupOut)
async def groups_create(
    payload: GroupCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria um novo grupo.
    O usuário criador se torna admin automaticamente.
    
    Args:
        payload: Dados do grupo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        GroupOut: Grupo criado
    
    Raises:
        HTTPException: 400 se nome inválido
    """
    user = await get_current_user(request, session_token)
    
    name = (payload.name or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome obrigatório")
    
    created_at = datetime.now(timezone.utc)
    group_id = str(uuid.uuid4())
    invite_code = _new_invite()
    
    # Tenta até 4 vezes se houver colisão de invite_code
    for _ in range(4):
        try:
            doc = {
                "id": group_id,
                "name": name,
                "description": (payload.description or "").strip(),
                "visibility": payload.visibility,
                "emoji": payload.emoji,
                "color": payload.color,
                "owner_id": user.id,
                "invite_code": invite_code,
                "created_at": created_at.isoformat()
            }
            
            await db.groups.insert_one(doc)
            
            # Adiciona criador como admin
            await db.group_members.insert_one({
                "group_id": group_id,
                "user_id": user.id,
                "role": "admin",
                "joined_at": created_at.isoformat()
            })
            
            return GroupOut(
                id=group_id,
                name=doc["name"],
                description=doc.get("description"),
                visibility=doc["visibility"],
                emoji=doc.get("emoji"),
                color=doc.get("color"),
                owner_id=doc["owner_id"],
                invite_code=doc["invite_code"],
                created_at=created_at
            )
        except Exception as e:
            # Se erro de duplicate key no invite_code, tenta outro
            if "invite_code" in str(e):
                invite_code = _new_invite()
                continue
            raise HTTPException(status_code=500, detail="Falha ao criar grupo")
    
    raise HTTPException(status_code=500, detail="Não foi possível gerar convite único")


@router.get("/mine")
async def my_groups(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Lista todos os grupos que o usuário participa.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        List[dict]: Lista de grupos
    """
    user = await get_current_user(request, session_token)
    
    # Busca memberships do usuário
    memberships = await db.group_members.find(
        {"user_id": user.id},
        {"_id": 0}
    ).to_list(100)
    
    result = []
    for membership in memberships:
        group_id = membership.get("group_id")
        
        # Busca dados do grupo
        group = await db.groups.find_one(
            {"id": group_id},
            {"_id": 0}
        )
        
        if group:
            result.append({
                "id": group["id"],
                "role": membership.get("role"),
                "name": group["name"],
                "description": group.get("description", ""),
                "visibility": group.get("visibility", "public"),
                "emoji": group.get("emoji"),
                "color": group.get("color"),
                "invite_code": group.get("invite_code")
            })
    
    return result


@router.get("/search")
async def groups_search(q: str = ""):
    """
    Busca grupos públicos por nome.
    
    Args:
        q: Query de busca (opcional)
    
    Returns:
        List[dict]: Grupos encontrados (máximo 20)
    """
    filter_query = {"visibility": "public"}
    
    if q:
        filter_query["name"] = {"$regex": q, "$options": "i"}
    
    groups = await db.groups.find(
        filter_query,
        {"_id": 0, "id": 1, "name": 1, "description": 1, "emoji": 1, "color": 1}
    ).limit(20).to_list(20)
    
    return groups


@router.get("/{group_id}")
async def groups_info(
    group_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Obtém informações detalhadas de um grupo.
    
    Args:
        group_id: ID do grupo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Informações do grupo
    
    Raises:
        HTTPException: 404 se grupo não encontrado
    """
    user = await get_current_user(request, session_token)
    
    group = await db.groups.find_one({"id": group_id}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    
    # Conta membros
    member_count = await db.group_members.count_documents({"group_id": group_id})
    
    return {
        "id": group["id"],
        "name": group["name"],
        "description": group.get("description", ""),
        "visibility": group.get("visibility", "public"),
        "emoji": group.get("emoji"),
        "color": group.get("color"),
        "owner_id": group.get("owner_id"),
        "invite_code": group.get("invite_code"),
        "created_at": group.get("created_at"),
        "member_count": member_count
    }


@router.get("/{group_id}/presence")
async def groups_presence(
    group_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Obtém presença de membros online no grupo.
    
    Args:
        group_id: ID do grupo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Membros online e seus status
    
    Raises:
        HTTPException: 403 se não for membro
    """
    user = await get_current_user(request, session_token)
    
    # Verifica se é membro
    await ensure_member(group_id, user.id)
    
    # Busca todos os membros
    members = await db.group_members.find(
        {"group_id": group_id},
        {"_id": 0, "user_id": 1}
    ).to_list(10000)
    
    member_ids = [m["user_id"] for m in members]
    
    if not member_ids:
        return {"online": [], "away": [], "offline": []}
    
    # Busca status de presença
    users = await db.users.find(
        {"id": {"$in": member_ids}},
        {"_id": 0, "id": 1, "nickname": 1, "tag": 1, "name": 1, "online_status": 1, "last_activity": 1}
    ).to_list(10000)
    
    online = []
    away = []
    offline = []
    
    for u in users:
        status = u.get("online_status", "offline")
        user_data = {
            "id": u["id"],
            "nickname": u.get("nickname"),
            "tag": u.get("tag"),
            "name": u.get("name"),
            "last_activity": u.get("last_activity")
        }
        
        if status == "online":
            online.append(user_data)
        elif status == "away":
            away.append(user_data)
        else:
            offline.append(user_data)
    
    return {
        "online": online,
        "away": away,
        "offline": offline
    }


@router.post("/join")
async def groups_join(
    payload: InviteJoin,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Entra em um grupo usando código de convite.
    Se o grupo for privado, cria uma solicitação de entrada.
    
    Args:
        payload: Código de convite
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True, "group_id": str, "pending": bool (opcional)}
    
    Raises:
        HTTPException: 404 se convite inválido
    """
    user = await get_current_user(request, session_token)
    
    # Busca grupo pelo convite
    group = await db.groups.find_one({"invite_code": payload.invite_code}, {"_id": 0})
    if not group:
        raise HTTPException(status_code=404, detail="Convite inválido")
    
    group_id = group["id"]
    
    # Verifica se já é membro
    existing = await db.group_members.find_one({"group_id": group_id, "user_id": user.id})
    if existing:
        return {"ok": True, "group_id": group_id}
    
    # Se grupo privado, cria solicitação
    if group.get("visibility") == "private":
        await db.group_join_requests.update_one(
            {"group_id": group_id, "user_id": user.id},
            {
                "$set": {
                    "status": "pending",
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            upsert=True
        )
        return {"ok": True, "pending": True}
    
    # Grupo público: adiciona diretamente
    await db.group_members.insert_one({
        "group_id": group_id,
        "user_id": user.id,
        "role": "member",
        "joined_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"ok": True, "group_id": group_id}


@router.post("/leave")
async def groups_leave(
    payload: GroupLeave,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Sai de um grupo.
    
    Args:
        payload: ID do grupo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    """
    user = await get_current_user(request, session_token)
    
    await db.group_members.delete_one({"group_id": payload.group_id, "user_id": user.id})
    
    return {"ok": True}


@router.patch("/{group_id}")
async def groups_update(
    group_id: str,
    payload: GroupUpdate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza informações do grupo.
    Apenas admins podem fazer isso.
    
    Args:
        group_id: ID do grupo
        payload: Dados para atualizar
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    
    Raises:
        HTTPException: 403 se não for admin
    """
    user = await get_current_user(request, session_token)
    
    await ensure_admin(group_id, user.id)
    
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update_data:
        return {"ok": True}
    
    await db.groups.update_one({"id": group_id}, {"$set": update_data})
    
    return {"ok": True}


@router.post("/{group_id}/invite/regenerate")
async def groups_invite_regen(
    group_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Regenera o código de convite do grupo.
    Apenas admins podem fazer isso.
    
    Args:
        group_id: ID do grupo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"invite_code": str}
    
    Raises:
        HTTPException: 403 se não for admin
    """
    user = await get_current_user(request, session_token)
    
    await ensure_admin(group_id, user.id)
    
    new_code = _new_invite()
    
    await db.groups.update_one({"id": group_id}, {"$set": {"invite_code": new_code}})
    
    return {"invite_code": new_code}


@router.get("/{group_id}/join-requests")
async def groups_join_requests(
    group_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Lista solicitações de entrada pendentes no grupo.
    Apenas admins podem ver.
    
    Args:
        group_id: ID do grupo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        List[dict]: Solicitações pendentes
    
    Raises:
        HTTPException: 403 se não for admin
    """
    user = await get_current_user(request, session_token)
    
    await ensure_admin(group_id, user.id)
    
    requests = await db.group_join_requests.find(
        {"group_id": group_id, "status": "pending"},
        {"_id": 0}
    ).to_list(1000)
    
    # Enriquece com dados dos usuários
    for req in requests:
        user_doc = await db.users.find_one(
            {"id": req["user_id"]},
            {"_id": 0, "nickname": 1, "tag": 1, "name": 1}
        )
        if user_doc:
            req["nickname"] = user_doc.get("nickname")
            req["tag"] = user_doc.get("tag")
            req["name"] = user_doc.get("name")
    
    return requests


@router.post("/{group_id}/join-requests/accept")
async def groups_join_accept(
    group_id: str,
    user_id: str = Body(..., embed=True),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Aceita uma solicitação de entrada no grupo.
    Apenas admins podem fazer isso.
    
    Args:
        group_id: ID do grupo
        user_id: ID do usuário solicitante
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    
    Raises:
        HTTPException: 403 se não for admin
    """
    user = await get_current_user(request, session_token)
    
    await ensure_admin(group_id, user.id)
    
    # Atualiza status da solicitação
    await db.group_join_requests.update_one(
        {"group_id": group_id, "user_id": user_id},
        {"$set": {"status": "accepted"}}
    )
    
    # Adiciona como membro se ainda não for
    existing = await db.group_members.find_one({"group_id": group_id, "user_id": user_id})
    if not existing:
        await db.group_members.insert_one({
            "group_id": group_id,
            "user_id": user_id,
            "role": "member",
            "joined_at": datetime.now(timezone.utc).isoformat()
        })
    
    return {"ok": True}


@router.post("/{group_id}/join-requests/reject")
async def groups_join_reject(
    group_id: str,
    user_id: str = Body(..., embed=True),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Rejeita uma solicitação de entrada no grupo.
    Apenas admins podem fazer isso.
    
    Args:
        group_id: ID do grupo
        user_id: ID do usuário solicitante
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    
    Raises:
        HTTPException: 403 se não for admin
    """
    user = await get_current_user(request, session_token)
    
    await ensure_admin(group_id, user.id)
    
    await db.group_join_requests.update_one(
        {"group_id": group_id, "user_id": user_id},
        {"$set": {"status": "rejected"}}
    )
    
    return {"ok": True}


@router.post("/{group_id}/members/role")
async def groups_member_role(
    group_id: str,
    payload: MemberRoleChange,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Muda o role de um membro do grupo.
    Apenas admins podem fazer isso.
    
    Args:
        group_id: ID do grupo
        payload: user_id e novo role
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    
    Raises:
        HTTPException: 403 se não for admin
    """
    user = await get_current_user(request, session_token)
    
    await ensure_admin(group_id, user.id)
    
    await db.group_members.update_one(
        {"group_id": group_id, "user_id": payload.user_id},
        {"$set": {"role": payload.role}}
    )
    
    return {"ok": True}


@router.post("/{group_id}/members/kick")
async def groups_member_kick(
    group_id: str,
    user_id: str = Body(..., embed=True),
    request: Request = None,
    session_token: Optional[str] = Cookie(None)
):
    """
    Remove um membro do grupo.
    Apenas admins podem fazer isso.
    
    Args:
        group_id: ID do grupo
        user_id: ID do usuário a remover
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    
    Raises:
        HTTPException: 403 se não for admin
    """
    user = await get_current_user(request, session_token)
    
    await ensure_admin(group_id, user.id)
    
    await db.group_members.delete_one({"group_id": group_id, "user_id": user_id})
    
    return {"ok": True}
