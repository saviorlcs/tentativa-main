"""
Funções auxiliares gerais.
Utilitários diversos usados em várias partes da aplicação.
"""
import secrets
import string
from datetime import datetime, timezone
from typing import Optional

# Constantes de presença
OFFLINE_AFTER_SECS = 120  # 2 minutos sem heartbeat = offline
AWAY_AFTER_SECS = 1800  # 30 minutos sem interação = away


def presence_from_fields(u: dict) -> str:
    """
    Calcula o status de presença baseado nos campos do usuário.
    
    Regras:
    - OFFLINE se não recebe heartbeat (last_activity) há >2 min OU tabs_open <= 0
    - Senão, AWAY se não há interação (last_interaction) há >30 min
    - Senão, ONLINE
    
    Args:
        u: Dicionário com dados do usuário
    
    Returns:
        Status: 'online', 'away', ou 'offline'
    """
    from .datetime_utils import utcnow, to_aware
    
    tabs = int(u.get("tabs_open") or 0)
    
    # Heartbeats (ping) e interações convertidos para UTC-aware
    last_activity = to_aware(u.get("last_activity"))
    last_interaction = to_aware(u.get("last_interaction"))
    
    # Sem abas OU sem heartbeat recente => OFFLINE
    if tabs <= 0:
        return "offline"
    if last_activity:
        idle_hb = (utcnow() - last_activity).total_seconds()
        if idle_hb > OFFLINE_AFTER_SECS:
            return "offline"
    else:
        # Se não temos last_activity, considera offline por segurança
        return "offline"
    
    # Com heartbeat ok: decide entre ONLINE/AWAY pela interação
    if last_interaction:
        idle_int = (utcnow() - last_interaction).total_seconds()
        if idle_int > AWAY_AFTER_SECS:
            return "away"
    return "online"


def new_invite() -> str:
    """
    Gera um novo código de convite aleatório.
    
    Returns:
        String alfanumérica de 8 caracteres
    """
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))


def sec(mins: int) -> int:
    """
    Converte minutos para segundos.
    
    Args:
        mins: Número de minutos
    
    Returns:
        Número de segundos
    """
    return mins * 60


def sec_left_from_timer(t: Optional[dict]) -> Optional[int]:
    """
    Calcula segundos restantes de um timer baseado em seu estado.
    
    Args:
        t: Dicionário com dados do timer (pode ser None)
    
    Returns:
        Segundos restantes ou None se timer inválido
    """
    if not t:
        return None
    
    state = t.get("state")
    if state == "idle":
        return None
    
    start_time = t.get("start_time")
    duration_secs = t.get("duration_secs")
    paused_at = t.get("paused_at")
    paused_elapsed = t.get("paused_elapsed", 0)
    
    if not start_time or not duration_secs:
        return None
    
    now = datetime.now(timezone.utc)
    
    if state == "paused" and paused_at:
        # Timer pausado: retorna o tempo que restava ao pausar
        from .datetime_utils import to_aware
        paused_dt = to_aware(paused_at)
        if paused_dt:
            elapsed_before_pause = (paused_dt - to_aware(start_time)).total_seconds()
            return max(0, int(duration_secs - elapsed_before_pause))
    
    # Timer rodando: calcula tempo restante
    from .datetime_utils import to_aware
    start_dt = to_aware(start_time)
    if start_dt:
        elapsed = (now - start_dt).total_seconds() - paused_elapsed
        return max(0, int(duration_secs - elapsed))
    
    return None
