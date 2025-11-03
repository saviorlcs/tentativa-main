"""
Serviço de quests semanais.
Contém lógica para gerar, gerenciar e atualizar progresso de quests.
"""
from datetime import datetime, timezone
from typing import Optional
from random import Random
import logging

from database import db
from services.reward_service import get_week_bounds, grant_reward

logger = logging.getLogger("pomociclo")


async def ensure_weekly_quests(user_id: str):
    """
    Garante que o usuário tem quests para a semana atual.
    Cria novas quests se necessário.
    
    Args:
        user_id: ID do usuário
    
    Returns:
        dict: Documento de quests semanais
    """
    now = datetime.now(timezone.utc)
    week_start, week_end, week_id = get_week_bounds(now)

    # Já existe doc desta semana?
    doc = await db.weekly_quests.find_one(
        {"user_id": user_id, "week_id": week_id},
        {"_id": 0}
    )
    if doc:
        return doc

    # Doc da semana anterior (para evitar repetição)
    prev = await db.weekly_quests.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    )
    prev_keys = set(prev.get("quest_keys", [])) if prev else set()

    subjects = await db.subjects.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    total_goal = sum(s.get("time_goal", 0) for s in subjects) or 300

    # Pool de quests variáveis (personalizadas)
    pool = []
    for s in subjects:
        # Minutos por matéria (60% da meta ou no mínimo 60min)
        target_min = max(60, int(round(s["time_goal"] * 0.6)))
        pool.append({
            "key": f"min:{s['id']}",
            "id": f"Q_MIN_{s['id']}",
            "type": "study_minutes_subject",
            "title": f"Estudar {target_min} min de {s['name']}",
            "description": f"Some {target_min} minutos de estudo em {s['name']} nesta semana",
            "target": target_min,
            "subject_id": s["id"],
            "reward": {"coins": 30, "xp": 120}
        })
        
        # Sessões por matéria (2 sessões)
        pool.append({
            "key": f"ses:{s['id']}",
            "id": f"Q_SES_{s['id']}",
            "type": "study_sessions_subject",
            "title": f"Fazer 2 sessões de {s['name']}",
            "description": f"Conclua 2 sessões de estudo em {s['name']} nesta semana",
            "target": 2,
            "subject_id": s["id"],
            "reward": {"coins": 20, "xp": 80}
        })

    # Quest de minutos totais na semana (ex.: 70% do total_goal ou 300min, o que for maior)
    total_target = max(300, int(round(total_goal * 0.7)))
    pool.append({
        "key": "week_total",
        "id": "Q_WEEK_TOTAL",
        "type": "study_minutes_week",
        "title": f"Estudar {total_target} min na semana",
        "description": f"Some {total_target} minutos de estudo no total nesta semana",
        "target": total_target,
        "reward": {"coins": 40, "xp": 160}
    })

    # Fixa: completar 1 ciclo
    fixed = {
        "key": "cycle_one",
        "id": "Q_CYCLE_ONE",
        "type": "complete_cycle",
        "title": "Completar 1 ciclo",
        "description": "Complete 1 ciclo semanal (atingir 100% da sua meta somada)",
        "target": 1,
        "reward": {"coins": 50, "xp": 200}
    }

    # Selecionar 3 do pool sem repetir as da semana anterior
    rng = Random(f"{user_id}-{week_id}")
    candidates = [q for q in pool if q["key"] not in prev_keys]
    if len(candidates) < 3:
        candidates = pool[:]  # Fallback se não tiver variedade
    rng.shuffle(candidates)
    chosen = candidates[:3]

    quests = [fixed] + chosen
    quest_payload = [{
        "qid": q["id"],
        "type": q["type"],
        "title": q["title"],
        "description": q["description"],
        "target": q["target"],
        "progress": 0,
        "done": False,
        "reward": q["reward"],
        "subject_id": q.get("subject_id")
    } for q in quests]

    doc = {
        "user_id": user_id,
        "week_id": week_id,
        "created_at": now.isoformat(),
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "quests": quest_payload,
        "quest_keys": [q["key"] for q in quests],
        "fixed_always": "Q_CYCLE_ONE"
    }
    
    await db.weekly_quests.insert_one(doc)
    return doc


async def get_current_week_quests(user_id: str):
    """
    Obtém quests da semana atual do usuário.
    Cria novas se não existirem.
    
    Args:
        user_id: ID do usuário
    
    Returns:
        dict: Documento de quests semanais
    """
    now = datetime.now(timezone.utc)
    _, _, week_id = get_week_bounds(now)
    
    doc = await db.weekly_quests.find_one(
        {"user_id": user_id, "week_id": week_id},
        {"_id": 0}
    )
    
    if not doc:
        doc = await ensure_weekly_quests(user_id)
    
    return doc


async def update_weekly_quests_after_study(
    user_id: str,
    subject_id: str,
    duration: int,
    completed: bool
):
    """
    Atualiza progresso de quests após sessão de estudo.
    
    Args:
        user_id: ID do usuário
        subject_id: ID da matéria estudada
        duration: Duração da sessão em minutos
        completed: Se a sessão foi completada
    """
    doc = await get_current_week_quests(user_id)
    if not doc:
        return

    quests = doc.get("quests", [])
    changed = False

    # Somatório semanal atual (pra detectar "completar 1 ciclo")
    subjects = await db.subjects.find(
        {"user_id": user_id},
        {"_id": 0}
    ).to_list(100)
    total_goal = sum(s.get("time_goal", 0) for s in subjects) or 1

    # Minutos acumulados na semana
    now = datetime.now(timezone.utc)
    week_start, _, _ = get_week_bounds(now)
    
    sessions = await db.study_sessions.find(
        {"user_id": user_id, "completed": True},
        {"_id": 0}
    ).to_list(10000)
    
    week_minutes = sum(
        s.get("duration", 0) for s in sessions
        if s.get("start_time") and datetime.fromisoformat(s["start_time"]) >= week_start
    )

    for q in quests:
        if q.get("done"):
            continue

        if q["type"] == "study_minutes_subject" and q.get("subject_id") == subject_id:
            q["progress"] = min(q["target"], q.get("progress", 0) + max(0, duration))
            if q["progress"] >= q["target"]:
                q["done"] = True
                await grant_reward(user_id, q["reward"]["coins"], q["reward"]["xp"])
                changed = True

        elif q["type"] == "study_sessions_subject" and q.get("subject_id") == subject_id and completed:
            q["progress"] = min(q["target"], q.get("progress", 0) + 1)
            if q["progress"] >= q["target"]:
                q["done"] = True
                await grant_reward(user_id, q["reward"]["coins"], q["reward"]["xp"])
                changed = True

        elif q["type"] == "study_minutes_week":
            # Atualiza pelo total da semana (robusto a múltiplas abas)
            q["progress"] = min(q["target"], week_minutes)
            if q["progress"] >= q["target"]:
                q["done"] = True
                await grant_reward(user_id, q["reward"]["coins"], q["reward"]["xp"])
                changed = True

        elif q["type"] == "complete_cycle":
            cycle_progress = min(100.0, (week_minutes / total_goal) * 100.0)
            q["progress"] = 1 if cycle_progress >= 100.0 else 0
            if q["progress"] >= q["target"]:
                q["done"] = True
                await grant_reward(user_id, q["reward"]["coins"], q["reward"]["xp"])
                changed = True

    if changed:
        await db.weekly_quests.update_one(
            {"user_id": user_id, "week_id": doc["week_id"]},
            {"$set": {"quests": quests}}
        )
