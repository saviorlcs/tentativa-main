"""
Configuração de banco de dados e conexão.
Centraliza a conexão MongoDB e referências às coleções.
"""
import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

# Carrega variáveis de ambiente
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Configuração da conexão MongoDB
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Referências às coleções - centralizadas para fácil acesso
groups_col = db["groups"]  # Coleção de grupos
group_members_col = db["group_members"]  # Membros de grupos
group_join_col = db["group_join_requests"]  # Solicitações de entrada em grupos
sessions_col = db["study_sessions"]  # Sessões de estudo
presence_col = db["presence"]  # Presença online dos usuários
users_col = db["users"]  # Usuários
subjects_col = db["subjects"]  # Matérias
tasks_col = db["tasks"]  # Tarefas
study_sessions_col = db["study_sessions"]  # Sessões de estudo
cycles_col = db["cycles"]  # Ciclos semanais
quests_col = db["quests"]  # Quests disponíveis
user_quests_col = db["user_quests"]  # Progresso de quests dos usuários
shop_items_col = db["shop_items"]  # Itens da loja
user_sessions_col = db["user_sessions"]  # Sessões de autenticação
settings_col = db["settings"]  # Configurações dos usuários
calendar_events_col = db["calendar_events"]  # Eventos do calendário
friends_col = db["friends"]  # Relações de amizade
rankings_col = db["rankings"]  # Rankings
