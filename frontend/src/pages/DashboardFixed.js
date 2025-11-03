/**
 * Dashboard Principal - Pomociclo
 * ================================
 * 
 * Página principal do aplicativo com timer Pomodoro gamificado.
 * Arquitetura modular com componentes e hooks separados.
 * 
 * Estrutura:
 * - Hooks personalizados para lógica complexa
 * - Componentes reutilizáveis para UI
 * - Gerenciamento centralizado de estado
 */
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Trophy, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { api } from '@/lib/api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useBackgroundTimer } from '../hooks/useBackgroundTimer';
import { useApp } from '@/context/AppContext';

// Componentes modulares
import TimerDisplay from '../components/dashboard/TimerDisplay';
import SubjectList from '../components/dashboard/SubjectList';
import SubjectDialog from '../components/dashboard/SubjectDialog';
import StatsPanel from '../components/dashboard/StatsPanel';
import CycleVisualization from '../components/dashboard/CycleVisualization';
import ProgressBar from '../components/dashboard/ProgressBar';

// Hooks personalizados
import { useSubjects } from '../hooks/dashboard/useSubjects';
import { useLocalProgress } from '../hooks/dashboard/useLocalProgress';
import { useBlockHistory } from '../hooks/dashboard/useBlockHistory';
import { useTimerLogic } from '../hooks/dashboard/useTimerLogic';

// Utilitários
import { formatTime, formatMinutes } from '../lib/dashboard/timerHelpers';

