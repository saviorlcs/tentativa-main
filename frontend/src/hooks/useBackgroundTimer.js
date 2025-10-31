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
  const [isPaused, setIsPaused] = useState(false);
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
            setIsPaused(false);
            setStartTime(state.startTime);
            setDuration(state.duration);
          } else {
            // Timer já completou enquanto estava fechado
            setTimeLeft(0);
            setIsRunning(false);
            setIsPaused(false);
            localStorage.removeItem(storageKey);
          }
        } else if (state.isPaused) {
          // Timer estava pausado
          setTimeLeft(state.timeLeft || 0);
          setIsRunning(false);
          setIsPaused(true);
          setDuration(state.duration || 0);
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
        isPaused: false,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } else if (isPaused) {
      // Salvar estado pausado
      const state = {
        isRunning: false,
        isPaused: true,
        timeLeft,
        duration,
      };
      localStorage.setItem(storageKey, JSON.stringify(state));
    } else if (!isRunning && !isPaused) {
      localStorage.removeItem(storageKey);
    }
  }, [isRunning, isPaused, startTime, duration, timeLeft, storageKey]);

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
  // Iniciar timer (substitua a função inteira)
const start = useCallback((seconds) => {
  const now = Date.now();
  const endTime = now + seconds * 1000;

  // ✅ Persistir ANTES de ligar o loop para evitar a corrida com updateTime()
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      isRunning: true,
      startTime: now,
      duration: seconds,
      endTime,
      isPaused: false,
    }));
  } catch {}

  setStartTime(now);
  setDuration(seconds);
  setTimeLeft(seconds);
  setIsRunning(true);
  setIsPaused(false);
}, [storageKey]);


  // Pausar timer
  const pause = useCallback(() => {
  const rem = timeLeft;
  setIsRunning(false);
  setIsPaused(true);
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      isRunning: false,
      isPaused: true,
      timeLeft: rem,
      duration,
    }));
  } catch {}
}, [timeLeft, duration, storageKey]);


  // Retomar timer
  // Retomar timer (substitua a função inteira)
const resume = useCallback(() => {
  if (isPaused && timeLeft > 0) {
    const now = Date.now();
    const endTime = now + timeLeft * 1000;

    // ✅ Persistir antes
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        isRunning: true,
        startTime: now,
        duration: timeLeft,
        endTime,
        isPaused: false,
      }));
    } catch {}

    setStartTime(now);
    setDuration(timeLeft);
    setIsRunning(true);
    setIsPaused(false);
  }
}, [isPaused, timeLeft, storageKey]);


  // Resetar timer
  const reset = useCallback((seconds) => {
    setIsRunning(false);
    setIsPaused(false);
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
    isPaused,
    start,
    pause,
    resume,
    reset,
    onComplete,
  };
}
