// src/pages/Revisao.jsx
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Brain,
  Plus,
  Trash2,
  CheckCircle2,
  Edit2,
  X,
  Calendar as CalIcon,
  Clock,
  AlertCircle,
  TrendingUp,
  BookOpen,
  Target,
} from "lucide-react";

export default function Revisao() {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]); // matérias de revisão
  const [cycleSubjects, setCycleSubjects] = useState([]); // matérias do ciclo (para vincular)
  const [upcoming, setUpcoming] = useState([]); // próximas revisões
  const [overdue, setOverdue] = useState([]); // revisões atrasadas
  const [expandedSubject, setExpandedSubject] = useState(null); // matéria expandida para ver sessões
  const [subjectSessions, setSubjectSessions] = useState(null); // sessões da matéria expandida

  // Criar nova matéria
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newArea, setNewArea] = useState("");
  const [newMode, setNewMode] = useState("normal");
  const [newExamDate, setNewExamDate] = useState("");
  const [newCycleSubject, setNewCycleSubject] = useState("");

  // Editar matéria
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editMode, setEditMode] = useState("normal");
  const [editExamDate, setEditExamDate] = useState("");

  // Carregar sessões de uma matéria específica
 // Carregar sessões de uma matéria específica
async function loadSubjectSessions(subjectId) {
  try {
    const res = await api.get(`/review/subjects/${subjectId}/sessions`);
    const data = res.data || {};
    // o backend retorna { subject, sessions }
    setSubjectSessions(Array.isArray(res.data?.sessions) ? res.data.sessions : []);
  } catch (e) {
    console.error("Erro ao carregar sessões:", e);
    setSubjectSessions([]);
  }
}


  // Carregar dados iniciais
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [me, revSubjects, cycSubs] = await Promise.all([
          api.get("/auth/me"),
          api.get("/review/subjects"),
          api.get("/subjects"),
        ]);
        if (!alive) return;
        setUser(me.data?.user || null);
        setSubjects(revSubjects.data || []);
        setCycleSubjects(cycSubs.data || []);
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Carregar próximas revisões e atrasadas
  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const [upcomingRes, overdueRes] = await Promise.all([
        api.get("/review/upcoming", { params: { days_ahead: 30 } }),
        api.get("/review/overdue"),
      ]);
      setUpcoming(upcomingRes.data || []);
      setOverdue(overdueRes.data || []);
    } catch (e) {
      console.error("Erro ao carregar revisões:", e);
    }
  }

  // Recarregar matérias
  async function reloadSubjects() {
    try {
      const res = await api.get("/review/subjects");
      setSubjects(res.data || []);
    } catch (e) {
      console.error("Erro ao recarregar matérias:", e);
    }
  }

  // Criar nova matéria
  async function handleCreate() {
    if (!newName.trim()) {
      toast.error("Digite o nome da matéria");
      return;
    }

    if (newMode === "exam" && !newExamDate) {
      toast.error("Defina a data da prova");
      return;
    }

    setCreating(true);
    try {
      await api.post("/review/subjects", {
        name: newName.trim(),
        area: newArea.trim() || null,
        cycle_subject_id: newCycleSubject || null,
        mode: newMode,
        exam_date: newExamDate ? new Date(newExamDate).toISOString() : null,
      });

      setNewName("");
      setNewArea("");
      setNewMode("normal");
      setNewExamDate("");
      setNewCycleSubject("");
      await reloadSubjects();
      toast.success("Matéria adicionada! Clique em 'Iniciar' para começar as revisões.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erro ao criar matéria");
    } finally {
      setCreating(false);
    }
  }

  // Deletar matéria
  async function handleDelete(id) {
    if (!confirm("Excluir esta matéria e todas as suas revisões?")) return;

    try {
      const res = await api.delete(`/review/subjects/${id}`);
      await reloadSubjects();
      await loadReviews();
      
      const eventsDeleted = res.data?.events_deleted || 0;
      if (eventsDeleted > 0) {
        toast.success(`Matéria removida e ${eventsDeleted} evento(s) da agenda deletados`);
      } else {
        toast.success("Matéria removida");
      }
    } catch (e) {
      toast.error("Erro ao remover matéria");
    }
  }

  // Editar matéria
  function startEdit(subj) {
    setEditingId(subj.id);
    setEditName(subj.name);
    setEditArea(subj.area || "");
    setEditMode(subj.mode || "normal");
    setEditExamDate(
      subj.exam_date ? new Date(subj.exam_date).toISOString().slice(0, 10) : ""
    );
  }

  async function saveEdit(id) {
    try {
      await api.patch(`/review/subjects/${id}`, {
        name: editName.trim(),
        area: editArea.trim() || null,
        mode: editMode,
        exam_date: editExamDate ? new Date(editExamDate).toISOString() : null,
      });
      setEditingId(null);
      await reloadSubjects();
      toast.success("Matéria atualizada");
    } catch (e) {
      toast.error("Erro ao salvar");
    }
  }

  // Iniciar revisões
  async function handleStart(id) {
    try {
      const res = await api.post(`/review/subjects/${id}/start`);
      toast.success(
        `${res.data.sessions_created} revisões criadas e agendadas!`
      );
      await reloadSubjects();
      await loadReviews();
    } catch (e) {
      toast.error(
        e?.response?.data?.detail || "Erro ao iniciar revisões"
      );
    }
  }

  // Marcar revisão como completa
  async function handleCompleteReview(sessionId) {
    try {
      const res = await api.post(`/review/sessions/${sessionId}/complete`);
      if (res.data.penalty_applied) {
        toast.warning(
          `Revisão marcada! Próxima revisão ajustada (+${res.data.days_late} dias de atraso)`
        );
      } else {
        toast.success("Revisão completa! 🎉");
      }
      await loadReviews();
    } catch (e) {
      toast.error("Erro ao marcar revisão");
    }
  }

  // Renderização
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900"
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <Header user={user} />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Título */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
            <Brain className="inline w-10 h-10 mr-3 text-purple-400" />
            Revisão Método Hermann
          </h1>
        </div>

        {/* Explicação do método */}
        <Card className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-500/30 rounded-2xl p-6 mb-8 app-surface">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-purple-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg mb-2">
                Como funciona?
              </h3>
              <p className="text-slate-300 text-sm leading-relaxed">
                O Método Hermann usa <strong>repetição espaçada</strong> para
                maximizar a retenção de longo prazo. Cada vez que você revisa,
                o intervalo até a próxima revisão aumenta progressivamente:{" "}
                <span className="text-purple-300 font-semibold">
                  1 dia → 3 dias → 7 dias → 14 dias → 1 mês → 2 meses → 4 meses
                  → 1 ano
                </span>
                . Se você revisar atrasado, ajustamos automaticamente para
                reforçar a memorização. 🧠✨
              </p>
            </div>
          </div>
        </Card>

        {/* Grid principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ESQUERDA: Criar nova matéria */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-purple-500/30 rounded-2xl p-6 backdrop-blur shadow-lg shadow-purple-500/10 app-surface">
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-400" /> Nova Matéria
              </h2>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-300 font-semibold mb-2 block">
                    Nome da Matéria
                  </Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Farmacologia"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 font-semibold mb-2 block">
                    Área (opcional)
                  </Label>
                  <Input
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    placeholder="Ex: Clínica Médica"
                    className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <Label className="text-gray-300 font-semibold mb-2 block">
                    Vincular ao Ciclo (opcional)
                  </Label>
                  <select
                    value={newCycleSubject}
                    onChange={(e) => setNewCycleSubject(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-2.5"
                  >
                    <option value="">— Não vincular —</option>
                    {cycleSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-gray-300 font-semibold mb-2 block">
                    Modo de Revisão
                  </Label>
                  <select
                    value={newMode}
                    onChange={(e) => setNewMode(e.target.value)}
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-xl text-white px-4 py-2.5"
                  >
                    <option value="normal">📚 Normal (Longo Prazo)</option>
                    <option value="exam">🎯 Época de Prova</option>
                  </select>
                </div>

                {newMode === "exam" && (
                  <div>
                    <Label className="text-gray-300 font-semibold mb-2 flex items-center gap-2 block">
                      <Target className="w-4 h-4 text-pink-400" /> Data da Prova
                    </Label>
                    <Input
                      type="date"
                      value={newExamDate}
                      onChange={(e) => setNewExamDate(e.target.value)}
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                )}

                <Button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 font-bold py-3 shadow-lg"
                >
                  {creating ? "Adicionando..." : "➕ Adicionar Matéria"}
                </Button>
              </div>
            </div>

            {/* Próximas Revisões */}
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 app-surface">
              <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <CalIcon className="w-5 h-5 text-cyan-400" /> Próximas Revisões
              </h3>

              {upcoming.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-4">
                  Nenhuma revisão agendada
                </p>
              ) : (
                <div className="space-y-3">
                  {upcoming.slice(0, 5).map((rev) => {
                    const date = new Date(rev.scheduled_date);
                    const dateStr = date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    });
                    return (
                      <div
                        key={rev.id}
                        className="bg-slate-700/30 rounded-xl p-3 border border-slate-600 app-surface"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-semibold text-sm">
                              {rev.subject_name}
                            </div>
                            <div className="text-slate-400 text-xs flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              {dateStr} • Rev. {rev.review_number}
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCompleteReview(rev.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                          >
                            ✓
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Revisões Atrasadas */}
            {overdue.length > 0 && (
              <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 border border-red-500/30 rounded-2xl p-6 app-surface">
                <h3 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400" /> Atrasadas
                </h3>

                <div className="space-y-3">
                  {overdue.map((rev) => {
                    const date = new Date(rev.scheduled_date);
                    const dateStr = date.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    });
                    return (
                      <div
                        key={rev.id}
                        className="bg-red-900/20 rounded-xl p-3 border border-red-500/30"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-white font-semibold text-sm">
                              {rev.subject_name}
                            </div>
                            <div className="text-red-300 text-xs flex items-center gap-1 mt-1">
                              <AlertCircle className="w-3 h-3" />
                              {rev.days_late} dia(s) atrasado
                            </div>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleCompleteReview(rev.id)}
                            className="bg-red-600 hover:bg-red-500 text-xs"
                          >
                            Revisar
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* DIREITA: Lista de matérias */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 app-surface">
              <h2 className="text-white font-bold text-xl mb-6 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-purple-400" /> Minhas Matérias
              </h2>

              {subjects.length === 0 ? (
                <div className="text-center py-16">
                  <div className="text-6xl mb-4">📚</div>
                  <div className="text-slate-300 text-lg mb-2">
                    Nenhuma matéria cadastrada
                  </div>
                  <div className="text-slate-400 text-sm">
                    Adicione sua primeira matéria para começar!
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {subjects.map((subj) => {
                    const isEditing = editingId === subj.id;
                    const isStarted = !!subj.first_study_date;
                    const isExpanded = expandedSubject === subj.id;

                    return (
                      <Card
                        key={subj.id}
                        className="bg-gradient-to-br from-slate-900/80 to-slate-800/80 border-slate-700 hover:border-purple-500/30 rounded-2xl p-5 transition-all duration-300 app-surface"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div 
                            className="flex-1 cursor-pointer"
                            onClick={() => {
                              if (isExpanded) {
                                setExpandedSubject(null);
                                setSubjectSessions(null);
                              } else {
                                setExpandedSubject(subj.id);
                                loadSubjectSessions(subj.id);
                              }
                            }}
                          >
                            {!isEditing ? (
                              <>
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-white font-bold text-xl">
                                    {subj.name}
                                  </h3>
                                  {subj.mode === "exam" && (
                                    <span className="text-xs bg-pink-500/20 text-pink-300 px-2 py-1 rounded-lg border border-pink-500/30">
                                      🎯 Prova
                                    </span>
                                  )}
                                  {isStarted && (
                                    <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg border border-emerald-500/30">
                                      ✓ Iniciado
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-400 ml-auto">
                                    {isExpanded ? '🔼 Clique para recolher' : '👁️ Clique para ver revisões'}
                                  </span>
                                </div>

                                {subj.area && (
                                  <div className="text-slate-400 text-sm mb-2">
                                    📂 {subj.area}
                                  </div>
                                )}

                                {subj.exam_date && (
                                  <div className="text-purple-300 text-sm flex items-center gap-2">
                                    <Target className="w-4 h-4" />
                                    Prova:{" "}
                                    {new Date(subj.exam_date).toLocaleDateString(
                                      "pt-BR"
                                    )}
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="space-y-3">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="bg-slate-700 border-slate-600 text-white font-bold"
                                />
                                <Input
                                  value={editArea}
                                  onChange={(e) => setEditArea(e.target.value)}
                                  placeholder="Área (opcional)"
                                  className="bg-slate-700 border-slate-600 text-white"
                                />
                                <select
                                  value={editMode}
                                  onChange={(e) => setEditMode(e.target.value)}
                                  className="w-full bg-slate-700 border border-slate-600 rounded-xl text-white px-3 py-2 text-sm"
                                >
                                  <option value="normal">Normal</option>
                                  <option value="exam">Época de Prova</option>
                                </select>
                                {editMode === "exam" && (
                                  <Input
                                    type="date"
                                    value={editExamDate}
                                    onChange={(e) =>
                                      setEditExamDate(e.target.value)
                                    }
                                    className="bg-slate-700 border-slate-600 text-white"
                                  />
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            {!isEditing ? (
                              <>
                                {!isStarted && (
                                  <Button
                                    size="sm"
                                    onClick={() => handleStart(subj.id)}
                                    className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 font-semibold"
                                  >
                                    🚀 Iniciar
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEdit(subj);
                                  }}
                                  className="text-cyan-300 hover:text-white hover:bg-cyan-500/20"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(subj.id);
                                  }}
                                  className="text-red-300 hover:text-white hover:bg-red-500/20"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(subj.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setEditingId(null)}
                                  className="text-gray-300 hover:text-white"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Sessões expandidas */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-slate-700">
                            <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                              <CalIcon className="w-4 h-4 text-purple-400" />
                              Próximas Revisões
                            </h4>
                            
                            {subjectSessions === null ? (
                              <p className="text-gray-400 text-sm text-center py-4">Carregando...</p>
                            ) : subjectSessions.length === 0 ? (
                              <p className="text-gray-400 text-sm text-center py-4">
                                Nenhuma revisão agendada. Clique em "Iniciar" para começar!
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {subjectSessions.slice(0, 5).map((session) => {
                                  const date = new Date(session.scheduled_date);
                                  const dateStr = date.toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric"
                                  });
                                  const isPending = !session.completed;
                                  const isOverdue = isPending && new Date(session.scheduled_date) < new Date();

                                  return (
                                    <div
                                      key={session.id}
                                      className={`bg-slate-800/50 rounded-lg p-3 border ${ 
                                        isOverdue 
                                          ? 'border-red-500/30 bg-red-900/10' 
                                          : session.completed
                                            ? 'border-emerald-500/30 bg-emerald-900/10'
                                            : 'border-slate-600'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div>
                                          <div className="text-white text-sm font-medium">
                                            Revisão #{session.review_number}
                                          </div>
                                          <div className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                            <Clock className="w-3 h-3" />
                                            {dateStr}
                                            {isOverdue && <span className="text-red-400 ml-2">(Atrasada)</span>}
                                            {session.completed && <span className="text-emerald-400 ml-2">(✓ Completa)</span>}
                                          </div>
                                        </div>
                                        {isPending && (
                                          <Button
                                            size="sm"
                                            onClick={() => handleCompleteReview(session.id)}
                                            className={isOverdue 
                                              ? "bg-red-600 hover:bg-red-500 text-xs"
                                              : "bg-emerald-600 hover:bg-emerald-500 text-xs"
                                            }
                                          >
                                            Marcar
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                                {subjectSessions.length > 5 && (
                                  <p className="text-xs text-gray-500 text-center mt-2">
                                    ... e mais {subjectSessions.length - 5} revisões
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
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
