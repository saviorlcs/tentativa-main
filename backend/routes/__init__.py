"""
Pacote de rotas - Endpoints da API organizados por domínio.

Módulos disponíveis:
- auth: Autenticação (login, logout, callback OAuth)
- subjects: CRUD de matérias
- tasks: CRUD de tarefas
- study: Sessões de estudo e timer
- quests: Sistema de quests semanais
- shop: Loja de itens e equipamentos
- settings: Configurações do usuário
- profile: Perfil, stats e nickname
- presence: Status online/offline/away
- calendar: Eventos do calendário
- groups: CRUD de grupos e membros
- rankings: Rankings global, amigos e grupos
- friends: Sistema de amizades
- review: Sistema de revisão espaçada
- habits: Sistema de hábitos diários
- devocional: Plano e progresso devocional
- financeiro: Gerenciamento financeiro
- rewards: Bônus e recompensas
- stats: Estatísticas do usuário
- admin: Rotas administrativas
"""

# Importa todos os routers para facilitar o acesso
from . import (
    auth,
    subjects,
    tasks,
    study,
    quests,
    shop,
    settings,
    profile,
    presence,
    calendar,
    groups,
    rankings,
    friends,
    review,
    habits,
    devocional,
    financeiro,
    rewards,
    stats,
    admin
)

__all__ = [
    "auth",
    "subjects",
    "tasks",
    "study",
    "quests",
    "shop",
    "settings",
    "profile",
    "presence",
    "calendar",
    "groups",
    "rankings",
    "friends",
    "review",
    "habits",
    "devocional",
    "financeiro",
    "rewards",
    "stats",
    "admin"
]
