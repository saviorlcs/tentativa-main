"""
Serviço de timer.
Contém lógica para configuração e gerenciamento de timers de estudo.
"""
from datetime import datetime, timezone
from typing import Optional


def timer_config_for(user) -> dict:
    """
    Retorna configuração de timer para o usuário.
    
    Args:
        user: Objeto do usuário com configurações
    
    Returns:
        dict: Configuração de timer (focus_min, break_min, long_break_min, long_every)
    """
    # Pega configurações do usuário se existir
    cfg = getattr(user, "timer_cfg", None) or {}
    return {
        "focus_min": int(cfg.get("focus_min", 50)),
        "break_min": int(cfg.get("break_min", 10)),
        "long_break_min": int(cfg.get("long_break_min", 20)),
        "long_every": int(cfg.get("long_every", 4)),  # long break a cada 4 focos
    }


def _sec(mins: int) -> int:
    """
    Converte minutos para segundos.
    
    Args:
        mins: Minutos
    
    Returns:
        int: Segundos
    """
    return int(mins) * 60


def _sec_left_from_timer(t: dict | None) -> int | None:
    """
    Calcula segundos restantes do timer.
    
    Args:
        t: Dicionário com dados do timer
    
    Returns:
        Optional[int]: Segundos restantes ou None se inválido
    """
    if not t:
        return None
    
    # Prioridade: phase_until (com relógio do servidor)
    pu = t.get("phase_until")
    if pu:
        try:
            until = datetime.fromisoformat(pu.replace("Z", "+00:00"))
            delta = int((datetime.now(timezone.utc) - until).total_seconds())
            left = -delta
            return left if left >= 0 else 0
        except Exception:
            pass
    
    # Fallback: seconds_left salvo
    try:
        sl = int(t.get("seconds_left"))
        return sl if sl >= 0 else 0
    except Exception:
        return None
