"""
Serviço de recompensas.
Contém lógica para cálculo de recompensas, level-up e progressão.
"""
from datetime import datetime, timezone, date, timedelta
from typing import Tuple, Optional
from math import floor, sqrt
import logging

from database import db

logger = logging.getLogger("pomociclo")


def _today_utc_date() -> date:
    """
    Retorna a data UTC atual.
    
    Returns:
        date: Data atual em UTC
    """
    return datetime.now(timezone.utc).date()


async def _get_user_settings_minutes(user_id: str) -> int:
    """
    Obtém duração de estudo configurada pelo usuário.
    
    Args:
        user_id: ID do usuário
    
    Returns:
        int: Minutos de duração de estudo (padrão: 50)
    """
    s = await db.user_settings.find_one(
        {"user_id": user_id},
        {"_id": 0, "study_duration": 1}
    )
    return int(s.get("study_duration", 50)) if s else 50


async def _update_and_get_streak(user_id: str, studied_minutes_today: int) -> int:
    """
    Incrementa streak se estudou >=25 min no dia.
    Salva/usa: users.last_streak_date (YYYY-MM-DD), users.streak_days (int).
    
    Args:
        user_id: ID do usuário
        studied_minutes_today: Minutos estudados hoje
    
    Returns:
        int: Número de dias na streak atual
    """
    u = await db.users.find_one(
        {"id": user_id},
        {"_id": 0, "last_streak_date": 1, "streak_days": 1}
    )
    
    today = _today_utc_date()
    last = None
    
    if u and u.get("last_streak_date"):
        try:
            last = datetime.fromisoformat(u["last_streak_date"]).date()
        except Exception:
            try:
                last = date.fromisoformat(u["last_streak_date"])
            except Exception:
                pass
    
    current_streak = u.get("streak_days", 0) if u else 0
    
    # Se estudou >= 25 min hoje
    if studied_minutes_today >= 25:
        if last is None:
            # Primeira vez
            new_streak = 1
        elif last == today:
            # Já contado hoje
            new_streak = current_streak
        elif (today - last).days == 1:
            # Ontem -> incrementa
            new_streak = current_streak + 1
        else:
            # Quebrou streak
            new_streak = 1
        
        await db.users.update_one(
            {"id": user_id},
            {"$set": {
                "streak_days": new_streak,
                "last_streak_date": today.isoformat()
            }}
        )
        return new_streak
    else:
        # Não estudou o suficiente
        return current_streak


def calculate_coins_and_xp(minutes: int, streak_days: int = 0) -> Tuple[int, int]:
    """
    Calcula coins e XP baseado em minutos estudados e streak.
    
    Fórmula:
    - coins = 12 * minutos + (streak * 2)
    - xp = 24 * minutos + (streak * 4)
    
    Args:
        minutes: Minutos estudados
        streak_days: Dias consecutivos de streak
    
    Returns:
        Tuple[int, int]: (coins, xp)
    """
    coins = int(12 * minutes + (streak_days * 2))
    xp = int(24 * minutes + (streak_days * 4))
    return coins, xp


def calculate_level_from_xp(xp: int) -> int:
    """
    Calcula level baseado no XP total.
    
    Fórmula: level = floor(sqrt(xp / 100)) + 1
    
    Args:
        xp: XP total do usuário
    
    Returns:
        int: Level calculado
    """
    return floor(sqrt(xp / 100)) + 1


def xp_required_for_next_level(current_level: int) -> int:
    """
    Calcula XP necessário para o próximo level.
    
    Args:
        current_level: Level atual
    
    Returns:
        int: XP necessário para o próximo level
    """
    next_level = current_level + 1
    return (next_level - 1) ** 2 * 100


async def update_user_rewards(
    user_id: str,
    minutes_studied: int,
    studied_minutes_today: int
) -> dict:
    """
    Atualiza recompensas do usuário após sessão de estudo.
    
    Args:
        user_id: ID do usuário
        minutes_studied: Minutos estudados nesta sessão
        studied_minutes_today: Total de minutos estudados hoje
    
    Returns:
        dict: Informações sobre recompensas (coins, xp, level_up, new_level)
    """
    # Atualiza e obtém streak
    streak = await _update_and_get_streak(user_id, studied_minutes_today)
    
    # Calcula recompensas
    coins, xp = calculate_coins_and_xp(minutes_studied, streak)
    
    # Busca usuário atual
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return {"coins": 0, "xp": 0, "level_up": False, "new_level": 1}
    
    # Calcula novos valores
    new_coins = user.get("coins", 0) + coins
    new_xp = user.get("xp", 0) + xp
    old_level = user.get("level", 1)
    new_level = calculate_level_from_xp(new_xp)
    
    level_up = new_level > old_level
    
    # Atualiza no banco
    await db.users.update_one(
        {"id": user_id},
        {"$set": {
            "coins": new_coins,
            "xp": new_xp,
            "level": new_level
        }}
    )
    
    return {
        "coins": coins,
        "xp": xp,
        "level_up": level_up,
        "new_level": new_level,
        "total_coins": new_coins,
        "total_xp": new_xp,
        "streak": streak
    }




