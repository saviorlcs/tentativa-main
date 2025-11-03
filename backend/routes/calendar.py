"""
Rotas de calendário/agenda.
Gerencia eventos do calendário com suporte a recorrência.
"""
from fastapi import APIRouter, Request, Cookie, HTTPException, Query
from typing import Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
import uuid
import calendar as cal_module

from database import db
from dependencies import get_current_user
from models.calendar import CalendarEvent, CalendarEventCreate, CalendarEventUpdate

router = APIRouter(prefix="/calendar")


class ChecklistAdd(BaseModel):
    """Payload para adicionar item à checklist."""
    text: str


def generate_recurring_dates(
    start: datetime,
    end: datetime,
    recurrence_type: str,
    recurrence_interval: int,
    recurrence_until: Optional[datetime],
    recurrence_count: Optional[int]
) -> list:
    """
    Gera lista de (start, end) para eventos recorrentes.
    
    Args:
        start: Data/hora de início
        end: Data/hora de fim
        recurrence_type: Tipo de recorrência (once, daily, weekly, monthly, yearly, every_x_days)
        recurrence_interval: Intervalo de recorrência
        recurrence_until: Data limite para recorrência
        recurrence_count: Número máximo de ocorrências
    
    Returns:
        List[Tuple[datetime, datetime]]: Lista de datas
    """
    dates = []
    duration = end - start
    current = start
    count = 0
    max_occurrences = recurrence_count if recurrence_count else 365
    
    while count < max_occurrences:
        if recurrence_until and current > recurrence_until:
            break
        
        dates.append((current, current + duration))
        count += 1
        
        if recurrence_type == "once":
            break
        elif recurrence_type == "daily":
            current += timedelta(days=1)
        elif recurrence_type == "weekly":
            current += timedelta(weeks=1)
        elif recurrence_type == "monthly":
            # Avança um mês
            month = current.month + 1
            year = current.year
            if month > 12:
                month = 1
                year += 1
            try:
                current = current.replace(year=year, month=month)
            except ValueError:
                # Dia não existe no mês (ex: 31 em fevereiro)
                last_day = cal_module.monthrange(year, month)[1]
                current = current.replace(year=year, month=month, day=min(current.day, last_day))
        elif recurrence_type == "yearly":
            current = current.replace(year=current.year + 1)
        elif recurrence_type == "every_x_days":
            current += timedelta(days=recurrence_interval)
        else:
            break
    
    return dates


async def check_time_conflicts(
    user_id: str,
    start: datetime,
    end: datetime,
    event_type: str = None
) -> dict:
    """
    Verifica conflitos de horário para um usuário.
    Se event_type for 'review', verifica especificamente conflitos com 'class'.
    
    Args:
        user_id: ID do usuário
        start: Data/hora de início
        end: Data/hora de fim
        event_type: Tipo do evento (review, class, other)
    
    Returns:
        dict: Informações sobre conflitos e sugestão de horário
    """
    # Busca eventos no mesmo dia
    day_start = start.replace(hour=0, minute=0, second=0, microsecond=0)
    day_end = day_start + timedelta(days=1)
    
    existing = await db.calendar_events.find({
        "user_id": user_id,
        "start": {"$lt": day_end.isoformat()},
        "end": {"$gt": day_start.isoformat()}
    }).to_list(1000)
    
    conflicting = []
    for ev in existing:
        ev_start = datetime.fromisoformat(ev["start"])
        ev_end = datetime.fromisoformat(ev["end"])
        
        # Verifica sobreposição
        if not (end <= ev_start or start >= ev_end):
            # Se estamos criando uma revisão, só importa se conflita com aula
            if event_type == "review" and ev.get("event_type") == "class":
                conflicting.append(ev)
            elif event_type != "review":
                conflicting.append(ev)
    
    has_conflict = len(conflicting) > 0
    
    # Sugerir próximo horário livre
    suggested_time = None
    if has_conflict:
        duration = (end - start).total_seconds() / 60
        attempt_start = start
        
        for _ in range(48):  # Tenta até 24 horas depois
            attempt_start += timedelta(minutes=30)
            attempt_end = attempt_start + timedelta(minutes=duration)
            
            is_free = True
            for ev in existing:
                ev_start = datetime.fromisoformat(ev["start"])
                ev_end = datetime.fromisoformat(ev["end"])
                
                if not (attempt_end <= ev_start or attempt_start >= ev_end):
                    if event_type == "review" and ev.get("event_type") == "class":
                        is_free = False
                        break
                    elif event_type != "review":
                        is_free = False
                        break
            
            if is_free:
                suggested_time = attempt_start
                break
    
    return {
        "has_conflict": has_conflict,
        "conflicting_events": [
            {
                "id": ev["id"],
                "title": ev["title"],
                "start": ev["start"],
                "end": ev["end"],
                "event_type": ev.get("event_type", "other")
            }
            for ev in conflicting
        ],
        "suggested_time": suggested_time.isoformat() if suggested_time else None
    }


