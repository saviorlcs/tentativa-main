"""
Modelos Pydantic relacionados a quests.
Define as estruturas de dados para quests e progresso do usuário.
"""
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime, timezone
import uuid


class Quest(BaseModel):
    """Modelo de quest com recompensas."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str  # Título da quest
    description: str  # Descrição detalhada
    xp_reward: int  # Recompensa em XP
    coins_reward: int  # Recompensa em moedas
    quest_type: str  # Tipo: daily, weekly, special
    target: int  # Valor alvo para completar


class UserQuest(BaseModel):
    """Modelo de progresso de quest do usuário."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # ID do usuário
    quest_id: str  # ID da quest
    progress: int = 0  # Progresso atual
    completed: bool = False  # Se foi completada
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de início