def _fatigue_multiplier(minutes: int) -> float:
    """
    Multiplicador de fadiga baseado na duração da sessão.
    Sessões muito longas têm rendimento decrescente.
    
    Args:
        minutes: Minutos estudados
    
    Returns:
        float: Multiplicador (1.00 a 0.70)
    """
    if minutes <= 50:
        return 1.00
    if minutes <= 100:
        return 0.90
    if minutes <= 180:
        return 0.80
    return 0.70


def _completion_multiplier(duration: int, block_minutes: int, skipped: bool) -> float:
    """
    Multiplicador de conclusão.
    Bônus se completou o bloco inteiro.
    
    Args:
        duration: Duração da sessão em minutos
        block_minutes: Duração configurada do bloco
        skipped: Se a sessão foi pulada
    
    Returns:
        float: Multiplicador (1.00 ou 1.20)
    """
    if skipped:
        return 1.00
    return 1.20 if duration >= block_minutes else 1.00


def _streak_multiplier(streak_days: int) -> float:
    """
    Multiplicador de streak.
    3% por dia até 7 dias (máx +21%).
    
    Args:
        streak_days: Dias consecutivos de streak
    
    Returns:
        float: Multiplicador (1.00 a 1.21)
    """
    return 1.0 + min(max(streak_days, 0), 7) * 0.03


def _week_bounds_utc(now: datetime) -> Tuple[datetime, datetime]:
    """
    Retorna início e fim da semana atual (segunda a segunda).
    
    Args:
        now: Data/hora atual
    
    Returns:
        Tuple[datetime, datetime]: (início_semana, fim_semana)
    """
    start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    end = start + timedelta(days=7)
    return start, end


async def _week_minutes_accumulated(user_id: str) -> int:
    """
    Calcula minutos estudados na semana atual.
    
    Args:
        user_id: ID do usuário
    
    Returns:
        int: Total de minutos estudados na semana
    """
    now = datetime.now(timezone.utc)
    week_start, week_end = _week_bounds_utc(now)
    
    sessions = await db.study_sessions.find(
        {"user_id": user_id, "completed": True},
        {"_id": 0, "start_time": 1, "duration": 1}
    ).to_list(10000)
    
    total = 0
    for s in sessions:
        try:
            st = datetime.fromisoformat(s["start_time"])
            if week_start <= st < week_end:
                total += int(s.get("duration", 0))
        except Exception:
            pass
    
    return total


def _softcap_multiplier(week_minutes_before: int) -> float:
    """
    Multiplicador de softcap.
    A partir de 900 min/semana (15h), coins pela metade.
    
    Args:
        week_minutes_before: Minutos estudados na semana antes desta sessão
    
    Returns:
        float: Multiplicador (1.0 ou 0.5)
    """
    return 0.5 if week_minutes_before >= 900 else 1.0


def _coins_raw(duration: int) -> float:
    """
    Cálculo base de coins.
    Base: 1 coin a cada 5 min.
    
    Args:
        duration: Duração em minutos
    
    Returns:
        float: Coins base
    """
    return duration / 5.0


def _session_xp_raw(duration: int, block_minutes: int) -> float:
    """
    Cálculo base de XP.
    Sublinear + bônus por blocos completos.
    
    Args:
        duration: Duração em minutos
        block_minutes: Duração configurada do bloco
    
    Returns:
        float: XP base
    """
    blocks = duration // block_minutes if block_minutes > 0 else 0
    return 8.0 * (duration ** 0.9) + 12.0 * blocks


def _apply_mults(value: float, *mults: float) -> int:
    """
    Aplica múltiplos multiplicadores a um valor.
    
    Args:
        value: Valor base
        *mults: Multiplicadores a aplicar
    
    Returns:
        int: Valor final arredondado
    """
    v = float(value)
    for m in mults:
        v *= float(m)
    return max(0, int(v // 1))


def _xp_curve_per_level(level: int) -> int:
    """
    Calcula XP necessário para atingir um level.
    Curva exponencial suave.
    
    Args:
        level: Level alvo
    
    Returns:
        int: XP necessário
    """
    base_xp = 100
    return int(base_xp * (1.25 ** (level - 1)) + 0.999)


async def grant_reward(user_id: str, coins: int, xp: int):
    """
    Concede recompensas ao usuário e atualiza level.
    
    Args:
        user_id: ID do usuário
        coins: Coins a adicionar
        xp: XP a adicionar
    """
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not user:
        return
    
    new_xp = user.get("xp", 0) + max(0, xp)
    new_level = user.get("level", 1)
    need = _xp_curve_per_level(new_level)
    
    while new_xp >= need:
        new_xp -= need
        new_level += 1
        need = _xp_curve_per_level(new_level)
    
    await db.users.update_one(
        {"id": user_id},
        {
            "$inc": {"coins": max(0, coins)},
            "$set": {"xp": int(new_xp), "level": int(new_level)}
        },
        upsert=True
    )


def get_week_bounds(now: datetime) -> Tuple[datetime, datetime, str]:
    """
    Segunda 00:00:00 até próxima segunda, e um week_id estável (ISO-week).
    
    Args:
        now: Data/hora de referência
    
    Returns:
        Tuple[datetime, datetime, str]: (início, fim, week_id)
    """
    now = now.astimezone(timezone.utc)
    week_start = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    week_end = week_start + timedelta(days=7)
    # week_id: YYYY-WW (ISO week)
    week_id = f"{week_start.isocalendar().year}-W{week_start.isocalendar().week:02d}"
    return week_start, week_end, week_id
