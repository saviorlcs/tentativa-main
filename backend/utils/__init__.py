"""
Pacote de utilitários - Funções auxiliares da aplicação.
"""
from .datetime_utils import (
    utcnow, now_utc, today_utc_date, period_bounds,
    to_aware, week_bounds_utc, get_week_bounds,
    expand_tolerance, overlap_minutes
)
from .reward_calculator import (
    fatigue_multiplier, completion_multiplier, streak_multiplier,
    softcap_multiplier, coins_raw, session_xp_raw,
    apply_mults, xp_curve_per_level
)
from .auth_utils import make_cookie, current_user_id
from .helpers import presence_from_fields, new_invite, sec, sec_left_from_timer

__all__ = [
    # DateTime utils
    "utcnow", "now_utc", "today_utc_date", "period_bounds",
    "to_aware", "week_bounds_utc", "get_week_bounds",
    "expand_tolerance", "overlap_minutes",
    # Reward calculator
    "fatigue_multiplier", "completion_multiplier", "streak_multiplier",
    "softcap_multiplier", "coins_raw", "session_xp_raw",
    "apply_mults", "xp_curve_per_level",
    # Auth utils
    "make_cookie", "current_user_id",
    # Helpers
    "presence_from_fields", "new_invite", "sec", "sec_left_from_timer",
]
