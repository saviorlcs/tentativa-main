import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, Edit2, Trash2, GripVertical, Trophy, Target } from 'lucide-react';
import Header from '../components/Header';
import useTabTimerTitle from "../hooks/useTabTimerTitle";
import { api } from "@/lib/api";
import { usePageTitle } from "../hooks/usePageTitle";
import { alarm } from "@/lib/alarm";
import { alarmSystem } from "@/lib/alarmNotification";
import { useBackgroundTimer } from "../hooks/useBackgroundTimer";
import { useApp } from "@/context/AppContext";
import ModernSealAvatar from "@/components/ModernSealAvatar";
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
import {
   DropdownMenu,
   DropdownMenuTrigger,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuLabel,
   DropdownMenuSeparator
 } from "../components/ui/dropdown-menu";
 import Footer from '../components/Footer';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Componente Bar para progresso - OTIMIZADO com memo
const Bar = memo(function Bar({ value, className = "", forceUpdateKey }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  
  return (
    <div className={`h-2 rounded-full bg-slate-700/50 overflow-hidden ${className}`} key={forceUpdateKey}>
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-[width] duration-500"
        style={{ width: `${v}%` }}
      />
    </div>
  );
});

// Componente de Item Arrastável com design moderno - OTIMIZADO com memo
const SortableSubjectItem = memo(function SortableSubjectItem({ subject, isActive, onClick, onEdit, onDelete, progress, forceUpdateKey }) {
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

  // OTIMIZAÇÃO: Log removido para melhor performance

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative backdrop-blur transition-all duration-300 cursor-grab ${
        isActive
          ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
          : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
      } rounded-xl p-3`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-200 transition-colors"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {/* Color Indicator */}
        <div
          className={`w-3 h-3 rounded-full transition-all duration-300 ${isActive ? 'scale-125' : ''}`}
          style={{
            backgroundColor: subject.color,
            boxShadow: isActive ? `0 0 12px ${subject.color}` : 'none'
          }}
        />

        {/* Subject Content */}
        <div className="flex-1 cursor-pointer" onClick={onClick}>
          <div className="flex items-center justify-between mb-2">
            <span className={`font-semibold text-sm ${isActive ? 'text-white' : 'text-gray-300'} transition-all`}>
              {subject.name}
            </span>
            <span className={`text-xs ${isActive ? 'text-cyan-300 font-semibold' : 'text-gray-400'}`}>
              {formatTime(subject.time_goal)}
            </span>
          </div>

          {/* Progress Bar - com key para forçar re-render */}
          <Bar value={progress} forceUpdateKey={forceUpdateKey} />
        </div>

        {/* Action Buttons - Sempre visíveis */}
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-cyan-400 hover:bg-cyan-500/10 hover:text-cyan-300"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            <Play className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:bg-slate-600/50 hover:text-gray-300"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(subject);
            }}
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-gray-400 hover:bg-red-500/10 hover:text-red-400"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(subject.id);
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

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

// Helper para gerar cor única diferente das existentes
const generateUniqueColor = (existingColors) => {
  const vibrantColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'
  ];

  const availableColors = vibrantColors.filter(c => !existingColors.includes(c));

  if (availableColors.length > 0) {
    return availableColors[Math.floor(Math.random() * availableColors.length)];
  }

  // Se todas as cores estão em uso, gera uma cor aleatória
  const randomColor = () => {
    const hue = Math.floor(Math.random() * 360);
    const saturation = 65 + Math.floor(Math.random() * 25); // 65-90%
    const lightness = 45 + Math.floor(Math.random() * 15);  // 45-60%
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  // Garante que a nova cor seja diferente das existentes
  let newColor;
  let attempts = 0;
  do {
    newColor = randomColor();
    attempts++;
  } while (existingColors.includes(newColor) && attempts < 50);

  return newColor;
};

// OTIMIZAÇÃO: Helper para logs condicionais (desliga em produção)
const DEBUG = process.env.NODE_ENV === 'development';
const debugLog = (...args) => DEBUG && console.log(...args);

function DashboardFixed() {
  const { me: user, refreshUser } = useApp();
  const [shopItems, setShopItems] = useState([]);

  // Estados principais
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [settings, setSettings] = useState({ 
    study_duration: 50, 
    break_duration: 10,
    long_break_duration: 30,
    long_break_interval: 4
  });
  const [loading, setLoading] = useState(true);

  // Estados do timer - USANDO BACKGROUND TIMER
  const backgroundTimer = useBackgroundTimer('dashboard-timer');
  const [sessionId, setSessionId] = useState(null);

  // Histórico de blocos (LINEAR)
  const [blockHistory, setBlockHistory] = useState([]);
  // Estrutura: [{ type: 'study' | 'short_break' | 'long_break', subjectId?, duration, timestamp }]

  // Estados de progresso (local - só salva no backend quando completar)
  const [localProgress, setLocalProgress] = useState({});
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0); // NOVO: trigger para forçar re-render
  const [stats, setStats] = useState(null);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false); // Flag para controlar carregamento

  // Estados de quests
  const [quests, setQuests] = useState([]);

  // Estados de UI
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(null);
  const [showResetSubjectDialog, setShowResetSubjectDialog] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#3B82F6', time_goal: 300 });
  const [activeId, setActiveId] = useState(null);
  const [isManualSubjectSelection, setIsManualSubjectSelection] = useState(false); // Rastreia se foi seleção manual


  const hasRequestedPermission = useRef(false);

  // ============= PERSISTÊNCIA NO LOCALSTORAGE =============
  const STORAGE_KEYS = {
    LOCAL_PROGRESS: 'pomociclo_local_progress',
    BLOCK_HISTORY: 'pomociclo_block_history',
    CURRENT_SUBJECT_ID: 'pomociclo_current_subject_id'
  };

  // Carregar dados do localStorage ao iniciar
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(STORAGE_KEYS.LOCAL_PROGRESS);
      const savedHistory = localStorage.getItem(STORAGE_KEYS.BLOCK_HISTORY);
      const savedSubjectId = localStorage.getItem(STORAGE_KEYS.CURRENT_SUBJECT_ID);

      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        console.log('[localStorage] Carregando progresso salvo:', parsedProgress);
        setLocalProgress(parsedProgress);
      }

      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('[localStorage] Carregando histórico salvo:', parsedHistory);
        setBlockHistory(parsedHistory);
      }

      if (savedSubjectId && subjects.length > 0) {
        const savedSubject = subjects.find(s => s.id === savedSubjectId);
        if (savedSubject) {
          console.log('[localStorage] Restaurando matéria atual:', savedSubject.name);
          setCurrentSubject(savedSubject);
        }
      }

      setIsLoadedFromStorage(true);
    } catch (error) {
      console.error('[localStorage] Erro ao carregar dados:', error);
      setIsLoadedFromStorage(true);
    }
  }, [subjects]);

  // Salvar localProgress no localStorage sempre que mudar
  useEffect(() => {
    if (!isLoadedFromStorage) return; // Só salva depois de carregar pela primeira vez
    
    try {
      console.log('[localStorage] Salvando progresso:', localProgress);
      localStorage.setItem(STORAGE_KEYS.LOCAL_PROGRESS, JSON.stringify(localProgress));
    } catch (error) {
      console.error('[localStorage] Erro ao salvar progresso:', error);
    }
  }, [localProgress, isLoadedFromStorage]);

  // Salvar blockHistory no localStorage sempre que mudar
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    
    try {
      console.log('[localStorage] Salvando histórico:', blockHistory);
      localStorage.setItem(STORAGE_KEYS.BLOCK_HISTORY, JSON.stringify(blockHistory));
    } catch (error) {
      console.error('[localStorage] Erro ao salvar histórico:', error);
    }
  }, [blockHistory, isLoadedFromStorage]);

  // Salvar currentSubject no localStorage sempre que mudar
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    
    if (currentSubject) {
      try {
        console.log('[localStorage] Salvando matéria atual:', currentSubject.id);
        localStorage.setItem(STORAGE_KEYS.CURRENT_SUBJECT_ID, currentSubject.id);
      } catch (error) {
        console.error('[localStorage] Erro ao salvar matéria atual:', error);
      }
    }
  }, [currentSubject, isLoadedFromStorage]);
  // ============= FIM DA PERSISTÊNCIA =============

  // Determinar fase atual baseado no histórico
  const currentPhase = useMemo(() => {
    if (blockHistory.length === 0) return 'study';
    const last = blockHistory[blockHistory.length - 1];

    if (last.type === 'study') {
      // Após estudo, vem pausa
      const studyCount = blockHistory.filter(b => b.type === 'study').length;
       return studyCount % settings.long_break_interval === 0 ? 'long_break' : 'short_break';
    } else {
      // Após pausa, vem estudo
      return 'study';
    }
  }, [blockHistory, settings.long_break_interval]);

  const phaseName = currentPhase === 'study' ? 'Estudo' : currentPhase === 'long_break' ? 'Pausa Longa' : 'Pausa Curta';
  const phaseEmoji = currentPhase === 'study' ? '📚' : currentPhase === 'long_break' ? '🌟' : '☕';

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

  usePageTitle(backgroundTimer.isRunning ? `${formatTime(backgroundTimer.timeLeft)} - ${phaseName}` : 'Dashboard');
  // Usar useTabTimerTitle para o título da aba
  useTabTimerTitle({
    seconds: backgroundTimer.timeLeft,
    running: backgroundTimer.isRunning,
    phase: currentPhase === 'study' ? 'study' : 'break',
    subject: currentSubject?.name || '',
    appName: 'Pomociclo',
    compact: true
  });
  // Sensores para drag & drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
// tempo planejado da matéria (em MINUTOS)
const getPlannedMinutes = useCallback((subject) => {
  if (!subject) return 0;
  // neste componente o campo é "time_goal" (minutos)
  return Number(subject.time_goal || 0);
}, []);

const isCurrentSubjectComplete = useCallback(() => {
  if (!currentSubject) return false;
  const planned = getPlannedMinutes(currentSubject);        // minutos
  if (!planned) return false;
  const studied = Math.max(0, (localProgress?.[currentSubject.id] || 0)); // minutos
  return studied >= planned;
}, [currentSubject, localProgress, getPlannedMinutes]);

const advanceToNextSubject = useCallback(() => {
  if (!subjects?.length || !currentSubject) return;
  const idx = subjects.findIndex(s => s.id === currentSubject.id);
  if (idx === -1) return;
  const next = subjects[(idx + 1) % subjects.length];

  // troca a matéria (mudança automática)
  setCurrentSubject(next);
  setIsManualSubjectSelection(false); // Marca como mudança automática
  setProgressUpdateTrigger(prev => prev + 1);

  backgroundTimer.pause();
  
  // CORREÇÃO: Não resetar o timer aqui, apenas trocar a matéria
  // O timer já está configurado corretamente pela fase atual (currentPhase)
  // que foi determinada pelo histórico de blocos
  
  // Apenas mostrar mensagem informativa
  toast.info(`Próxima matéria: ${next.name}`);
}, [subjects, currentSubject, backgroundTimer]);


// REMOVIDO: Este useEffect não é mais necessário pois a lógica de avanço
// automático está sendo tratada diretamente no handleBlockComplete
// quando um bloco de estudo é concluído. Isso evita avanços duplicados
// e permite que o usuário clique em matérias completas sem ser redirecionado.

  // Carregar dados do backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, statsRes, settingsRes, shopRes] = await Promise.all([
          api.get('/subjects'),
          api.get('/stats'),
          api.get('/settings'),
          api.get('/shop/all').catch(() => ({ data: { items: [] } }))
        ]);

        const sortedSubjects = (subjectsRes.data || []).sort((a, b) => a.order - b.order);
        setSubjects(sortedSubjects);
        setStats(statsRes.data || {});
        setShopItems(shopRes.data?.items || []);

        if (settingsRes.data) {
          setSettings({
            study_duration: settingsRes.data.study_duration || 50,
            break_duration: settingsRes.data.break_duration || 10,
            long_break_duration: settingsRes.data.long_break_duration || 30,
            long_break_interval: settingsRes.data.long_break_interval || 4
          });
          backgroundTimer.reset((settingsRes.data.study_duration || 50) * 60);
        }

        // MODIFICADO: Merge inteligente entre dados do backend e localStorage
        const savedProgress = localStorage.getItem(STORAGE_KEYS.LOCAL_PROGRESS);
        let mergedProgress = {};
        
        if (savedProgress) {
          // Se há dados salvos no localStorage, usar eles como base
          mergedProgress = JSON.parse(savedProgress);
          console.log('[fetchData] Usando progresso do localStorage como base');
        }
        
        // Garantir que todas as matérias tenham uma entrada, mesmo que seja 0
        sortedSubjects.forEach(subject => {
          if (!(subject.id in mergedProgress)) {
            // Se não há progresso salvo para essa matéria, usar dados do backend
            const subjectStats = (statsRes.data?.subjects || []).find(s => s.id === subject.id);
            mergedProgress[subject.id] = subjectStats?.studied_minutes || 0;
          }
        });
        
        setLocalProgress(mergedProgress);
        console.log('[fetchData] Progresso mesclado:', mergedProgress);

        // Selecionar matéria: preferir a salva no localStorage, senão primeira da lista
        const savedSubjectId = localStorage.getItem(STORAGE_KEYS.CURRENT_SUBJECT_ID);
        const savedSubject = sortedSubjects.find(s => s.id === savedSubjectId);
        
        if (!currentSubject) {
          if (savedSubject) {
            setCurrentSubject(savedSubject);
            console.log('[fetchData] Restaurando matéria salva:', savedSubject.name);
          } else if (sortedSubjects.length > 0) {
            setCurrentSubject(sortedSubjects[0]);
            console.log('[fetchData] Selecionando primeira matéria:', sortedSubjects[0].name);
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
        setLoading(false);
      }
    };

    fetchData();
    refreshUser(); // Atualiza dados do usuário
  }, []);

  // Solicitar permissão de notificação ao montar
  useEffect(() => {
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true;
      alarmSystem.requestPermission().then(granted => {
        if (granted) {
          console.log('✓ Permissão de notificação concedida');
        } else {
          console.log('✗ Permissão de notificação negada');
        }
      });
    }
  }, []);

// Monitor de mudanças no localProgress para debug
  useEffect(() => {
    debugLog('[useEffect] localProgress alterado:', localProgress);
    debugLog('[useEffect] currentSubject:', currentSubject);
    if (currentSubject) {
      debugLog('[useEffect] progresso da matéria atual:', localProgress[currentSubject.id]);
    }
  }, [localProgress, currentSubject]);

  // Configurar callback de conclusão do timer
  // Antes: useEffect(() => { backgroundTimer.onComplete(handleBlockComplete); }, [...deps])

const handleBlockCompleteRef = useRef(null);

// Quando completar um bloco (100%)
const handleBlockComplete = useCallback(async () => {
  console.log('[handleBlockComplete] iniciando...', { currentPhase, currentSubject });
  backgroundTimer.pause();

  await alarmSystem.trigger(
    '⏰ Timer Completo!',
    currentPhase === 'study' ? 'Bloco de estudo completo!' : 'Pausa completa!'
  );

  // monta o bloco concluído (minutos)
  // IMPORTANTE: Para pausa longa, no TIMER mostra 30min mas na BARRA conta só 10min
  const concludedMinutesTimer = currentPhase === 'study'
    ? (settings?.study_duration || 50)
    : (currentPhase === 'long_break'
        ? (settings?.long_break_duration || 30)
        : (settings?.break_duration || 10));

  // Para a barra: pausas longas contam como pausas curtas (10min)
  const concludedMinutesProgress = currentPhase === 'study'
    ? (settings?.study_duration || 50)
    : (settings?.break_duration || 10); // Ambas pausas contam como 10min na barra

  const newBlock = {
      type: currentPhase,
      timestamp: new Date().toISOString(),
      duration: concludedMinutesTimer, // Duração real no timer
      progressDuration: concludedMinutesProgress // Duração para progresso
    };

  if (currentPhase === 'study' && currentSubject) {
    newBlock.subjectId = currentSubject.id;

    // 1) OTIMISTA: sobe a barra já (COM pausas incluídas)
    const goal = Number(currentSubject.time_goal || 0) || Infinity;
    updateProgress(currentSubject.id, concludedMinutesProgress, goal);

    // 2) dispara API sem travar a UI
    try {
      console.log('[handleBlockComplete] Enviando para API:', { session_id: sessionId, duration: concludedMinutesTimer, skipped: false });
      
      const resp = await api.post('/study/end', {
        session_id: sessionId,
        duration: concludedMinutesTimer,
        skipped: false
      });
      
      console.log('[handleBlockComplete] Resposta da API:', resp.data);
      setSessionId(null);
      
      // Atualiza stats e processa XP/coins
      const freshStats = await api.get('/stats');
      setStats(freshStats.data || {});
      
      // SEMPRE mostra ganhos de XP e coins (mesmo que seja 0)
      const coinsEarned = resp.data?.coins_earned || 0;
      const xpEarned = resp.data?.xp_earned || 0;
      
      if (coinsEarned > 0 || xpEarned > 0) {
        toast.success(`✅ Bloco de ${currentSubject.name} completo!\n💰 +${coinsEarned} coins\n⭐ +${xpEarned} XP`, { duration: 5000 });
      } else {
        toast.warning(`⚠️ Bloco completo mas nenhuma recompensa foi recebida!\n💰 Coins: ${coinsEarned}\n⭐ XP: ${xpEarned}`, { duration: 5000 });
      }
      
      // Atualiza user data para refletir XP/coins
      refreshUser();
    } catch (error) {
      console.error('❌ [handleBlockComplete] Erro ao salvar sessão:', error);
      console.error('Detalhes do erro:', error.response?.data || error.message);
      toast.error(`❌ Erro ao salvar progresso!\nVerifique o console para detalhes.\nProgresso local mantido.`, { duration: 5000 });
    }
  } else {
    // PAUSAS TAMBÉM CONTAM NA BARRA
    if (currentSubject) {
      const goal = Number(currentSubject.time_goal || 0) || Infinity;
      updateProgress(currentSubject.id, concludedMinutesProgress, goal);
      newBlock.subjectId = currentSubject.id;
    }
    
    toast.success(`${currentPhase === 'long_break' ? 'Pausa Longa' : currentPhase === 'short_break' ? 'Pausa Curta' : 'Pausa'} concluída!`);
  }

  // 3) registra no histórico (sempre pelo set funcional)
  setBlockHistory(prev => [...prev, newBlock]);

  // 4) Verificar se matéria completou e deve mudar automaticamente
  if (currentSubject && currentPhase === 'study') {
    const currentProgress = localProgress[currentSubject.id] || 0;
    const updatedProgress = currentProgress + concludedMinutesProgress;
    const subjectGoal = currentSubject.time_goal || 0;
    
    // Se completou a matéria AO TERMINAR UM BLOCO DE ESTUDO
    if (updatedProgress >= subjectGoal) {
      const currentIndex = subjects.findIndex(s => s.id === currentSubject.id);
      
      // Verifica se há próxima matéria
      if (currentIndex < subjects.length - 1) {
        const nextSubject = subjects[currentIndex + 1];
        setCurrentSubject(nextSubject);
        setIsManualSubjectSelection(false); // Marca como mudança automática
        toast.success(`✅ ${currentSubject.name} completa! Mudando para: ${nextSubject.name}`);
      } else {
        // Se era a última matéria, mantém nela mas marca como manual
        // para que o usuário possa voltar blocos se quiser
        setIsManualSubjectSelection(true);
        toast.success('🎉 Parabéns! Você completou todo o ciclo de estudos!', { duration: 5000 });
      }
    }
  }

  // 5) prepara próxima fase/tempo - CORRIGIDO
  // define a próxima fase e tempo
  const studyCountSoFar = (blockHistory.filter(b => b.type === 'study').length) + (currentPhase === 'study' ? 1 : 0);
  const nextPhase = currentPhase === 'study'
    ? (studyCountSoFar % settings.long_break_interval === 0 ? 'long_break' : 'short_break')
    : 'study';

  // CORRIGIDO: usar os valores corretos de settings para cada fase
  const nextDuration = nextPhase === 'study'
    ? (settings?.study_duration || 50)
    : (nextPhase === 'long_break' ? (settings?.long_break_duration || 30) : (settings?.break_duration || 10));

  backgroundTimer.reset(nextDuration * 60);
  toast.info(nextPhase !== 'study' ? (nextPhase === 'long_break' ? 'Próximo: Pausa Longa 🌟' : 'Próximo: Pausa Curta ☕') : 'Próximo: Estudo 📚');
}, [currentPhase, currentSubject, settings, sessionId, blockHistory, backgroundTimer, localProgress, subjects, refreshUser]);

handleBlockCompleteRef.current = handleBlockComplete;

useEffect(() => {
  if (!backgroundTimer || typeof backgroundTimer.onComplete !== "function") return;
  // assume que onComplete retorna um "off"; se não retornar, o cleanup abaixo só ignora
  const off = backgroundTimer.onComplete(() => {
    // sempre usa a versão mais recente de handleBlockComplete
    if (handleBlockCompleteRef.current) handleBlockCompleteRef.current();
  });
  return () => { try { off && off(); } catch (_) {} };
}, [backgroundTimer]);


  // Iniciar/Pausar timer
  // --- Substitua a função toggleTimer por este bloco ---
const toggleTimer = async () => {
  console.log('[toggleTimer] chamado', { currentPhase, currentSubject, backgroundTimer });

  if (currentPhase === 'study' && !currentSubject) {
    toast.error('Selecione uma matéria para estudar');
    console.log('[toggleTimer] sem matéria selecionada — abortando');
    return;
  }

  // CORREÇÃO: Impedir iniciar timer se a matéria estiver completa
  if (currentPhase === 'study' && isCurrentSubjectComplete()) {
    toast.info('Esta matéria já está completa! Use "Voltar" para reverter blocos ou "Reset" para recomeçar.');
    return;
  }

  try {
    if (backgroundTimer && backgroundTimer.isPaused) {
      console.log('[toggleTimer] resumindo timer (paused -> resume)');
      backgroundTimer.resume();
      return;
    }

    if (!backgroundTimer || typeof backgroundTimer.start !== 'function') {
      console.error('[toggleTimer] backgroundTimer inválido ou sem método start', backgroundTimer);
      toast.error('Erro interno: temporizador indisponível');
      return;
    }

    if (!backgroundTimer.isRunning) {
      // se timeLeft for falsy, fallback para settings.study_duration * 60
      const fallbackSecs = (settings && settings.study_duration) ? settings.study_duration * 60 : 25 * 60;
      const secsToStart = (typeof backgroundTimer.timeLeft === 'number' && backgroundTimer.timeLeft > 0)
        ? backgroundTimer.timeLeft
        : fallbackSecs;

      console.log('[toggleTimer] iniciando timer', { secsToStart, backgroundTimerTimeLeft: backgroundTimer.timeLeft, fallbackSecs });

      // se for um novo bloco de estudo e timeLeft corresponde ao padrão, criar sessão
      if (currentPhase === 'study' && secsToStart === (settings?.study_duration || 25) * 60) {
        // CORREÇÃO: Ao iniciar um novo bloco de estudo, resetar a flag de seleção manual
        // para que quando completar, possa avançar automaticamente
        setIsManualSubjectSelection(false);
        
        try {
          console.log('[toggleTimer] 📝 Criando sessão de estudo para:', currentSubject.name);
          const response = await api.post('/study/start', { subject_id: currentSubject.id });
          const newSessionId = response.data?.id || null;
          setSessionId(newSessionId);
          console.log('[toggleTimer] ✅ Sessão criada com sucesso! Session ID:', newSessionId);
          console.log('[toggleTimer] Dados completos da resposta:', response.data);
          
          if (!newSessionId) {
            console.warn('⚠️ [toggleTimer] ATENÇÃO: Session ID veio vazio/null! Recompensas NÃO serão concedidas!');
            toast.warning('⚠️ Sessão criada sem ID. Você pode não receber recompensas!');
          }
        } catch (error) {
          console.error('❌ [toggleTimer] ERRO ao criar sessão:', error);
          console.error('Detalhes do erro:', error.response?.data || error.message);
          toast.error('❌ Erro ao criar sessão de estudo! Você NÃO receberá coins/XP neste bloco!');
          setSessionId(null);
          // IMPORTANTE: Agora mostramos o erro claramente ao usuário
          // return; // Comentado para permitir funcionamento sem backend (mas sem recompensas)
        }
      }

      // garante que passamos um número válido para start()
      backgroundTimer.start(secsToStart);
      console.log('[toggleTimer] backgroundTimer.start() chamado');
      return;
    }

    // se já estiver rodando -> pausar
    console.log('[toggleTimer] pausando timer (isRunning true)');
    backgroundTimer.pause();

  } catch (err) {
    console.error('[toggleTimer] erro inesperado', err);
    toast.error('Erro ao controlar o timer (veja console)');
  }
};
// --- fim do bloco ---


  
// helper (cole perto dos outros helpers)
const getPlannedSeconds = useCallback((subject) => {
  if (!subject) return 0;
  if (typeof subject.plannedSeconds === 'number') return subject.plannedSeconds;
  if (typeof subject.planned_minutes === 'number') return subject.planned_minutes * 60;
  if (typeof subject.plannedHours === 'number') return subject.plannedHours * 3600;
  return 0;
}, []);

// Atualiza progresso local com clamp e novo objeto (força re-render) - CORRIGIDO
const updateProgress = useCallback((subjectId, deltaMin, goalMin) => {
  console.log('[updateProgress] chamado:', { subjectId, deltaMin, goalMin });
  
  setLocalProgress(prev => {
    const oldMin = Math.max(0, Number(prev?.[subjectId] || 0));
    const nextMin = Math.max(0, Math.min(
      (goalMin ?? Infinity),
      oldMin + Number(deltaMin || 0)
    ));
    
    console.log('[updateProgress] atualizando:', { oldMin, deltaMin, nextMin });
    
    return { ...prev, [subjectId]: nextMin };
  });
  
  // NOVO: Força re-render dos componentes
  setProgressUpdateTrigger(prev => prev + 1);
}, []);

// Resetar o bloco atual: só reinicia o tempo do bloco da fase corrente
const resetCurrentBlock = useCallback(() => {
  backgroundTimer.pause();
  const d = currentPhase === 'study'
    ? settings.study_duration
    : (currentPhase === 'long_break' ? settings.long_break_duration: settings.break_duration);
  backgroundTimer.reset(d * 60);
  toast.success('Bloco atual resetado');
}, [currentPhase, settings, backgroundTimer]);

// Voltar 1 bloco no histórico (e ajustar barra se foi estudo "real") - CORRIGIDO
const previousBlock = useCallback(() => {
  if (blockHistory.length === 0) {
    toast.info('Não há bloco para voltar');
    return;
  }

  const last = blockHistory[blockHistory.length - 1];
  console.log('[previousBlock] voltando bloco:', last);

  // CORREÇÃO: Verificar se o último bloco pertence à matéria atual
  // Isso impede que o botão "Voltar" afete matérias anteriores quando
  // o usuário está começando uma nova matéria (Bloco 0)
  if (currentSubject && last?.subjectId && last.subjectId !== currentSubject.id) {
    toast.error('Não é possível voltar para blocos de matérias anteriores');
    return;
  }

  // duração confiável em minutos
  const defaultStudyMin = settings?.study_duration || 50;
  const defaultBreakMin = settings?.break_duration || 10;
  const minutesToUndoTimer =
    typeof last?.duration === 'number'
      ? last.duration
      : (last?.type === 'study'
          ? defaultStudyMin
          : (last.type === 'long_break' ? settings.long_break_duration : settings.break_duration));

  // Para a barra: pausas longas sempre contam como pausas curtas (10min)
  const minutesToUndoProgress = 
    typeof last?.progressDuration === 'number'
      ? last.progressDuration
      : (last?.type === 'study'
          ? defaultStudyMin
          : defaultBreakMin); // Ambas pausas = 10min na barra

  // 1) Se foi ESTUDO ou PAUSA, desfaz progresso (pausas também contam!)
  if (last?.subjectId) {
    const subj = subjects.find(s => s.id === last.subjectId);
    const goal = Number(subj?.time_goal || 0) || Infinity;
    updateProgress(last.subjectId, -minutesToUndoProgress, goal);
  }

  // 2) remove do histórico
  setBlockHistory(prev => prev.slice(0, -1));

  // 3) carrega o tempo do bloco que “voltou”
  backgroundTimer.pause();
  backgroundTimer.reset(minutesToUndoTimer * 60);
  setSessionId(null);

  // CORREÇÃO: Quando voltar um bloco, marcar como seleção manual
  // para que a matéria não avance automaticamente mesmo se chegar a 100% novamente
  setIsManualSubjectSelection(true);
  
  toast.success('Voltou 1 bloco');

  // 4) força repaint das barras/lista
  setProgressUpdateTrigger(prev => prev + 1);
}, [blockHistory, subjects, settings, backgroundTimer, updateProgress, currentSubject]);





// substitua seu handler de "pular" por este: - CORRIGIDO
const skipBlock = useCallback(() => {
  if (currentPhase === 'study' && !currentSubject) {
    toast.error('Selecione uma matéria');
    return;
  }

  backgroundTimer.pause();

  const studyMin = settings?.study_duration || 50;
  const breakMin = settings?.break_duration || 10;

  if (currentPhase === 'study') {
    // Se a matéria JÁ estiver 100%, troca de matéria e prepara novo estudo
    if (isCurrentSubjectComplete()) {
      advanceToNextSubject();
      setProgressUpdateTrigger(p => p + 1);
      return;
    }

    // Conta como estudo “pulando” (soma minutos na barra)
    const goal = Number(currentSubject?.time_goal || 0) || Infinity;
    updateProgress(currentSubject.id, studyMin, goal);

    // registra no histórico como study (skipped = true) para que o previous desfaça
    const newBlock = {
      type: 'study',
      timestamp: new Date().toISOString(),
      duration: currentPhase === 'study'
      ? settings.study_duration
      : (currentPhase === 'long_break' ? settings.long_break_duration : settings.break_duration),
    skipped: true,
    ...(currentPhase === 'study' && currentSubject ? { subjectId: currentSubject.id } : {})
  };
    setBlockHistory(prev => [...prev, newBlock]);

    // próxima fase: pausa curta/longa conforme contagem
    const studyCountSoFar = blockHistory.filter(b => b.type === 'study').length + 1; // +1 deste skip
    const nextPhase = (studyCountSoFar % 4 === 0) ? 'long_break' : 'short_break';
    const nextDuration = nextPhase === 'long_break' ? breakMin * 3 : breakMin;

    backgroundTimer.reset(nextDuration * 60);
    toast.info('Bloco de estudo pulado (contabilizado).');

  } else {
    // Pulando pausa: AGORA CONTA NA BARRA (pausa longa conta como curta)
    const pauseDurationTimer = currentPhase === 'long_break' ? breakMin * 3 : breakMin;
    const pauseDurationProgress = breakMin; // Ambas pausas = 10min na barra
    
    const newBlock = {
      type: currentPhase,
      timestamp: new Date().toISOString(),
      duration: pauseDurationTimer, // Duração real
      progressDuration: pauseDurationProgress, // Duração para progresso
      skipped: true,
      ...(currentSubject ? { subjectId: currentSubject.id } : {})
    };
    setBlockHistory(prev => [...prev, newBlock]);

    // Conta a pausa na barra da matéria atual
    if (currentSubject) {
      const goal = Number(currentSubject.time_goal || 0) || Infinity;
      updateProgress(currentSubject.id, pauseDurationProgress, goal);
    }

    // próxima fase: estudo
    backgroundTimer.reset((settings?.study_duration || 50) * 60);
    toast.info('Pausa pulada (contabilizada).');
  }

  // força repaint de tudo
  setProgressUpdateTrigger(prev => prev + 1);
}, [currentPhase, currentSubject, settings, blockHistory, backgroundTimer, isCurrentSubjectComplete, advanceToNextSubject, updateProgress]);





   

// Abrir dialog de confirmação para resetar matéria
const openResetSubjectDialog = () => {
  if (!currentSubject) { 
    toast.error("Nenhuma matéria selecionada"); 
    return; 
  }
  setShowResetSubjectDialog(true);
};

// Resetar matéria (chamado após confirmação do dialog)
const resetCurrentSubject = (resetLongBreakCounter = false) => {
  if (!currentSubject) { toast.error("Nenhuma matéria selecionada"); return; }
  const sid = currentSubject.id;

  // Limpar APENAS progresso e histórico da matéria atual (não de outras!)
  setLocalProgress(prev => ({ ...prev, [sid]: 0 }));
  setBlockHistory(prev => prev.filter(b => b.subjectId !== sid));
  backgroundTimer.pause();
  setSessionId(null);
  
  // CORREÇÃO: Se optou por resetar a contagem de blocos até pausa longa
  if (resetLongBreakCounter) {
    // Remove APENAS os blocos de estudo da matéria atual
    // Mantém blocos de outras matérias intactos!
    setBlockHistory(prev => prev.filter(b => {
      // Mantém todos os blocos que NÃO são de estudo da matéria atual
      return !(b.type === 'study' && b.subjectId === sid);
    }));
    console.log('[resetCurrentSubject] Contagem de blocos até pausa longa resetada (apenas da matéria atual)');
  }
  
  // NOVO: Resetar timer para bloco de ESTUDOS
  const studyDuration = settings?.study_duration || 50;
  backgroundTimer.reset(studyDuration * 60);
  console.log('[resetCurrentSubject] Timer resetado para bloco de estudos:', studyDuration, 'min');
  
  // CORREÇÃO: Salvar alterações no localStorage mantendo outras matérias
  try {
    const currentProgress = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOCAL_PROGRESS) || '{}');
    currentProgress[sid] = 0;
    localStorage.setItem(STORAGE_KEYS.LOCAL_PROGRESS, JSON.stringify(currentProgress));
    
    const currentHistory = JSON.parse(localStorage.getItem(STORAGE_KEYS.BLOCK_HISTORY) || '[]');
    const filteredHistory = currentHistory.filter(b => b.subjectId !== sid);
    localStorage.setItem(STORAGE_KEYS.BLOCK_HISTORY, JSON.stringify(filteredHistory));
  } catch (error) {
    console.error('[localStorage] Erro ao limpar matéria:', error);
  }
  
  const message = resetLongBreakCounter 
    ? "Matéria e contagem de pausa longa resetadas!" 
    : "Matéria resetada (contagem de pausa longa mantida)";
  toast.success(message);
  
  // Fechar dialog
  setShowResetSubjectDialog(false);
  
  // NOVO: Força re-render
  setProgressUpdateTrigger(prev => prev + 1);
};

const resetCycle = () => {
  backgroundTimer.pause();
  setSessionId(null);
  setBlockHistory([]);
  setLocalProgress({});
  
  // MODIFICADO: Sempre resetar para bloco de ESTUDOS
  const studyDuration = settings?.study_duration || 50;
  backgroundTimer.reset(studyDuration * 60);
  console.log('[resetCycle] Timer resetado para bloco de estudos:', studyDuration, 'min');
  
  // NOVO: Limpar tudo do localStorage
  try {
    localStorage.removeItem(STORAGE_KEYS.LOCAL_PROGRESS);
    localStorage.removeItem(STORAGE_KEYS.BLOCK_HISTORY);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SUBJECT_ID);
  } catch (error) {
    console.error('[localStorage] Erro ao limpar ciclo:', error);
  }
  
  toast.success("Ciclo resetado - Timer ajustado para estudo");
  
  // NOVO: Força re-render
  setProgressUpdateTrigger(prev => prev + 1);
};



  // Adicionar nova matéria
  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error('Digite um nome para a matéria');
      return;
    }

    try {
      // Gera cor única diferente das existentes
      const existingColors = subjects.map(s => s.color);
      const uniqueColor = generateUniqueColor(existingColors);
      
      const response = await api.post('/subjects', {
        name: newSubject.name,
        color: uniqueColor,
        time_goal: newSubject.time_goal
      });

      const newSubj = response.data;
      setSubjects([...subjects, newSubj]);
      setLocalProgress(prev => ({ ...prev, [newSubj.id]: 0 }));
      
      // Reset com nova cor única para próxima matéria
      const nextColor = generateUniqueColor([...existingColors, uniqueColor]);
      setNewSubject({ name: '', color: nextColor, time_goal: 300 });
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

    try {
      await api.post('/subjects/reorder', {
        order: newOrder.map(s => s.id)
      });
    } catch (error) {
      console.error('Erro ao reordenar matérias:', error);
      toast.error('Erro ao salvar nova ordem');
    }
  };

   // Cálculos de progresso - SEM MEMO para garantir recálculo sempre
   const getSubjectProgress = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) {
      console.log('[getSubjectProgress] matéria não encontrada:', subjectId);
      return 0;
    }

    const completed = localProgress[subjectId] || 0;
    const goal = subject.time_goal || 1;
    const progress = Math.min(100, (completed / goal) * 100);
    
    console.log('[getSubjectProgress]', { subjectId, completed, goal, progress, localProgress });
    return progress;
  };

  const currentSubjectProgress = (() => {
    if (!currentSubject) return 0;
    const progress = getSubjectProgress(currentSubject.id);
    console.log('[currentSubjectProgress]', { currentSubjectId: currentSubject.id, progress });
    return progress;
  })();

  const cycleProgress = (() => {
    if (subjects.length === 0) return 0;

    const totalGoal = subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0);
    const totalCompleted = subjects.reduce((sum, s) => {
      return sum + (localProgress[s.id] || 0);
    }, 0);

    const progress = totalGoal > 0 ? Math.min(100, (totalCompleted / totalGoal) * 100) : 0;
    console.log('[cycleProgress]', { totalGoal, totalCompleted, progress });
    return progress;
  })();

  const totalStudied = useMemo(() => {
   // soma estudo + short_break + long_break
   return blockHistory.reduce((sum, b) => sum + (b?.duration || 0), 0);
 }, [blockHistory]);

  const studyBlocksCount = blockHistory.filter(b => b.type === 'study').length;
  const nextLongBreakIn = 4 - (studyBlocksCount % 4);

  // Calcular tempo total do ciclo incluindo pausas longas
  const totalCycleTimeWithBreaks = useMemo(() => {
    // Tempo total de estudo planejado
    const totalStudyTime = subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0);
    
    // Calcular número total de blocos de estudo
    const totalStudyBlocks = subjects.reduce((sum, s) => {
      return sum + Math.ceil((s.time_goal || 0) / (settings?.study_duration || 50));
    }, 0);
    
    // Calcular quantas pausas longas haverá
    const longBreakInterval = settings?.long_break_interval || 4;
    const numberOfLongBreaks = Math.floor(totalStudyBlocks / longBreakInterval);
    
    // Tempo total de pausas longas
    const totalLongBreaksTime = numberOfLongBreaks * (settings?.long_break_duration || 30);
    
    return totalStudyTime + totalLongBreaksTime;
  }, [subjects, settings]);

  // --- Sistema de Quests ---
  const minutesStudiedSoFar = useMemo(() => {
    return (stats?.subjects || []).reduce((s, x) => s + (x.time_studied || 0), 0);
  }, [stats]);

  // Matéria menos estudada
  const lowestSubjectInfo = useMemo(() => {
    return subjects.reduce((acc, subj) => {
      const st = (stats?.subjects || []).find(ss => ss.id === subj.id) || {};
      const studied = st.time_studied || 0;
      if (!acc || studied < acc.studied) return { subject: subj, studied };
      return acc;
    }, null);
  }, [subjects, stats]);

  // Gerar quest com recompensa
  const genQuest = (key, title, target, progress, difficulty = "medium") => {
    const diffMultMap = { easy: 0.8, medium: 1, hard: 1.5 };
    const diffMult = diffMultMap[difficulty] ?? 1;

    const baseCoins = Math.ceil(((target ?? 60) / 5));
    const coins = Math.max(5, Math.round(baseCoins * diffMult));
    const xp = coins * 10;

    return {
      id: `local-${key}`,
      title,
      target,
      progress,
      coins_reward: coins,
      xp_reward: xp,
      completed: progress >= (target ?? 0),
      _difficulty: difficulty,
    };
  };

  const fourQuests = useMemo(() => {
    const auto = [];

    // 1) completar 1 ciclo
    auto.push(
      genQuest(
        "complete-cycle",
        "Completar 1 ciclo",
        1,
        (stats?.cycle_progress ?? 0) >= 100 ? 1 : 0,
        "medium"
      )
    );

    // 2) estudar 300 min na semana
    auto.push(
      genQuest("study-300", "Estudar 300 min na semana", 300, minutesStudiedSoFar, "medium")
    );

    // 3) focar na Matéria menos estudada (se existir)
    if (lowestSubjectInfo?.subject) {
      auto.push(
        genQuest(
          "focus-subject",
          `Estudar ${lowestSubjectInfo.subject.name} por 120 min`,
          120,
          lowestSubjectInfo.studied,
          "hard"
        )
      );
    }

    // 4) concluir 6 sessões de estudo
    auto.push(
      genQuest(
        "sessions-6",
        "Concluir 6 sessões de estudo",
        6,
        stats?.sessions_completed || 0,
        "easy"
      )
    );

    return auto.slice(0, 4);
  }, [stats, minutesStudiedSoFar, lowestSubjectInfo]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  const activeSubject = subjects.find(s => s.id === activeId);

  const phaseColor = currentPhase === 'study' ? '#22d3ee' : currentPhase === 'long_break' ? '#a855f7' : '#22c55e';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Grid Principal - Reorganizado */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Coluna Central - Timer e Fila (2 colunas) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card do Timer */}
            <div className="rounded-3xl p-8 bg-gradient-to-br from-slate-800/60 via-slate-800/50 to-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-xl">
              
              {/* Avatar + Título */}
              <div className="text-center mb-6">
                {user && (
                  <div className="inline-flex flex-col items-center justify-center mb-4">
                    <ModernSealAvatar
                      user={user}
                      item={shopItems.find(item => item.id === user.equipped_items?.seal)}
                      size={80}
                      className="shadow-2xl"
                    />
                  </div>
                )}
                {!user && (
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 via-cyan-600 to-blue-600 text-white text-3xl font-bold mb-4 shadow-2xl shadow-cyan-500/30 animate-pulse" style={{animationDuration: '3s'}}>
                    SL
                  </div>
                )}
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">{phaseName}</h1>
                {currentPhase === 'study' ? (
                  <>
                    <p className="text-xl text-purple-400 font-semibold mb-2">
                      {currentSubject?.name || 'Selecione uma matéria'}
                    </p>
                    <p className="text-sm text-gray-400">
                      Selecione uma matéria ao lado para começar
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-gray-400">
                    {phaseEmoji} {currentPhase === 'long_break'
                      ? 'Relaxe e recarregue as energias!'
                      : 'Aproveite para descansar um pouco!'}
                  </p>
                )}
                <div className="mt-3 inline-block px-4 py-1 rounded-full text-xs font-semibold border" style={{
                  backgroundColor: `${phaseColor}15`,
                  borderColor: `${phaseColor}50`,
                  color: phaseColor
                }}>
                  {studyBlocksCount} blocos completados • Próxima pausa longa em {nextLongBreakIn} blocos
                </div>
              </div>

              {/* Timer Display */}
              <div className="text-center mb-8">
                <div className="text-9xl font-bold mb-2 tracking-tight font-mono transition-colors duration-300 drop-shadow-2xl"
                     style={{
                       color: phaseColor,
                       textShadow: `0 0 40px ${phaseColor}60`
                     }}>
                  {/* CORREÇÃO: Se matéria está completa (100%), mostrar 00:00 */}
                  {isCurrentSubjectComplete() && currentPhase === 'study' 
                    ? '00:00' 
                    : formatTime(backgroundTimer.timeLeft)}
                </div>
                <p className="text-gray-400 text-lg font-medium">
                  {isCurrentSubjectComplete() && currentPhase === 'study' 
                    ? '✅ Matéria completa!' 
                    : (currentPhase === 'study' ? `${settings.study_duration} min` :
                       currentPhase === 'long_break' ? `${settings.long_break_duration} min` :
                       `${settings.break_duration} min`)}
                </p>
              </div>

              {/* Controles */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                <Button
                  onClick={toggleTimer}
                  disabled={isCurrentSubjectComplete() && currentPhase === 'study'}
                  className="h-16 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105 disabled:scale-100"
                  data-testid="start-pause-btn"
                >
                  {isCurrentSubjectComplete() && currentPhase === 'study' ? (
                    <>
                      <Trophy className="w-5 h-5 mr-2" />
                      Completo
                    </>
                  ) : backgroundTimer.isRunning ? (
                    <>
                      <Pause className="w-5 h-5 mr-2" />
                      Pausar
                    </>
                  ) : backgroundTimer.isPaused ? (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      Retomar
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
                  disabled={(currentPhase === 'study' && !currentSubject) || (isCurrentSubjectComplete() && currentPhase === 'study')}
                  className="h-16 bg-slate-700/80 hover:bg-slate-600/80 disabled:opacity-40 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                  data-testid="skip-btn"
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  {currentPhase === 'study' ? 'Pular' : 'Pular pausa'}
                </Button>

                <Button
                  onClick={previousBlock}
                  disabled={blockHistory.length === 0}
                  className="h-16 bg-slate-700/80 hover:bg-slate-600/80 disabled:opacity-40 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                  data-testid="previous-btn"
                >
                  <SkipBack className="w-5 h-5 mr-2" />
                  Voltar
                </Button>

                <div className="flex flex-wrap gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        className="h-16 w-full bg-slate-700/80 hover:bg-slate-600/80 text-white font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                        data-testid="reset-menu-btn"
                      >
                        <RotateCcw className="w-5 h-5 mr-2" />
                        Reset
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-slate-800 border-slate-700">
                      <DropdownMenuLabel className="text-white">Opções de reset</DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem
                        className="text-gray-300 focus:bg-slate-700 focus:text-white"
                        onSelect={(e) => { e.preventDefault(); resetCurrentBlock(); }}
                      >
                        Resetar bloco atual
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        disabled={!currentSubject}
                        className="text-gray-300 focus:bg-slate-700 focus:text-white"
                        onSelect={(e) => { e.preventDefault(); openResetSubjectDialog(); }}
                      >
                        Resetar matéria atual
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem
                        className="text-red-400 focus:bg-red-500/20 focus:text-red-400"
                        onSelect={(e) => { e.preventDefault(); resetCycle(); }}
                      >
                        Resetar ciclo
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Barras de Progresso */}
              <div className="space-y-6 bg-gradient-to-br from-slate-900/40 to-slate-800/40 rounded-2xl p-6 backdrop-blur border border-slate-700/30">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 font-medium">Progresso do conteúdo atual</span>
                    <span className="text-cyan-400 font-bold text-base">{currentSubjectProgress.toFixed(0)}%</span>
                  </div>
                  <Bar value={currentSubjectProgress} forceUpdateKey={progressUpdateTrigger} />
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-300 font-medium">Progresso do ciclo</span>
                    <span className="text-cyan-400 font-bold text-base">{cycleProgress.toFixed(0)}%</span>
                  </div>
                  <Bar value={cycleProgress} forceUpdateKey={progressUpdateTrigger} />
                </div>
              </div>
            </div>

            {/* Fila de Conteúdos - Logo abaixo do timer */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-5 shadow-xl">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-white">Fila de conteúdos</h2>
                <Button
                  onClick={() => {
                    const existingColors = subjects.map(s => s.color);
                    const uniqueColor = generateUniqueColor(existingColors);
                    setNewSubject({ name: '', color: uniqueColor, time_goal: 300 });
                    setShowAddSubject(true);
                  }}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg px-3 py-1.5 text-sm"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-base mb-2">Nenhuma matéria adicionada ainda</p>
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
                    <div className="space-y-2">
                      {subjects.map(subject => {
                        const progress = getSubjectProgress(subject.id);
                        const isComplete = progress >= 100;
                        return (
                          <SortableSubjectItem
                            key={`${subject.id}-${progressUpdateTrigger}`}
                            subject={subject}
                            isActive={currentSubject?.id === subject.id}
                            onClick={() => { 
                              setCurrentSubject(subject); 
                              setIsManualSubjectSelection(true); 
                              setProgressUpdateTrigger(p => p + 1);
                              // Mostrar mensagem informativa se a matéria estiver completa
                              if (isComplete) {
                                toast.info(`${subject.name} está completa! Você pode voltar blocos ou resetar.`);
                              }
                            }}
                            onEdit={setShowEditSubject}
                            onDelete={handleDeleteSubject}
                            progress={progress}
                            forceUpdateKey={progressUpdateTrigger}
                          />
                        );
                      })}
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

          {/* Coluna Direita - Mapa do Ciclo e Missões */}
          <div className="lg:col-span-1 space-y-6">
            {/* Mapa do Ciclo */}
            <div className="bg-gradient-to-br from-slate-800/70 via-slate-800/60 to-slate-900/70 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 animate-pulse" style={{animationDuration: '3s'}}>
                  Mapa do Ciclo
                </h2>
                <p className="text-sm text-gray-300 font-medium">Distribuição interativa das matérias</p>
                <div className="mt-2 h-0.5 w-20 mx-auto bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
              </div>

              {subjects.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-400 text-center">Adicione matérias para<br />visualizar o mapa</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  {/* Container centralizado com padding proporcional */}
                  <div className="relative w-full aspect-square max-w-md mx-auto mb-6 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                      {(() => {
                        let offset = 0;
                        const GAP_DEGREES = 0.15;
                        const totalGoal = subjects.reduce((s, x) => s + (x.time_goal || 0), 0);

                        return subjects.map(subject => {
                          const percentage = totalGoal > 0 ? ((subject.time_goal || 0) / totalGoal) * 100 : 100 / subjects.length;
                          const startDegRaw = -90 + (offset * 360) / 100;
                          const sweepRaw = (percentage * 360) / 100;
                          const startDeg = startDegRaw + GAP_DEGREES;
                          const endDeg = startDegRaw + sweepRaw - GAP_DEGREES;
                          offset += percentage;

                          const safeId = subject.id ?? `subj-${Math.random().toString(36).slice(2)}`;
                          const id = `arc-${safeId}`;
                          const d = arcPath(100, 100, 70, startDeg, endDeg);
                          return <path key={id} id={id} d={d} pathLength="100" />;
                        });
                      })()}
                    </defs>

                    {/* Arcos coloridos GROSSOS com bordas retas */}
                    {(() => {
                      let offset = 0;
                      const totalGoal = subjects.reduce((s, x) => s + (x.time_goal || 0), 0);

                      return subjects.map((subject) => {
                        const percentage = totalGoal > 0 ? ((subject.time_goal || 0) / totalGoal) * 100 : 100 / subjects.length;
                        offset += percentage;
                        const id = `arc-${subject.id}`;
                        const isActive = currentSubject?.id === subject.id;

                        return (
                          <use
                            key={`stroke-${id}`}
                            href={`#${id}`}
                            stroke={subject.color}
                            strokeWidth={isActive ? 54 : 50}
                            fill="none"
                            pathLength="100"
                            onClick={() => { setCurrentSubject(subject); setIsManualSubjectSelection(true); setProgressUpdateTrigger(p => p + 1); }}

                            style={{
                              cursor: 'pointer',
                              filter: isActive ? `drop-shadow(0 0 12px ${subject.color}CC)` : 'none',
                              strokeLinecap: 'butt',
                              strokeLinejoin: 'miter',
                              transition: 'stroke-width 200ms ease, filter 200ms ease'
                            }}
                          />
                        );
                      });
                    })()}

                    {/* Textos curvados DENTRO dos arcos */}
                    {(() => {
                      let offset = 0;
                      const GAP_DEGREES = 0.15;
                      const totalGoal = subjects.reduce((s, x) => s + (x.time_goal || 0), 0);

                      return subjects.map((subject) => {
                        const percentage = totalGoal > 0 ? ((subject.time_goal || 0) / totalGoal) * 100 : 100 / subjects.length;
                        const id = `arc-${subject.id}`;
                        const isActive = currentSubject?.id === subject.id;

                        const startDegRaw = -90 + (offset * 360) / 100;
                        const sweepRaw = (percentage * 360) / 100;
                        const startDeg = startDegRaw + GAP_DEGREES;
                        const endDeg = startDegRaw + sweepRaw - GAP_DEGREES;
                        offset += percentage;

                        const actualSweep = endDeg - startDeg;
                        if (actualSweep < 20) return null;

                        return (
                          <text key={`text-${id}`} fill="#fff">
                            <textPath
                              href={`#${id}`}
                              startOffset="50%"
                              textAnchor="middle"
                              onClick={() => { setCurrentSubject(subject); setIsManualSubjectSelection(true); setProgressUpdateTrigger(p => p + 1); }}

                              style={{
                                fontSize: isActive ? 8 : 7.5,
                                fontWeight: 900,
                                cursor: 'pointer',
                                letterSpacing: '0.02em',
                                transition: 'font-size 200ms ease',
                                textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                              }}
                            >
                              {subject.name}
                            </textPath>
                          </text>
                        );
                      });
                    })()}
                  </svg>

                  {/* Centro com gradiente */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative">
                      <div className="absolute inset-0 -m-7 rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" style={{animationDuration: '3s'}} />
                      <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-tr from-blue-500/5 via-purple-500/5 to-cyan-500/5 animate-pulse" style={{animationDuration: '4s', animationDelay: '1s'}} />

                      <div className="relative text-center bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-full px-7 py-5 border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
                        <p className="text-xs text-cyan-300 font-bold mb-1 tracking-wider uppercase">Mapa do</p>
                        <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 tracking-tight">CICLO</p>
                        {currentSubject && (
                          <>
                            <div className="mt-2 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
                            <p className="text-xs font-semibold mt-2 max-w-[120px] truncate" style={{color: currentSubject.color}}>
                              {currentSubject.name}
                            </p>
                            <p className="text-[10px] text-gray-500 mt-1">
                              {formatMinutes(currentSubject.time_goal)}
                            </p>
                          </>
                        )}
                        {!currentSubject && (
                          <p className="text-[10px] text-gray-500 mt-2">Clique em uma matéria</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                  {/* Lista de Matérias do Ciclo */}
                  <div className="w-full space-y-3 mt-6">
                    <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4 flex items-center gap-2">
                      <span className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></span>
                      Matérias do Ciclo
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {subjects.map((subject, index) => {
                        const isActive = currentSubject?.id === subject.id;
                        return (
                          <div
                            key={subject.id}
                            onClick={() => { setCurrentSubject(subject); setIsManualSubjectSelection(true); setProgressUpdateTrigger(p => p + 1); }}

                            className={`flex items-center justify-between text-sm p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                              isActive
                                ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                                : 'hover:bg-slate-700/30 border border-transparent'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${isActive ? 'scale-125' : ''}`}
                                style={{
                                  backgroundColor: subject.color,
                                  boxShadow: isActive ? `0 0 12px ${subject.color}` : 'none'
                                }}
                              />
                              <span className={`${isActive ? 'text-white font-bold' : 'text-gray-300'} transition-all`}>
                                {index + 1}. {subject.name}
                              </span>
                            </div>
                            <span className={`text-xs ${isActive ? 'text-cyan-300 font-semibold' : 'text-gray-400'}`}>
                              {formatMinutes(subject.time_goal)} planejado
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Totais */}
                    <div className="pt-4 mt-4 text-right text-xs border-t border-slate-700/50 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tempo total do ciclo:</span>
                        <b className="text-cyan-300 text-sm">{formatMinutes(totalCycleTimeWithBreaks)}</b>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-500 ml-2">• Estudo:</span>
                        <span className="text-gray-400">{formatMinutes(subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0))}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-gray-500 ml-2">• Pausas longas:</span>
                        <span className="text-gray-400">{formatMinutes(totalCycleTimeWithBreaks - subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0))}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tempo de estudo:</span>
                        <b className="text-emerald-300 text-sm">{formatMinutes(totalStudied)}</b>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Missões Semanais - Compacta */}
            <div className="bg-gradient-to-br from-purple-900/30 via-slate-800/50 to-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-2xl shadow-purple-500/10">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400">
                  Missões Semanais
                </h2>
              </div>

              <div className="space-y-3">
                {fourQuests.map((quest) => {
                  const progressPct = quest.target > 0 ? Math.min(100, (quest.progress / quest.target) * 100) : 0;
                  return (
                    <div
                      key={quest.id}
                      className={`relative overflow-hidden rounded-xl p-3 transition-all duration-300 ${
                        quest.completed
                          ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/50'
                          : 'bg-slate-800/60 border-2 border-slate-700/50 hover:border-purple-500/50'
                      }`}
                    >
                      {quest.completed && (
                        <div className="absolute top-2 right-2">
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white font-bold text-xs">✓</span>
                          </div>
                        </div>
                      )}

                      <div className="mb-2">
                        <h3 className={`font-bold text-xs mb-1 ${quest.completed ? 'text-green-300' : 'text-white'}`}>
                          {quest.title}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Target className="w-3 h-3" />
                          <span>{quest.progress} / {quest.target}</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="h-1.5 rounded-full bg-slate-700/50 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              quest.completed
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500'
                                : 'bg-gradient-to-r from-purple-400 to-pink-500'
                            }`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-yellow-400 font-bold">🪙 {quest.coins_reward}</span>
                          <span className="text-purple-400 font-bold">⭐ {quest.xp_reward}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Adicionar Matéria */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Nova Matéria
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="subject-name" className="text-gray-300 font-medium">Nome da Matéria</Label>
              <Input
                id="subject-name"
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="Ex: Matemática"
                className="bg-slate-700/50 border-slate-600 text-white mt-1 focus:border-cyan-500 transition-colors"
              />
            </div>

            <div>
              <Label htmlFor="subject-color" className="text-gray-300 font-medium">Cor</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="subject-color"
                  type="color"
                  value={newSubject.color}
                  onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  value={newSubject.color}
                  onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
                  placeholder="#3B82F6"
                  className="flex-1 bg-slate-700/50 border-slate-600 text-white focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="subject-goal" className="text-gray-300 font-medium">Meta semanal (minutos)</Label>
              <Input
                id="subject-goal"
                type="number"
                value={newSubject.time_goal}
                onChange={(e) => setNewSubject({ ...newSubject, time_goal: parseInt(e.target.value) || 0 })}
                placeholder="300"
                min="0"
                className="bg-slate-700/50 border-slate-600 text-white mt-1 focus:border-cyan-500 transition-colors"
              />
              <p className="text-xs text-gray-400 mt-2 bg-slate-700/30 rounded-lg px-3 py-2">
                ≈ {Math.ceil(newSubject.time_goal / settings.study_duration)} blocos de estudo
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={handleAddSubject}
                className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 font-semibold shadow-lg shadow-cyan-500/30"
              >
                Adicionar
              </Button>
              <Button
                onClick={() => setShowAddSubject(false)}
                variant="outline"
                className="border-slate-600 text-gray-300 hover:bg-slate-700/50 hover:text-white"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Matéria */}
      {showEditSubject && (
        <Dialog open={!!showEditSubject} onOpenChange={() => setShowEditSubject(null)}>
          <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-white text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Editar Matéria
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div>
                <Label className="text-gray-300 font-medium">Nome</Label>
                <Input
                  defaultValue={showEditSubject.name}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, name: e.target.value })}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1 focus:border-cyan-500 transition-colors"
                />
              </div>

              <div>
                <Label className="text-gray-300 font-medium">Cor</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    defaultValue={showEditSubject.color}
                    onChange={(e) => setShowEditSubject({ ...showEditSubject, color: e.target.value })}
                    className="w-20 h-10 cursor-pointer"
                  />
                  <Input
                    defaultValue={showEditSubject.color}
                    onChange={(e) => setShowEditSubject({ ...showEditSubject, color: e.target.value })}
                    placeholder="#3B82F6"
                    className="flex-1 bg-slate-700/50 border-slate-600 text-white focus:border-cyan-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-300 font-medium">Meta semanal (minutos)</Label>
                <Input
                  type="number"
                  defaultValue={showEditSubject.time_goal}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, time_goal: parseInt(e.target.value) || 0 })}
                  className="bg-slate-700/50 border-slate-600 text-white mt-1 focus:border-cyan-500 transition-colors"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  onClick={() => {
                    handleUpdateSubject(showEditSubject.id, {
                      name: showEditSubject.name,
                      color: showEditSubject.color,
                      time_goal: showEditSubject.time_goal
                    });
                  }}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 font-semibold shadow-lg shadow-cyan-500/30"
                >
                  Salvar
                </Button>
                <Button
                  onClick={() => setShowEditSubject(null)}
                  variant="outline"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700/50 hover:text-white"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog de confirmação para resetar matéria */}
      <Dialog open={showResetSubjectDialog} onOpenChange={setShowResetSubjectDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              Resetar Matéria Atual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <p className="text-gray-300 text-base">
              Você está prestes a resetar a matéria <span className="font-bold text-cyan-400">{currentSubject?.name}</span>.
            </p>
            <p className="text-gray-400 text-sm">
              Deseja também resetar a contagem de blocos até a próxima pausa longa?
            </p>
            
            <div className="bg-slate-700/30 rounded-lg p-4 border border-slate-600/50">
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold text-cyan-400">✓ Sim:</span> Reseta tudo e a próxima pausa longa volta para o padrão (após 4 blocos)
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-amber-400">✗ Não:</span> Apenas reseta a matéria, mantendo a contagem atual de blocos
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={() => resetCurrentSubject(true)}
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
              >
                Sim, resetar tudo
              </Button>
              <Button
                onClick={() => resetCurrentSubject(false)}
                className="bg-amber-600 hover:bg-amber-500 text-white font-semibold"
              >
                Não, manter contagem
              </Button>
            </div>
            
            <Button
              onClick={() => setShowResetSubjectDialog(false)}
              variant="outline"
              className="w-full border-slate-600 text-gray-300 hover:bg-slate-700/50"
            >
              Cancelar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );

}
export default DashboardFixed;
