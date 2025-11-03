"""
Rotas de tarefas (tasks).
Gerencia CRUD de tarefas associadas a matérias.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from typing import Optional, List

from database import db
from dependencies import get_current_user
from models.task import Task, TaskCreate

router = APIRouter(prefix="/tasks")


@router.get("/{subject_id}", response_model=List[Task])
async def get_tasks(
    subject_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna todas as tarefas de uma matéria.
    
    Args:
        subject_id: ID da matéria
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        List[Task]: Lista de tarefas da matéria
    """
    user = await get_current_user(request, session_token)
    tasks = await db.tasks.find(
        {"user_id": user.id, "subject_id": subject_id},
        {"_id": 0}
    ).to_list(1000)
    return tasks


@router.post("", response_model=Task)
async def create_task(
    input: TaskCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria uma nova tarefa.
    
    Args:
        input: Dados da nova tarefa
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        Task: Tarefa criada
    """
    user = await get_current_user(request, session_token)
    
    task = Task(
        user_id=user.id,
        subject_id=input.subject_id,
        title=input.title
    )
    
    task_dict = task.model_dump()
    task_dict["created_at"] = task_dict["created_at"].isoformat()
    await db.tasks.insert_one(task_dict)
    
    return task


@router.patch("/{task_id}")
async def toggle_task(
    task_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Alterna estado de conclusão de uma tarefa.
    
    Args:
        task_id: ID da tarefa
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    
    Raises:
        HTTPException: 404 se tarefa não encontrada
    """
    user = await get_current_user(request, session_token)
    
    task = await db.tasks.find_one({"id": task_id, "user_id": user.id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    await db.tasks.update_one(
        {"id": task_id},
        {"$set": {"completed": not task["completed"]}}
    )
    
    return {"success": True}


@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Deleta uma tarefa.
    
    Args:
        task_id: ID da tarefa
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    
    Raises:
        HTTPException: 404 se tarefa não encontrada
    """
    user = await get_current_user(request, session_token)
    
    result = await db.tasks.delete_one({"id": task_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return {"success": True}
