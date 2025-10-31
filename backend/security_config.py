# backend/security_config.py
# Configurações de segurança centralizadas

import logging
from pathlib import Path

# ==================== LOGGING DE SEGURANÇA ====================

# Cria logger específico para segurança
security_logger = logging.getLogger('security')
security_logger.setLevel(logging.WARNING)

# Handler para arquivo de log de segurança
log_dir = Path(__file__).parent / 'logs'
log_dir.mkdir(exist_ok=True)

security_handler = logging.FileHandler(log_dir / 'security.log')
security_handler.setLevel(logging.WARNING)

# Formato do log
formatter = logging.Formatter(
    '%(asctime)s | %(levelname)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
security_handler.setFormatter(formatter)
security_logger.addHandler(security_handler)

# Também loga no console
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.ERROR)
console_handler.setFormatter(formatter)
security_logger.addHandler(console_handler)


# ==================== CONFIGURAÇÕES ====================

# Rate Limiting
RATE_LIMIT_MAX_REQUESTS = 100  # Requisições por janela
RATE_LIMIT_WINDOW_SECONDS = 60  # Janela de tempo em segundos
RATE_LIMIT_BLOCK_MINUTES = 15  # Tempo de bloqueio

# Admin Protection
ADMIN_MAX_FAILED_ATTEMPTS = 5  # Tentativas de login admin
ADMIN_BLOCK_HOURS = 1  # Tempo de bloqueio após falhas

# IPs confiáveis (whitelist) - adicione IPs que nunca devem ser bloqueados
TRUSTED_IPS = [
    '127.0.0.1',
    'localhost',
]

# Padrões de ataque conhecidos
ATTACK_PATTERNS = [
    # XSS
    r'<script[^>]*>',
    r'javascript:',
    r'on\w+\s*=',
    
    # SQL Injection (mesmo usando MongoDB, por precaução)
    r'union\s+select',
    r'drop\s+table',
    r'insert\s+into',
    r'delete\s+from',
    r';\s*drop',
    
    # Code Injection
    r'exec\s*\(',
    r'eval\s*\(',
    r'system\s*\(',
    r'passthru',
    r'shell_exec',
    
    # Path Traversal
    r'\.\./\.\.',
    r'\.\.\\',
    
    # Command Injection
    r';\s*cat\s+',
    r';\s*ls\s+',
    r';\s*rm\s+',
    r'\|\s*wget',
    r'\|\s*curl',
]

# Rotas públicas (não precisam de autenticação)
PUBLIC_ROUTES = [
    '/api/auth/google',
    '/api/auth/google/callback',
    '/docs',
    '/openapi.json',
    '/favicon.ico',
]

# Rotas que exigem admin
ADMIN_ROUTES = [
    '/api/admin',
]

print("✅ Configurações de segurança carregadas")
print(f"📊 Rate Limit: {RATE_LIMIT_MAX_REQUESTS} req/{RATE_LIMIT_WINDOW_SECONDS}s")
print(f"🛡️ Padrões de ataque monitorados: {len(ATTACK_PATTERNS)}")
