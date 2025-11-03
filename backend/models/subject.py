"""
Modelos Pydantic relacionados a matérias.
Define as estruturas de dados para matérias de estudo.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class Subject(BaseModel):
    """Modelo de matéria com tracking de tempo de estudo."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # ID do usuário dono da matéria
    name: str  # Nome da matéria
    color: str  # Cor para identificação visual (hex)
    order: int  # Ordem de exibição
    time_goal: int  # Meta de tempo por ciclo (em minutos)
    total_time_studied: int = 0  # Total de minutos estudados
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de criação


class SubjectCreate(BaseModel):
    """Modelo de requisição para criar uma nova matéria."""
    name: str  # Nome da matéria
    color: str  # Cor (hex)
    time_goal: int  # Meta de tempo em minutos


class SubjectUpdate(BaseModel):
    """Modelo de requisição para atualizar uma matéria existente."""
    name: Optional[str] = None  # Novo nome (opcional)
    color: Optional[str] = None  # Nova cor (opcional)
    time_goal: Optional[int] = None  # Nova meta (opcional)
    order: Optional[int] = None  # Nova ordem (opcional)
