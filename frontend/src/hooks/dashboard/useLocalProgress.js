/**
 * Hook para gerenciar progresso local das matérias
 * 
 * Gerencia o progresso de estudo de cada matéria com persistência
 * no localStorage e sincronização com o backend
 */
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'pomociclo_local_progress';

export function useLocalProgress(subjects, stats) {
  const [localProgress, setLocalProgress] = useState({});
  const [progressUpdateTrigger, setProgressUpdateTrigger] = useState(0);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  /**
   * Carrega progresso do localStorage ao iniciar
   */
  useEffect(() => {
    try {
      const savedProgress = localStorage.getItem(STORAGE_KEY);
      
      if (savedProgress) {
        const parsedProgress = JSON.parse(savedProgress);
        console.log('[useLocalProgress] Carregando progresso do localStorage:', parsedProgress);
        setLocalProgress(parsedProgress);
      }
      
      setIsLoadedFromStorage(true);
    } catch (error) {
      console.error('[useLocalProgress] Erro ao carregar do localStorage:', error);
      setIsLoadedFromStorage(true);
    }
  }, []);

  /**
   * Salva progresso no localStorage quando mudar
   */
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    
    try {
      console.log('[useLocalProgress] Salvando progresso no localStorage:', localProgress);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(localProgress));
    } catch (error) {
      console.error('[useLocalProgress] Erro ao salvar no localStorage:', error);
    }
  }, [localProgress, isLoadedFromStorage]);

  /**
   * Mescla progresso do backend com localStorage
   */
  const mergeBackendProgress = useCallback((backendStats) => {
    const savedProgress = localStorage.getItem(STORAGE_KEY);
    let mergedProgress = {};
    
    if (savedProgress) {
      mergedProgress = JSON.parse(savedProgress);
      console.log('[useLocalProgress] Usando localStorage como base');
    }
    
    // Garantir que todas as matérias tenham entrada
    subjects.forEach(subject => {
      if (!(subject.id in mergedProgress)) {
        const subjectStats = backendStats?.subjects?.find(s => s.id === subject.id);
        mergedProgress[subject.id] = subjectStats?.studied_minutes || 0;
      }
    });
    
    setLocalProgress(mergedProgress);
    console.log('[useLocalProgress] Progresso mesclado:', mergedProgress);
  }, [subjects]);

  /**
   * Atualiza progresso de uma matéria
   */
  const updateProgress = useCallback((subjectId, deltaMin, goalMin) => {
    console.log('[updateProgress] Atualizando:', { subjectId, deltaMin, goalMin });
    
    setLocalProgress(prev => {
      const oldMin = Math.max(0, Number(prev?.[subjectId] || 0));
      const nextMin = Math.max(0, Math.min(
        (goalMin ?? Infinity),
        oldMin + Number(deltaMin || 0)
      ));
      
      console.log('[updateProgress] Novo valor:', { oldMin, deltaMin, nextMin });
      
      return { ...prev, [subjectId]: nextMin };
    });
    
    // Força re-render dos componentes
    setProgressUpdateTrigger(prev => prev + 1);
  }, []);

  /**
   * Reseta progresso de uma matéria
   */
  const resetProgress = useCallback((subjectId) => {
    setLocalProgress(prev => ({
      ...prev,
      [subjectId]: 0
    }));
    setProgressUpdateTrigger(prev => prev + 1);
  }, []);

  /**
   * Reseta todo o progresso
   */
  const resetAllProgress = useCallback(() => {
    const emptyProgress = {};
    subjects.forEach(subject => {
      emptyProgress[subject.id] = 0;
    });
    setLocalProgress(emptyProgress);
    setProgressUpdateTrigger(prev => prev + 1);
  }, [subjects]);

  return {
    localProgress,
    progressUpdateTrigger,
    isLoadedFromStorage,
    updateProgress,
    resetProgress,
    resetAllProgress,
    mergeBackendProgress
  };
}
