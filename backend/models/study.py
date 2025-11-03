"""
Modelos Pydantic relacionados a estudo.
Define as estruturas de dados para sessões de estudo e ciclos.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime, timezone
import uuid


class StudySession(BaseModel):
    """Modelo de sessão de estudo com tracking de recompensas."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # ID do usuário
    subject_id: str  # ID da matéria estudada
    start_time: datetime  # Horário de início
    end_time: Optional[datetime] = None  # Horário de término
    duration: int = 0  # Duração em minutos
    completed: bool = False  # Se foi completada
    skipped: bool = False  # Se foi pulada
    coins_earned: int = 0  # Moedas ganhas
    xp_earned: int = 0  # XP ganho


class StudySessionStart(BaseModel):
    """Modelo de requisição para iniciar uma sessão de estudo."""
    subject_id: str  # ID da matéria a estudar


class StudySessionEnd(BaseModel):
    """Modelo de requisição para finalizar uma sessão de estudo."""
    session_id: str  # ID da sessão
    duration: int  # Duração real estudada em minutos
    skipped: bool = False  # Se foi pulada


class Cycle(BaseModel):
    """Modelo de ciclo semanal para tracking de metas de estudo."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # ID do usuário
    week_start: datetime  # Início da semana
    week_end: datetime  # Fim da semana
    status: str = "active"  # Status: active, completed
    total_time_goal: int = 0  # Meta total de tempo
    total_time_studied: int = 0  # Total estudado
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de criação
