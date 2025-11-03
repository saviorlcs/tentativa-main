"""
Modelos Pydantic relacionados ao timer.
Define as estruturas de dados para gerenciamento de estado do timer.
"""
from pydantic import BaseModel
from typing import Optional, Literal


class TimerStateIn(BaseModel):
    """Modelo de entrada de estado do timer."""
    state: Literal["focus", "break", "paused", "idle"]  # Estado atual do timer
    seconds_left: Optional[int] = None  # Segundos restantes


class TimerStateBody(BaseModel):
    """Modelo de corpo de estado do timer para tracking de estudo."""
    state: Literal["focus", "break", "paused", "idle"]  # Estado do timer
    seconds_left: Optional[int] = None  # Segundos restantes
    subject_id: Optional[str] = None  # ID da matéria sendo estudada
