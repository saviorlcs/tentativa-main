"""
Serviço de geração de quests.
Contém lógica para gerar quests semanais personalizadas.
"""
import random
from datetime import datetime
from typing import List

# Dificuldades das quests (nome, multiplicador_coins, multiplicador_xp)
DIFFS = [
    ("Tranquila", 1.0, 1.0),   # baixo esforço
    ("Média",     1.6, 1.8),
    ("Difícil",   2.4, 2.6),
    ("Desafio",   3.4, 3.8),   # alto esforço
]

# Templates de títulos das quests
TEMPLATES = [
    "Estudar {m} minutos de {subject}",
    "Concluir {b} blocos de {subject}",
    "Revisar {m} minutos de {subject}",
    "Estudar {m} minutos de matéria teórica",
    "Estudar {m} minutos de matéria de exatas",
]


def generate_weekly_quests(user, subjects: List) -> List[dict]:
    """
    Gera 4 quests semanais personalizadas para o usuário.
    
    Args:
        user: Objeto do usuário com configurações
        subjects: Lista de matérias do usuário
    
    Returns:
        List[dict]: Lista com 4 quests geradas
    """
    quests = []
    baseCoins = 60   # ~5h → 60 coins
    baseXP = 120     # XP base

    # Pega duração de estudo configurada pelo usuário
    study_duration = getattr(user, "study_duration", 50)
    if hasattr(user, "settings"):
        study_duration = getattr(user.settings, "study_duration", 50)

    for diff_name, c_mult, x_mult in DIFFS:
        subject = random.choice(subjects) if subjects else None
        minutes_target = random.choice([60, 90, 120, 150])  # alvo em minutos
        blocks_target = minutes_target // study_duration

        title = random.choice(TEMPLATES).format(
            m=minutes_target,
            b=blocks_target,
            subject=subject.name if subject else "qualquer matéria"
        )

        quests.append({
            "title": title,
            "target": minutes_target,  # sempre em minutos para simplificar
            "progress": 0,
            "coins_reward": int(baseCoins * c_mult),
            "xp_reward": int(baseXP * x_mult),
            "completed": False,
            "difficulty": diff_name,
            "week_start": datetime.utcnow().date().isoformat(),
        })

    return quests
