"""
Rotas da loja (shop).
Gerencia itens da loja, compra, equipar/desequipar items.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from typing import Optional, List
from pydantic import BaseModel

from database import db
from dependencies import get_current_user
from config import FREE_SHOP

router = APIRouter(prefix="/shop")


class EquipBody(BaseModel):
    """Payload para equipar item."""
    item_id: str


class UnequipBody(BaseModel):
    """Payload para desequipar item."""
    item_type: str  # "seal" | "border" | "theme"


class PurchaseBody(BaseModel):
    """Payload para comprar item."""
    item_id: str


async def _load_shop_items() -> List[dict]:
    """
    Carrega todos os itens da loja do banco de dados.
    
    Returns:
        List[dict]: Lista de itens da loja
    """
    items = await db.shop_items.find({}, {"_id": 0}).to_list(1000)
    return items


@router.get("/list")
@router.get("/items")
@router.get("")
@router.get("/all")
async def shop_list():
    """
    Lista todos os itens disponíveis na loja.
    
    Returns:
        dict: Itens da loja e se a loja está grátis (modo teste)
    """
    items = await _load_shop_items()
    return {"items": items, "free_shop": FREE_SHOP}


@router.post("/purchase")
@router.post("/buy")
async def shop_purchase(
    body: PurchaseBody,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Compra um item da loja.
    Verifica se usuário tem coins suficientes e se já possui o item.
    
    Args:
        body: Dados da compra (item_id)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True, "new_balance": int}
    
    Raises:
        HTTPException: 404 se item não encontrado
        HTTPException: 400 se já possui o item ou coins insuficientes
    """
    user = await get_current_user(request, session_token)
    
    # Busca o item
    items = await _load_shop_items()
    item = next((x for x in items if x["id"] == body.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    # Verifica se já possui
    items_owned = user.items_owned or []
    if body.item_id in items_owned:
        raise HTTPException(status_code=400, detail="Você já possui este item")
    
    # Verifica coins (a menos que FREE_SHOP esteja ativo)
    price = item.get("price", 0)
    if not FREE_SHOP:
        if user.coins < price:
            raise HTTPException(
                status_code=400,
                detail=f"Coins insuficientes. Você tem {user.coins}, precisa de {price}"
            )
    
    # Adiciona item ao inventário
    await db.users.update_one(
        {"id": user.id},
        {
            "$push": {"items_owned": body.item_id},
            "$inc": {"coins": -price if not FREE_SHOP else 0}
        }
    )
    
    new_balance = user.coins - (price if not FREE_SHOP else 0)
    return {"ok": True, "new_balance": new_balance}


@router.post("/equip")
@router.post("/equip_item")
async def shop_equip(
    body: EquipBody,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Equipa um item do inventário do usuário.
    
    Args:
        body: Dados (item_id)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True, "item_type": str, "item_id": str}
    
    Raises:
        HTTPException: 404 se item não encontrado
        HTTPException: 400 se não possui o item
    """
    user = await get_current_user(request, session_token)
    
    # Busca o item
    items = await _load_shop_items()
    item = next((x for x in items if x["id"] == body.item_id), None)
    if not item:
        raise HTTPException(status_code=404, detail="Item não encontrado")
    
    # Verifica se possui o item
    items_owned = user.items_owned or []
    if body.item_id not in items_owned:
        raise HTTPException(status_code=400, detail="Você não possui este item")
    
    item_type = item["item_type"]
    
    # Equipa o item
    await db.users.update_one(
        {"id": user.id},
        {"$set": {f"equipped_items.{item_type}": body.item_id}}
    )
    
    return {"ok": True, "item_type": item_type, "item_id": body.item_id}


@router.post("/unequip")
@router.post("/unequip_item")
async def shop_unequip(
    body: UnequipBody,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Desequipa um item equipado.
    
    Args:
        body: Dados (item_type)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"ok": True, "item_type": str}
    
    Raises:
        HTTPException: 400 se item_type inválido
    """
    user = await get_current_user(request, session_token)
    
    item_type = body.item_type
    if not item_type or item_type not in ["seal", "border", "theme"]:
        raise HTTPException(status_code=400, detail="Invalid item_type")
    
    # Desequipa o item
    await db.users.update_one(
        {"id": user.id},
        {"$set": {f"equipped_items.{item_type}": None}}
    )
    
    return {"ok": True, "item_type": item_type}


@router.get("/inventory")
async def shop_inventory(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna o inventário do usuário (itens possuídos e equipados).
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"items_owned": List[str], "equipped_items": dict}
    """
    user = await get_current_user(request, session_token)
    
    return {
        "items_owned": user.items_owned or [],
        "equipped_items": user.equipped_items or {"seal": None, "border": None, "theme": None}
    }
