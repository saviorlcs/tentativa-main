"""
Modelos Pydantic relacionados ao calendário.
Define as estruturas de dados para eventos do calendário.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class EventChecklistItem(BaseModel):
    """Item de checklist dentro de um evento do calendário."""
    text: str  # Texto do item
    done: bool = False  # Se foi concluído


class CalendarEventCreate(BaseModel):
    """Modelo de requisição para criar um evento no calendário."""
    title: str  # Título do evento
    start: datetime  # Data/hora de início
    end: datetime  # Data/hora de fim
    subject_id: Optional[str] = None  # ID da matéria relacionada
    description: Optional[str] = None  # Descrição do evento
    checklist: List[EventChecklistItem] = Field(default_factory=list)  # Lista de tarefas
    color: Optional[str] = None  # Cor do evento


class CalendarEventUpdate(BaseModel):
    """Modelo de requisição para atualizar um evento do calendário."""
    title: Optional[str] = None  # Novo título
    start: Optional[datetime] = None  # Nova data/hora de início
    end: Optional[datetime] = None  # Nova data/hora de fim
    subject_id: Optional[str] = None  # Nova matéria
    description: Optional[str] = None  # Nova descrição
    checklist: Optional[List[EventChecklistItem]] = None  # Nova checklist
    color: Optional[str] = None  # Nova cor


class CalendarEvent(BaseModel):
    """Modelo completo de evento do calendário."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # ID do usuário dono do evento
    title: str  # Título
    start: datetime  # Início
    end: datetime  # Fim
    subject_id: Optional[str] = None  # Matéria relacionada
    description: Optional[str] = None  # Descrição
    checklist: List[EventChecklistItem] = Field(default_factory=list)  # Checklist
    color: Optional[str] = None  # Cor
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de criação
