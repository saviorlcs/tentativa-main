"""
Rotas de matérias (subjects).
Gerencia CRUD de matérias de estudo.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from typing import Optional, List
import random

from database import db
from dependencies import get_current_user
from models.subject import Subject, SubjectCreate, SubjectUpdate
from pydantic import BaseModel

router = APIRouter(prefix="/subjects")


class ReorderSubjectsPayload(BaseModel):
    """Payload para reordenar matérias."""
    order: List[str]  # Lista de IDs na nova ordem


@router.get("", response_model=List[Subject])
async def get_subjects(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna todas as matérias do usuário ordenadas.
    
    Args:
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        List[Subject]: Lista de matérias ordenadas
    """
    user = await get_current_user(request, session_token)
    subjects = await db.subjects.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("order", 1).to_list(100)
    return subjects


@router.post("", response_model=Subject)
async def create_subject(
    input: SubjectCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria uma nova matéria.
    Gera automaticamente uma cor única e aleatória.
    
    Args:
        input: Dados da nova matéria
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        Subject: Matéria criada
    """
    user = await get_current_user(request, session_token)
    
    # Obtém ordem máxima atual
    subjects = await db.subjects.find({"user_id": user.id}).to_list(1000)
    max_order = max([s.get("order", 0) for s in subjects], default=-1)
    
    # Gerar cor única e aleatória diferente das existentes
    existing_colors = {s.get("color") for s in subjects if s.get("color")}
    
    # Paleta de cores vibrantes para matérias
    color_palette = [
        "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8",
        "#F7DC6F", "#BB8FCE", "#85C1E2", "#F8B88B", "#FAD7A0",
        "#A569BD", "#5DADE2", "#48C9B0", "#F4D03F", "#EB984E",
        "#EC7063", "#AF7AC5", "#5499C7", "#52BE80", "#F39C12",
        "#E74C3C", "#9B59B6", "#3498DB", "#1ABC9C", "#F39C12"
    ]
    
    # Encontrar cor disponível
    available_colors = [c for c in color_palette if c not in existing_colors]
    
    if available_colors:
        # Usa cor aleatória da paleta que ainda não foi usada
        selected_color = available_colors[random.randint(0, len(available_colors) - 1)]
    else:
        # Se todas as cores foram usadas, gerar cor RGB aleatória
        selected_color = "#{:02x}{:02x}{:02x}".format(
            random.randint(100, 255),
            random.randint(100, 255),
            random.randint(100, 255)
        )
    
    subject = Subject(
        user_id=user.id,
        name=input.name,
        color=selected_color,  # Usa cor gerada ao invés da fornecida
        time_goal=input.time_goal,
        order=max_order + 1
    )
    
    subject_dict = subject.model_dump()
    subject_dict["created_at"] = subject_dict["created_at"].isoformat()
    await db.subjects.insert_one(subject_dict)
    
    return subject


@router.patch("/{subject_id}")
async def update_subject(
    subject_id: str,
    input: SubjectUpdate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza uma matéria existente.
    
    Args:
        subject_id: ID da matéria
        input: Dados para atualização
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    
    Raises:
        HTTPException: 404 se matéria não encontrada
    """
    user = await get_current_user(request, session_token)
    
    subject = await db.subjects.find_one({"id": subject_id, "user_id": user.id})
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data:
        await db.subjects.update_one(
            {"id": subject_id},
            {"$set": update_data}
        )
    
    return {"success": True}


@router.delete("/{subject_id}")
async def delete_subject(
    subject_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Deleta uma matéria.
    
    Args:
        subject_id: ID da matéria
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    
    Raises:
        HTTPException: 404 se matéria não encontrada
    """
    user = await get_current_user(request, session_token)
    
    result = await db.subjects.delete_one({"id": subject_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    return {"success": True}


@router.post("/reorder")
async def reorder_subjects(
    payload: ReorderSubjectsPayload,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Reordena matérias do usuário.
    
    Args:
        payload: Nova ordem das matérias (lista de IDs)
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    
    Raises:
        HTTPException: 400 se IDs inválidos
    """
    user = await get_current_user(request, session_token)

    # Valida IDs pertencentes ao usuário
    user_subjects = await db.subjects.find(
        {"user_id": user.id},
        {"_id": 0, "id": 1}
    ).to_list(1000)
    
    owned = {s["id"] for s in user_subjects}
    invalid = [sid for sid in payload.order if sid not in owned]
    
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"IDs inválidos: {invalid}"
        )

    # Atualiza 1 a 1 (simples e compatível com Motor)
    for idx, sid in enumerate(payload.order):
        await db.subjects.update_one(
            {"id": sid, "user_id": user.id},
            {"$set": {"order": idx}}
        )

    return {"success": True}
