# Pomociclo Backend - Guia de Inicialização

## ✅ Backend está refatorado e limpo!

O servidor principal (`server.py`) foi reduzido de **5000 linhas para 260 linhas** com uma arquitetura modular e clean code.

---

## 📋 Pré-requisitos

1. **Python 3.8+** instalado
2. **MongoDB** rodando (localhost:27017)
3. **Dependências Python** instaladas

---

## 🚀 Comandos para Iniciar o Backend

### Opção 1: Usando o script automatizado (RECOMENDADO)
```bash
cd backend
./start.sh
```

### Opção 2: Comandos manuais

#### 1. Instalar dependências (primeira vez)
```bash
cd backend
pip install -r requirements.txt
```

#### 2. Iniciar o servidor
```bash
cd backend
python server.py
```

### Opção 3: Com uvicorn diretamente
```bash
cd backend
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

---

## 🌐 URLs Importantes

- **API Base:** http://localhost:8001/api
- **Health Check:** http://localhost:8001/api/health
- **Documentação (Swagger):** http://localhost:8001/api/docs
- **Documentação (ReDoc):** http://localhost:8001/api/redoc

---

## 📁 Arquitetura Clean Code

```
backend/
├── server.py              # Servidor principal (260 linhas) ✨
├── config.py              # Configurações centralizadas
├── database.py            # Conexão MongoDB
├── dependencies.py        # Autenticação e helpers
├── requirements.txt       # Dependências Python
│
├── routes/                # 🎯 Endpoints da API (por domínio)
│   ├── auth.py           # Autenticação
│   ├── subjects.py       # Matérias
│   ├── tasks.py          # Tarefas
│   ├── study.py          # Sessões de estudo
│   ├── quests.py         # Sistema de quests
│   ├── shop.py           # Loja
│   ├── groups.py         # Grupos de estudo
│   ├── rankings.py       # Rankings
│   ├── friends.py        # Sistema de amigos
│   ├── profile.py        # Perfil do usuário
│   ├── presence.py       # Presença online
│   ├── calendar.py       # Calendário
│   ├── settings.py       # Configurações
│   ├── review.py         # Sistema de revisão
│   ├── habits.py         # Hábitos
│   ├── devocional.py     # Devocional
│   ├── financeiro.py     # Controle financeiro
│   ├── rewards.py        # Recompensas
│   ├── stats.py          # Estatísticas
│   └── admin.py          # Administração
│
├── services/              # 🧠 Lógica de negócio
│   ├── auth_service.py   # Serviço de autenticação
│   ├── quest_service.py  # Lógica de quests
│   ├── quest_generator.py# Gerador de quests
│   ├── reward_service.py # Sistema de recompensas
│   ├── timer_service.py  # Gerenciamento de timers
│   └── calendar_service.py # Lógica de calendário
│
├── models/                # 📦 Modelos de dados Pydantic
│   ├── user.py           # Modelo de usuário
│   ├── task.py           # Modelo de tarefa
│   ├── quest.py          # Modelo de quest
│   ├── subject.py        # Modelo de matéria
│   ├── shop.py           # Modelo de itens da loja
│   ├── calendar.py       # Modelo de eventos
│   ├── group.py          # Modelo de grupos
│   ├── study.py          # Modelo de sessões de estudo
│   ├── timer.py          # Modelo de timer
│   └── settings.py       # Modelo de configurações
│
└── utils/                 # 🛠️ Utilitários
    ├── auth_utils.py     # Helpers de autenticação
    ├── datetime_utils.py # Helpers de data/hora
    ├── helpers.py        # Helpers gerais
    └── reward_calculator.py # Cálculo de recompensas
```

---

## ✨ Melhorias Implementadas

### 1. **Modularização Completa**
   - Cada domínio tem seu próprio arquivo de rota
   - Lógica de negócio separada em services
   - Models Pydantic para validação

### 2. **Segurança**
   - Middleware CSRF protection
   - Proteção contra payloads grandes
   - Headers de segurança (X-Frame-Options, etc.)
   - Rate limiting preparado

### 3. **Manutenibilidade**
   - Código bem comentado em português
   - Docstrings em todas as funções
   - Configurações centralizadas
   - Fácil de encontrar e modificar código

### 4. **Performance**
   - Índices MongoDB criados automaticamente
   - Conexões assíncronas (motor)
   - Queries otimizadas

---

## 🔧 Configuração (.env)

```env
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"

# Opcional
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI=""
JWT_SECRET="your-secret-key-change-in-production"
```

---

## 📝 Próximos Passos

Agora que o backend está limpo e funcional, vamos refatorar o frontend:
- DashboardFixed.js (2047 linhas → modular)
- Outros componentes grandes
- Estrutura de componentes reutilizáveis

---

## 🐛 Troubleshooting

### MongoDB não inicia
```bash
sudo systemctl start mongod
sudo systemctl status mongod
```

### Porta 8001 já em uso
```bash
# Encontrar processo
lsof -i :8001

# Ou usar outra porta editando server.py (linha 257)
```

### Erro de módulo não encontrado
```bash
pip install -r requirements.txt --force-reinstall
```
