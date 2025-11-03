"""
Modelos Pydantic relacionados a grupos.
Define as estruturas de dados para grupos de estudo.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone
import uuid


class GroupCreate(BaseModel):
    """Modelo de requisição para criar um novo grupo."""
    name: str  # Nome do grupo
    description: Optional[str] = None  # Descrição do grupo
    is_private: bool = False  # Se o grupo é privado


class GroupOut(BaseModel):
    """Modelo de resposta com dados do grupo."""
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # Nome do grupo
    description: Optional[str] = None  # Descrição
    owner_id: str  # ID do dono do grupo
    is_private: bool = False  # Se é privado
    invite_code: Optional[str] = None  # Código de convite
    member_count: int = 0  # Número de membros
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))  # Data de criação


class GroupUpdate(BaseModel):
    """Modelo de requisição para atualizar detalhes do grupo."""
    name: Optional[str] = None  # Novo nome
    description: Optional[str] = None  # Nova descrição
    is_private: Optional[bool] = None  # Novo status de privacidade


class InviteJoin(BaseModel):
    """Modelo de requisição para entrar via código de convite."""
    invite_code: str  # Código de convite


class MemberRoleChange(BaseModel):
    """Modelo de requisição para mudar role de membro."""
    user_id: str  # ID do usuário
    role: str  # Nova role


class GroupLeave(BaseModel):
    """Modelo de requisição para sair de um grupo."""
    group_id: str  # ID do grupo


class GroupJoin(BaseModel):
    """Modelo de requisição para entrar em um grupo."""
    group_id: str  # ID do grupo
