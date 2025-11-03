"""
Rotas de Revisão (Sistema de Revisão Espaçada).
Gerencia matérias de revisão e sessões programadas.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, timezone, timedelta
import uuid

from database import db
from dependencies import get_current_user

router = APIRouter(prefix="/review")


# ================== MODELOS ==================

class ReviewSubject(BaseModel):
    """Modelo de matéria para revisão."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    area: Optional[str] = None
    cycle_subject_id: Optional[str] = None
    mode: str = "normal"  # "normal" ou "exam"
    exam_date: Optional[datetime] = None
    first_study_date: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class ReviewSubjectCreate(BaseModel):
    """Modelo para criar matéria de revisão."""
    name: str
    area: Optional[str] = None
    cycle_subject_id: Optional[str] = None
    mode: str = "normal"
    exam_date: Optional[datetime] = None


class ReviewSubjectUpdate(BaseModel):
    """Modelo para atualizar matéria de revisão."""
    name: Optional[str] = None
    area: Optional[str] = None
    cycle_subject_id: Optional[str] = None
    mode: Optional[str] = None
    exam_date: Optional[datetime] = None


class ReviewSession(BaseModel):
    """Modelo de sessão de revisão."""
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    review_subject_id: str
    review_number: int
    scheduled_date: datetime
    completed_date: Optional[datetime] = None
    status: str = "pending"  # pending, completed, overdue
    calendar_event_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Intervalos de revisão (em dias) - Modo Normal
REVIEW_INTERVALS_NORMAL = [1, 3, 7, 14, 30, 60, 120, 365]


# ================== FUNÇÕES AUXILIARES ==================

def calculate_exam_intervals(first_study: datetime, exam_date: datetime) -> List[int]:
    """
    Calcula intervalos de revisão até a prova.
    Retorna lista de dias entre cada revisão.
    """
    days_until_exam = (exam_date.date() - first_study.date()).days
    
    if days_until_exam <= 0:
        return [1, 7, 30, 90, 365]
    
    intervals_before = []
    
    if days_until_exam >= 1:
        intervals_before.append(1)
    if days_until_exam >= 4:
        intervals_before.append(3)
    if days_until_exam >= 8:
        intervals_before.append(7)
    if days_until_exam >= 15:
        intervals_before.append(14)
    
    # Última revisão sempre 1 dia antes da prova
    intervals_before.append(days_until_exam - 1)
    
    # Revisões pós-prova
    intervals_after = [7, 30, 90, 365]
    
    return intervals_before + intervals_after


async def find_available_time_slot(
    user_id: str,
    target_date: datetime,
    duration_hours: int = 2
) -> tuple[datetime, datetime]:
    """
    Encontra horário livre no dia para agendar revisão.
    Evita conflitos com eventos já agendados.
    """
    day_start = target_date.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    
    # Busca eventos existentes no dia
    existing_events = await db.calendar_events.find({
        "user_id": user_id,
        "start": {"$lt": day_end.isoformat()},
        "end": {"$gt": day_start.isoformat()},
    }).to_list(100)
    
    # Extrai horários ocupados
    busy_slots = []
    for ev in existing_events:
        if ev.get("event_type") == "class":
            start = datetime.fromisoformat(ev["start"]) if isinstance(ev["start"], str) else ev["start"]
            end = datetime.fromisoformat(ev["end"]) if isinstance(ev["end"], str) else ev["end"]
            busy_slots.append((start, end))
    
    # Tenta horários preferenciais
    preferred_hours = [14, 16, 18, 10, 20, 8, 12]
    
    for hour in preferred_hours:
        candidate_start = target_date.replace(hour=hour, minute=0, second=0, microsecond=0)
        candidate_end = candidate_start + timedelta(hours=duration_hours)
        
        # Verifica conflitos
        has_conflict = False
        for busy_start, busy_end in busy_slots:
            if candidate_start < busy_end and candidate_end > busy_start:
                has_conflict = True
                break
        
        if not has_conflict:
            return candidate_start, candidate_end
    
    # Fallback: 14h
    fallback_start = target_date.replace(hour=14, minute=0, second=0, microsecond=0)
    return fallback_start, fallback_start + timedelta(hours=duration_hours)


# ================== ROTAS ==================

