// src/pages/Habitos.jsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  X,
  Calendar as CalIcon,
  TrendingUp,
  Target,
  Flame,
} from "lucide-react";

const FREQUENCIES = [
  { value: "daily", label: "📅 Diário" },
  { value: "weekly", label: "📆 Semanal" },
  { value: "monthly", label: "🗓️ Mensal" },
  { value: "custom", label: "⚙️ Personalizado" },
];

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

function formatStreak(days) {
  if (days === 0) return "Sem sequência";
  if (days === 1) return "1 dia";
  return `${days} dias`;
}

function HabitCard({ habit, onToggle, onEdit, onDelete, onViewHistory }) {
  const today = new Date().toISOString().slice(0, 10);
  const isCompletedToday = habit.completions?.some((c) => c.date === today);
  const streak = habit.current_streak || 0;

  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700 hover:border-purple-500/30 rounded-2xl p-5 transition-all duration-300 shadow-lg hover:shadow-purple-500/10 app-surface">
      <div className="flex items-start gap-4">
        <button
          onClick={() => onToggle(habit.id, isCompletedToday)}
          className="mt-1 shrink-0"
        >
          {isCompletedToday ? (
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          ) : (
            <Circle className="w-8 h-8 text-slate-500 hover:text-emerald-400 transition-colors" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-xl mb-2">{habit.name}</h3>
          
          {habit.description && (
            <p className="text-slate-400 text-sm mb-3">{habit.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="text-xs bg-purple-500/20 text-purple-300 px-3 py-1.5 rounded-lg border border-purple-500/30">
              {FREQUENCIES.find((f) => f.value === habit.frequency)?.label || habit.frequency}
            </span>

            {habit.frequency === "weekly" && habit.weekdays?.length > 0 && (
              <span className="text-xs text-slate-400">
                {habit.weekdays.map(d => WEEKDAYS.find(w => w.value === d)?.label).join(", ")}
              </span>
            )}

            {habit.frequency === "monthly" && habit.day_of_month && (
              <span className="text-xs text-slate-400">Dia {habit.day_of_month}</span>
            )}

            {streak > 0 && (
              <span className="flex items-center gap-1.5 text-xs bg-orange-500/20 text-orange-300 px-3 py-1.5 rounded-lg border border-orange-500/30">
                <Flame className="w-3.5 h-3.5" />
                {formatStreak(streak)}
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500">
            Total completado: {habit.total_completions || 0} vezes
          </div>
        </div>

        <div className="flex flex-col gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onViewHistory(habit)}
            className="text-cyan-300 hover:text-white hover:bg-cyan-500/20"
          >
            <TrendingUp className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(habit)}
            className="text-purple-300 hover:text-white hover:bg-purple-500/20"
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(habit.id)}
            className="text-red-300 hover:text-white hover:bg-red-500/20"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function HabitHistory({ habit, onClose }) {
  const last30Days = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last30Days.push(d.toISOString().slice(0, 10));
  }

  const completionDates = new Set(habit.completions?.map((c) => c.date) || []);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-purple-500/30 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto app-surface">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-white font-bold text-2xl flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-purple-400" />
            Histórico: {habit.name}
          </h2>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-purple-400">{habit.current_streak || 0}</div>
                <div className="text-xs text-slate-400">Sequência Atual</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-400">{habit.longest_streak || 0}</div>
                <div className="text-xs text-slate-400">Melhor Sequência</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">{habit.total_completions || 0}</div>
                <div className="text-xs text-slate-400">Total Completo</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-cyan-400">
                  {Math.round(((habit.total_completions || 0) / Math.max(1, habit.completions?.length || 1)) * 100)}%
                </div>
                <div className="text-xs text-slate-400">Taxa de Sucesso</div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-3">Últimos 30 dias</h3>
            <div className="grid grid-cols-7 gap-2">
              {last30Days.map((date) => {
                const isCompleted = completionDates.has(date);
                const d = new Date(date + "T00:00:00");
                const day = d.getDate();

                return (
                  <div
                    key={date}
                    className={`aspect-square rounded-lg border flex items-center justify-center text-xs font-semibold transition-all ${
                      isCompleted
                        ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-200"
                        : "bg-slate-800/50 border-slate-700 text-slate-500"
                    }`}
                    title={date}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Habitos() {
  const [user, setUser] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create form
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [weekdays, setWeekdays] = useState([]);
  const [dayOfMonth, setDayOfMonth] = useState(1);
  const [customDays, setCustomDays] = useState(1);

  // History
  const [historyHabit, setHistoryHabit] = useState(null);

  // Edit
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    api.get("/auth/me").then((r) => setUser(r.data?.user || null)).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    loadHabits();
  }, []);

  async function loadHabits() {
    try {
      const res = await api.get("/habits");
      setHabits(res.data || []);
    } catch (e) {
      console.error("Erro ao carregar hábitos:", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error("Digite o nome do hábito");
      return;
    }

    if (frequency === "weekly" && weekdays.length === 0) {
      toast.error("Selecione pelo menos um dia da semana");
      return;
    }

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        frequency,
      };

      if (frequency === "weekly") {
        payload.weekdays = weekdays;
      } else if (frequency === "monthly") {
        payload.day_of_month = dayOfMonth;
      } else if (frequency === "custom") {
        payload.custom_days = customDays;
      }

      await api.post("/habits", payload);
      setName("");
      setDescription("");
      setFrequency("daily");
      setWeekdays([]);
      setDayOfMonth(1);
      setCustomDays(1);
      setShowCreate(false);
      await loadHabits();
      toast.success("Hábito criado!");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erro ao criar hábito");
    }
  }

  async function handleToggle(id, isCompleted) {
    try {
      if (isCompleted) {
        await api.delete(`/habits/${id}/complete`);
        toast.success("Marcação removida");
      } else {
        await api.post(`/habits/${id}/complete`);
        toast.success("Hábito completado! 🎉");
      }
      await loadHabits();
    } catch (e) {
      toast.error("Erro ao atualizar hábito");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Excluir este hábito e todo seu histórico?")) return;

    try {
      await api.delete(`/habits/${id}`);
      await loadHabits();
      toast.success("Hábito removido");
    } catch (e) {
      toast.error("Erro ao remover hábito");
    }
  }

  function handleEdit(habit) {
    setEditingId(habit.id);
    setEditName(habit.name);
    setEditDescription(habit.description || "");
  }

  async function saveEdit(id) {
    try {
      await api.patch(`/habits/${id}`, {
        name: editName.trim(),
        description: editDescription.trim() || null,
      });
      setEditingId(null);
      await loadHabits();
      toast.success("Hábito atualizado");
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Header user={user} />

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            <Target className="inline w-10 h-10 mr-3 text-purple-400" />
            Meus Hábitos
          </h1>

          <Button
            onClick={() => setShowCreate(!showCreate)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold shadow-lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Hábito
          </Button>
        </div>

        {/* Create Form */}
        {showCreate && (
          <Card className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 border-purple-500/30 rounded-2xl p-6 mb-6 app-surface">
            <h2 className="text-white font-bold text-xl mb-4">Criar Novo Hábito</h2>
            
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 font-semibold mb-2 block">Nome</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Ler 30 minutos"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 font-semibold mb-2 block">Descrição (opcional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: Ler livros de desenvolvimento pessoal"
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300 font-semibold mb-2 block">Periodicidade</Label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-2.5"
                >
                  {FREQUENCIES.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>

              {frequency === "weekly" && (
                <div>
                  <Label className="text-gray-300 font-semibold mb-2 block">Dias da Semana</Label>
                  <div className="flex flex-wrap gap-2">
                    {WEEKDAYS.map((wd) => (
                      <button
                        key={wd.value}
                        onClick={() => {
                          if (weekdays.includes(wd.value)) {
                            setWeekdays(weekdays.filter((d) => d !== wd.value));
                          } else {
                            setWeekdays([...weekdays, wd.value]);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                          weekdays.includes(wd.value)
                            ? "bg-purple-600 text-white"
                            : "bg-slate-700/50 text-slate-400 hover:bg-slate-600"
                        }`}
                      >
                        {wd.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frequency === "monthly" && (
                <div>
                  <Label className="text-gray-300 font-semibold mb-2 block">Dia do Mês</Label>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    value={dayOfMonth}
                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              )}

              {frequency === "custom" && (
                <div>
                  <Label className="text-gray-300 font-semibold mb-2 block">Repetir a cada X dias</Label>
                  <Input
                    type="number"
                    min={1}
                    value={customDays}
                    onChange={(e) => setCustomDays(Number(e.target.value))}
                    className="bg-slate-700/50 border-slate-600 text-white"
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleCreate} className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500">
                  Criar Hábito
                </Button>
                <Button onClick={() => setShowCreate(false)} variant="ghost" className="text-gray-300">
                  Cancelar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Habits List */}
        {loading ? (
          <p className="text-center text-gray-400 py-8">Carregando...</p>
        ) : habits.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎯</div>
            <div className="text-slate-300 text-lg mb-2">Nenhum hábito cadastrado</div>
            <div className="text-slate-400 text-sm">Crie seu primeiro hábito para começar!</div>
          </div>
        ) : (
          <div className="space-y-4">
            {habits.map((habit) => (
              <div key={habit.id}>
                {editingId === habit.id ? (
                  <Card className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700 rounded-2xl p-5 app-surface">
                    <div className="space-y-3">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white font-bold"
                      />
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Descrição (opcional)"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveEdit(habit.id)} className="bg-emerald-600 hover:bg-emerald-500">
                          <CheckCircle2 className="w-4 h-4 mr-2" /> Salvar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)} className="text-gray-300">
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <HabitCard
                    habit={habit}
                    onToggle={handleToggle}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewHistory={(h) => setHistoryHabit(h)}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {historyHabit && <HabitHistory habit={historyHabit} onClose={() => setHistoryHabit(null)} />}
      </div>
    </div>
  );
}