function DashboardFixed() {
  const { me: user, refreshUser } = useApp();
  
  // Estados de configurações e dados
  const [settings, setSettings] = useState({ 
    study_duration: 50, 
    break_duration: 10,
    long_break_duration: 30,
    long_break_interval: 4
  });
  const [stats, setStats] = useState(null);
  const [shopItems, setShopItems] = useState([]);
  
  // Estados de UI
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(null);
  const [showResetSubjectDialog, setShowResetSubjectDialog] = useState(false);
  const [activeId, setActiveId] = useState(null);

  // Hook do timer de fundo
  const backgroundTimer = useBackgroundTimer('dashboard-timer');

  // Hooks personalizados de lógica
  const {
    subjects,
    currentSubject,
    loading,
    loadSubjects,
    addSubject,
    updateSubject,
    deleteSubject,
    reorderSubjects,
    selectSubject,
    setCurrentSubject
  } = useSubjects();

  const {
    localProgress,
    progressUpdateTrigger,
    isLoadedFromStorage,
    updateProgress,
    resetProgress,
    resetAllProgress,
    mergeBackendProgress
  } = useLocalProgress(subjects, stats);

  const {
    blockHistory,
    currentPhase,
    isLoadedFromStorage: historyLoaded,
    addBlock,
    removeLastBlock,
    clearHistory
  } = useBlockHistory(settings);

  const {
    toggleTimer,
    resetCurrentBlock,
    previousBlock,
    skipBlock,
    isCurrentSubjectComplete
  } = useTimerLogic({
    backgroundTimer,
    currentPhase,
    currentSubject,
    subjects,
    settings,
    blockHistory,
    localProgress,
    updateProgress,
    addBlock,
    removeLastBlock,
    refreshUser,
    setCurrentSubject,
    setProgressUpdateTrigger: (fn) => {
      // Wrapper para manter compatibilidade
    }
  });

  // Informações da fase atual
  const phaseName = currentPhase === 'study' 
    ? 'Estudo' 
    : currentPhase === 'long_break' 
      ? 'Pausa Longa' 
      : 'Pausa Curta';
      
  const phaseEmoji = currentPhase === 'study' 
    ? '📚' 
    : currentPhase === 'long_break' 
      ? '🌟' 
      : '☕';

  const phaseColor = currentPhase === 'study' 
    ? '#22d3ee' 
    : currentPhase === 'long_break' 
      ? '#a855f7' 
      : '#22c55e';

  // Atualiza título da página
  usePageTitle(
    backgroundTimer.isRunning 
      ? `${formatTime(backgroundTimer.timeLeft)} - ${phaseName}` 
      : 'Dashboard'
  );

  /**
   * Carrega dados iniciais do backend
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectsData, statsRes, settingsRes, shopRes] = await Promise.all([
          loadSubjects(),
          api.get('/stats'),
          api.get('/settings'),
          api.get('/shop/all').catch(() => ({ data: { items: [] } }))
        ]);

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

        // Mescla progresso do backend com localStorage
        mergeBackendProgress(statsRes.data);
      } catch (error) {
        console.error('[DashboardFixed] Erro ao carregar dados:', error);
        toast.error('Erro ao carregar dados');
      }
    };

    fetchData();
    refreshUser();
  }, []);

  /**
   * Handlers de matérias
   */
  const handleAddSubject = async (formData) => {
    await addSubject(formData);
  };

  const handleUpdateSubject = async (subjectId, updates) => {
    await updateSubject(subjectId, updates);
    setShowEditSubject(null);
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta matéria?')) return;
    await deleteSubject(subjectId);
  };

  const handleSubjectClick = (subject) => {
    selectSubject(subject);
  };

  /**
   * Handlers de drag & drop
   */
  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      reorderSubjects(active.id, over.id);
    }
    
    setActiveId(null);
  };

  /**
   * Reset de matéria/ciclo
   */
  const openResetSubjectDialog = () => {
    if (!currentSubject) { 
      toast.error('Nenhuma matéria selecionada'); 
      return; 
    }
    setShowResetSubjectDialog(true);
  };

  const resetCurrentSubject = (resetLongBreakCounter = false) => {
    if (!currentSubject) return;
    
    resetProgress(currentSubject.id);
    backgroundTimer.pause();
    backgroundTimer.reset((settings?.study_duration || 50) * 60);
    
    if (resetLongBreakCounter) {
      clearHistory();
    }
    
    toast.success(
      resetLongBreakCounter 
        ? 'Matéria e contagem de pausa longa resetadas!' 
        : 'Matéria resetada (contagem de pausa longa mantida)'
    );
    
    setShowResetSubjectDialog(false);
  };

  const resetCycle = () => {
    backgroundTimer.pause();
    clearHistory();
    resetAllProgress();
    backgroundTimer.reset((settings?.study_duration || 50) * 60);
    toast.success('Ciclo resetado completamente');
  };

  /**
   * Estatísticas de blocos
   */
  const studyBlocksCount = blockHistory.filter(b => b.type === 'study').length;
  const nextLongBreakIn = settings.long_break_interval - (studyBlocksCount % settings.long_break_interval);

  /**
   * Sistema de Quests (simplificado)
   */
  const totalStudied = useMemo(() => {
    return Object.values(localProgress).reduce((sum, mins) => sum + mins, 0);
  }, [localProgress]);

  const minutesStudiedSoFar = useMemo(() => {
    return (stats?.subjects || []).reduce((s, x) => s + (x.time_studied || 0), 0);
  }, [stats]);

  const fourQuests = useMemo(() => {
    const genQuest = (key, title, target, progress) => ({
      id: `local-${key}`,
      title,
      target,
      progress,
      coins_reward: Math.ceil(target / 5),
      xp_reward: Math.ceil(target / 5) * 10,
      completed: progress >= target
    });

    return [
      genQuest('study-300', 'Estudar 300 min na semana', 300, minutesStudiedSoFar),
      genQuest('sessions-6', 'Concluir 6 sessões', 6, stats?.sessions_completed || 0),
      genQuest('complete-cycle', 'Completar 1 ciclo', 1, (stats?.cycle_progress ?? 0) >= 100 ? 1 : 0),
    ];
  }, [stats, minutesStudiedSoFar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-white text-xl">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white">
      <Header />

      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          
          {/* Coluna Central - Timer e Matérias */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer Principal */}
            <div className="rounded-3xl p-8 bg-gradient-to-br from-slate-800/60 via-slate-800/50 to-slate-900/60 border border-slate-700/50 shadow-2xl backdrop-blur-xl">
              
              {/* Informações do Usuário */}
              <div className="text-center mb-6">
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  {phaseName}
                </h1>
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
                <div className="mt-3 inline-block px-4 py-1 rounded-full text-xs font-semibold border"
                     style={{
                       backgroundColor: `${phaseColor}15`,
                       borderColor: `${phaseColor}50`,
                       color: phaseColor
                     }}>
                  {studyBlocksCount} blocos completados • Próxima pausa longa em {nextLongBreakIn} blocos
                </div>
              </div>

              {/* Display do Timer */}
              <div className="text-center mb-8">
                <div className="text-9xl font-bold mb-2 tracking-tight font-mono transition-colors duration-300 drop-shadow-2xl"
                     style={{
                       color: phaseColor,
                       textShadow: `0 0 40px ${phaseColor}60`
                     }}>
                  {isCurrentSubjectComplete() && currentPhase === 'study' 
                    ? '00:00' 
                    : formatTime(backgroundTimer.timeLeft)}
                </div>
                <p className="text-gray-400 text-lg font-medium">
                  {isCurrentSubjectComplete() && currentPhase === 'study' 
                    ? '✅ Matéria completa!' 
                    : `${currentPhase === 'study' ? settings.study_duration :
                         currentPhase === 'long_break' ? settings.long_break_duration :
                         settings.break_duration} min`}
                </p>
              </div>

              {/* Controles do Timer */}
              <TimerDisplay
                timeLeft={backgroundTimer.timeLeft}
                isRunning={backgroundTimer.isRunning}
                currentPhase={currentPhase}
                currentSubject={currentSubject}
                onToggle={toggleTimer}
                onSkip={skipBlock}
                onPrevious={previousBlock}
                onReset={resetCurrentBlock}
              />

              {/* Botões de Reset */}
              <div className="flex gap-2 mt-6 justify-center">
                <Button
                  onClick={openResetSubjectDialog}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700/50"
                  disabled={!currentSubject}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Matéria
                </Button>
                <Button
                  onClick={resetCycle}
                  variant="outline"
                  size="sm"
                  className="border-slate-600 text-gray-300 hover:bg-slate-700/50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Ciclo
                </Button>
              </div>
            </div>

            {/* Lista de Matérias */}
            <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                  Fila de Estudos
                </h2>
                <Button
                  onClick={() => setShowAddSubject(true)}
                  size="sm"
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Matéria
                </Button>
              </div>

              <SubjectList
                subjects={subjects}
                currentSubject={currentSubject}
                localProgress={localProgress}
                progressUpdateTrigger={progressUpdateTrigger}
                onSubjectClick={handleSubjectClick}
                onSubjectEdit={(subject) => setShowEditSubject(subject)}
                onSubjectDelete={handleDeleteSubject}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              />
            </div>
          </div>

          {/* Coluna Direita - Visualização e Stats */}
          <div className="lg:col-span-1 space-y-6">
            {/* Painel de Estatísticas */}
            <StatsPanel user={user} stats={stats} />

            {/* Visualização do Ciclo */}
            <div className="bg-gradient-to-br from-slate-800/70 via-slate-800/60 to-slate-900/70 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2">
                  Mapa do Ciclo
                </h2>
                <p className="text-sm text-gray-300 font-medium">Distribuição interativa das matérias</p>
              </div>

              <CycleVisualization
                subjects={subjects}
                currentSubject={currentSubject}
                onSubjectSelect={handleSubjectClick}
                totalStudied={totalStudied}
              />
            </div>

            {/* Missões Semanais */}
            <div className="bg-gradient-to-br from-purple-900/30 via-slate-800/50 to-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-400 to-pink-400">
                  Missões Semanais
                </h2>
              </div>

              <div className="space-y-3">
                {fourQuests.map((quest) => {
                  const progressPct = quest.target > 0 
                    ? Math.min(100, (quest.progress / quest.target) * 100) 
                    : 0;
                    
                  return (
                    <div
                      key={quest.id}
                      className={`relative overflow-hidden rounded-xl p-3 transition-all duration-300 ${
                        quest.completed
                          ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-2 border-green-500/50'
                          : 'bg-slate-800/60 border-2 border-slate-700/50'
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
                        <p className="text-sm font-semibold text-white">{quest.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <span>💰 {quest.coins_reward} coins</span>
                          <span>⭐ {quest.xp_reward} XP</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <ProgressBar value={progressPct} className="flex-1" />
                        <span className="text-xs text-gray-400 tabular-nums">
                          {quest.progress}/{quest.target}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Diálogo Adicionar Matéria */}
      <SubjectDialog
        isOpen={showAddSubject}
        onClose={() => setShowAddSubject(false)}
        onSave={handleAddSubject}
        mode="add"
      />

      {/* Diálogo Editar Matéria */}
      {showEditSubject && (
        <SubjectDialog
          isOpen={true}
          onClose={() => setShowEditSubject(null)}
          onSave={(data) => handleUpdateSubject(showEditSubject.id, data)}
          subject={showEditSubject}
          mode="edit"
        />
      )}

      {/* Diálogo Reset Matéria */}
      <Dialog open={showResetSubjectDialog} onOpenChange={setShowResetSubjectDialog}>
        <DialogContent className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-white text-xl font-bold">
              Resetar Matéria Atual
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <p className="text-gray-300 text-base">
              Você está prestes a resetar a matéria{' '}
              <span className="font-bold text-cyan-400">{currentSubject?.name}</span>.
            </p>
            <p className="text-gray-400 text-sm">
              Deseja também resetar a contagem de blocos até a próxima pausa longa?
            </p>
            
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