@router.get("/subjects")
async def get_review_subjects(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Lista todas as matérias de revisão do usuário.
    
    Returns:
        List[dict]: Lista de matérias de revisão
    """
    user = await get_current_user(request, session_token)
    subjects = await db.review_subjects.find(
        {"user_id": user.id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(1000)
    return subjects


@router.post("/subjects")
async def create_review_subject(
    input: ReviewSubjectCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria uma nova matéria para revisão.
    
    Returns:
        dict: Matéria criada
    """
    user = await get_current_user(request, session_token)
    
    subject = ReviewSubject(
        user_id=user.id,
        name=input.name,
        area=input.area,
        cycle_subject_id=input.cycle_subject_id,
        mode=input.mode,
        exam_date=input.exam_date
    )
    
    subject_dict = subject.model_dump()
    subject_dict["created_at"] = subject_dict["created_at"].isoformat()
    if subject_dict.get("exam_date"):
        subject_dict["exam_date"] = subject_dict["exam_date"].isoformat()
    
    await db.review_subjects.insert_one(subject_dict)
    return subject


@router.patch("/subjects/{subject_id}")
async def update_review_subject(
    subject_id: str,
    input: ReviewSubjectUpdate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza uma matéria de revisão.
    
    Returns:
        dict: {"success": True}
    """
    user = await get_current_user(request, session_token)
    
    subject = await db.review_subjects.find_one({"id": subject_id, "user_id": user.id})
    if not subject:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    
    update_data = {k: v for k, v in input.model_dump().items() if v is not None}
    if update_data.get("exam_date"):
        update_data["exam_date"] = update_data["exam_date"].isoformat()
    
    if update_data:
        await db.review_subjects.update_one({"id": subject_id}, {"$set": update_data})
    
    return {"success": True}


@router.delete("/subjects/{subject_id}")
async def delete_review_subject(
    subject_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Deleta uma matéria de revisão e todas suas sessões.
    
    Returns:
        dict: {"success": True, "events_deleted": int}
    """
    user = await get_current_user(request, session_token)
    
    result = await db.review_subjects.delete_one({"id": subject_id, "user_id": user.id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    
    # Busca sessões para deletar eventos da agenda
    sessions = await db.review_sessions.find({
        "review_subject_id": subject_id,
        "user_id": user.id
    }, {"_id": 0, "calendar_event_id": 1}).to_list(1000)
    
    event_ids = [s["calendar_event_id"] for s in sessions if s.get("calendar_event_id")]
    
    # Deleta eventos da agenda
    if event_ids:
        await db.calendar_events.delete_many({
            "id": {"$in": event_ids},
            "user_id": user.id
        })
    
    # Deleta sessões de revisão
    await db.review_sessions.delete_many({"review_subject_id": subject_id, "user_id": user.id})
    
    return {"success": True, "events_deleted": len(event_ids)}


@router.post("/subjects/{subject_id}/start")
async def start_review_subject(
    subject_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Inicia o sistema de revisão para uma matéria.
    Cria todas as sessões programadas e eventos na agenda.
    
    Returns:
        dict: {"success": True, "sessions_created": int, "sessions": List}
    """
    user = await get_current_user(request, session_token)
    
    subject = await db.review_subjects.find_one({"id": subject_id, "user_id": user.id})
    if not subject:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    
    if subject.get("first_study_date"):
        raise HTTPException(status_code=400, detail="Matéria já foi iniciada")
    
    now = datetime.now(timezone.utc)
    
    # Marca data do primeiro estudo
    await db.review_subjects.update_one(
        {"id": subject_id},
        {"$set": {"first_study_date": now.isoformat()}}
    )
    
    # Calcula intervalos
    if subject["mode"] == "exam" and subject.get("exam_date"):
        exam_dt = datetime.fromisoformat(subject["exam_date"]) if isinstance(subject["exam_date"], str) else subject["exam_date"]
        intervals = calculate_exam_intervals(now, exam_dt)
    else:
        intervals = REVIEW_INTERVALS_NORMAL
    
    # Cria sessões
    sessions_created = []
    for i, interval_days in enumerate(intervals, start=1):
        scheduled = now + timedelta(days=interval_days)
        
        session = ReviewSession(
            user_id=user.id,
            review_subject_id=subject_id,
            review_number=i,
            scheduled_date=scheduled,
            status="pending"
        )
        
        session_dict = session.model_dump()
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        session_dict["scheduled_date"] = session_dict["scheduled_date"].isoformat()
        
        await db.review_sessions.insert_one(session_dict)
        
        # Cria evento na agenda
        event_start, event_end = await find_available_time_slot(user.id, scheduled, duration_hours=2)
        
        event_title = f"📚 Revisão {i}: {subject['name']}"
        
        # Import CalendarEvent model if exists
        try:
            from models.calendar import CalendarEvent
            event = CalendarEvent(
                user_id=user.id,
                title=event_title,
                start=event_start,
                end=event_end,
                subject_id=subject.get("cycle_subject_id"),
                event_type="review",
                checklist=[]
            )
            event_dict = event.model_dump()
        except ImportError:
            # Fallback: criar dict manualmente
            event_dict = {
                "id": str(uuid.uuid4()),
                "user_id": user.id,
                "title": event_title,
                "start": event_start.isoformat(),
                "end": event_end.isoformat(),
                "subject_id": subject.get("cycle_subject_id"),
                "event_type": "review",
                "checklist": [],
                "created_at": now.isoformat()
            }
        
        # Converte datetime para string se necessário
        if isinstance(event_dict.get("created_at"), datetime):
            event_dict["created_at"] = event_dict["created_at"].isoformat()
        if isinstance(event_dict.get("start"), datetime):
            event_dict["start"] = event_dict["start"].isoformat()
        if isinstance(event_dict.get("end"), datetime):
            event_dict["end"] = event_dict["end"].isoformat()
        
        await db.calendar_events.insert_one(event_dict)
        
        # Atualiza sessão com ID do evento
        await db.review_sessions.update_one(
            {"id": session_dict["id"]},
            {"$set": {"calendar_event_id": event_dict["id"]}}
        )
        
        sessions_created.append({
            "review_number": i,
            "scheduled_date": scheduled.isoformat(),
            "calendar_event_id": event_dict["id"]
        })
    
    return {
        "success": True,
        "sessions_created": len(sessions_created),
        "sessions": sessions_created
    }


@router.post("/sessions/{session_id}/complete")
async def complete_review_session(
    session_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Marca uma sessão de revisão como completa.
    Aplica penalidade se houve atraso.
    
    Returns:
        dict: {"success": True, "days_late": int, "penalty_applied": bool}
    """
    user = await get_current_user(request, session_token)
    
    session = await db.review_sessions.find_one({"id": session_id, "user_id": user.id})
    if not session:
        raise HTTPException(status_code=404, detail="Sessão não encontrada")
    
    if session["status"] == "completed":
        raise HTTPException(status_code=400, detail="Sessão já foi completada")
    
    now = datetime.now(timezone.utc)
    scheduled = datetime.fromisoformat(session["scheduled_date"])
    days_late = (now.date() - scheduled.date()).days
    
    # Marca como completa
    await db.review_sessions.update_one(
        {"id": session_id},
        {"$set": {
            "status": "completed",
            "completed_date": now.isoformat()
        }}
    )
    
    # Marca evento da agenda como completo
    if session.get("calendar_event_id"):
        await db.calendar_events.update_one(
            {"id": session["calendar_event_id"], "user_id": user.id},
            {"$set": {"completed": True}}
        )
    
    return {
        "success": True,
        "days_late": days_late,
        "penalty_applied": days_late > 0
    }


@router.get("/upcoming")
async def get_upcoming_reviews(
    request: Request,
    session_token: Optional[str] = Cookie(None),
    days_ahead: int = 30
):
    """
    Retorna próximas revisões programadas.
    
    Args:
        days_ahead: Número de dias para buscar à frente (default: 30)
    
    Returns:
        List[dict]: Lista de sessões futuras com dados da matéria
    """
    user = await get_current_user(request, session_token)
    
    now = datetime.now(timezone.utc)
    future_date = now + timedelta(days=days_ahead)
    
    sessions = await db.review_sessions.find({
        "user_id": user.id,
        "status": "pending",
        "scheduled_date": {
            "$gte": now.isoformat(),
            "$lte": future_date.isoformat()
        }
    }, {"_id": 0}).sort("scheduled_date", 1).to_list(1000)
    
    # Enriquece com dados da matéria
    result = []
    for session in sessions:
        subject = await db.review_subjects.find_one(
            {"id": session["review_subject_id"]},
            {"_id": 0, "name": 1, "area": 1, "mode": 1}
        )
        
        if subject:
            result.append({
                **session,
                "subject_name": subject["name"],
                "subject_area": subject.get("area"),
                "subject_mode": subject.get("mode")
            })
    
    return result


@router.get("/overdue")
async def get_overdue_reviews(
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna revisões atrasadas.
    
    Returns:
        List[dict]: Lista de sessões atrasadas com dias de atraso
    """
    user = await get_current_user(request, session_token)
    
    now = datetime.now(timezone.utc)
    
    sessions = await db.review_sessions.find({
        "user_id": user.id,
        "status": "pending",
        "scheduled_date": {"$lt": now.isoformat()}
    }, {"_id": 0}).sort("scheduled_date", 1).to_list(1000)
    
    # Enriquece com dados da matéria e calcula atraso
    result = []
    for session in sessions:
        subject = await db.review_subjects.find_one(
            {"id": session["review_subject_id"]},
            {"_id": 0, "name": 1, "area": 1}
        )
        
        if subject:
            scheduled = datetime.fromisoformat(session["scheduled_date"])
            days_late = (now.date() - scheduled.date()).days
            
            result.append({
                **session,
                "subject_name": subject["name"],
                "subject_area": subject.get("area"),
                "days_late": days_late
            })
    
    return result


@router.get("/subjects/{subject_id}/sessions")
async def get_subject_sessions(
    subject_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna todas as sessões de uma matéria específica.
    
    Returns:
        List[dict]: Lista de sessões ordenadas por data
    """
    user = await get_current_user(request, session_token)
    
    # Verifica se a matéria existe
    subject = await db.review_subjects.find_one({"id": subject_id, "user_id": user.id})
    if not subject:
        raise HTTPException(status_code=404, detail="Matéria não encontrada")
    
    # Busca todas as sessões
    sessions = await db.review_sessions.find({
        "review_subject_id": subject_id,
        "user_id": user.id
    }, {"_id": 0}).sort("review_number", 1).to_list(1000)
    
    return sessions
