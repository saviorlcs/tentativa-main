/**
 * Hook para gerenciar histórico de blocos do Pomodoro
 * 
 * Gerencia o histórico linear de blocos de estudo e pausas,
 * permitindo navegação (voltar/avançar) e persistência
 */
import { useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'pomociclo_block_history';

export function useBlockHistory(settings) {
  const [blockHistory, setBlockHistory] = useState([]);
  const [isLoadedFromStorage, setIsLoadedFromStorage] = useState(false);

  /**
   * Carrega histórico do localStorage ao iniciar
   */
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(STORAGE_KEY);
      
      if (savedHistory) {
        const parsedHistory = JSON.parse(savedHistory);
        console.log('[useBlockHistory] Carregando histórico do localStorage:', parsedHistory);
        setBlockHistory(parsedHistory);
      }
      
      setIsLoadedFromStorage(true);
    } catch (error) {
      console.error('[useBlockHistory] Erro ao carregar do localStorage:', error);
      setIsLoadedFromStorage(true);
    }
  }, []);

  /**
   * Salva histórico no localStorage quando mudar
   */
  useEffect(() => {
    if (!isLoadedFromStorage) return;
    
    try {
      console.log('[useBlockHistory] Salvando histórico no localStorage:', blockHistory);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(blockHistory));
    } catch (error) {
      console.error('[useBlockHistory] Erro ao salvar no localStorage:', error);
    }
  }, [blockHistory, isLoadedFromStorage]);

  /**
   * Determina a fase atual baseado no histórico
   */
  const currentPhase = useMemo(() => {
    if (blockHistory.length === 0) return 'study';
    
    const last = blockHistory[blockHistory.length - 1];

    if (last.type === 'study') {
      // Após estudo, vem pausa
      const studyCount = blockHistory.filter(b => b.type === 'study').length;
      return studyCount % settings.long_break_interval === 0 
        ? 'long_break' 
        : 'short_break';
    } else {
      // Após pausa, vem estudo
      return 'study';
    }
  }, [blockHistory, settings.long_break_interval]);

  /**
   * Adiciona um bloco ao histórico
   */
  const addBlock = (block) => {
    setBlockHistory(prev => [...prev, block]);
  };

  /**
   * Remove o último bloco do histórico
   */
  const removeLastBlock = () => {
    setBlockHistory(prev => prev.slice(0, -1));
  };

  /**
   * Limpa todo o histórico
   */
  const clearHistory = () => {
    setBlockHistory([]);
  };

  return {
    blockHistory,
    currentPhase,
    isLoadedFromStorage,
    addBlock,
    removeLastBlock,
    clearHistory
  };
}
