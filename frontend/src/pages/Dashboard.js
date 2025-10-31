import ModernSealAvatar from '../components/ModernSealAvatar';
import { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, Edit2, Trash2, ChevronDown } from 'lucide-react';
import Header from '../components/Header';
import { api } from "@/lib/api";
import { setCycleState } from "../lib/siteStyle";
import { usePageTitle } from "../hooks/usePageTitle";
import { alarm } from "@/lib/alarm";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;

// Tipos de blocos
const BLOCK_TYPES = {
  STUDY: 'STUDY',
  SHORT_BREAK: 'SHORT_BREAK',
  LONG_BREAK: 'LONG_BREAK'
};

// Cores por tipo de bloco
const BLOCK_COLORS = {
  STUDY: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    button: 'bg-blue-500 hover:bg-blue-600',
    accent: '#3b82f6'
  },
  SHORT_BREAK: {
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
    button: 'bg-green-500 hover:bg-green-600',
    accent: '#22c55e'
  },
  LONG_BREAK: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    button: 'bg-purple-500 hover:bg-purple-600',
    accent: '#a855f7'
  }
};

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

function DashboardNew() {
  const navigate = useNavigate();
  
  // Estados principais
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({
    study_duration: 50,
    short_break_duration: 10,
    long_break_duration: 30
  });
  const [loading, setLoading] = useState(true);
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#3B82F6', time_goal: 300 });
  
  // Estados do timer
  const [currentBlockType, setCurrentBlockType] = useState(BLOCK_TYPES.STUDY);
  const [timeLeft, setTimeLeft] = useState(50 * 60); // em segundos
  const [isRunning, setIsRunning] = useState(false);
  
  // Estado do ciclo
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0); // índice global de blocos
  const [studyBlocksCompleted, setStudyBlocksCompleted] = useState(0); // contador para pausa longa
  
  // Timer ref
  const timerIntervalRef = useRef(null);
  
  usePageTitle(isRunning ? `${formatTime(timeLeft)} - ${currentBlockType}` : 'Dashboard');

  // Formatar tempo MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calcular total de blocos de estudo por matéria
  const calculateStudyBlocks = (subject) => {
    const timeGoalMinutes = subject.time_goal || 0;
    return Math.ceil(timeGoalMinutes / settings.study_duration);
  };

  // Calcular total de blocos (estudo + pausas) por matéria
  const calculateTotalBlocks = (subject) => {
    const studyBlocks = calculateStudyBlocks(subject);
    // Cada bloco de estudo tem uma pausa depois (exceto o último da matéria)
    return studyBlocks * 2 - 1;
  };

  // Calcular total de blocos do ciclo completo
  const totalCycleBlocks = useMemo(() => {
    return subjects.reduce((acc, subject) => acc + calculateTotalBlocks(subject), 0);
  }, [subjects, settings]);

  // Obter matéria atual
  const currentSubject = subjects[currentSubjectIndex] || null;

  // Determinar qual deve ser o próximo tipo de bloco
  const getNextBlockType = (currentType, studyCount) => {
    if (currentType === BLOCK_TYPES.STUDY) {
      // Após um estudo, verificar se é hora da pausa longa
      if ((studyCount + 1) % 4 === 0) {
        return BLOCK_TYPES.LONG_BREAK;
      }
      return BLOCK_TYPES.SHORT_BREAK;
    }
    // Após qualquer pausa, volta para estudo
    return BLOCK_TYPES.STUDY;
  };

  // Carregar dados do backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsRes, statsRes, settingsRes] = await Promise.all([
          axios.get(`${API}/subjects`, { withCredentials: true }),
          axios.get(`${API}/stats`, { withCredentials: true }),
          axios.get(`${API}/settings`, { withCredentials: true })
        ]);
        
        setSubjects(subjectsRes.data || []);
        setStats(statsRes.data || {});
        
        if (settingsRes.data) {
          setSettings({
            study_duration: settingsRes.data.study_duration || 50,
            short_break_duration: settingsRes.data.break_duration || 10,
            long_break_duration: (settingsRes.data.break_duration || 10) * 3 // 3x a pausa curta
          });
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

  // Quando completar um bloco
  const handleBlockComplete = async () => {
    setIsRunning(false);
    
    // Tocar alarme
    alarm();
    
    // Se era um bloco de estudo, salvar sessão e incrementar contador
    if (currentBlockType === BLOCK_TYPES.STUDY) {
      await saveStudySession();
      setStudyBlocksCompleted(prev => prev + 1);
    }
    
    // Não avança automaticamente - usuário precisa clicar em próximo
    toast.success(`${currentBlockType === BLOCK_TYPES.STUDY ? 'Bloco de estudo' : 'Pausa'} completo!`);
  };

  // Salvar sessão de estudo no backend
  const saveStudySession = async () => {
    if (!currentSubject) return;
    
    try {
      const durationMinutes = settings.study_duration;
      await axios.post(`${API}/session`, {
        subject_id: currentSubject.id,
        duration: durationMinutes,
        completed: true
      }, { withCredentials: true });
      
      // Recarregar stats
      const statsRes = await axios.get(`${API}/stats`, { withCredentials: true });
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Erro ao salvar sessão:', error);
    }
  };

  // Iniciar/Pausar timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Próximo bloco
  const nextBlock = () => {
    if (isRunning) {
      toast.error('Pause o timer antes de avançar');
      return;
    }
    
    // Verificar se completou o ciclo completo
    const allSubjectsCompleted = subjects.every(subject => {
      const subjectStats = (stats?.subjects || []).find(s => s.id === subject.id);
      const studiedMinutes = subjectStats?.studied_minutes || 0;
      return studiedMinutes >= (subject.time_goal || 0);
    });
    
    if (allSubjectsCompleted && subjects.length > 0) {
      toast.success('🎉 Parabéns! Você completou todo o ciclo de estudos!', {
        duration: 5000
      });
      return;
    }
    
    // Determinar próximo tipo de bloco
    const nextType = getNextBlockType(currentBlockType, studyBlocksCompleted);
    
    // Se próximo é estudo, verificar se precisa mudar de matéria
    if (nextType === BLOCK_TYPES.STUDY && currentSubject) {
      const currentSubjectStudyBlocks = calculateStudyBlocks(currentSubject);
      const completedBlocksThisSubject = (stats?.subjects || [])
        .find(s => s.id === currentSubject.id)?.studied_minutes || 0;
      const completedStudyBlocks = Math.floor(completedBlocksThisSubject / settings.study_duration);
      
      // Se completou todos os blocos desta matéria, vai para próxima
      if (completedStudyBlocks >= currentSubjectStudyBlocks) {
        if (currentSubjectIndex < subjects.length - 1) {
          setCurrentSubjectIndex(prev => prev + 1);
          toast.info(`Mudando para: ${subjects[currentSubjectIndex + 1].name}`);
        } else {
          toast.success('🎉 Última matéria completa! Ciclo finalizado!', {
            duration: 5000
          });
          return;
        }
      }
    }
    
    setCurrentBlockType(nextType);
    setCurrentBlockIndex(prev => prev + 1);
    
    // Resetar timer com duração apropriada
    let duration;
    if (nextType === BLOCK_TYPES.STUDY) {
      duration = settings.study_duration * 60;
    } else if (nextType === BLOCK_TYPES.SHORT_BREAK) {
      duration = settings.short_break_duration * 60;
    } else {
      duration = settings.long_break_duration * 60;
    }
    
    setTimeLeft(duration);
  };

  // Bloco anterior
  const previousBlock = () => {
    if (isRunning) {
      toast.error('Pause o timer antes de voltar');
      return;
    }
    
    if (currentBlockIndex === 0) {
      toast.error('Já está no primeiro bloco');
      return;
    }
    
    // Lógica inversa do nextBlock
    // Se atual é estudo, anterior é pausa
    // Se atual é pausa, anterior é estudo
    let prevType;
    if (currentBlockType === BLOCK_TYPES.STUDY) {
      // Verificar qual tipo de pausa era antes
      if (studyBlocksCompleted > 0 && studyBlocksCompleted % 4 === 0) {
        prevType = BLOCK_TYPES.LONG_BREAK;
      } else {
        prevType = BLOCK_TYPES.SHORT_BREAK;
      }
      setStudyBlocksCompleted(prev => Math.max(0, prev - 1));
    } else {
      prevType = BLOCK_TYPES.STUDY;
    }
    
    setCurrentBlockType(prevType);
    setCurrentBlockIndex(prev => Math.max(0, prev - 1));
    
    // Resetar timer
    let duration;
    if (prevType === BLOCK_TYPES.STUDY) {
      duration = settings.study_duration * 60;
    } else if (prevType === BLOCK_TYPES.SHORT_BREAK) {
      duration = settings.short_break_duration * 60;
    } else {
      duration = settings.long_break_duration * 60;
    }
    
    setTimeLeft(duration);
  };

  // Reset bloco atual
  const resetCurrentBlock = () => {
    setIsRunning(false);
    let duration;
    if (currentBlockType === BLOCK_TYPES.STUDY) {
      duration = settings.study_duration * 60;
    } else if (currentBlockType === BLOCK_TYPES.SHORT_BREAK) {
      duration = settings.short_break_duration * 60;
    } else {
      duration = settings.long_break_duration * 60;
    }
    setTimeLeft(duration);
  };

  // Reset matéria atual
  const resetSubject = () => {
    setIsRunning(false);
    setCurrentBlockType(BLOCK_TYPES.STUDY);
    setTimeLeft(settings.study_duration * 60);
    // Manter o mesmo subject index
  };

  // Reset ciclo completo
  const resetCycle = () => {
    setIsRunning(false);
    setCurrentSubjectIndex(0);
    setCurrentBlockIndex(0);
    setCurrentBlockType(BLOCK_TYPES.STUDY);
    setStudyBlocksCompleted(0);
    setTimeLeft(settings.study_duration * 60);
  };

  // Adicionar nova matéria
  const handleAddSubject = async () => {
    if (!newSubject.name.trim()) {
      toast.error('Digite um nome para a matéria');
      return;
    }
    
    try {
      const response = await axios.post(`${API}/subjects`, {
        name: newSubject.name,
        color: newSubject.color,
        time_goal: newSubject.time_goal
      }, { withCredentials: true });
      
      setSubjects([...subjects, response.data]);
      setNewSubject({ name: '', color: '#3B82F6', time_goal: 300 });
      setShowAddSubject(false);
      toast.success('Matéria adicionada!');
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
      toast.error('Erro ao adicionar matéria');
    }
  };

  // Calcular progresso da matéria atual
  const currentSubjectProgress = useMemo(() => {
    if (!currentSubject || !stats) return 0;
    
    const subjectStats = (stats.subjects || []).find(s => s.id === currentSubject.id);
    const studiedMinutes = subjectStats?.studied_minutes || 0;
    const totalMinutes = currentSubject.time_goal || 1;
    
    return Math.min(100, (studiedMinutes / totalMinutes) * 100);
  }, [currentSubject, stats]);

  // Calcular progresso do ciclo completo
  const cycleProgress = useMemo(() => {
    if (!stats || subjects.length === 0) return 0;
    
    const totalGoal = subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0);
    const totalStudied = subjects.reduce((sum, s) => {
      const subjectStats = (stats.subjects || []).find(ss => ss.id === s.id);
      return sum + (subjectStats?.studied_minutes || 0);
    }, 0);
    
    return totalGoal > 0 ? Math.min(100, (totalStudied / totalGoal) * 100) : 0;
  }, [subjects, stats]);

  // Cores do bloco atual
  const colors = BLOCK_COLORS[currentBlockType];

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Grid 3 colunas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Coluna Esquerda - Fila de Matérias */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl p-6 bg-gray-800/50 border border-gray-700/50 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-100">Matérias</h2>
              
              {subjects.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-4">Nenhuma matéria adicionada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjects.map((subject, index) => {
                    const subjectStats = (stats?.subjects || []).find(s => s.id === subject.id);
                    const studiedMinutes = subjectStats?.studied_minutes || 0;
                    const progress = subject.time_goal > 0 
                      ? Math.min(100, (studiedMinutes / subject.time_goal) * 100) 
                      : 0;
                    
                    const isActive = index === currentSubjectIndex;
                    
                    return (
                      <div 
                        key={subject.id} 
                        className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                          isActive 
                            ? 'border-cyan-400 bg-cyan-500/10 shadow-lg scale-105' 
                            : 'border-gray-700 bg-gray-900/30 hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div 
                            className="w-4 h-4 rounded-full shadow-lg" 
                            style={{ backgroundColor: subject.color }}
                          />
                          <span className="font-semibold text-lg">{subject.name}</span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-gray-400">
                            <span>Progresso</span>
                            <span className="font-bold">{progress.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-700/50 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500"
                              style={{ 
                                width: `${progress}%`,
                                backgroundColor: subject.color 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              <Button className="w-full mt-6 rounded-xl py-6 font-semibold text-base" variant="outline" onClick={() => setShowAddSubject(true)}>
                <Plus className="w-5 h-5 mr-2" />
                Adicionar Matéria
              </Button>
              
              {/* Dialog Adicionar Matéria */}
              <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Nova Matéria</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="subject-name">Nome da Matéria</Label>
                      <Input
                        id="subject-name"
                        value={newSubject.name}
                        onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                        placeholder="Ex: Matemática"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subject-color">Cor</Label>
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
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="subject-goal">Tempo Total (minutos)</Label>
                      <Input
                        id="subject-goal"
                        type="number"
                        value={newSubject.time_goal}
                        onChange={(e) => setNewSubject({ ...newSubject, time_goal: parseInt(e.target.value) || 0 })}
                        placeholder="300"
                        min="0"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.ceil(newSubject.time_goal / settings.study_duration)} blocos de estudo
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button onClick={handleAddSubject} className="flex-1">
                        Adicionar
                      </Button>
                      <Button onClick={() => setShowAddSubject(false)} variant="outline">
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          {/* Coluna Central - Timer */}
          <div className="lg:col-span-6">
            <div className={`rounded-3xl p-8 transition-all duration-500 ${colors.bg} border-2 ${colors.border} shadow-2xl`}>
              
              {/* Seletores de tipo */}
              <div className="flex justify-center gap-3 mb-10">
                <button
                  onClick={() => {
                    if (!isRunning) {
                      setCurrentBlockType(BLOCK_TYPES.STUDY);
                      setTimeLeft(settings.study_duration * 60);
                    }
                  }}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentBlockType === BLOCK_TYPES.STUDY
                      ? 'bg-blue-500 text-white shadow-lg scale-105'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                  disabled={isRunning}
                >
                  Estudo
                </button>
                <button
                  onClick={() => {
                    if (!isRunning) {
                      setCurrentBlockType(BLOCK_TYPES.SHORT_BREAK);
                      setTimeLeft(settings.short_break_duration * 60);
                    }
                  }}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentBlockType === BLOCK_TYPES.SHORT_BREAK
                      ? 'bg-green-500 text-white shadow-lg scale-105'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                  disabled={isRunning}
                >
                  Pausa Curta
                </button>
                <button
                  onClick={() => {
                    if (!isRunning) {
                      setCurrentBlockType(BLOCK_TYPES.LONG_BREAK);
                      setTimeLeft(settings.long_break_duration * 60);
                    }
                  }}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentBlockType === BLOCK_TYPES.LONG_BREAK
                      ? 'bg-purple-500 text-white shadow-lg scale-105'
                      : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                  }`}
                  disabled={isRunning}
                >
                  Pausa Longa
                </button>
              </div>
              
              {/* Timer display */}
              <div className="text-center mb-10">
                <div className={`text-9xl font-bold ${colors.text} mb-6 tracking-tight`}>
                  {formatTime(timeLeft)}
                </div>
                
                <Button
                  size="lg"
                  onClick={toggleTimer}
                  className={`${colors.button} text-white px-16 py-7 text-2xl font-bold rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105`}
                  data-testid="start-pause-btn"
                >
                  {isRunning ? (
                    <>
                      <Pause className="w-7 h-7 mr-3" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="w-7 h-7 mr-3" />
                      Iniciar
                    </>
                  )}
                </Button>
              </div>
              
              {/* Controles */}
              <div className="flex justify-center gap-3 mb-10">
                <Button
                  variant="outline"
                  onClick={previousBlock}
                  disabled={currentBlockIndex === 0 || isRunning}
                  data-testid="previous-block-btn"
                  className="px-6 py-3 rounded-xl font-semibold disabled:opacity-30"
                >
                  <SkipBack className="w-5 h-5 mr-2" />
                  Anterior
                </Button>
                
                {/* Dropdown Reset */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" disabled={isRunning} className="px-6 py-3 rounded-xl font-semibold">
                      <RotateCcw className="w-5 h-5 mr-2" />
                      Reset
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={resetCurrentBlock}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Resetar Bloco Atual
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={resetSubject}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Resetar Matéria
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={resetCycle}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Resetar Ciclo Completo
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button
                  variant="outline"
                  onClick={nextBlock}
                  disabled={isRunning}
                  data-testid="next-block-btn"
                  className="px-6 py-3 rounded-xl font-semibold disabled:opacity-30"
                >
                  Próximo
                  <SkipForward className="w-5 h-5 ml-2" />
                </Button>
              </div>
              
              {/* Barras de Progresso */}
              <div className="space-y-6 bg-gray-900/30 rounded-2xl p-6">
                {/* Progresso da Matéria */}
                <div>
                  <div className="flex justify-between text-base font-medium mb-3">
                    <span className="text-gray-200">
                      {currentSubject?.name || 'Nenhuma matéria selecionada'}
                    </span>
                    <span className={`${colors.text} font-bold`}>
                      {currentSubjectProgress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full ${colors.button} transition-all duration-500`}
                      style={{ width: `${currentSubjectProgress}%` }}
                    />
                  </div>
                </div>
                
                {/* Progresso do Ciclo */}
                <div>
                  <div className="flex justify-between text-base font-medium mb-3">
                    <span className="text-gray-200">Ciclo Completo</span>
                    <span className={`${colors.text} font-bold`}>
                      {cycleProgress.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-500`}
                      style={{ width: `${cycleProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Coluna Direita - Mapa do Ciclo */}
          <div className="lg:col-span-3">
            <div className="rounded-3xl p-6 bg-gray-800/50 border border-gray-700/50 shadow-xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-100">Mapa do Ciclo</h2>
              
              {subjects.length === 0 ? (
                <div className="flex items-center justify-center h-80">
                  <p className="text-gray-400 text-center">Adicione matérias para<br/>visualizar o mapa</p>
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <svg width="300" height="300" viewBox="0 0 300 300">
                    {/* Círculo de fundo */}
                    <circle
                      cx="150"
                      cy="150"
                      r="130"
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
                      const subjectStats = (stats?.subjects || []).find(s => s.id === subject.id);
                      const studiedMinutes = subjectStats?.studied_minutes || 0;
                      const subjectProgress = subject.time_goal > 0 
                        ? Math.min(1, studiedMinutes / subject.time_goal)
                        : 0;
                      const progressEndDeg = startDeg + (percentage / 100) * 360 * subjectProgress;
                      
                      return (
                        <g key={subject.id}>
                          {/* Arco de fundo (planejado) */}
                          <path
                            d={arcPath(150, 150, 130, startDeg - 90, endDeg - 90)}
                            fill="none"
                            stroke={subject.color}
                            strokeWidth="28"
                            opacity="0.2"
                          />
                          
                          {/* Arco de progresso (estudado) */}
                          {subjectProgress > 0 && (
                            <path
                              d={arcPath(150, 150, 130, startDeg - 90, progressEndDeg - 90)}
                              fill="none"
                              stroke={subject.color}
                              strokeWidth="28"
                              opacity="1"
                              className="drop-shadow-lg"
                            />
                          )}
                          
                          {/* Texto do nome da matéria */}
                          {percentage > 8 && (
                            <text
                              x={polar(150, 150, 100, startDeg + (percentage / 100) * 360 / 2 - 90).x}
                              y={polar(150, 150, 100, startDeg + (percentage / 100) * 360 / 2 - 90).y}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize="13"
                              fontWeight="700"
                              transform={`rotate(${startDeg + (percentage / 100) * 360 / 2}, ${polar(150, 150, 100, startDeg + (percentage / 100) * 360 / 2 - 90).x}, ${polar(150, 150, 100, startDeg + (percentage / 100) * 360 / 2 - 90).y})`}
                              className="drop-shadow"
                            >
                              {subject.name.length > 10 ? subject.name.substring(0, 10) + '...' : subject.name}
                            </text>
                          )}
                        </g>
                      );
                    })}
                    
                    {/* Círculo central decorativo */}
                    <circle
                      cx="150"
                      cy="150"
                      r="65"
                      fill="rgba(15, 23, 42, 0.9)"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="2"
                    />
                    
                    {/* Texto central */}
                    <text
                      x="150"
                      y="140"
                      textAnchor="middle"
                      fill="rgba(255,255,255,0.7)"
                      fontSize="16"
                      fontWeight="600"
                    >
                      Progresso
                    </text>
                    <text
                      x="150"
                      y="165"
                      textAnchor="middle"
                      fill="white"
                      fontSize="32"
                      fontWeight="bold"
                    >
                      {cycleProgress.toFixed(0)}%
                    </text>
                  </svg>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default DashboardNew;
