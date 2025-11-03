"""
Pomociclo API - Servidor Principal
====================================

Aplicação FastAPI modular para gerenciamento de estudos com gamificação.
Arquitetura limpa com rotas separadas por domínio, services e models.

Estrutura:
- /routes: Endpoints da API organizados por domínio
- /services: Lógica de negócio
- /models: Modelos de dados Pydantic
- /config.py: Configurações e variáveis de ambiente
- /database.py: Conexão MongoDB
- /dependencies.py: Dependências compartilhadas (auth, etc)
"""

from fastapi import FastAPI, Request, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import secrets

# Importa configurações centralizadas
from config import logger, IS_DEV
from database import db

# ================== CRIAÇÃO DA APLICAÇÃO ==================

app = FastAPI(
    title="Pomociclo API",
    description="API para gerenciamento de estudos com gamificação",
    version="2.0",
    docs_url="/api/docs" if IS_DEV else None,  # Swagger apenas em desenvolvimento
    redoc_url="/api/redoc" if IS_DEV else None
)

# ================== CONFIGURAÇÃO DE CORS ==================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# ================== MIDDLEWARES DE SEGURANÇA ==================

# Caminhos isentos de verificação CSRF
CSRF_EXEMPT_PATHS = {
    "/api/",
    "/api/health",
    "/api/auth/google/login",
    "/api/auth/google/callback",
    "/api/auth/me",
    "/api/auth/set-session",
}

@app.middleware("http")
async def csrf_guard(request: Request, call_next):
    """
    Middleware de proteção CSRF.
    Valida token CSRF em métodos que alteram dados (POST, PUT, PATCH, DELETE).
    """
    # Métodos "seguros" não validam
    if request.method not in ("POST", "PUT", "PATCH", "DELETE"):
        return await call_next(request)

    # Isenta se vier Authorization (útil em dev cross-origin)
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return await call_next(request)

    # Isenta paths específicos (exato match)
    if request.url.path in CSRF_EXEMPT_PATHS:
        return await call_next(request)
    
    # Isenta paths que começam com certos prefixos (para paths com parâmetros)
    exempt_prefixes = [
        "/api/subjects/",
        "/api/tasks/",
        "/api/calendar/",
        "/api/friends/",
        "/api/groups/",
        "/api/shop/",
        "/api/habits/",
        "/api/review/",
    ]
    for prefix in exempt_prefixes:
        if request.url.path.startswith(prefix):
            return await call_next(request)

    # Verificação CSRF padrão (header vs cookie)
    header = request.headers.get("X-CSRF-Token")
    cookie = request.cookies.get("csrf_token")
    if not header or not cookie or not secrets.compare_digest(header, cookie):
        return JSONResponse({"detail": "CSRF check failed"}, status_code=403)

    return await call_next(request)


@app.middleware("http")
async def body_size_guard(request: Request, call_next):
    """
    Middleware de proteção contra payloads muito grandes.
    Limita o tamanho do corpo da requisição a 1MB.
    """
    MAX_SIZE = 1024 * 1024  # 1MB
    content_length = request.headers.get("content-length")
    if content_length and int(content_length) > MAX_SIZE:
        return JSONResponse({"detail": "payload too large"}, status_code=413)
    return await call_next(request)


@app.middleware("http")
async def security_headers(request: Request, call_next):
    """
    Middleware que adiciona headers de segurança em todas as respostas.
    Protege contra clickjacking, XSS e outras vulnerabilidades.
    """
    response = await call_next(request)
    
    # Headers de segurança
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    
    return response


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handler global para exceções HTTP.
    Retorna respostas JSON padronizadas para erros.
    """
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )

# ================== EVENTOS DE STARTUP/SHUTDOWN ==================

@app.on_event("startup")
async def startup_indexes():
    """
    Evento executado na inicialização do servidor.
    Cria índices necessários no MongoDB para otimizar consultas.
    """
    logger.info("🚀 Inicializando Pomociclo API...")
    
    # Índices para melhor performance
    try:
        await db.groups.create_index("invite_code")
        await db.group_members.create_index([("group_id", 1), ("user_id", 1)])
        await db.users.create_index("email", unique=True)
        await db.subjects.create_index([("user_id", 1), ("order", 1)])
        await db.tasks.create_index([("subject_id", 1), ("completed", 1)])
        await db.study_sessions.create_index([("user_id", 1), ("start_time", -1)])
        await db.calendar_events.create_index([("user_id", 1), ("start_time", 1)])
        logger.info("✓ Índices do MongoDB criados/verificados")
    except Exception as e:
        logger.error(f"⚠️ Erro ao criar índices: {e}")
    
    logger.info("✓ Pomociclo API iniciada com sucesso!")


@app.on_event("shutdown")
async def shutdown_event():
    """
    Evento executado no desligamento do servidor.
    Limpa recursos e fecha conexões.
    """
    logger.info("👋 Desligando Pomociclo API...")

# ================== ROUTER PRINCIPAL DA API ==================

api_router = APIRouter(prefix="/api")

# Rotas base
@api_router.get("/")
async def api_root():
    """Rota raiz da API - retorna informações básicas."""
    return {
        "message": "Pomociclo API",
        "status": "ok",
        "version": "2.0",
        "docs": "/api/docs" if IS_DEV else "disabled"
    }

@api_router.get("/health")
async def health_check():
    """Health check - verifica se a API está funcionando."""
    return {"ok": True, "status": "healthy"}

# ================== IMPORTAÇÃO E REGISTRO DAS ROTAS ==================

# Importa todos os módulos de rotas
from routes import (
    auth,
    subjects,
    tasks,
    study,
    quests,
    shop,
    groups,
    rankings,
    friends,
    profile,
    presence,
    calendar,
    settings,
    review,
    habits,
    devocional,
    financeiro,
    rewards,
    stats,
    admin
)

# Registra todas as rotas no router principal
api_router.include_router(auth.router, tags=["autenticação"])
api_router.include_router(subjects.router, tags=["matérias"])
api_router.include_router(tasks.router, tags=["tarefas"])
api_router.include_router(study.router, tags=["estudos"])
api_router.include_router(quests.router, tags=["quests"])
api_router.include_router(shop.router, tags=["loja"])
api_router.include_router(groups.router, tags=["grupos"])
api_router.include_router(rankings.router, tags=["rankings"])
api_router.include_router(friends.router, tags=["amigos"])
api_router.include_router(profile.router, tags=["perfil"])
api_router.include_router(presence.router, tags=["presença"])
api_router.include_router(calendar.router, tags=["calendário"])
api_router.include_router(settings.router, tags=["configurações"])
api_router.include_router(review.router, tags=["revisão"])
api_router.include_router(habits.router, tags=["hábitos"])
api_router.include_router(devocional.router, tags=["devocional"])
api_router.include_router(financeiro.router, tags=["financeiro"])
api_router.include_router(rewards.router, tags=["recompensas"])
api_router.include_router(stats.router, tags=["estatísticas"])
api_router.include_router(admin.router, tags=["admin"])

# Registra o router principal no app
app.include_router(api_router)

# ================== EXECUÇÃO DIRETA (DESENVOLVIMENTO) ==================

if __name__ == "__main__":
    import uvicorn
    logger.info("🔧 Modo desenvolvimento - iniciando servidor uvicorn...")
    uvicorn.run(
        "server_new:app",
        host="0.0.0.0",
        port=8001,
        reload=True,  # Hot reload em desenvolvimento
        log_level="info"
    )
