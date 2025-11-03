"""
Pom

ociclo API - Servidor principal.
Aplicação FastAPI modular para gerenciamento de estudos com gamificação.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import APIRouter

# Importa configurações
from config import logger

# Cria app FastAPI
app = FastAPI(
    title="Pomociclo API",
    description="API para gerenciamento de estudos com gamificação",
    version="2.0"
)

# Configuração de CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Em produção, especifique os domínios permitidos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router principal da API
api_router = APIRouter(prefix="/api")

# Importa e registra todas as rotas
from routes import auth, subjects, tasks, study, quests, shop, groups, rankings, friends, profile, presence, calendar, settings

# Registra rotas base
@api_router.get("/")
async def api_root():
    """Rota raiz da API."""
    return {"message": "Pomociclo API", "status": "ok", "version": "2.0"}

@api_router.get("/health")
async def health():
    """Health check da API."""
    return {"ok": True}

# Inclui rotas dos módulos
api_router.include_router(auth.router, tags=["auth"])
api_router.include_router(subjects.router, tags=["subjects"])
api_router.include_router(tasks.router, tags=["tasks"])
api_router.include_router(study.router, tags=["study"])
api_router.include_router(quests.router, tags=["quests"])
api_router.include_router(shop.router, tags=["shop"])
api_router.include_router(groups.router, tags=["groups"])
api_router.include_router(rankings.router, tags=["rankings"])
api_router.include_router(friends.router, tags=["friends"])
api_router.include_router(profile.router, tags=["profile"])
api_router.include_router(presence.router, tags=["presence"])
api_router.include_router(calendar.router, tags=["calendar"])
api_router.include_router(settings.router, tags=["settings"])

# Registra o router principal no app
app.include_router(api_router)

# Log de inicialização
logger.info("Pomociclo API iniciada com sucesso!")

# Exporta o app para o uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
