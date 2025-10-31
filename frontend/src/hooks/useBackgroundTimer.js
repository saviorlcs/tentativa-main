import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook para timer que funciona em background
 * - Continua rodando quando aba está em segundo plano
 * - Para quando aba é fechada (beforeunload)
 * - Baseado em timestamp para precisão
 */
export function useBackgroundTimer(storageKey = 'timer-state') {
  const [timeLeft, setTimeLeft] = useState(0); // segundos
  const [isRunning, setIsRunning] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(null);

  // Carregar estado do localStorage ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.isRunning && state.endTime) {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));
          
          if (remaining > 0) {
            setTimeLeft(remaining);
            setIsRunning(true);
            setStartTime(state.startTime);
            setDuration(state.duration);
          } else {
            // Timer já completou enquanto estava fechado
            setTimeLeft(0);
            setIsRunning(false);
            localStorage.removeItem(storageKey);
          }
        }
      }
    } catch (e) {
      console.error('Erro ao carregar timer:', e);
    }
  }, [storageKey]);

  // Atualizar timer
  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Calcular timeLeft baseado em timestamp
    const updateTime = () => {
      try {
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
          setIsRunning(false);
          return;
        }

        const state = JSON.parse(saved);
        if (!state.endTime) {
          setIsRunning(false);
          return;
        }

        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((state.endTime - now) / 1000));

        setTimeLeft(remaining);

        if (remaining <= 0) {
          setIsRunning(false);
          localStorage.removeItem(storageKey);
          
          // Chamar callback de conclusão
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        }
      } catch (e) {
        console.error('Erro ao atualizar timer:', e);
      }
    };

    // Atualizar imediatamente
    updateTime();

    // Atualizar a cada 100ms para precisão
    intervalRef.current = setInterval(updateTime, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, storageKey]);

  // Salvar estado no localStorage quando mudar
  useEffect(() => {
    if (isRunning && startTime) {
      const endTime = startTime + duration * 1000;
      const state = {
        isRunning,
        startTime,
        duration,
        endTime,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } else if (!isRunning) {
      localStorage.removeItem(storageKey);
    }
  }, [isRunning, startTime, duration, storageKey]);

  // Parar timer quando aba fechar
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.removeItem(storageKey);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handleBeforeUnload);
    };
  }, [storageKey]);

  // Iniciar timer
  const start = useCallback((seconds) => {
    const now = Date.now();
    setStartTime(now);
    setDuration(seconds);
    setTimeLeft(seconds);
    setIsRunning(true);
  }, []);

  // Pausar timer
  const pause = useCallback(() => {
    setIsRunning(false);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Resetar timer
  const reset = useCallback((seconds) => {
    setIsRunning(false);
    setTimeLeft(seconds);
    setStartTime(null);
    setDuration(seconds);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  // Registrar callback de conclusão
  const onComplete = useCallback((callback) => {
    onCompleteRef.current = callback;
  }, []);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    onComplete,
  };
}
