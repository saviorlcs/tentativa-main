"""
Utilitários de cálculo de recompensas.
Calcula XP, moedas e níveis do usuário.
"""
from math import floor, sqrt


def fatigue_multiplier(minutes: int) -> float:
    """
    Calcula multiplicador de fadiga baseado na duração do estudo.
    Sessões mais longas têm retornos decrescentes.
    
    Args:
        minutes: Duração do estudo em minutos
    
    Returns:
        Valor do multiplicador (1.0 aos 60 min, decrescendo depois)
    """
    return 1.0 if minutes <= 60 else 60 / minutes


def completion_multiplier(
    duration: int, 
    block_minutes: int, 
    skipped: bool
) -> float:
    """
    Calcula multiplicador de conclusão baseado no término da sessão.
    
    Args:
        duration: Duração real estudada
        block_minutes: Duração alvo do bloco
        skipped: Se a sessão foi pulada
    
    Returns:
        Valor do multiplicador (0.0 se pulado, 1.0-1.5 baseado em % de conclusão)
    """
    if skipped or duration <= 0 or block_minutes <= 0:
        return 0.0
    pct = duration / block_minutes
    return 1.0 + min(pct * 0.5, 0.5)


def streak_multiplier(streak_days: int) -> float:
    """
    Calcula multiplicador de bônus por sequência de dias.
    
    Args:
        streak_days: Número de dias consecutivos
    
    Returns:
        Valor do multiplicador (1.0 a 2.0)
    """
    return min(1.0 + (streak_days * 0.05), 2.0)


def softcap_multiplier(week_minutes_before: int) -> float:
    """
    Calcula multiplicador de limite suave para prevenir farming excessivo.
    Reduz recompensas após 1000 minutos por semana.
    
    Args:
        week_minutes_before: Minutos estudados esta semana antes da sessão atual
    
    Returns:
        Valor do multiplicador (1.0 antes do limite, decrescendo depois)
    """
    if week_minutes_before < 1000:
        return 1.0
    return max(0.2, 1.0 - ((week_minutes_before - 1000) / 2000))


def coins_raw(duration: int) -> float:
    """
    Calcula moedas base para uma sessão de estudo.
    
    Args:
        duration: Duração do estudo em minutos
    
    Returns:
        Valor base de moedas
    """
    return duration * 1.5


def session_xp_raw(duration: int, block_minutes: int) -> float:
    """
    Calcula XP base para uma sessão de estudo.
    
    Args:
        duration: Duração do estudo em minutos
        block_minutes: Duração alvo do bloco
    
    Returns:
        Valor base de XP
    """
    return (duration / block_minutes) * 100


def apply_mults(value: float, *mults: float) -> int:
    """
    Aplica múltiplos multiplicadores a um valor base.
    
    Args:
        value: Valor base
        *mults: Número variável de multiplicadores
    
    Returns:
        Valor inteiro final arredondado
    """
    result = value
    for m in mults:
        result *= m
    return max(1, int(round(result)))


def xp_curve_per_level(level: int) -> int:
    """
    Calcula XP necessário para um dado nível.
    Usa uma curva baseada em raiz quadrada para progressão balanceada.
    
    Args:
        level: Nível alvo
    
    Returns:
        XP necessário para aquele nível
    """
    return int(floor(100 * sqrt(level)))
