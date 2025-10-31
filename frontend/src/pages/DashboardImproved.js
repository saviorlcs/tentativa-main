import { useState, useEffect, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import Header from '../components/Header';
import { api } from "@/lib/api";
import { usePageTitle } from "../hooks/usePageTitle";
import { alarm } from "@/lib/alarm";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Componente de Item Arrastável
function SortableSubjectItem({ subject, isActive, onClick, onEdit, onDelete, progress }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subject.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-slate-800/60 border-2 rounded-xl p-4 transition-all duration-300 ${
        isActive
          ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
          : 'border-slate-700 hover:border-slate-600'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 transition-colors"
        >
          <GripVertical className="w-5 h-5" />
        </button>

        {/* Subject Content */}
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-4 h-4 rounded-full shadow-lg"
              style={{ backgroundColor: subject.color }}
            />
            <span className="font-semibold text-lg text-white">{subject.name}</span>
            <span className="text-sm text-gray-400 ml-auto">{formatTime(subject.time_goal)}</span>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${progress}%`,
                backgroundColor: subject.color,
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(subject);
            }}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
          >
            <Edit2 className="w-4 h-4 text-gray-300" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(subject.id);
            }}
            className="p-2 rounded-lg bg-slate-700/50 hover:bg-red-500/20 transition-colors"
          >
            <Trash2 className="w-4 h-4 text-gray-300 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
}

// Helpers geométricos para o mapa do ciclo
const deg2rad = (deg) => (deg * Math.PI) / 180;

const polar = (cx, cy, r, deg) => ({
  x: cx + r * Math.cos(deg2rad(deg)),
  y: cy + r * Math.sin(deg2rad(deg)),
});

const arcPath = (cx, cy, r, startDeg, endDeg) => {
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  let sweep = endDeg - startDeg;

  while (sweep < 0) sweep += 360;
  while (sweep > 360) sweep -= 360;

  const largeArcFlag = sweep > 180 ? 1 : 0;
  const sweepFlag = 1;

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
};

function DashboardImproved() {
  // Estados principais
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [settings, setSettings] = useState({ study_duration: 50, break_duration: 10 });
  const [loading, setLoading] = useState(true);

  // Estados do timer
  const [timeLeft, setTimeLeft] = useState(0); // em segundos
  const [isRunning, setIsRunning] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [currentPhase, setCurrentPhase] = useState('study'); // 'study' | 'short_break' | 'long_break'
  const [studyBlocksCompleted, setStudyBlocksCompleted] = useState(0); // contador para pausa longa

  // Estados de progresso (local - só salva no backend quando completar)
  const [localProgress, setLocalProgress] = useState({});
  const [stats, setStats] = useState(null);

  // Estados de UI
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#3B82F6', time_goal: 300 });
  const [activeId, setActiveId] = useState(null);

  const timerIntervalRef = useRef(null);

  usePageTitle(isRunning ? `${formatTime(timeLeft)} - ${currentPhase === 'study' ? currentSubject?.name || 'Estudo' : currentPhase === 'long_break' ? 'Pausa Longa' : 'Pausa Curta'}` : 'Dashboard');

  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Formatar tempo MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatMinutes = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Carregar dados do backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, statsRes, settingsRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/stats'),
          api.get('/settings')
        ]);

        const sortedSubjects = (subjectsRes.data || []).sort((a, b) => a.order - b.order);
        setSubjects(sortedSubjects);
        setStats(statsRes.data || {});

        if (settingsRes.data) {
          setSettings({
            study_duration: settingsRes.data.study_duration || 50,
            break_duration: settingsRes.data.break_duration || 10,
          });
          // Inicializar timer com duração de estudo
          setTimeLeft((settingsRes.data.study_duration || 50) * 60);
        }

        // Inicializar progresso local
        const initialProgress = {};
        sortedSubjects.forEach(subject => {
          const subjectStats = (statsRes.data?.subjects || []).find(s => s.id === subject.id);
          initialProgress[subject.id] = subjectStats?.studied_minutes || 0;
        });
        setLocalProgress(initialProgress);

        // Selecionar primeira matéria se nenhuma estiver selecionada
        if (!currentSubject && sortedSubjects.length > 0) {
          setCurrentSubject(sortedSubjects[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Timer completou
            handleBlockComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning]);

  // Quando completar um bloco (100%)
  const handleBlockComplete = async () => {
    setIsRunning(false);

    // Tocar alarme
    alarm();

    if (currentPhase === 'study') {
      // Bloco de estudo completado
      if (!currentSubject) return;

      try {
        // Salvar sessão completa no backend
        await api.post('/study/end', {
          session_id: sessionId,
          duration: settings.study_duration,
          skipped: false
        });

        // Atualizar progresso local
        setLocalProgress(prev => ({
          ...prev,
          [currentSubject.id]: (prev[currentSubject.id] || 0) + settings.study_duration
        }));

        // Recarregar stats
        const statsRes = await api.get('/stats');
        setStats(statsRes.data || {});

        // Incrementar contador de blocos de estudo
        const newCount = studyBlocksCompleted + 1;
        setStudyBlocksCompleted(newCount);

        toast.success(`Bloco de ${currentSubject.name} completo! 🎉`);

        // Determinar próxima fase: pausa curta ou longa?
        if (newCount % 4 === 0) {
          // A cada 4 blocos = pausa longa
          setCurrentPhase('long_break');
          setTimeLeft(settings.break_duration * 3 * 60); // Pausa longa = 3x a pausa curta
          toast.info('Hora da pausa longa! 🌟');
        } else {
          // Pausa curta
          setCurrentPhase('short_break');
          setTimeLeft(settings.break_duration * 60);
          toast.info('Hora da pausa curta! ☕');
        }

        setSessionId(null);
      } catch (error) {
        console.error('Erro ao salvar sessão:', error);
        toast.error('Erro ao salvar progresso');
      }
    } else {
      // Pausa completada - voltar para estudo
      toast.success(currentPhase === 'long_break' ? 'Pausa longa concluída!' : 'Pausa curta concluída!');
      setCurrentPhase('study');
      setTimeLeft(settings.study_duration * 60);
      toast.info('Pronto para estudar! 📚');
    }
  };

  // Iniciar/Pausar timer
  const toggleTimer = async () => {
    if (currentPhase === 'study' && !currentSubject) {
      toast.error('Selecione uma matéria para estudar');
      return;
    }

    if (!isRunning) {
      // Iniciar
      if (currentPhase === 'study') {
        // Iniciar nova sessão de estudo
        try {
          const response = await api.post('/study/start', { subject_id: currentSubject.id });
          setSessionId(response.data?.id || null);
        } catch (error) {
          console.error('Erro ao iniciar sessão:', error);
          toast.error('Erro ao iniciar sessão');
          return;
        }
      }
      // Para pausas, não precisa criar sessão
      setIsRunning(true);
    } else {
      // Pausar
      setIsRunning(false);
    }
  };

  // Pular bloco (não salva progresso, mas marca como completo visualmente)
  const skipBlock = async () => {
    if (currentPhase === 'study' && !currentSubject) {
      toast.error('Selecione uma matéria');
      return;
    }

    setIsRunning(false);

    if (currentPhase === 'study') {
      // Pular bloco de estudo
      try {
        // Salvar como pulado no backend (não conta para ranking)
        if (sessionId) {
          await api.post('/study/end', {
            session_id: sessionId,
            duration: settings.study_duration,
            skipped: true
          });
        }

        // Atualizar progresso local visualmente
        setLocalProgress(prev => ({
          ...prev,
          [currentSubject.id]: (prev[currentSubject.id] || 0) + settings.study_duration
        }));

        // Incrementar contador
        const newCount = studyBlocksCompleted + 1;
        setStudyBlocksCompleted(newCount);

        setSessionId(null);
        toast.info('Bloco de estudo pulado');

        // Ir para pausa
        if (newCount % 4 === 0) {
          setCurrentPhase('long_break');
          setTimeLeft(settings.break_duration * 3 * 60);
        } else {
          setCurrentPhase('short_break');
          setTimeLeft(settings.break_duration * 60);
        }
      } catch (error) {
        console.error('Erro ao pular bloco:', error);
        toast.error('Erro ao pular bloco');
      }
    } else {
      // Pular pausa
      setCurrentPhase('study');
      setTimeLeft(settings.study_duration * 60);
      toast.info('Pausa pulada - pronto para estudar!');
    }
  };

  // Voltar 1 bloco (apenas visual)
  const previousBlock = () => {
    if (!currentSubject) {
      toast.error('Selecione uma matéria');
      return;
    }

    if (isRunning) {
      toast.error('Pause o timer antes de voltar');
      return;
    }

    const currentProgress = localProgress[currentSubject.id] || 0;
    if (currentProgress < settings.study_duration) {
      toast.error('Não há blocos para voltar');
      return;
    }

    setLocalProgress(prev => ({
      ...prev,
      [currentSubject.id]: Math.max(0, currentProgress - settings.study_duration)
    }));

    toast.success('Voltou 1 bloco');
  };

  // Reset bloco atual
  const resetCurrentBlock = () => {
    setIsRunning(false);
    
    if (currentPhase === 'study') {
      setTimeLeft(settings.study_duration * 60);
    } else if (currentPhase === 'short_break') {
      setTimeLeft(settings.break_duration * 60);
    } else {
      setTimeLeft(settings.break_duration * 3 * 60);
    }
    
    setSessionId(null);
    toast.success('Bloco atual resetado');
  };

  // Adicionar nova matéria
  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error('Digite um nome para a matéria');
      return;
    }

    try {
      const response = await api.post('/subjects', {
        name: newSubject.name,
        color: newSubject.color,
        time_goal: newSubject.time_goal
      });

      const newSubj = response.data;
      setSubjects([...subjects, newSubj]);
      setLocalProgress(prev => ({ ...prev, [newSubj.id]: 0 }));
      setNewSubject({ name: '', color: '#3B82F6', time_goal: 300 });
      setShowAddSubject(false);
      toast.success('Matéria adicionada!');
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
      toast.error('Erro ao adicionar matéria');
    }
  };

  // Atualizar matéria
  const handleUpdateSubject = async (subjectId, updates) => {
    try {
      await api.patch(`/subjects/${subjectId}`, updates);
      setSubjects(subjects.map(s => s.id === subjectId ? { ...s, ...updates } : s));
      setShowEditSubject(null);
      toast.success('Matéria atualizada');
    } catch (error) {
      console.error('Erro ao atualizar matéria:', error);
      toast.error('Erro ao atualizar matéria');
    }
  };

  // Deletar matéria
  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta matéria?')) return;

    try {
      await api.delete(`/subjects/${subjectId}`);
      setSubjects(subjects.filter(s => s.id !== subjectId));
      if (currentSubject?.id === subjectId) {
        setCurrentSubject(subjects[0] || null);
      }
      toast.success('Matéria excluída');
    } catch (error) {
      console.error('Erro ao excluir matéria:', error);
      toast.error('Erro ao excluir matéria');
    }
  };

  // Drag & Drop handlers
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    const oldIndex = subjects.findIndex(s => s.id === active.id);
    const newIndex = subjects.findIndex(s => s.id === over.id);

    const newOrder = arrayMove(subjects, oldIndex, newIndex);
    setSubjects(newOrder);

    // Atualizar ordem no backend
    try {
      await api.post('/subjects/reorder', {
        order: newOrder.map(s => s.id)
      });
    } catch (error) {
      console.error('Erro ao reordenar matérias:', error);
      toast.error('Erro ao salvar nova ordem');
    }
  };

  // Cálculos de progresso
  const getSubjectProgress = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return 0;

    const completed = localProgress[subjectId] || 0;
    const goal = subject.time_goal || 1;
    return Math.min(100, (completed / goal) * 100);
  };

  const currentSubjectProgress = useMemo(() => {
    if (!currentSubject) return 0;
    return getSubjectProgress(currentSubject.id);
  }, [currentSubject, localProgress, subjects]);

  const cycleProgress = useMemo(() => {
    if (subjects.length === 0) return 0;

    const totalGoal = subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0);
    const totalCompleted = subjects.reduce((sum, s) => {
      return sum + (localProgress[s.id] || 0);
    }, 0);

    return totalGoal > 0 ? Math.min(100, (totalCompleted / totalGoal) * 100) : 0;
  }, [subjects, localProgress]);

  // Total estudado
  const totalStudied = useMemo(() => {
    return Object.values(localProgress).reduce((sum, val) => sum + val, 0);
  }, [localProgress]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  const activeSubject = subjects.find(s => s.id === activeId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Coluna Central - Timer (2 colunas) */}
          <div className="lg:col-span-2">
            <div className="rounded-3xl p-8 bg-slate-800/50 border border-slate-700/50 shadow-2xl backdrop-blur">
              
              {/* Avatar + Título */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white text-3xl font-bold mb-4 shadow-lg">
                  SL
                </div>
                <h1 className="text-4xl font-bold mb-2">
                  {currentPhase === 'study' ? 'Estudo' : currentPhase === 'long_break' ? 'Pausa Longa' : 'Pausa Curta'}
                </h1>
                {currentPhase === 'study' ? (
                  <>
                    <p className="text-xl text-purple-400 font-semibold mb-2">
                      {currentSubject?.name || 'Selecione uma matéria'}
                    </p>
                    <p className="text-sm text-gray-400">
                      {currentSubject ? 'Selecione uma matéria ao lado para começar' : 'Nenhuma matéria selecionada'}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    {currentPhase === 'long_break' 
                      ? '🌟 Relaxe e recarregue as energias!' 
                      : '☕ Aproveite para descansar um pouco!'}
                  </p>
                )}
                <div className="mt-3 inline-block px-4 py-1 rounded-full text-xs font-semibold" style={{
                  backgroundColor: currentPhase === 'study' ? 'rgba(34, 211, 238, 0.2)' : currentPhase === 'long_break' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                  color: currentPhase === 'study' ? '#22d3ee' : currentPhase === 'long_break' ? '#a855f7' : '#22c55e'
                }}>
                  {studyBlocksCompleted} blocos completados • Próxima pausa longa em {4 - (studyBlocksCompleted % 4)} blocos
                </div>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className={`text-9xl font-bold mb-2 tracking-tight font-mono transition-colors duration-300 ${
                  currentPhase === 'study' ? 'text-cyan-400' : currentPhase === 'long_break' ? 'text-purple-400' : 'text-green-400'
                }`}>
                  {formatTime(timeLeft)}
                </div>
                <p className="text-gray-400 text-lg">
                  {currentPhase === 'study' ? `${settings.study_duration} min` : currentPhase === 'long_break' ? `${settings.break_duration * 3} min` : `${settings.break_duration} min`}
                </p>
              </div>

              {/* Controles */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                <Button
                  onClick={toggleTimer}
                  className="h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-bold text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  data-testid="start-pause-btn"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Iniciar
                    </>
                  )}
                </Button>

                <Button
                  onClick={skipBlock}
                  disabled={currentPhase === 'study' && !currentSubject}
                  className="h-16 bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold rounded-2xl"
                  data-testid="skip-btn"
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  {currentPhase === 'study' ? 'Pular bloco' : 'Pular pausa'}
                </Button>

                <Button
                  onClick={previousBlock}
                  disabled={(currentPhase === 'study' && !currentSubject) || isRunning}
                  className="h-16 bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold rounded-2xl"
                  data-testid="previous-btn"
                >
                  <SkipBack className="w-5 h-5 mr-2" />
                  Bloco anterior
                </Button>

                <Button
                  onClick={resetCurrentBlock}
                  disabled={isRunning}
                  className="h-16 bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold rounded-2xl"
                  data-testid="reset-btn"
                >
                  <RotateCcw className="w-5 h-5 mr-2" />
                  Resetar
                </Button>
              </div>

              {/* Barras de Progresso */}
              <div className="space-y-6 bg-slate-900/30 rounded-2xl p-6">
                {/* Progresso do conteúdo atual */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Progresso do conteúdo atual</span>
                    <span className="text-cyan-400 font-bold">{currentSubjectProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500 rounded-full"
                      style={{ width: `${currentSubjectProgress}%` }}
                    />
                  </div>
                </div>

                {/* Progresso do ciclo */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300">Progresso do ciclo</span>
                    <span className="text-cyan-400 font-bold">{cycleProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-all duration-500 rounded-full"
                      style={{ width: `${cycleProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Mapa do Ciclo */}
          <div className="lg:col-span-1">
            <div className="rounded-3xl p-6 bg-slate-800/50 border border-slate-700/50 shadow-xl backdrop-blur">
              <h2 className="text-2xl font-bold mb-2 text-cyan-400">Mapa do Ciclo</h2>
              <p className="text-sm text-gray-400 mb-6">Distribuição interativa das matérias</p>

              {subjects.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-400 text-center">Adicione matérias para<br />visualizar o mapa</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* SVG do Mapa Circular */}
                  <svg width="280" height="280" viewBox="0 0 280 280" className="mb-6">
                    {/* Círculo de fundo */}
                    <circle
                      cx="140"
                      cy="140"
                      r="120"
                      fill="none"
                      stroke="rgba(255,255,255,0.05)"
                      strokeWidth="3"
                    />

                    {/* Renderizar arcos por matéria */}
                    {subjects.map((subject, index) => {
                      const totalGoal = subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0);
                      const percentage = totalGoal > 0 ? ((subject.time_goal || 0) / totalGoal) * 100 : 0;

                      // Calcular ângulos
                      let startDeg = 0;
                      for (let i = 0; i < index; i++) {
                        const prevPercentage = totalGoal > 0
                          ? ((subjects[i].time_goal || 0) / totalGoal) * 100
                          : 0;
                        startDeg += (prevPercentage / 100) * 360;
                      }
                      const endDeg = startDeg + (percentage / 100) * 360;

                      // Calcular progresso
                      const subjectProgress = getSubjectProgress(subject.id);
                      const progressEndDeg = startDeg + (percentage / 100) * 360 * (subjectProgress / 100);

                      const isSelected = currentSubject?.id === subject.id;

                      return (
                        <g key={subject.id}>
                          {/* Arco de fundo (planejado) */}
                          <path
                            d={arcPath(140, 140, 120, startDeg - 90, endDeg - 90)}
                            fill="none"
                            stroke={subject.color}
                            strokeWidth="26"
                            opacity="0.3"
                            className="cursor-pointer transition-opacity hover:opacity-50"
                            onClick={() => setCurrentSubject(subject)}
                          />

                          {/* Arco de progresso (estudado) */}
                          {subjectProgress > 0 && (
                            <path
                              d={arcPath(140, 140, 120, startDeg - 90, progressEndDeg - 90)}
                              fill="none"
                              stroke={subject.color}
                              strokeWidth="26"
                              opacity="1"
                              className="cursor-pointer drop-shadow-lg"
                              onClick={() => setCurrentSubject(subject)}
                            />
                          )}

                          {/* Highlight se selecionado */}
                          {isSelected && (
                            <path
                              d={arcPath(140, 140, 120, startDeg - 90, endDeg - 90)}
                              fill="none"
                              stroke="#fff"
                              strokeWidth="4"
                              opacity="0.6"
                              className="animate-pulse"
                            />
                          )}

                          {/* Texto do nome da matéria */}
                          {percentage > 8 && (
                            <text
                              x={polar(140, 140, 95, startDeg + (percentage / 100) * 360 / 2 - 90).x}
                              y={polar(140, 140, 95, startDeg + (percentage / 100) * 360 / 2 - 90).y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="12"
                              fontWeight="700"
                              className="drop-shadow pointer-events-none select-none"
                              transform={`rotate(${startDeg + (percentage / 100) * 360 / 2}, ${polar(140, 140, 95, startDeg + (percentage / 100) * 360 / 2 - 90).x}, ${polar(140, 140, 95, startDeg + (percentage / 100) * 360 / 2 - 90).y})`}
                            >
                              {subject.name.length > 10 ? subject.name.substring(0, 10) + '...' : subject.name}
                            </text>
                          )}
                        </g>
                      );
                    })}

                    {/* Círculo central */}
                    <circle
                      cx="140"
                      cy="140"
                      r="60"
                      fill="rgba(15, 23, 42, 0.95)"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="2"
                    />

                    {/* Texto central */}
                    <text
                      x="140"
                      y="130"
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.7)"
                      fontSize="14"
                      fontWeight="600"
                    >
                      MAPA DO
                    </text>
                    <text
                      x="140"
                      y="150"
                      textAnchor="middle"
                      fill="white"
                      fontSize="18"
                      fontWeight="bold"
                    >
                      CICLO
                    </text>
                    <text
                      x="140"
                      y="165"
                      textAnchor="middle"
                      fill="rgba(34, 211, 238, 1)"
                      fontSize="11"
                      fontWeight="600"
                    >
                      {currentSubject?.name.substring(0, 12) || ''}
                    </text>
                  </svg>

                  {/* Lista de Matérias do Ciclo */}
                  <div className="w-full">
                    <h3 className="text-lg font-bold mb-4 text-cyan-400">Matérias do Ciclo</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {subjects.map((subject, index) => (
                        <div
                          key={subject.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer ${
                            currentSubject?.id === subject.id
                              ? 'bg-cyan-500/20 border border-cyan-500/50'
                              : 'bg-slate-700/30 hover:bg-slate-700/50'
                          }`}
                          onClick={() => setCurrentSubject(subject)}
                        >
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <span className="text-sm font-medium flex-1">
                            {index + 1}. {subject.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatMinutes(subject.time_goal)} planejado
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Totais */}
                    <div className="mt-6 pt-4 border-t border-slate-700/50 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tempo total do ciclo:</span>
                        <span className="text-cyan-400 font-bold">
                          {formatMinutes(subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0))}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Tempo de estudo:</span>
                        <span className="text-cyan-400 font-bold">{formatMinutes(totalStudied)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Fila de Conteúdos (Embaixo) */}
        <div className="rounded-3xl p-6 bg-slate-800/50 border border-slate-700/50 shadow-xl backdrop-blur">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-cyan-400">Fila de conteúdos</h2>
            <Button
              onClick={() => setShowAddSubject(true)}
              className="bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-semibold rounded-xl px-6"
            >
              <Plus className="w-5 h-5 mr-2" />
              Adicionar
            </Button>
          </div>

          {subjects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-4">Nenhuma matéria adicionada ainda</p>
              <p className="text-gray-500 text-sm">Clique em "Adicionar" para criar sua primeira matéria</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={subjects.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(subject => (
                    <SortableSubjectItem
                      key={subject.id}
                      subject={subject}
                      isActive={currentSubject?.id === subject.id}
                      onClick={() => setCurrentSubject(subject)}
                      onEdit={setShowEditSubject}
                      onDelete={handleDeleteSubject}
                      progress={getSubjectProgress(subject.id)}
                    />
                  ))}
                </div>
              </SortableContext>

              <DragOverlay>
                {activeId && activeSubject ? (
                  <div className="bg-slate-800 border-2 border-cyan-400 rounded-xl p-4 shadow-2xl opacity-90">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: activeSubject.color }}
                      />
                      <span className="font-semibold text-white">{activeSubject.name}</span>
                    </div>
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      {/* Dialog Adicionar Matéria */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Nova Matéria</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="subject-name" className="text-gray-300">Nome da Matéria</Label>
              <Input
                id="subject-name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="Ex: Matemática"
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="subject-color" className="text-gray-300">Cor</Label>
              <div className="flex gap-2">
                <Input
                  id="subject-color"
                  type="color"
                  value={newSubject.color}
                  onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={newSubject.color}
                  onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject-goal" className="text-gray-300">Tempo Total (minutos)</Label>
              <Input
                id="subject-goal"
                type="number"
                value={newSubject.time_goal}
                onChange={(e) => setNewSubject({ ...newSubject, time_goal: parseInt(e.target.value) || 0 })}
                placeholder="300"
                min="0"
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                {Math.ceil(newSubject.time_goal / settings.study_duration)} blocos de estudo
              </p>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddSubject} className="flex-1 bg-cyan-600 hover:bg-cyan-700">
                Adicionar
              </Button>
              <Button onClick={() => setShowAddSubject(false)} variant="outline" className="border-slate-600 text-gray-300">
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Matéria */}
      {showEditSubject && (
        <Dialog open={!!showEditSubject} onOpenChange={() => setShowEditSubject(null)}>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Editar Matéria</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300">Nome</Label>
                <Input
                  defaultValue={showEditSubject.name}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, name: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-300">Cor</Label>
                <Input
                  type="color"
                  defaultValue={showEditSubject.color}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, color: e.target.value })}
                  className="w-20 h-10"
                />
              </div>

              <div>
                <Label className="text-gray-300">Meta Semanal (minutos)</Label>
                <Input
                  type="number"
                  defaultValue={showEditSubject.time_goal}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, time_goal: parseInt(e.target.value) || 0 })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <Button
                onClick={() => {
                  handleUpdateSubject(showEditSubject.id, {
                    name: showEditSubject.name,
                    color: showEditSubject.color,
                    time_goal: showEditSubject.time_goal
                  });
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

export default DashboardImproved;
