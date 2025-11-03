"""
Rotas de Financeiro.
Gerencia dados financeiros do usuário.
"""
from fastapi import APIRouter, Request, Cookie
from typing import Optional

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/financeiro")


@router.get("/data")
async def get_financeiro_data(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna dados financeiros do usuário.
    
    Returns:
        dict: Dados financeiros organizados por ano/mês
    """
    user = await get_current_user(request, session_token)
    doc = await db.financeiro.find_one({"user_id": user.id})
    return doc.get("data", {}) if doc else {}


@router.post("/save")
async def save_financeiro_value(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Salva um valor financeiro específico.
    
    Body JSON:
        - year: Ano
        - month: Mês
        - category: Categoria (receitas, despesas, etc)
        - item: Item específico
        - value: Valor numérico
    
    Returns:
        dict: {"success": True}
    """
    user = await get_current_user(request, session_token)
    body = await request.json()
    
    year = body.get("year")
    month = body.get("month")
    category = body.get("category")
    item = body.get("item")
    value = body.get("value", 0)
    
    # Monta o caminho do campo para atualização
    key = f"{year}-{month}"
    update_path = f"data.{key}.{category}.{item}"
    
    await db.financeiro.update_one(
        {"user_id": user.id},
        {"$set": {update_path: value}},
        upsert=True
    )
    
    return {"success": True}