@router.post("/check-conflicts")
async def calendar_check_conflicts(
    ev: CalendarEventCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Verifica conflitos de horário antes de criar um evento.
    
    Args:
        ev: Dados do evento
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Informações sobre conflitos
    """
    user = await get_current_user(request, session_token)
    
    conflict_info = await check_time_conflicts(
        user.id,
        ev.start,
        ev.end,
        ev.event_type
    )
    
    return conflict_info


@router.post("/event")
async def calendar_create(
    ev: CalendarEventCreate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Cria um ou mais eventos no calendário.
    Suporta eventos recorrentes.
    
    Args:
        ev: Dados do evento
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: Eventos criados
    
    Raises:
        HTTPException: 400 se subject_id inválido ou erro na criação
    """
    user = await get_current_user(request, session_token)
    
    # Valida subject se informado
    if ev.subject_id:
        owned = await db.subjects.find_one({"id": ev.subject_id, "user_id": user.id})
        if not owned:
            raise HTTPException(status_code=400, detail="subject_id inválido")
    
    try:
        # Gera datas recorrentes
        recurring_dates = generate_recurring_dates(
            ev.start, ev.end,
            ev.recurrence_type or "once",
            ev.recurrence_interval or 1,
            ev.recurrence_until,
            ev.recurrence_count
        )
        
        created_events = []
        for start_dt, end_dt in recurring_dates:
            doc = CalendarEvent(
                user_id=user.id,
                title=ev.title,
                start=start_dt,
                end=end_dt,
                subject_id=ev.subject_id,
                event_type=ev.event_type or "other",
                checklist=ev.checklist or []
            ).model_dump()
            
            # Normaliza ISO
            doc["start"] = doc["start"].isoformat() if hasattr(doc["start"], 'isoformat') else doc["start"]
            doc["end"] = doc["end"].isoformat() if hasattr(doc["end"], 'isoformat') else doc["end"]
            doc["created_at"] = doc["created_at"].isoformat() if hasattr(doc["created_at"], 'isoformat') else doc["created_at"]
            
            clean_doc = dict(doc)
            await db.calendar_events.insert_one(doc)
            created_events.append(clean_doc)
        
        return {"ok": True, "created_count": len(created_events), "events": created_events[:5]}
    except Exception as e:
        import traceback
        error_detail = f"Erro ao criar evento: {str(e)}"
        print(f"[calendar_create ERROR] {error_detail}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=error_detail)


@router.get("/day")
async def calendar_day(
    request: Request,
    date_iso: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna todos os eventos de um dia específico.
    
    Args:
        request: Request do FastAPI
        date_iso: Data no formato YYYY-MM-DD
        session_token: Token de sessão do cookie
    
    Returns:
        List[dict]: Lista de eventos do dia
    """
    user = await get_current_user(request, session_token)
    
    # Limites do dia (UTC)
    d = datetime.fromisoformat(date_iso).date()
    day_start = datetime(d.year, d.month, d.day, tzinfo=timezone.utc)
    day_end = day_start + timedelta(days=1)
    
    # Eventos que tocam o dia
    items = await db.calendar_events.find(
        {
            "user_id": user.id,
            "start": {"$lt": day_end.isoformat()},
            "end": {"$gt": day_start.isoformat()}
        },
        {"_id": 0}
    ).sort("start", 1).to_list(500)
    
    return items


@router.get("/month")
async def calendar_month(
    request: Request,
    year: int,
    month: int,
    session_token: Optional[str] = Cookie(None)
):
    """
    Retorna resumo de eventos do mês agrupados por dia.
    
    Args:
        request: Request do FastAPI
        year: Ano
        month: Mês (1-12)
        session_token: Token de sessão do cookie
    
    Returns:
        List[dict]: Resumo por dia [{date_iso, count, hasCompleted}]
    """
    user = await get_current_user(request, session_token)
    
    # Janela do mês (UTC)
    start = datetime(year, month, 1, tzinfo=timezone.utc)
    end = datetime(
        year + (1 if month == 12 else 0),
        1 if month == 12 else month + 1,
        1,
        tzinfo=timezone.utc
    )
    
    cur = db.calendar_events.find(
        {
            "user_id": user.id,
            "start": {"$gte": start.isoformat(), "$lt": end.isoformat()}
        },
        {"_id": 0}
    )
    
    # Agrega por dia
    agg = {}
    async for ev in cur:
        di = ev["start"][:10]  # YYYY-MM-DD
        d = agg.setdefault(di, {"date_iso": di, "count": 0, "hasCompleted": False})
        d["count"] += 1
        d["hasCompleted"] = d["hasCompleted"] or bool(ev.get("completed"))
    
    return list(agg.values())


@router.patch("/event/{event_id}")
async def calendar_update(
    event_id: str,
    payload: CalendarEventUpdate,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Atualiza um evento existente.
    
    Args:
        event_id: ID do evento
        payload: Dados para atualização
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    
    Raises:
        HTTPException: 400 se subject_id inválido
    """
    user = await get_current_user(request, session_token)
    
    upd = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not upd:
        return {"success": True}
    
    if "subject_id" in upd and upd["subject_id"]:
        owned = await db.subjects.find_one({"id": upd["subject_id"], "user_id": user.id})
        if not owned:
            raise HTTPException(status_code=400, detail="subject_id inválido")
    
    # Normaliza ISO se veio datetime
    if "start" in upd and isinstance(upd["start"], datetime):
        upd["start"] = upd["start"].isoformat()
    if "end" in upd and isinstance(upd["end"], datetime):
        upd["end"] = upd["end"].isoformat()
    
    await db.calendar_events.update_one(
        {"id": event_id, "user_id": user.id},
        {"$set": upd}
    )
    
    return {"success": True}


@router.delete("/event/{event_id}")
async def calendar_delete(
    event_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Deleta um evento do calendário.
    
    Args:
        event_id: ID do evento
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    """
    user = await get_current_user(request, session_token)
    
    await db.calendar_events.delete_one({"id": event_id, "user_id": user.id})
    
    return {"success": True}


@router.post("/event/{event_id}/checklist")
async def checklist_add(
    event_id: str,
    item: ChecklistAdd,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Adiciona item à checklist de um evento.
    
    Args:
        event_id: ID do evento
        item: Item para adicionar
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True, "item": dict}
    """
    user = await get_current_user(request, session_token)
    
    new_item = {"id": str(uuid.uuid4()), "text": item.text, "done": False}
    
    await db.calendar_events.update_one(
        {"id": event_id, "user_id": user.id},
        {"$push": {"checklist": new_item}}
    )
    
    return {"success": True, "item": new_item}


@router.post("/event/{event_id}/checklist/{item_id}/toggle")
async def checklist_toggle(
    event_id: str,
    item_id: str,
    request: Request,
    session_token: Optional[str] = Cookie(None)
):
    """
    Alterna o status done de um item da checklist.
    
    Args:
        event_id: ID do evento
        item_id: ID do item da checklist
        request: Request do FastAPI
        session_token: Token de sessão do cookie
    
    Returns:
        dict: {"success": True}
    
    Raises:
        HTTPException: 404 se evento não encontrado
    """
    user = await get_current_user(request, session_token)
    
    ev = await db.calendar_events.find_one(
        {"id": event_id, "user_id": user.id},
        {"_id": 0, "checklist": 1}
    )
    
    if not ev:
        raise HTTPException(status_code=404, detail="Evento não encontrado")
    
    items = ev.get("checklist", [])
    for it in items:
        if it["id"] == item_id:
            it["done"] = not it.get("done", False)
            break
    
    await db.calendar_events.update_one(
        {"id": event_id, "user_id": user.id},
        {"$set": {"checklist": items}}
    )
    
    return {"success": True}
