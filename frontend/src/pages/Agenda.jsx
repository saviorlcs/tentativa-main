// src/pages/AgendaNew.jsx - Agenda Melhorada com Sistema de Aulas
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Calendar as CalIcon,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ListChecks,
  X,
  GraduationCap,
  BookOpen,
  Brain,
} from "lucide-react";

/* ===================== helpers ===================== */
const pad2 = (n) => String(n).padStart(2, "0");
const toISODate = (d) => d.toISOString().slice(0, 10);

const EVENT_TYPES = [
  { value: "class", label: "🎓 Aula", color: "#3b82f6", icon: GraduationCap },
  { value: "study", label: "📚 Estudo", color: "#10b981", icon: BookOpen },
  { value: "review", label: "🧠 Revisão", color: "#8b5cf6", icon: Brain },
  { value: "other", label: "📝 Outro", color: "#6b7280", icon: CalIcon },
];

/* ===================== HourPicker ===================== */
function HourPicker({ value, onChange }) {
  const [hh, mm] = (value || "00:00").split(":");
  return (
    <div className="flex items-center gap-1 w-full min-w-0">
      <Input
        type="number"
        min={0}
        max={23}
        value={Number(hh)}
        onChange={(e) => onChange(`${pad2(e.target.value || 0)}:${mm}`)}
        className="shrink-0 w-14 sm:w-16 bg-slate-700 border-slate-600 text-white app-surface"
      />
      <span className="text-slate-400 px-1">:</span>
      <Input
        type="number"
        min={0}
        max={59}
        value={Number(mm)}
        onChange={(e) => onChange(`${hh}:${pad2(e.target.value || 0)}`)}
        className="shrink-0 w-14 sm:w-16 bg-slate-700 border-slate-600 text-white app-surface"
      />
    </div>
  );
}

