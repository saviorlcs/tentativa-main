"""
Rotas de amizades (friends).
Gerencia solicitações de amizade, lista de amigos e remoção de amigos.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from typing import Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/friends")


class FriendRequestInput(BaseModel):
    """Payload para enviar solicitação de amizade."""
    friend_nickname: str
    friend_tag: str


class FriendRequestModel(BaseModel):
    """Modelo de solicitação de amizade."""
    id: str = None
    from_id: str
    to_id: str
    status: str = "pending"  # pending, accepted, rejected
    created_at: datetime = None
    responded_at: Optional[datetime] = None
    
    def __init__(self, **data):
        if 'id' not in data or data['id'] is None:
            data['id'] = str(uuid.uuid4())
        if 'created_at' not in data or data['created_at'] is None:
            data['created_at'] = datetime.now(timezone.utc)
        super().__init__(**data)


def _to_aware(dt: any) -> Optional[datetime]:
    """
    Converte datetime para timezone-aware UTC.
    
    Args:
        dt: datetime, string ISO ou None
    
    Returns:
        datetime timezone-aware ou None
    """
    if not dt:
        return None
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def _presence_from_fields(user_doc: dict) -> str:
    """
    Calcula status de presença baseado em last_activity.
    
    Args:
        user_doc: Documento do usuário
    
    Returns:
        str: "online", "away" ou "offline"
    """
    last_activity = _to_aware(user_doc.get("last_activity"))
    if not last_activity:
        return "offline"
    
    now = datetime.now(timezone.utc)
    diff = (now - last_activity).total_seconds()
    
    if diff < 120:  # 2 minutos
        return "online"
    elif diff < 600:  # 10 minutos
        return "away"
    else:
        return "offline"


def _sec_left_from_timer(timer: dict) -> Optional[int]:
    """
    Calcula segundos restantes do timer.
    
    Args:
        timer: Dict com informações do timer
    
    Returns:
        int: Segundos restantes ou None
    """
    if not timer:
        return None
    
    state = timer.get("state")
    if state == "paused":
        return int(timer.get("seconds_left") or 0)
    
    phase_until = _to_aware(timer.get("phase_until"))
    if not phase_until:
        return int(timer.get("seconds_left") or 0)
    
    now = datetime.now(timezone.utc)
    return max(0, int((phase_until - now).total_seconds()))


@router.get("/list")
async def friends_list(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Lista todos os amigos do usuário com status de presença e timer.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        List[dict]: Lista de amigos com dados de presença
    """
    user = await get_current_user(request, session_token)
    
    # Busca vínculos de amizade
    links = await db.friends.find(
        {"$or": [{"user_id": user.id}, {"friend_id": user.id}]},
        {"_id": 0}
    ).to_list(1000)
    
    # Migração: se não houver vínculos, reconstrói a partir de friend_requests aceitos
    if not links:
        accepted = await db.friend_requests.find(
            {"$or": [{"from_id": user.id}, {"to_id": user.id}], "status": "accepted"},
            {"_id": 0, "from_id": 1, "to_id": 1}
        ).to_list(1000)
        
        if accepted:
            now_iso = datetime.now(timezone.utc).isoformat()
            for fr in accepted:
                pairs = [
                    {"user_id": fr["from_id"], "friend_id": fr["to_id"]},
                    {"user_id": fr["to_id"], "friend_id": fr["from_id"]}
                ]
                for p in pairs:
                    await db.friends.update_one(
                        p,
                        {"$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now_iso}},
                        upsert=True
                    )
            
            # Recarrega links
            links = await db.friends.find(
                {"$or": [{"user_id": user.id}, {"friend_id": user.id}]},
                {"_id": 0}
            ).to_list(1000)
    
    if not links:
        return []
    
    # Extrai IDs dos amigos
    friend_ids = []
    for link in links:
        u, v = link.get("user_id"), link.get("friend_id")
        if u == user.id and v:
            friend_ids.append(v)
        elif v == user.id and u:
            friend_ids.append(u)
    
    if not friend_ids:
        return []
    
    # Carrega dados dos amigos
    friends = await db.users.find(
        {"id": {"$in": friend_ids}},
        {
            "_id": 0,
            "id": 1,
            "name": 1,
            "nickname": 1,
            "tag": 1,
            "last_activity": 1,
            "active_session": 1
        }
    ).to_list(1000)
    
    # Mapa de matérias
    subject_ids = []
    for f in friends:
        sid = (f.get("active_session") or {}).get("subject_id")
        if sid:
            subject_ids.append(sid)
    
    subject_map = {}
    if subject_ids:
        subjects = await db.subjects.find(
            {"id": {"$in": subject_ids}},
            {"_id": 0, "id": 1, "name": 1}
        ).to_list(1000)
        subject_map = {s["id"]: s["name"] for s in subjects}
    
    # Monta resposta
    result = []
    for f in friends:
        status = _presence_from_fields(f)
        active = f.get("active_session") or {}
        timer = active.get("timer") or {}
        
        timer_state = None
        seconds_left = None
        studying = None
        show_timer = False
        
        if status != "offline":
            state = (timer.get("state") or "").lower()
            updated_at = _to_aware(timer.get("updated_at"))
            
            # Timer é "fresco" se foi atualizado nos últimos 2 minutos
            FRESH_SECS = 120
            now = datetime.now(timezone.utc)
            fresh = bool(updated_at and (now - updated_at).total_seconds() <= FRESH_SECS)
            
            if state in ("focus", "break"):
                sl = _sec_left_from_timer(timer) or 0
                if sl > 0:
                    seconds_left = sl
                    timer_state = state
                    show_timer = True
                    if state == "focus":
                        sid = active.get("subject_id")
                        if sid:
                            studying = subject_map.get(sid)
            elif state == "paused" and fresh:
                seconds_left = _sec_left_from_timer(timer)
                timer_state = "paused"
                show_timer = True
                sid = active.get("subject_id")
                if sid:
                    studying = subject_map.get(sid)
        
        result.append({
            "id": f["id"],
            "nickname": f.get("nickname"),
            "tag": f.get("tag"),
            "name": f.get("name"),
            "status": status,
            "studying": studying,
            "timer_state": timer_state,
            "seconds_left": seconds_left,
            "show_timer": show_timer
        })
    
    return result


@router.post("/requests")
async def send_friend_request(
    payload: FriendRequestInput,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Envia uma solicitação de amizade.
    
    Args:
        payload: Nickname e tag do amigo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True, "request_id": str}
    
    Raises:
        HTTPException: 404 se usuário não encontrado
        HTTPException: 400 se já são amigos ou solicitação pendente
    """
    user = await get_current_user(request, session_token)
    
    # Localiza destinatário
    to_user = await db.users.find_one(
        {
            "nickname": {"$regex": f"^{payload.friend_nickname}$", "$options": "i"},
            "tag": {"$regex": f"^{payload.friend_tag}$", "$options": "i"}
        },
        {"_id": 0, "id": 1}
    )
    
    if not to_user:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    
    if to_user["id"] == user.id:
        raise HTTPException(status_code=400, detail="Você não pode enviar solicitação para si mesmo")
    
    # Verifica se já são amigos
    already = await db.friends.find_one({
        "$or": [
            {"user_id": user.id, "friend_id": to_user["id"]},
            {"user_id": to_user["id"], "friend_id": user.id}
        ]
    })
    
    if already:
        raise HTTPException(status_code=400, detail="Vocês já são amigos")
    
    # Verifica solicitação pendente
    pending = await db.friend_requests.find_one({
        "$or": [
            {"from_id": user.id, "to_id": to_user["id"], "status": "pending"},
            {"from_id": to_user["id"], "to_id": user.id, "status": "pending"}
        ]
    })
    
    if pending:
        raise HTTPException(status_code=400, detail="Já existe uma solicitação pendente entre vocês")
    
    # Cria solicitação
    req = FriendRequestModel(from_id=user.id, to_id=to_user["id"]).model_dump()
    req["created_at"] = req["created_at"].isoformat()
    
    await db.friend_requests.insert_one(req)
    
    return {"ok": True, "request_id": req["id"]}


@router.get("/requests")
async def list_friend_requests(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Lista solicitações de amizade (recebidas e enviadas).
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"incoming": List[dict], "outgoing": List[dict]}
    """
    user = await get_current_user(request, session_token)
    
    # Solicitações recebidas
    incoming = await db.friend_requests.find(
        {"to_id": user.id, "status": "pending"},
        {"_id": 0}
    ).to_list(500)
    
    # Solicitações enviadas
    outgoing = await db.friend_requests.find(
        {"from_id": user.id, "status": "pending"},
        {"_id": 0}
    ).to_list(500)
    
    # Enriquece com dados dos usuários
    for req in incoming:
        from_user = await db.users.find_one(
            {"id": req["from_id"]},
            {"_id": 0, "nickname": 1, "tag": 1, "name": 1}
        )
        if from_user:
            req["friend_nickname"] = from_user.get("nickname")
            req["friend_tag"] = from_user.get("tag")
            if from_user.get("nickname") and from_user.get("tag"):
                req["from"] = f"{from_user['nickname']}#{from_user['tag']}"
            else:
                req["from"] = from_user.get("name", "Usuário")
    
    for req in outgoing:
        to_user = await db.users.find_one(
            {"id": req["to_id"]},
            {"_id": 0, "nickname": 1, "tag": 1, "name": 1}
        )
        if to_user:
            req["friend_nickname"] = to_user.get("nickname")
            req["friend_tag"] = to_user.get("tag")
            if to_user.get("nickname") and to_user.get("tag"):
                req["to"] = f"{to_user['nickname']}#{to_user['tag']}"
            else:
                req["to"] = to_user.get("name", "Usuário")
    
    return {"incoming": incoming, "outgoing": outgoing}


@router.post("/requests/{request_id}/accept")
async def accept_friend_request(
    request_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Aceita uma solicitação de amizade.
    Cria vínculos bilaterais de amizade.
    
    Args:
        request_id: ID da solicitação
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    
    Raises:
        HTTPException: 404 se solicitação não encontrada
    """
    user = await get_current_user(request, session_token)
    
    fr = await db.friend_requests.find_one({"id": request_id}, {"_id": 0})
    if not fr or fr.get("to_id") != user.id or fr.get("status") != "pending":
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    # Cria vínculos bilaterais
    pairs = [
        {"user_id": fr["from_id"], "friend_id": fr["to_id"]},
        {"user_id": fr["to_id"], "friend_id": fr["from_id"]}
    ]
    
    now = datetime.now(timezone.utc).isoformat()
    for p in pairs:
        await db.friends.update_one(
            p,
            {"$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now}},
            upsert=True
        )
    
    # Atualiza status da solicitação
    await db.friend_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "accepted", "responded_at": now}}
    )
    
    return {"ok": True}


@router.post("/requests/{request_id}/reject")
async def reject_friend_request(
    request_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Rejeita uma solicitação de amizade.
    
    Args:
        request_id: ID da solicitação
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    
    Raises:
        HTTPException: 404 se solicitação não encontrada
    """
    user = await get_current_user(request, session_token)
    
    fr = await db.friend_requests.find_one({"id": request_id}, {"_id": 0})
    if not fr or fr.get("to_id") != user.id or fr.get("status") != "pending":
        raise HTTPException(status_code=404, detail="Solicitação não encontrada")
    
    await db.friend_requests.update_one(
        {"id": request_id},
        {"$set": {"status": "rejected", "responded_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"ok": True}


@router.delete("/remove/{friend_id}")
async def remove_friend(
    friend_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Remove um amigo.
    Deleta os vínculos bilaterais de amizade.
    
    Args:
        friend_id: ID do amigo
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True}
    """
    user = await get_current_user(request, session_token)
    
    # Remove ambos os vínculos
    await db.friends.delete_many({
        "$or": [
            {"user_id": user.id, "friend_id": friend_id},
            {"user_id": friend_id, "friend_id": user.id}
        ]
    })
    
    return {"ok": True}
