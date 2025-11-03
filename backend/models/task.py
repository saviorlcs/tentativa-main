"""
Modelos Pydantic relacionados a tarefas.
Define as estruturas de dados para tarefas de matérias.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
import uuid


class Task(BaseModel):
    """Modelo de tarefa associada a uma matéria."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # ID do usuário
    subject_id: str  # ID da matéria relacionada
    title: str  # Título/descrição da tarefa
    completed: bool = False  # Status de conclusão
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de criação


class TaskCreate(BaseModel):
    """Modelo de requisição para criar uma nova tarefa."""
    subject_id: str  # ID da matéria
    title: str  # Título da tarefa