/* ===================== MonthGrid (calendário mensal) ===================== */
function buildMonthMatrix(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const startWeekday = (first.getDay() + 6) % 7; // seg=0
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

function MonthGrid({ valueISO, onChange, monthSummary = {} }) {
  const sel = new Date(`${valueISO}T00:00:00`);
  const view = new Date(sel.getFullYear(), sel.getMonth(), 1);
  const weeks = buildMonthMatrix(view);

  const changeMonth = (delta) => {
    const d = new Date(view);
    d.setMonth(d.getMonth() + delta);
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const chosen = Math.min(sel.getDate(), last);
    onChange(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(chosen)}`);
  };

  const monthLabel = view.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });

  return (
    <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-cyan-500/40 rounded-xl p-4 shadow-xl shadow-cyan-500/20 backdrop-blur-xl app-surface">
      <div className="flex items-center justify-between mb-4">
        <button 
          onClick={() => changeMonth(-1)} 
          className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-cyan-500/30 transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="text-white font-bold text-base capitalize">{monthLabel}</div>
        <button 
          onClick={() => changeMonth(1)} 
          className="text-gray-300 hover:text-white p-2 rounded-lg hover:bg-cyan-500/30 transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-cyan-300 mb-2 font-semibold">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((w) => (
          <div key={w} className="text-center">
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weeks.flat().map((d, i) => {
          if (!d) return <div key={i} className="h-10 rounded-lg bg-slate-800/30 border border-slate-800/40 app-surface" />;
          const iso = `${view.getFullYear()}-${pad2(view.getMonth() + 1)}-${pad2(d)}`;
          const isSelected = iso === valueISO;
          const sum = monthSummary[iso];
          const isToday = iso === toISODate(new Date());

          return (
            <button
              key={i}
              onClick={() => onChange(iso)}
              className={`h-10 rounded-lg border text-xs relative transition-all ${
                isSelected
                  ? "bg-gradient-to-br from-cyan-600/40 to-blue-600/40 border-cyan-400/70 text-white shadow-lg shadow-cyan-500/40 scale-105 app-surface"
                  : isToday
                  ? "bg-gradient-to-br from-blue-600/30 to-cyan-600/30 border-blue-400/50 text-white font-bold shadow-md shadow-blue-500/30 app-surface"
                  : "bg-slate-800/40 border-slate-700/60 text-slate-200 hover:bg-slate-700/60 hover:border-cyan-500/40 app-surface"
              }`}
            >
              <span className={`absolute top-1 left-2 text-xs ${isSelected || isToday ? "font-bold" : ""}`}>{d}</span>
              {!!sum?.count && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {Array.from({ length: Math.min(sum.count, 3) }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-1 h-1 rounded-full ${
                        sum?.hasCompleted ? "bg-emerald-400" : "bg-cyan-400"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== DayTimeline (linhas por hora) ===================== */
function DayTimeline({ events = [], subjects = [] }) {
  const startMin = 6 * 60;
  const endMin = 23 * 60;
  const total = endMin - startMin;
  const getSubj = (id) => subjects.find((s) => s.id === id);

  return (
    <div className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border border-slate-700/60 rounded-xl p-4 relative overflow-hidden shadow-lg app-surface">
      <div className="relative" style={{ height: 680 }}>
        {Array.from({ length: (endMin - startMin) / 60 + 1 }).map((_, i) => {
          const top = (i * 60) / total * 680;
          const hh = 6 + i;
          return (
            <div key={i} className="absolute left-0 right-0" style={{ top }}>
              <div className="flex items-center gap-3">
                <div className="w-12 text-right text-xs font-semibold text-slate-400">{pad2(hh)}:00</div>
                <div className="flex-1 border-t border-slate-700/60 app-surface" />
              </div>
            </div>
          );
        })}

        {events.map((ev) => {
          const s = new Date(ev.start);
          const e = new Date(ev.end);
          const sMin = s.getHours() * 60 + s.getMinutes();
          const eMin = e.getHours() * 60 + e.getMinutes();
          const top = ((sMin - startMin) / total) * 680;
          const height = Math.max(35, ((eMin - sMin) / total) * 680);
          const subj = getSubj(ev.subject_id);
          const hhmm = `${pad2(s.getHours())}:${pad2(s.getMinutes())} → ${pad2(e.getHours())}:${pad2(e.getMinutes())}`;
          const eventType = EVENT_TYPES.find(t => t.value === ev.event_type) || EVENT_TYPES[3];
          const EventIcon = eventType.icon;

          return (
            <div
              key={ev.id}
              className="absolute left-16 right-4 rounded-lg p-3 shadow-md hover:shadow-lg transition-all"
              style={{
                top,
                height,
                background: subj ? `${subj.color}25` : `${eventType.color}15`,
                border: `2px solid ${subj ? `${subj.color}70` : `${eventType.color}60`}`,
              }}
            >
              <div className="flex items-center gap-2 text-xs text-white font-semibold mb-1">
                <EventIcon className="w-3.5 h-3.5" style={{ color: eventType.color }} />
                <span className="truncate">{ev.title}</span>
                {ev.completed && (
                  <span className="ml-auto text-emerald-300 text-[10px] bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 rounded app-surface">
                    ✓
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-300 text-[10px]">
                <Clock className="w-3 h-3" />
                {hhmm}
                {subj && (
                  <span
                    className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-semibold"
                    style={{ color: "white", background: `${subj.color}40`, border: `1px solid ${subj.color}70` }}
                  >
                    {subj.name}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ===================== Página Agenda ===================== */
export default function Agenda() {
  const [user, setUser] = useState(null);

  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()));
  const [events, setEvents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [monthSummary, setMonthSummary] = useState({});

  // criação
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [startHHMM, setStartHHMM] = useState("14:00");
  const [endHHMM, setEndHHMM] = useState("16:00");
  const [subjectId, setSubjectId] = useState("");
  const [eventType, setEventType] = useState("other");
  const [creating, setCreating] = useState(false);
  
  // Periodicidade
  const [recurrenceType, setRecurrenceType] = useState("once");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceUntil, setRecurrenceUntil] = useState("");
  const [recurrenceCount, setRecurrenceCount] = useState("");

  // edição
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");

  const dateObj = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate]);

  function moveDay(delta) {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + delta);
    setSelectedDate(toISODate(d));
  }

  /* -------- carregar user e matérias -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, subs] = await Promise.all([api.get("/auth/me"), api.get("/subjects")]);
        if (!alive) return;
        setUser(me.data?.user || null);
        setSubjects(subs.data || []);
      } catch (e) {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* -------- buscar eventos do dia -------- */
  async function fetchDay() {
    try {
      const res = await api.get("/calendar/day", { params: { date_iso: selectedDate } });
      setEvents(res.data || []);
    } catch (e) {
      setEvents([]);
    }
  }

  useEffect(() => {
    fetchDay();
  }, [selectedDate]);

  /* -------- resumo do mês -------- */
  async function fetchMonthSummary(iso) {
    const d = new Date(`${iso}T00:00:00`);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    try {
      const res = await api.get("/calendar/month", { params: { year: y, month: m } });
      const map = {};
      for (const it of res.data || []) map[it.date_iso] = { count: it.count, hasCompleted: !!it.hasCompleted };
      setMonthSummary(map);
    } catch {
      setMonthSummary({});
    }
  }

  useEffect(() => {
    fetchMonthSummary(selectedDate);
  }, [selectedDate]);

  /* -------- criar evento -------- */
  async function handleCreate() {
    if (!title.trim()) {
      toast.info("Dê um título ao evento 🙏");
      return;
    }
    const [sh, sm] = startHHMM.split(":").map(Number);
    const [eh, em] = endHHMM.split(":").map(Number);
    const start = new Date(`${selectedDate}T${pad2(sh)}:${pad2(sm)}:00`);
    const end = new Date(`${selectedDate}T${pad2(eh)}:${pad2(em)}:00`);
    if (end <= start) {
      toast.info("Hora final deve ser maior que a inicial");
      return;
    }
    
    const payload = {
      title: title.trim(),
      start,
      end,
      subject_id: subjectId || null,
      event_type: eventType,
      checklist: [],
      recurrence_type: recurrenceType,
      recurrence_interval: parseInt(recurrenceInterval) || 1,
      recurrence_until: recurrenceUntil ? new Date(recurrenceUntil) : null,
      recurrence_count: recurrenceCount ? parseInt(recurrenceCount) : null,
    };
    
    setCreating(true);
    try {
      // CORREÇÃO: Verificação de conflitos opcional - se falhar, apenas cria o evento
      try {
        if (eventType === "review" || recurrenceType === "once") {
          const conflictCheck = await api.post("/calendar/check-conflicts", payload).catch(() => null);
          
          if (conflictCheck?.data?.has_conflict) {
            const conflicts = conflictCheck.data.conflicting_events || [];
            const suggested = conflictCheck.data.suggested_time;
            
            let message = `⚠️ Conflito detectado!\n\n`;
            if (eventType === "review") {
              message += `Este horário coincide com ${conflicts.length} aula(s):\n`;
            } else {
              message += `Este horário já possui ${conflicts.length} evento(s):\n`;
            }
            conflicts.forEach(c => {
              const cStart = new Date(c.start);
              message += `• ${c.title} (${pad2(cStart.getHours())}:${pad2(cStart.getMinutes())})\n`;
            });
            
            if (suggested) {
              const suggestedDate = new Date(suggested);
              const suggestedTime = `${pad2(suggestedDate.getHours())}:${pad2(suggestedDate.getMinutes())}`;
              message += `\n✨ Horário livre sugerido: ${suggestedTime}`;
              
              const shouldUseSuggested = window.confirm(
                message + "\n\nDeseja usar o horário sugerido?"
              );
              
              if (shouldUseSuggested) {
                setStartHHMM(suggestedTime);
                const duration = (end - start) / (1000 * 60); // minutos
                const newEnd = new Date(suggestedDate.getTime() + duration * 60 * 1000);
                setEndHHMM(`${pad2(newEnd.getHours())}:${pad2(newEnd.getMinutes())}`);
                setCreating(false);
                toast.info("Horário ajustado! Clique em Criar novamente.");
                return;
              }
            } else {
              const shouldContinue = window.confirm(
                message + "\n\nDeseja criar o evento mesmo assim?"
              );
              if (!shouldContinue) {
                setCreating(false);
                return;
              }
            }
          }
        }
      } catch (conflictError) {
        // Se a verificação de conflitos falhar, apenas loga e continua
        console.log('[Agenda] Verificação de conflitos não disponível, criando evento diretamente');
      }
      
      // Cria o evento
      const res = await api.post("/calendar/event", payload);
      setTitle("");
      setSubjectId("");
      setEventType("other");
      setRecurrenceType("once");
      setRecurrenceInterval(1);
      setRecurrenceUntil("");
      setRecurrenceCount("");
      setShowCreate(false);
      fetchDay();
      fetchMonthSummary(selectedDate);
      
      const count = res.data?.created_count || 1;
      toast.success(count > 1 ? `${count} eventos criados! ✨` : "Evento criado! ✨");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erro ao criar evento");
    } finally {
      setCreating(false);
    }
  }

  /* -------- deletar -------- */
  async function handleDelete(id) {
    try {
      await api.delete(`/calendar/event/${id}`);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      fetchMonthSummary(selectedDate);
      toast.success("Evento removido");
    } catch {
      toast.error("Erro ao remover");
    }
  }

  /* -------- editar -------- */
  function startEdit(ev) {
    setEditingId(ev.id);
    setEditTitle(ev.title);
    setEditSubject(ev.subject_id || "");
  }

  async function saveEdit(id) {
    try {
      await api.patch(`/calendar/event/${id}`, {
        title: editTitle.trim(),
        subject_id: editSubject || null,
      });
      setEditingId(null);
      fetchDay();
      fetchMonthSummary(selectedDate);
      toast.success("Evento atualizado");
    } catch {
      toast.error("Erro ao salvar edição");
    }
  }

  /* -------- checklist -------- */
  async function addChecklistItem(id) {
    const text = prompt("Novo item do checklist:");
    if (!text || !text.trim()) return;
    try {
      await api.post(`/calendar/event/${id}/checklist`, { text: text.trim() });
      fetchDay();
    } catch {
      toast.error("Erro ao adicionar item");
    }
  }

  async function toggleChecklist(id, itemId) {
    try {
      await api.post(`/calendar/event/${id}/checklist/${itemId}/toggle`);
      setEvents((prev) =>
        prev.map((ev) =>
          ev.id !== id
            ? ev
            : { ...ev, checklist: ev.checklist.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)) }
        )
      );
    } catch {
      toast.error("Erro ao marcar item");
    }
  }

  /* ===================== render ===================== */
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Header user={user} />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Título + navegação do dia */}
        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 flex items-center gap-3">
            <CalIcon className="w-10 h-10 text-cyan-400" />
            Agenda
          </h1>

          <div className="flex items-center gap-2 bg-slate-800/60 border border-cyan-500/40 rounded-xl p-2 backdrop-blur-xl shadow-lg shadow-cyan-500/20 app-surface">
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-cyan-500/30 h-9 w-9 p-0" 
              onClick={() => moveDay(-1)}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 text-white font-bold min-w-[180px] text-center text-sm shadow-inner app-surface">
              {dateObj.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "short" })}
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-gray-300 hover:text-white hover:bg-cyan-500/30 h-9 w-9 p-0" 
              onClick={() => moveDay(1)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* GRID PRINCIPAL */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ESQUERDA: calendário + criar */}
          <div className="lg:col-span-1 space-y-8">
            <MonthGrid valueISO={selectedDate} onChange={(iso) => setSelectedDate(iso)} monthSummary={monthSummary} />

            {/* Botão Criar */}
            {!showCreate && (
              <Button
                onClick={() => setShowCreate(true)}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold py-3 text-base shadow-xl shadow-cyan-500/30 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Evento
              </Button>
            )}

            {showCreate && (
              <div className="bg-gradient-to-br from-slate-800/80 to-slate-800/60 border border-cyan-500/40 rounded-xl p-4 backdrop-blur shadow-xl shadow-cyan-500/20 app-surface">
                <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-cyan-400" /> Criar Evento
                </h2>

                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-300 font-semibold mb-1.5 block text-sm">Título do Evento</Label>
                    <Input
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex.: Aula de Cálculo"
                      className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-cyan-500 h-9 text-sm app-surface"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-300 font-semibold mb-1.5 block text-sm">Tipo de Evento</Label>
                    <select
                      value={eventType}
                      onChange={(e) => setEventType(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm focus:border-cyan-500 app-surface"
                    >
                      {EVENT_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-gray-300 font-semibold mb-1.5 flex items-center gap-1.5 block text-sm">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" /> Início
                      </Label>
                      <HourPicker value={startHHMM} onChange={setStartHHMM} />
                    </div>
                    <div>
                      <Label className="text-gray-300 font-semibold mb-1.5 flex items-center gap-1.5 block text-sm">
                        <Clock className="w-3.5 h-3.5 text-blue-400" /> Fim
                      </Label>
                      <HourPicker value={endHHMM} onChange={setEndHHMM} />
                    </div>
                  </div>

                  <div>
                    <Label className="text-gray-300 font-semibold mb-1.5 block text-sm">Matéria (opcional)</Label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg text-white px-3 py-2 text-sm focus:border-cyan-500 app-surface"
                    >
                      <option value="">— Sem matéria vinculada —</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Periodicidade */}
                  <div className="bg-slate-700/30 border border-slate-600/50 rounded-lg p-3 space-y-3">
                    <Label className="text-cyan-300 font-bold text-base flex items-center gap-2">
                      🔄 Repetir Evento
                    </Label>
                    
                    <div>
                      <Label className="text-gray-300 text-sm mb-2 block">Frequência</Label>
                      <select
                        value={recurrenceType}
                        onChange={(e) => setRecurrenceType(e.target.value)}
                        className="w-full bg-slate-700/70 border border-slate-600 rounded-lg text-white px-3 py-2.5 text-sm app-surface"
                      >
                        <option value="once">Apenas este dia</option>
                        <option value="daily">Diariamente</option>
                        <option value="weekly">Semanalmente</option>
                        <option value="monthly">Mensalmente</option>
                        <option value="yearly">Anualmente</option>
                        <option value="every_x_days">A cada X dias</option>
                      </select>
                    </div>

                    {recurrenceType === "every_x_days" && (
                      <div>
                        <Label className="text-gray-300 text-sm mb-2 block">Intervalo (dias)</Label>
                        <Input
                          type="number"
                          min={1}
                          max={365}
                          value={recurrenceInterval}
                          onChange={(e) => setRecurrenceInterval(e.target.value)}
                          placeholder="Ex: 3"
                          className="bg-slate-700/70 border-slate-600 text-white text-sm app-surface"
                        />
                      </div>
                    )}

                    {recurrenceType !== "once" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-gray-300 text-sm mb-2 block">Até a data</Label>
                          <Input
                            type="date"
                            value={recurrenceUntil}
                            onChange={(e) => setRecurrenceUntil(e.target.value)}
                            className="bg-slate-700/70 border-slate-600 text-white text-sm app-surface"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-300 text-sm mb-2 block">Ou N° vezes</Label>
                          <Input
                            type="number"
                            min={1}
                            max={365}
                            value={recurrenceCount}
                            onChange={(e) => setRecurrenceCount(e.target.value)}
                            placeholder="Ex: 10"
                            className="bg-slate-700/70 border-slate-600 text-white text-sm app-surface"
                          />
                        </div>
                      </div>
                    )}

                    {recurrenceType !== "once" && (
                      <p className="text-xs text-slate-400 italic">
                        💡 Dica: Use "até a data" OU "N° vezes" (não ambos)
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-3">
                    <Button 
                      onClick={handleCreate} 
                      disabled={creating} 
                      className="flex-1 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-bold py-3.5 shadow-lg shadow-cyan-500/40"
                    >
                      {creating ? "Criando..." : "✨ Criar"}
                    </Button>
                    <Button 
                      onClick={() => setShowCreate(false)} 
                      variant="ghost" 
                      className="text-gray-300 hover:bg-slate-700"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* DIREITA: timeline + cards */}
          <div className="lg:col-span-2 space-y-8">
            <DayTimeline events={events} subjects={subjects} />

            <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-6 shadow-lg app-surface">
              {events.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">📅</div>
                  <div className="text-slate-300 text-lg font-bold mb-2">Nada programado para hoje</div>
                  <div className="text-slate-400 text-sm">Crie um evento para começar!</div>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((ev) => {
                    const start = new Date(ev.start);
                    const end = new Date(ev.end);
                    const hhmm = `${pad2(start.getHours())}:${pad2(start.getMinutes())} → ${pad2(
                      end.getHours()
                    )}:${pad2(end.getMinutes())}`;
                    const subj = subjects.find((s) => s.id === ev.subject_id);
                    const isEditing = editingId === ev.id;
                    const eventType = EVENT_TYPES.find(t => t.value === ev.event_type) || EVENT_TYPES[3];
                    const EventIcon = eventType.icon;

                    return (
                      <Card 
                        key={ev.id} 
                        className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-slate-700/70 hover:border-cyan-500/40 rounded-xl p-4 transition-all shadow-lg hover:shadow-cyan-500/20 app-surface"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-3">
                              {!isEditing ? (
                                <>
                                  <EventIcon className="w-5 h-5" style={{ color: eventType.color }} />
                                  <h3 className="text-white font-bold text-lg">{ev.title}</h3>
                                </>
                              ) : (
                                <Input
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white font-bold text-base"
                                />
                              )}

                              {ev.completed && (
                                <span className="inline-flex items-center gap-1.5 text-emerald-300 bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-md shadow-emerald-500/30 app-surface">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluído
                                </span>
                              )}

                              {subj && (
                                <span
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold shadow-md"
                                  style={{
                                    color: "white",
                                    background: `${subj.color}35`,
                                    border: `2px solid ${subj.color}80`,
                                  }}
                                >
                                  {subj.name}
                                </span>
                              )}
                            </div>

                            <div className="text-slate-300 mb-3 flex items-center gap-2 font-semibold text-sm">
                              <Clock className="w-4 h-4 text-cyan-400" />
                              <span>{hhmm}</span>
                            </div>

                            {ev.checklist?.length > 0 && (
                              <div className="mt-3 space-y-2 bg-slate-800/60 rounded-lg p-3 border border-slate-700/70 app-surface">
                                <div className="text-xs font-semibold text-cyan-300 mb-2 flex items-center gap-1.5">
                                  <ListChecks className="w-4 h-4" /> Checklist
                                </div>
                                {ev.checklist.map((it) => (
                                  <label key={it.id} className="flex items-center gap-2 text-xs text-slate-300 hover:text-white cursor-pointer transition-colors">
                                    <input
                                      type="checkbox"
                                      checked={!!it.done}
                                      onChange={() => toggleChecklist(ev.id, it.id)}
                                      className="accent-cyan-500 w-4 h-4 rounded"
                                    />
                                    <span className={it.done ? "line-through opacity-60" : ""}>{it.text}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col items-end gap-2 shrink-0">
                            {!isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg"
                                  onClick={() => startEdit(ev)}
                                >
                                  <Edit2 className="w-4 h-4 mr-2" /> Editar
                                </Button>
                                <Button
                                  size="sm"
                                  className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold shadow-lg"
                                  onClick={() => handleDelete(ev.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" /> Excluir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-cyan-300 hover:text-white hover:bg-cyan-500/20"
                                  onClick={() => addChecklistItem(ev.id)}
                                >
                                  <ListChecks className="w-4 h-4 mr-2" /> Checklist
                                </Button>
                              </>
                            ) : (
                              <>
                                <div className="w-64 mb-3">
                                  <Label className="text-gray-300 text-sm mb-2 block font-bold">Matéria (opcional)</Label>
                                  <select
                                    value={editSubject}
                                    onChange={(e) => setEditSubject(e.target.value)}
                                    className="w-full bg-slate-700 border border-slate-600 rounded-xl text-white px-3 py-2.5 text-sm app-surface"
                                  >
                                    <option value="">— sem matéria —</option>
                                    {subjects.map((s) => (
                                      <option key={s.id} value={s.id}>
                                        {s.name}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm"
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 font-bold shadow-lg" 
                                    onClick={() => saveEdit(ev.id)}
                                  >
                                    <CheckCircle2 className="w-4 h-4 mr-2" /> Salvar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-300 hover:text-white hover:bg-slate-700"
                                    onClick={() => setEditingId(null)}
                                  >
                                    <X className="w-4 h-4 mr-2" /> Cancelar
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
