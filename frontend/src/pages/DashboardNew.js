import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Play, Pause, SkipForward, SkipBack, RotateCcw, Plus, Edit2, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { api } from "@/lib/api";
import { useApp } from '@/context/AppContext';
import ModernSealAvatar from '../components/ModernSealAvatar';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

export default function DashboardNew() {
  const navigate = useNavigate();
  const { me: user } = useApp();
  
  // Estados principais
  const [subjects, setSubjects] = useState([]);
  const [currentSubject, setCurrentSubject] = useState(null);
  const [settings, setSettings] = useState({ study_duration: 50, break_duration: 10 });
  
  // Estados do timer
  const [timerState, setTimerState] = useState('idle'); // 'idle' | 'focus' | 'break' | 'paused'
  const [timeLeft, setTimeLeft] = useState(0); // segundos restantes
  const [currentBlockType, setCurrentBlockType] = useState('focus'); // 'focus' | 'break'
  const [currentBlockIndex, setCurrentBlockIndex] = useState(0); // índice do bloco atual
  
  // Estados de progresso
  const [subjectProgress, setSubjectProgress] = useState({}); // {subjectId: completedMinutes}
  const [blockHistory, setBlockHistory] = useState([]); // histórico de blocos completados
  
  // Estados de UI
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#3b82f6', time_goal: 300 });
  
  const timerInterval = useRef(null);

  // Carregar dados iniciais
  useEffect(() => {
    if (user?.id) {
      loadSubjects();
      loadSettings();
      loadProgress();
    }
  }, [user]);

  // Timer tick
  useEffect(() => {
    if (timerState === 'focus' || timerState === 'break') {
      timerInterval.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // Bloco completado
            handleBlockComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    }
    
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, [timerState]);

  const loadSubjects = async () => {
    try {
      const response = await api.get('/subjects');
      const data = response.data || [];
      setSubjects(data.sort((a, b) => a.order - b.order));
      
      // Se não houver matéria selecionada, seleciona a primeira
      if (!currentSubject && data.length > 0) {
        setCurrentSubject(data[0]);
      }
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
      toast.error('Erro ao carregar matérias');
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get('/settings');
      setSettings(response.data || { study_duration: 50, break_duration: 10 });
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
    }
  };

  const loadProgress = async () => {
    try {
      // Carregar progresso salvo do localStorage
      const saved = localStorage.getItem(`progress_${user?.id}`);
      if (saved) {
        setSubjectProgress(JSON.parse(saved));
      }
      
      const histSaved = localStorage.getItem(`blockHistory_${user?.id}`);
      if (histSaved) {
        setBlockHistory(JSON.parse(histSaved));
      }
    } catch (error) {
      console.error('Erro ao carregar progresso:', error);
    }
  };

  const saveProgress = (newProgress) => {
    localStorage.setItem(`progress_${user?.id}`, JSON.stringify(newProgress));
  };

  const saveBlockHistory = (newHistory) => {
    localStorage.setItem(`blockHistory_${user?.id}`, JSON.stringify(newHistory));
  };

  // Funções do Timer
  const handleTimerToggle = () => {
    if (!currentSubject && currentBlockType === 'focus') {
      toast.error('Selecione uma matéria para estudar');
      return;
    }

    if (timerState === 'idle') {
      // Iniciar
      startBlock('focus');
    } else if (timerState === 'focus' || timerState === 'break') {
      // Pausar
      setTimerState('paused');
    } else if (timerState === 'paused') {
      // Retomar
      setTimerState(currentBlockType);
    }
  };

  const startBlock = (type) => {
    const duration = type === 'focus' ? settings.study_duration : settings.break_duration;
    setTimeLeft(duration * 60);
    setCurrentBlockType(type);
    setTimerState(type);
  };

  const handleBlockComplete = () => {
    // Bloco completado naturalmente
    const blockType = currentBlockType;
    const blockDuration = blockType === 'focus' ? settings.study_duration : settings.break_duration;
    
    if (blockType === 'focus' && currentSubject) {
      // Incrementar progresso apenas para blocos de estudo completados
      const newProgress = {
        ...subjectProgress,
        [currentSubject.id]: (subjectProgress[currentSubject.id] || 0) + blockDuration
      };
      setSubjectProgress(newProgress);
      saveProgress(newProgress);
      
      // Adicionar ao histórico
      const newHistory = [
        ...blockHistory,
        {
          subjectId: currentSubject.id,
          type: 'focus',
          duration: blockDuration,
          completed: true,
          timestamp: new Date().toISOString()
        }
      ];
      setBlockHistory(newHistory);
      saveBlockHistory(newHistory);
      
      // Registrar sessão no backend
      registerStudySession(currentSubject.id, blockDuration, false);
    }
    
    // Alternar para próximo tipo de bloco
    if (blockType === 'focus') {
      toast.success('Bloco de estudo concluído! Hora do intervalo.');
      startBlock('break');
    } else {
      toast.success('Intervalo concluído! Pronto para estudar.');
      setTimerState('idle');
      setTimeLeft(0);
    }
    
    setCurrentBlockIndex(prev => prev + 1);
  };

  const registerStudySession = async (subjectId, duration, skipped) => {
    try {
      await api.post('/study/start', { subject_id: subjectId });
      await api.post('/study/end', { 
        subject_id: subjectId,
        duration: duration,
        skipped: skipped
      });
    } catch (error) {
      console.error('Erro ao registrar sessão:', error);
    }
  };

  const handleSkipBlock = () => {
    if (timerState === 'idle') {
      toast.error('Nenhum bloco ativo para pular');
      return;
    }

    const blockType = currentBlockType;
    const blockDuration = blockType === 'focus' ? settings.study_duration : settings.break_duration;
    
    if (blockType === 'focus' && currentSubject) {
      // Ao pular, ainda contabiliza na barra de progresso
      const newProgress = {
        ...subjectProgress,
        [currentSubject.id]: (subjectProgress[currentSubject.id] || 0) + blockDuration
      };
      setSubjectProgress(newProgress);
      saveProgress(newProgress);
      
      // Adicionar ao histórico como pulado
      const newHistory = [
        ...blockHistory,
        {
          subjectId: currentSubject.id,
          type: 'focus',
          duration: blockDuration,
          completed: false,
          skipped: true,
          timestamp: new Date().toISOString()
        }
      ];
      setBlockHistory(newHistory);
      saveBlockHistory(newHistory);
      
      // Registrar como pulado no backend
      registerStudySession(currentSubject.id, blockDuration, true);
    }
    
    // Passar para o próximo bloco
    if (blockType === 'focus') {
      toast.info('Bloco de estudo pulado. Hora do intervalo.');
      startBlock('break');
    } else {
      toast.info('Intervalo pulado.');
      setTimerState('idle');
      setTimeLeft(0);
    }
    
    setCurrentBlockIndex(prev => prev + 1);
  };

  const handleBackBlock = () => {
    if (blockHistory.length === 0) {
      toast.error('Não há blocos anteriores');
      return;
    }

    // Pausar timer atual
    setTimerState('idle');
    setTimeLeft(0);
    
    // Pegar último bloco
    const lastBlock = blockHistory[blockHistory.length - 1];
    const newHistory = blockHistory.slice(0, -1);
    setBlockHistory(newHistory);
    saveBlockHistory(newHistory);
    
    // Remover progresso se foi bloco de estudo
    if (lastBlock.type === 'focus' && lastBlock.subjectId) {
      const newProgress = {
        ...subjectProgress,
        [lastBlock.subjectId]: Math.max(0, (subjectProgress[lastBlock.subjectId] || 0) - lastBlock.duration)
      };
      setSubjectProgress(newProgress);
      saveProgress(newProgress);
    }
    
    // Voltar para o tipo de bloco anterior
    setCurrentBlockType(lastBlock.type === 'focus' ? 'break' : 'focus');
    setCurrentBlockIndex(prev => Math.max(0, prev - 1));
    
    toast.success('Voltou para o bloco anterior');
  };

  const handleResetCurrentBlock = () => {
    setTimerState('idle');
    const duration = currentBlockType === 'focus' ? settings.study_duration : settings.break_duration;
    setTimeLeft(duration * 60);
    toast.success('Bloco atual resetado');
  };

  const handleResetSubject = () => {
    if (!currentSubject) {
      toast.error('Selecione uma matéria para resetar');
      return;
    }
    
    const newProgress = {
      ...subjectProgress,
      [currentSubject.id]: 0
    };
    setSubjectProgress(newProgress);
    saveProgress(newProgress);
    
    // Remover blocos desta matéria do histórico
    const newHistory = blockHistory.filter(b => b.subjectId !== currentSubject.id);
    setBlockHistory(newHistory);
    saveBlockHistory(newHistory);
    
    toast.success(`Progresso de ${currentSubject.name} resetado`);
  };

  const handleResetCycle = () => {
    setSubjectProgress({});
    setBlockHistory([]);
    saveProgress({});
    saveBlockHistory([]);
    setTimerState('idle');
    setTimeLeft(0);
    setCurrentBlockIndex(0);
    toast.success('Ciclo resetado');
  };

  // Cálculos de progresso
  const getSubjectProgressPercentage = (subjectId) => {
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return 0;
    
    const completed = subjectProgress[subjectId] || 0;
    const goal = subject.time_goal || 1;
    return Math.min(100, (completed / goal) * 100);
  };

  const getCycleProgressPercentage = () => {
    const totalGoal = subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0);
    if (totalGoal === 0) return 0;
    
    const totalCompleted = Object.values(subjectProgress).reduce((sum, val) => sum + val, 0);
    return Math.min(100, (totalCompleted / totalGoal) * 100);
  };

  const getCurrentSubjectProgress = () => {
    if (!currentSubject) return 0;
    return getSubjectProgressPercentage(currentSubject.id);
  };

  // Funções de matérias
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
      
      setSubjects([...subjects, response.data]);
      setShowAddSubject(false);
      setNewSubject({ name: '', color: '#3b82f6', time_goal: 300 });
      toast.success('Matéria adicionada');
    } catch (error) {
      console.error('Erro ao adicionar matéria:', error);
      toast.error('Erro ao adicionar matéria');
    }
  };

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

  // Formatação de tempo
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

  // Botão do timer (muda de Iniciar -> Pausar -> Retomar)
  const getTimerButtonText = () => {
    if (timerState === 'idle') return 'Iniciar';
    if (timerState === 'paused') return 'Retomar';
    return 'Pausar';
  };

  const getTimerButtonIcon = () => {
    if (timerState === 'idle' || timerState === 'paused') return <Play className="w-5 h-5" />;
    return <Pause className="w-5 h-5" />;
  };

  if (!user) {
    return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Cabeçalho com Avatar e Info do Usuário */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <ModernSealAvatar size={80} />
            <div>
              <h1 className="text-3xl font-bold">{user.nickname}#{user.tag}</h1>
              <p className="text-gray-400">Level {user.level} • {user.coins} moedas</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Coluna Esquerda - Timer */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card do Timer */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
              <div className="text-center mb-6">
                <p className="text-sm text-gray-400 mb-2">
                  {currentBlockType === 'focus' ? 'Estudando' : 'Intervalo'}
                  {currentSubject && currentBlockType === 'focus' && ` - ${currentSubject.name}`}
                </p>
                <div className="text-7xl font-bold mb-4">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-sm text-gray-400">
                  {timerState === 'idle' && 'Clique em Iniciar para começar'}
                  {timerState === 'paused' && 'Timer pausado'}
                  {(timerState === 'focus' || timerState === 'break') && 'Timer rodando...'}
                </p>
              </div>

              {/* Progresso da Matéria Atual */}
              {currentSubject && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progresso de {currentSubject.name}</span>
                    <span>{getCurrentSubjectProgress().toFixed(1)}%</span>
                  </div>
                  <Progress value={getCurrentSubjectProgress()} className="h-3" />
                </div>
              )}

              {/* Progresso do Ciclo */}
              <div className="mb-8">
                <div className="flex justify-between text-sm mb-2">
                  <span>Progresso do Ciclo</span>
                  <span>{getCycleProgressPercentage().toFixed(1)}%</span>
                </div>
                <Progress value={getCycleProgressPercentage()} className="h-3" />
              </div>

              {/* Controles do Timer */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Button
                  onClick={handleBackBlock}
                  disabled={blockHistory.length === 0}
                  className="h-14 bg-slate-700 hover:bg-slate-600"
                >
                  <SkipBack className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
                
                <Button
                  onClick={handleTimerToggle}
                  className="h-14 bg-cyan-600 hover:bg-cyan-500"
                >
                  {getTimerButtonIcon()}
                  <span className="ml-2">{getTimerButtonText()}</span>
                </Button>
                
                <Button
                  onClick={handleSkipBlock}
                  disabled={timerState === 'idle'}
                  className="h-14 bg-slate-700 hover:bg-slate-600"
                >
                  <SkipForward className="w-5 h-5 mr-2" />
                  Pular
                </Button>
              </div>

              {/* Botões de Reset */}
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={handleResetCurrentBlock}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset Bloco
                </Button>
                
                <Button
                  onClick={handleResetSubject}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled={!currentSubject}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset Matéria
                </Button>
                
                <Button
                  onClick={handleResetCycle}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset Ciclo
                </Button>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">Estatísticas</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Total Estudado</p>
                  <p className="text-2xl font-bold">
                    {formatMinutes(Object.values(subjectProgress).reduce((sum, val) => sum + val, 0))}
                  </p>
                </div>
                <div className="bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-gray-400">Blocos Completados</p>
                  <p className="text-2xl font-bold">
                    {blockHistory.filter(b => b.type === 'focus').length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Coluna Direita - Matérias */}
          <div className="space-y-6">
            {/* Lista de Matérias */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Matérias</h3>
                <Button
                  onClick={() => setShowAddSubject(true)}
                  size="sm"
                  className="bg-cyan-600 hover:bg-cyan-500"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Adicionar
                </Button>
              </div>

              <div className="space-y-3">
                {subjects.map(subject => (
                  <div
                    key={subject.id}
                    onClick={() => setCurrentSubject(subject)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      currentSubject?.id === subject.id
                        ? 'bg-cyan-600/20 border-2 border-cyan-600'
                        : 'bg-slate-700/50 border-2 border-transparent hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: subject.color }}
                        />
                        <span className="font-semibold">{subject.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEditSubject(subject);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSubject(subject.id);
                          }}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{formatMinutes(subjectProgress[subject.id] || 0)} / {formatMinutes(subject.time_goal)}</span>
                        <span>{getSubjectProgressPercentage(subject.id).toFixed(0)}%</span>
                      </div>
                      <Progress value={getSubjectProgressPercentage(subject.id)} className="h-2" />
                    </div>
                  </div>
                ))}
                
                {subjects.length === 0 && (
                  <p className="text-center text-gray-400 py-8">
                    Nenhuma matéria ainda. Adicione uma para começar!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog Adicionar Matéria */}
      <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Matéria</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome</Label>
              <Input
                value={newSubject.name}
                onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                placeholder="Ex: Matemática"
              />
            </div>
            <div>
              <Label>Cor</Label>
              <Input
                type="color"
                value={newSubject.color}
                onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })}
              />
            </div>
            <div>
              <Label>Meta Semanal (minutos)</Label>
              <Input
                type="number"
                value={newSubject.time_goal}
                onChange={(e) => setNewSubject({ ...newSubject, time_goal: parseInt(e.target.value) || 0 })}
              />
            </div>
            <Button onClick={handleAddSubject} className="w-full">
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Matéria */}
      {showEditSubject && (
        <Dialog open={!!showEditSubject} onOpenChange={() => setShowEditSubject(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Matéria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  defaultValue={showEditSubject.name}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, name: e.target.value })}
                />
              </div>
              <div>
                <Label>Cor</Label>
                <Input
                  type="color"
                  defaultValue={showEditSubject.color}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, color: e.target.value })}
                />
              </div>
              <div>
                <Label>Meta Semanal (minutos)</Label>
                <Input
                  type="number"
                  defaultValue={showEditSubject.time_goal}
                  onChange={(e) => setShowEditSubject({ ...showEditSubject, time_goal: parseInt(e.target.value) || 0 })}
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
                className="w-full"
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
