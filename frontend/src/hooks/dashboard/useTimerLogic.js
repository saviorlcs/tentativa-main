/**
 * Hook para lógica do Timer Pomodoro
 * 
 * Gerencia toda a lógica complexa do timer incluindo:
 * - Toggle play/pause
 * - Conclusão de blocos
 * - Skip de blocos
 * - Navegação (voltar/avançar)
 * - Reset de blocos e ciclos
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { alarmSystem } from '@/lib/alarmNotification';

export function useTimerLogic({
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
  setProgressUpdateTrigger
}) {
  const [sessionId, setSessionId] = useState(null);
  const [isManualSubjectSelection, setIsManualSubjectSelection] = useState(false);

  /**
   * Verifica se a matéria atual está completa
   */
  const isCurrentSubjectComplete = useCallback(() => {
    if (!currentSubject) return false;
    const planned = Number(currentSubject.time_goal || 0);
    if (!planned) return false;
    const studied = Math.max(0, (localProgress?.[currentSubject.id] || 0));
    return studied >= planned;
  }, [currentSubject, localProgress]);

  /**
   * Avança para a próxima matéria
   */
  const advanceToNextSubject = useCallback(() => {
    if (!subjects?.length || !currentSubject) return;
    const idx = subjects.findIndex(s => s.id === currentSubject.id);
    if (idx === -1) return;
    const next = subjects[(idx + 1) % subjects.length];

    setCurrentSubject(next);
    setIsManualSubjectSelection(false);
    setProgressUpdateTrigger(prev => prev + 1);

    backgroundTimer.pause();
    toast.info(`Próxima matéria: ${next.name}`);
  }, [subjects, currentSubject, backgroundTimer, setCurrentSubject, setProgressUpdateTrigger]);

  /**
   * Handler de conclusão de bloco
   */
  const handleBlockCompleteRef = useRef(null);
  
  const handleBlockComplete = useCallback(async () => {
    console.log('[handleBlockComplete] iniciando...', { currentPhase, currentSubject });
    backgroundTimer.pause();

    await alarmSystem.trigger(
      '⏰ Timer Completo!',
      currentPhase === 'study' ? 'Bloco de estudo completo!' : 'Pausa completa!'
    );

    // Duração do bloco
    const concludedMinutesTimer = currentPhase === 'study'
      ? (settings?.study_duration || 50)
      : (currentPhase === 'long_break'
          ? (settings?.long_break_duration || 30)
          : (settings?.break_duration || 10));

    const concludedMinutesProgress = currentPhase === 'study'
      ? (settings?.study_duration || 50)
      : (settings?.break_duration || 10);

    const newBlock = {
      type: currentPhase,
      timestamp: new Date().toISOString(),
      duration: concludedMinutesTimer,
      progressDuration: concludedMinutesProgress
    };

    if (currentPhase === 'study' && currentSubject) {
      newBlock.subjectId = currentSubject.id;

      // Atualiza progresso local
      const goal = Number(currentSubject.time_goal || 0) || Infinity;
      updateProgress(currentSubject.id, concludedMinutesProgress, goal);

      // Salva no backend
      try {
        console.log('[handleBlockComplete] Enviando para API:', { 
          session_id: sessionId, 
          duration: concludedMinutesTimer, 
          skipped: false 
        });
        
        const resp = await api.post('/study/end', {
          session_id: sessionId,
          duration: concludedMinutesTimer,
          skipped: false
        });
        
        console.log('[handleBlockComplete] Resposta da API:', resp.data);
        setSessionId(null);
        
        const coinsEarned = resp.data?.coins_earned || 0;
        const xpEarned = resp.data?.xp_earned || 0;
        
        if (coinsEarned > 0 || xpEarned > 0) {
          toast.success(
            `✅ Bloco de ${currentSubject.name} completo!\n💰 +${coinsEarned} coins\n⭐ +${xpEarned} XP`, 
            { duration: 5000 }
          );
        } else {
          toast.warning(
            `⚠️ Bloco completo mas nenhuma recompensa foi recebida!\n💰 Coins: ${coinsEarned}\n⭐ XP: ${xpEarned}`, 
            { duration: 5000 }
          );
        }
        
        refreshUser();
      } catch (error) {
        console.error('❌ [handleBlockComplete] Erro ao salvar sessão:', error);
        toast.error('❌ Erro ao salvar progresso! Progresso local mantido.', { duration: 5000 });
      }
    } else {
      // Pausas também contam na barra
      if (currentSubject) {
        const goal = Number(currentSubject.time_goal || 0) || Infinity;
        updateProgress(currentSubject.id, concludedMinutesProgress, goal);
        newBlock.subjectId = currentSubject.id;
      }
      
      toast.success(`${currentPhase === 'long_break' ? 'Pausa Longa' : 'Pausa Curta'} concluída!`);
    }

    // Registra no histórico
    addBlock(newBlock);

    // Verificar se matéria completou
    if (currentSubject && currentPhase === 'study') {
      const currentProgress = localProgress[currentSubject.id] || 0;
      const updatedProgress = currentProgress + concludedMinutesProgress;
      const subjectGoal = currentSubject.time_goal || 0;
      
      if (updatedProgress >= subjectGoal) {
        const currentIndex = subjects.findIndex(s => s.id === currentSubject.id);
        
        if (currentIndex < subjects.length - 1) {
          const nextSubject = subjects[currentIndex + 1];
          setCurrentSubject(nextSubject);
          setIsManualSubjectSelection(false);
          toast.success(`✅ ${currentSubject.name} completa! Mudando para: ${nextSubject.name}`);
        } else {
          setIsManualSubjectSelection(true);
          toast.success('🎉 Parabéns! Você completou todo o ciclo de estudos!', { duration: 5000 });
        }
      }
    }

    // Prepara próxima fase
    const studyCountSoFar = (blockHistory.filter(b => b.type === 'study').length) + 
                             (currentPhase === 'study' ? 1 : 0);
    const nextPhase = currentPhase === 'study'
      ? (studyCountSoFar % settings.long_break_interval === 0 ? 'long_break' : 'short_break')
      : 'study';

    const nextDuration = nextPhase === 'study'
      ? (settings?.study_duration || 50)
      : (nextPhase === 'long_break' ? (settings?.long_break_duration || 30) : (settings?.break_duration || 10));

    backgroundTimer.reset(nextDuration * 60);
    toast.info(
      nextPhase !== 'study' 
        ? (nextPhase === 'long_break' ? 'Próximo: Pausa Longa 🌟' : 'Próximo: Pausa Curta ☕') 
        : 'Próximo: Estudo 📚'
    );
  }, [
    currentPhase, currentSubject, settings, sessionId, blockHistory, 
    backgroundTimer, localProgress, subjects, refreshUser, updateProgress,
    addBlock, setCurrentSubject, setProgressUpdateTrigger
  ]);

  handleBlockCompleteRef.current = handleBlockComplete;

  // Registra callback de conclusão no backgroundTimer
  useEffect(() => {
    if (!backgroundTimer || typeof backgroundTimer.onComplete !== "function") return;
    
    const off = backgroundTimer.onComplete(() => {
      if (handleBlockCompleteRef.current) handleBlockCompleteRef.current();
    });
    
    return () => { 
      try { 
        off && off(); 
      } catch (_) {} 
    };
  }, [backgroundTimer]);

  /**
   * Toggle play/pause
   */
  const toggleTimer = async () => {
    console.log('[toggleTimer] chamado', { currentPhase, currentSubject, backgroundTimer });

    if (currentPhase === 'study' && !currentSubject) {
      toast.error('Selecione uma matéria para estudar');
      return;
    }

    if (currentPhase === 'study' && isCurrentSubjectComplete()) {
      toast.info('Esta matéria já está completa! Use "Voltar" para reverter blocos ou "Reset" para recomeçar.');
      return;
    }

    try {
      if (backgroundTimer && backgroundTimer.isPaused) {
        backgroundTimer.resume();
        return;
      }

      if (!backgroundTimer || typeof backgroundTimer.start !== 'function') {
        toast.error('Erro interno: temporizador indisponível');
        return;
      }

      if (!backgroundTimer.isRunning) {
        const fallbackSecs = (settings && settings.study_duration) ? settings.study_duration * 60 : 25 * 60;
        const secsToStart = (typeof backgroundTimer.timeLeft === 'number' && backgroundTimer.timeLeft > 0)
          ? backgroundTimer.timeLeft
          : fallbackSecs;

        if (currentPhase === 'study' && secsToStart === (settings?.study_duration || 25) * 60) {
          setIsManualSubjectSelection(false);
          
          try {
            const response = await api.post('/study/start', { subject_id: currentSubject.id });
            const newSessionId = response.data?.id || null;
            setSessionId(newSessionId);
            
            if (!newSessionId) {
              toast.warning('⚠️ Sessão criada sem ID. Você pode não receber recompensas!');
            }
          } catch (error) {
            console.error('❌ [toggleTimer] ERRO ao criar sessão:', error);
            toast.error('❌ Erro ao criar sessão de estudo! Você NÃO receberá coins/XP neste bloco!');
            setSessionId(null);
          }
        }

        backgroundTimer.start(secsToStart);
        return;
      }

      backgroundTimer.pause();
    } catch (err) {
      console.error('[toggleTimer] erro inesperado', err);
      toast.error('Erro ao controlar o timer');
    }
  };

  /**
   * Reseta bloco atual
   */
  const resetCurrentBlock = useCallback(() => {
    backgroundTimer.pause();
    const d = currentPhase === 'study'
      ? settings.study_duration
      : (currentPhase === 'long_break' ? settings.long_break_duration : settings.break_duration);
    backgroundTimer.reset(d * 60);
    toast.success('Bloco atual resetado');
  }, [currentPhase, settings, backgroundTimer]);

  /**
   * Volta um bloco
   */
  const previousBlock = useCallback(() => {
    if (blockHistory.length === 0) {
      toast.info('Não há bloco para voltar');
      return;
    }

    const last = blockHistory[blockHistory.length - 1];

    if (currentSubject && last?.subjectId && last.subjectId !== currentSubject.id) {
      toast.error('Não é possível voltar para blocos de matérias anteriores');
      return;
    }

    const minutesToUndoTimer = typeof last?.duration === 'number'
      ? last.duration
      : (last?.type === 'study'
          ? settings?.study_duration || 50
          : (last.type === 'long_break' ? settings.long_break_duration : settings.break_duration));

    const minutesToUndoProgress = typeof last?.progressDuration === 'number'
      ? last.progressDuration
      : (last?.type === 'study'
          ? settings?.study_duration || 50
          : settings?.break_duration || 10);

    if (last?.subjectId) {
      const subj = subjects.find(s => s.id === last.subjectId);
      const goal = Number(subj?.time_goal || 0) || Infinity;
      updateProgress(last.subjectId, -minutesToUndoProgress, goal);
    }

    removeLastBlock();

    backgroundTimer.pause();
    backgroundTimer.reset(minutesToUndoTimer * 60);
    setSessionId(null);
    setIsManualSubjectSelection(true);
    
    toast.success('Voltou 1 bloco');
    setProgressUpdateTrigger(prev => prev + 1);
  }, [
    blockHistory, subjects, settings, backgroundTimer, 
    updateProgress, currentSubject, removeLastBlock, setProgressUpdateTrigger
  ]);

  /**
   * Pula bloco atual
   */
  const skipBlock = useCallback(() => {
    if (currentPhase === 'study' && !currentSubject) {
      toast.error('Selecione uma matéria');
      return;
    }

    backgroundTimer.pause();

    const studyMin = settings?.study_duration || 50;
    const breakMin = settings?.break_duration || 10;

    if (currentPhase === 'study') {
      if (isCurrentSubjectComplete()) {
        advanceToNextSubject();
        setProgressUpdateTrigger(p => p + 1);
        return;
      }

      const goal = Number(currentSubject?.time_goal || 0) || Infinity;
      updateProgress(currentSubject.id, studyMin, goal);

      const newBlock = {
        type: 'study',
        timestamp: new Date().toISOString(),
        duration: studyMin,
        progressDuration: studyMin,
        skipped: true,
        subjectId: currentSubject.id
      };
      addBlock(newBlock);

      const studyCountSoFar = blockHistory.filter(b => b.type === 'study').length + 1;
      const nextPhase = (studyCountSoFar % settings.long_break_interval === 0) ? 'long_break' : 'short_break';
      const nextDuration = nextPhase === 'long_break' ? settings.long_break_duration : breakMin;

      backgroundTimer.reset(nextDuration * 60);
      toast.info('Bloco de estudo pulado (contabilizado).');
    } else {
      const pauseDurationTimer = currentPhase === 'long_break' ? settings.long_break_duration : breakMin;
      const pauseDurationProgress = breakMin;
      
      const newBlock = {
        type: currentPhase,
        timestamp: new Date().toISOString(),
        duration: pauseDurationTimer,
        progressDuration: pauseDurationProgress,
        skipped: true,
        ...(currentSubject ? { subjectId: currentSubject.id } : {})
      };
      addBlock(newBlock);

      if (currentSubject) {
        const goal = Number(currentSubject.time_goal || 0) || Infinity;
        updateProgress(currentSubject.id, pauseDurationProgress, goal);
      }

      backgroundTimer.reset((settings?.study_duration || 50) * 60);
      toast.info('Pausa pulada (contabilizada).');
    }

    setProgressUpdateTrigger(prev => prev + 1);
  }, [
    currentPhase, currentSubject, settings, blockHistory, backgroundTimer,
    isCurrentSubjectComplete, advanceToNextSubject, updateProgress, addBlock, setProgressUpdateTrigger
  ]);

  return {
    sessionId,
    isManualSubjectSelection,
    toggleTimer,
    resetCurrentBlock,
    previousBlock,
    skipBlock,
    isCurrentSubjectComplete
  };
}
