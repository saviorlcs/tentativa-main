"""
Pacote de modelos - Models Pydantic da aplicação.
Define as estruturas de dados usadas na API.
"""
from .user import User, UserSession, NicknameTagCreate, NicknameTagUpdate
from .subject import Subject, SubjectCreate, SubjectUpdate
from .task import Task, TaskCreate
from .study import StudySession, StudySessionStart, StudySessionEnd, Cycle
from .quest import Quest, UserQuest
from .shop import ShopItem, PurchaseItem
from .settings import Settings, UserSettings
from .timer import TimerStateIn, TimerStateBody
from .group import (
    GroupCreate, GroupOut, GroupUpdate, InviteJoin,
    MemberRoleChange, GroupLeave, GroupJoin
)
from .calendar import EventChecklistItem, CalendarEventCreate, CalendarEventUpdate, CalendarEvent

__all__ = [
    # Modelos de usuário
    "User", "UserSession", "NicknameTagCreate", "NicknameTagUpdate",
    # Modelos de matéria
    "Subject", "SubjectCreate", "SubjectUpdate",
    # Modelos de tarefa
    "Task", "TaskCreate",
    # Modelos de estudo
    "StudySession", "StudySessionStart", "StudySessionEnd", "Cycle",
    # Modelos de quest
    "Quest", "UserQuest",
    # Modelos de loja
    "ShopItem", "PurchaseItem",
    # Modelos de configurações
    "Settings", "UserSettings",
    # Modelos de timer
    "TimerStateIn", "TimerStateBody",
    # Modelos de grupo
    "GroupCreate", "GroupOut", "GroupUpdate", "InviteJoin",
    "MemberRoleChange", "GroupLeave", "GroupJoin",
    # Modelos de calendário
    "EventChecklistItem", "CalendarEventCreate", "CalendarEventUpdate", "CalendarEvent",
]
