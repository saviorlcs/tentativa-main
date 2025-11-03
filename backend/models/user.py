"""
Modelos Pydantic relacionados ao usuário.
Define as estruturas de dados para contas de usuário e autenticação.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class User(BaseModel):
    """Modelo principal de usuário com dados de perfil e gamificação."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str  # Email do usuário
    name: str  # Nome completo
    picture: Optional[str] = None  # URL da foto de perfil
    nickname: Optional[str] = None  # Apelido (4-16 caracteres alfanuméricos)
    tag: Optional[str] = None  # Tag única (3-4 caracteres alfanuméricos)
    last_nickname_change: Optional[datetime] = None  # Última vez que mudou nickname
    level: int = 1  # Nível do usuário
    coins: int = 0  # Moedas da loja
    xp: int = 0  # Experiência acumulada
    items_owned: List[str] = Field(default_factory=list)  # IDs dos itens possuídos
    equipped_items: dict = Field(default_factory=lambda: {"seal": None, "border": None, "theme": None})  # Itens equipados
    online_status: str = "offline"  # Status: online, away, offline
    last_activity: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Última atividade
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de criação


class UserSession(BaseModel):
    """Modelo de sessão de autenticação do usuário."""
    user_id: str  # ID do usuário
    session_token: str  # Token da sessão
    expires_at: datetime  # Data de expiração
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de criação


class NicknameTagCreate(BaseModel):
    """Modelo de requisição para criar nickname e tag."""
    nickname: str  # Apelido desejado
    tag: str  # Tag desejada


class NicknameTagUpdate(BaseModel):
    """Modelo de requisição para atualizar nickname e tag."""
    nickname: str  # Novo apelido
    tag: str  # Nova tag
