# backend/security_middleware.py
# Middleware de segurança para proteger contra invasões e ataques

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from datetime import datetime, timedelta
from collections import defaultdict
import re
import logging

logger = logging.getLogger(__name__)

# ==================== RATE LIMITING ====================
# Protege contra ataques de força bruta e DDoS

class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, max_requests=100, window_seconds=60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = defaultdict(list)
        self.blocked_ips = {}  # IP -> timestamp de quando foi bloqueado
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        
        # Verifica se IP está bloqueado
        if client_ip in self.blocked_ips:
            blocked_until = self.blocked_ips[client_ip]
            if datetime.now() < blocked_until:
                logger.warning(f"🚫 IP bloqueado tentou acessar: {client_ip}")
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Too many requests. IP temporarily blocked."}
                )
            else:
                # Desbloqueia após o tempo
                del self.blocked_ips[client_ip]
        
        # Limpa requisições antigas
        now = datetime.now()
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < timedelta(seconds=self.window_seconds)
        ]
        
        # Verifica rate limit
        if len(self.requests[client_ip]) >= self.max_requests:
            # Bloqueia IP por 15 minutos
            self.blocked_ips[client_ip] = now + timedelta(minutes=15)
            logger.error(f"🚨 ALERTA: IP bloqueado por excesso de requisições: {client_ip}")
            return JSONResponse(
                status_code=429,
                content={"detail": "Rate limit exceeded. IP blocked for 15 minutes."}
            )
        
        # Registra requisição
        self.requests[client_ip].append(now)
        
        response = await call_next(request)
        return response


# ==================== PROTEÇÃO XSS & INJECTION ====================
# Detecta tentativas de injeção de código malicioso

class SecurityScanMiddleware(BaseHTTPMiddleware):
    def __init__(self, app):
        super().__init__(app)
        
        # Padrões suspeitos (XSS, SQL Injection, Path Traversal)
        self.suspicious_patterns = [
            r'<script[^>]*>',
            r'javascript:',
            r'on\w+\s*=',  # onclick=, onerror=, etc
            r'\.\./',  # Path traversal
            r'union\s+select',
            r'drop\s+table',
            r'insert\s+into',
            r'delete\s+from',
            r'exec\s*\(',
            r'eval\s*\(',
            r'base64_decode',
            r'system\s*\(',
            r'passthru',
            r'shell_exec',
        ]
        self.pattern_regex = re.compile('|'.join(self.suspicious_patterns), re.IGNORECASE)
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        
        # Ignora verificações de segurança para localhost em desenvolvimento
        is_local = client_ip in ['127.0.0.1', 'localhost', '::1']
        
        # Verifica URL (exceto para localhost)
        if not is_local:
            url_str = str(request.url)
            if self.pattern_regex.search(url_str):
                logger.error(f"🚨 ATAQUE DETECTADO: URL suspeita de {client_ip}: {url_str}")
                return JSONResponse(
                    status_code=403,
                    content={"detail": "Suspicious request detected"}
                )
        
        # Verifica query parameters (exceto para localhost)
        if not is_local:
            for key, value in request.query_params.items():
                if self.pattern_regex.search(str(value)):
                    logger.error(f"🚨 ATAQUE DETECTADO: Query param malicioso de {client_ip}: {key}={value}")
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Malicious content detected"}
                    )
        
        # Verifica headers suspeitos (exceto para localhost)
        if not is_local:
            suspicious_headers = ['x-forwarded-for', 'user-agent', 'referer']
            for header in suspicious_headers:
                value = request.headers.get(header, '')
                if self.pattern_regex.search(value):
                    logger.error(f"🚨 ATAQUE DETECTADO: Header malicioso de {client_ip}: {header}")
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Malicious headers detected"}
                    )
        
        response = await call_next(request)
        return response


# ==================== ADMIN PROTECTION ====================
# Protege rotas administrativas

class AdminProtectionMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, admin_paths=['/api/admin']):
        super().__init__(app)
        self.admin_paths = admin_paths
        self.failed_attempts = defaultdict(int)  # IP -> número de tentativas
        self.blocked_admin_ips = {}  # IP -> timestamp de bloqueio
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host
        path = request.url.path
        
        # Verifica se é rota admin
        is_admin_route = any(path.startswith(admin_path) for admin_path in self.admin_paths)
        
        if is_admin_route:
            # Verifica se IP está bloqueado de acessar admin
            if client_ip in self.blocked_admin_ips:
                blocked_until = self.blocked_admin_ips[client_ip]
                if datetime.now() < blocked_until:
                    logger.warning(f"🚫 IP bloqueado tentou acessar área admin: {client_ip}")
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "Access denied"}
                    )
                else:
                    del self.blocked_admin_ips[client_ip]
            
            # Log de acesso a área admin
            logger.info(f"⚠️ Acesso à área admin de: {client_ip} - Path: {path}")
        
        response = await call_next(request)
        
        # Se falhou autenticação em rota admin
        if is_admin_route and response.status_code == 401:
            self.failed_attempts[client_ip] += 1
            
            if self.failed_attempts[client_ip] >= 5:
                # Bloqueia por 1 hora
                self.blocked_admin_ips[client_ip] = datetime.now() + timedelta(hours=1)
                logger.error(f"🚨 IP bloqueado após múltiplas tentativas de acesso admin: {client_ip}")
        
        return response


# ==================== LOGGING DE SEGURANÇA ====================

def log_security_event(event_type: str, ip: str, details: str):
    """Registra eventos de segurança em log"""
    timestamp = datetime.now().isoformat()
    logger.warning(f"[SECURITY] {timestamp} | {event_type} | IP: {ip} | {details}")


# ==================== HEADERS DE SEGURANÇA ====================

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Adiciona headers de segurança em todas as respostas"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Headers de segurança
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"  # Previne clickjacking
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Content Security Policy - protege contra XSS
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' https:;"
        )
        response.headers["Content-Security-Policy"] = csp
        
        return response
