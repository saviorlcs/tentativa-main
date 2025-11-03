"""
Modelos Pydantic relacionados a configurações.
Define as estruturas de dados para configurações de estudo do usuário.
"""
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional


class Settings(BaseModel):
    """Modelo de configurações do timer de estudo."""
    study_duration: int = 50  # Duração do estudo em minutos
    break_duration: int = 10  # Duração do intervalo em minutos
    long_break_duration: int = 30  # Duração do intervalo longo em minutos
    long_break_interval: int = 4  # A cada quantos blocos de estudo
    sound_enabled: Optional[bool] = True  # Se o som está ativado
    sound_id: Optional[str] = 'bell'  # ID do som escolhido
    sound_duration: Optional[float] = 2.0  # Duração do som em segundos


class UserSettings(BaseModel):
    """Modelo de configurações específicas do usuário."""
    model_config = ConfigDict(extra="ignore")
    
    user_id: str  # ID do usuário
    study_duration: int = 50  # Duração do estudo
    break_duration: int = 10  # Duração do intervalo
    long_break_duration: int = 30  # Duração do intervalo longo
    long_break_interval: int = 4  # Frequência do intervalo longo
