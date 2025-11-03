"""
Utilitários de data e hora.
Centraliza operações de manipulação de data e hora.
"""
from datetime import datetime, timezone, timedelta, date
from typing import Tuple, Optional


def utcnow() -> datetime:
    """Retorna a data e hora atual em UTC."""
    return datetime.now(timezone.utc)


def now_utc() -> datetime:
    """Retorna a data e hora atual em UTC (alias para utcnow)."""
    return datetime.now(timezone.utc)


def today_utc_date() -> date:
    """Retorna a data de hoje em UTC."""
    return datetime.now(timezone.utc).date()


def period_bounds(period: str) -> Tuple[datetime, datetime]:
    """
    Calcula os limites de início e fim para um período específico.
    
    Args:
        period: Tipo de período - 'day', 'week', 'month', ou 'all'
    
    Returns:
        Tupla com (datetime_início, datetime_fim)
    """
    now = now_utc()
    if period == "day":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "week":
        start = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    elif period == "month":
        start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # 'all'
        start = datetime(1970, 1, 1, tzinfo=timezone.utc)
    return start, now


def to_aware(dt) -> Optional[datetime]:
    """
    Converte string ou datetime para timezone-aware (UTC).
    Aceita strings no formato ISO com sufixo 'Z' e datetimes naive (assume UTC).
    
    Args:
        dt: String ou objeto datetime para converter
    
    Returns:
        Datetime com timezone ou None se a conversão falhar
    """
    if dt is None:
        return None
    if isinstance(dt, str):
        s = dt.replace("Z", "+00:00")
        try:
            dt = datetime.fromisoformat(s)
        except Exception:
            return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def week_bounds_utc(now: datetime) -> Tuple[datetime, datetime]:
    """
    Obtém o início da semana (Segunda 00:00) e fim (Domingo 23:59:59) em UTC.
    
    Args:
        now: Datetime de referência
    
    Returns:
        Tupla com (início_semana, fim_semana)
    """
    week_start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    week_end = week_start + timedelta(days=7, seconds=-1)
    return week_start, week_end


def get_week_bounds(now: datetime) -> Tuple[datetime, datetime, str]:
    """
    Obtém limites da semana e string formatada.
    
    Args:
        now: Datetime de referência
    
    Returns:
        Tupla com (início_semana, fim_semana, string_semana)
    """
    week_start, week_end = week_bounds_utc(now)
    week_str = f"{week_start.strftime('%Y-%m-%d')}_to_{week_end.strftime('%Y-%m-%d')}"
    return week_start, week_end, week_str


def expand_tolerance(
    start: datetime, 
    end: datetime, 
    tolerance_minutes: int = 60
) -> Tuple[datetime, datetime]:
    """
    Expande um intervalo de tempo com margem de tolerância.
    
    Args:
        start: Datetime de início
        end: Datetime de fim
        tolerance_minutes: Minutos para adicionar antes/depois
    
    Returns:
        Tupla com (início_expandido, fim_expandido)
    """
    return (
        start - timedelta(minutes=tolerance_minutes),
        end + timedelta(minutes=tolerance_minutes)
    )


def overlap_minutes(
    a_start: datetime, 
    a_end: datetime, 
    b_start: datetime, 
    b_end: datetime
) -> int:
    """
    Calcula a sobreposição em minutos entre dois intervalos de tempo.
    
    Args:
        a_start: Início do primeiro intervalo
        a_end: Fim do primeiro intervalo
        b_start: Início do segundo intervalo
        b_end: Fim do segundo intervalo
    
    Returns:
        Número de minutos sobrepostos (0 se não houver sobreposição)
    """
    latest_start = max(a_start, b_start)
    earliest_end = min(a_end, b_end)
    delta = earliest_end - latest_start
    if delta.total_seconds() <= 0:
        return 0
    return int(delta.total_seconds() / 60)
