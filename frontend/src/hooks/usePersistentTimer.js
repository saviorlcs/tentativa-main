// src/hooks/usePersistentTimer.js
import { useCallback, useEffect, useRef, useState } from "react";

const STORE_KEY = "pomociclo_timer_v2";

function load() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || "null"); } catch { return null; }
}
function save(s) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch {}
}

export default function usePersistentTimer(defaults = { studySec: 25*60, breakSec: 5*60 }) {
  const workerRef = useRef(null);
  const endAtRef = useRef(null);     // timestamp ms
  const modeRef  = useRef("idle");   // 'idle' | 'focus' | 'break' | 'paused'
  const subjRef  = useRef("");       // nome da matéria (p/ título da aba)
  const onCompleteRef = useRef(null); // callback quando timer completa

  // estado derivado (para render)
  const [timeLeft, setTimeLeft] = useState(defaults.studySec);
  const [isStudying, setIsStudying] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Inicializa Web Worker
  useEffect(() => {
    try {
      workerRef.current = new Worker(process.env.PUBLIC_URL + '/timer-worker.js');
      
      workerRef.current.onmessage = (e) => {
        const { type, timeLeft: workerTimeLeft, mode: workerMode } = e.data;
        
        switch (type) {
          case 'TICK':
            setTimeLeft(workerTimeLeft);
            // Salva no localStorage periodicamente
            if (workerTimeLeft % 5 === 0) {
              save({
                endAt: Date.now() + (workerTimeLeft * 1000),
                mode: workerMode,
                timeLeft: workerTimeLeft,
                subject: subjRef.current,
                running: true
              });
            }
            break;
            
          case 'COMPLETE':
            modeRef.current = "idle";
            setIsStudying(false);
            setIsBreak(false);
            setTimeLeft(0);
            save({
              endAt: null,
              mode: "idle",
              timeLeft: 0,
              subject: subjRef.current,
              running: false
            });
            // Chama callback se existir
            if (onCompleteRef.current) {
              onCompleteRef.current(workerMode);
            }
            break;
            
          case 'PAUSED':
            setTimeLeft(workerTimeLeft);
            break;
            
          case 'STOPPED':
            setTimeLeft(defaults.studySec);
            break;
            
          default:
            break;
        }
      };

      workerRef.current.onerror = (error) => {
        console.error('Timer Worker Error:', error);
      };
    } catch (error) {
      console.error('Failed to create Web Worker:', error);
      // Fallback: se Web Worker não funcionar, usa setInterval
      workerRef.current = null;
    }

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
    // eslint-disable-next-line
  }, []);

  // carregar do storage (uma única vez)
  useEffect(() => {
    const s = load();
    if (s?.mode === "focus" || s?.mode === "break") {
      endAtRef.current = s.endAt;
      modeRef.current = s.mode;
      subjRef.current = s.subject || "";
      const rem = Math.max(0, Math.round((s.endAt - Date.now())/1000));
      
      if (rem > 0) {
        setTimeLeft(rem);
        setIsStudying(true);
        setIsBreak(s.mode === "break");
        
        // Reinicia o worker com o tempo restante
        if (workerRef.current) {
          workerRef.current.postMessage({
            type: 'START',
            payload: { seconds: rem, mode: s.mode }
          });
        }
      }
    } else if (s?.mode === "paused") {
      modeRef.current = "paused";
      subjRef.current = s.subject || "";
      setTimeLeft(s.timeLeft ?? defaults.studySec);
      setIsStudying(false);
      setIsBreak(false);
    }
    // eslint-disable-next-line
  }, []);

  // Page Visibility API - ressincroniza quando volta à aba
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && endAtRef.current && (modeRef.current === "focus" || modeRef.current === "break")) {
        // Recalcula o tempo restante baseado no timestamp absoluto
        const rem = Math.max(0, Math.round((endAtRef.current - Date.now())/1000));
        setTimeLeft(rem);
        
        if (rem > 0 && workerRef.current) {
          // Ressincroniza o worker
          workerRef.current.postMessage({
            type: 'START',
            payload: { seconds: rem, mode: modeRef.current }
          });
        } else if (rem === 0) {
          // Timer já completou enquanto estava fora
          modeRef.current = "idle";
          setIsStudying(false);
          setIsBreak(false);
          if (onCompleteRef.current) {
            onCompleteRef.current(modeRef.current);
          }
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const persist = useCallback(() => {
    const running = modeRef.current === "focus" || modeRef.current === "break";
    save({
      endAt: endAtRef.current,
      mode: modeRef.current,
      timeLeft,
      subject: subjRef.current,
      running
    });
  }, [timeLeft]);

  const start = useCallback((sec, subjectName, mode="focus") => {
    endAtRef.current = Date.now() + sec*1000;
    modeRef.current = mode;
    subjRef.current = subjectName || subjRef.current || "";
    setIsStudying(true);
    setIsBreak(mode === "break");
    setTimeLeft(sec);
    
    // Inicia o worker
    if (workerRef.current) {
      workerRef.current.postMessage({
        type: 'START',
        payload: { seconds: sec, mode: mode }
      });
    }
    
    persist();
  }, [persist]);

  const pause = useCallback(() => {
    const rem = Math.max(0, Math.round(((endAtRef.current ?? Date.now()) - Date.now())/1000));
    modeRef.current = "paused";
    setIsStudying(false);
    setIsBreak(false);
    setTimeLeft(rem);
    
    // Pausa o worker
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'PAUSE' });
    }
    
    persist();
  }, [persist]);

  const resume = useCallback(() => {
    const sec = timeLeft;
    const mode = isBreak ? "break" : "focus";
    start(sec, subjRef.current, mode);
  }, [timeLeft, isBreak, start]);

  const reset = useCallback((sec = defaults.studySec) => {
    modeRef.current = "idle";
    endAtRef.current = null;
    setIsStudying(false);
    setIsBreak(false);
    setTimeLeft(sec);
    
    // Para o worker
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'STOP' });
    }
    
    persist();
  }, [defaults.studySec, persist]);

  const setSubject = useCallback((name) => {
    subjRef.current = name || "";
    persist();
  }, [persist]);

  const setOnComplete = useCallback((callback) => {
    onCompleteRef.current = callback;
  }, []);

  return {
    // estado para UI
    timeLeft, isStudying, isBreak,
    // ações
    start, pause, resume, reset, setSubject, setOnComplete,
    // leitura
    getMode: () => modeRef.current,
    getSubject: () => subjRef.current,
    getEndAt: () => endAtRef.current
  };
}
