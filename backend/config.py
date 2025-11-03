"""
Configuração e constantes da aplicação.
Centraliza variáveis de ambiente e configurações do app.
"""
import os
import logging
from pathlib import Path

# Configuração do logger
logger = logging.getLogger("pomociclo")
if not logger.handlers:
    logging.basicConfig(level=logging.INFO)

# Configuração de ambiente
IS_DEV = os.environ.get("DEV", "1") in ("1", "true", "True")  # Ambiente de desenvolvimento
DISABLE_RATELIMIT = os.getenv("DISABLE_RATELIMIT", "false").lower() == "true"  # Desabilitar rate limiting
FREE_SHOP = os.getenv("FREE_SHOP", "false").lower() == "true"  # Loja grátis para testes

# Configuração do Google OAuth
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")  # ID do cliente Google
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")  # Secret do cliente Google
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "")  # URI de redirecionamento

# Configuração do JWT
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")  # Chave secreta JWT
JWT_ALGORITHM = "HS256"  # Algoritmo de encriptação
JWT_EXPIRATION_DAYS = 30  # Dias até expirar o token


def rl(times: int = 60, seconds: int = 60) -> list:
    """
    Helper de dependência de rate limiter (atualmente desabilitado).
    Retorna lista vazia pois o Redis não está configurado.
    
    Args:
        times: Número de requisições permitidas
        seconds: Janela de tempo em segundos
    
    Returns:
        Lista vazia (rate limiting desabilitado)
    """
    return []
