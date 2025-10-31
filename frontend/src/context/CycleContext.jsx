// frontend/src/context/CycleContext.jsx
import { createContext, useContext, useMemo, useRef, useState, useEffect } from "react";
import { api } from "../lib/api";

const Ctx = createContext(null);
export const useCycle = () => useContext(Ctx);

const STORAGE_KEY = "cycle_timer_state";

export function CycleProvider({ children }) {
  // ---- TIMER (melhorado com timestamps) ----
  const [status, setStatus] = useState("idle"); // "idle" | "running" | "paused"
  const [remainingMs, setRemainingMs] = useState(0);
  const [targetTimestamp, setTargetTimestamp] = useState(null); // quando o timer deve terminar
  const timerRef = useRef(null);
  const rafRef = useRef(null);

  // Salvar estado no localStorage
  const saveTimerState = (state) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save timer state:", e);
    }
  };

  // Carregar estado do localStorage
  const loadTimerState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        return state;
      }
    } catch (e) {
      console.error("Failed to load timer state:", e);
    }
    return null;
  };

  const clearTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  // Função de tick baseada em timestamp real
  const tick = () => {
    if (!targetTimestamp) return;
    
    const now = Date.now();
    const remaining = Math.max(0, targetTimestamp - now);
    
    setRemainingMs(remaining);
    
    if (remaining <= 0) {
      clearTimer();
      setStatus("idle");
      setTargetTimestamp(null);
      saveTimerState({ status: "idle", remainingMs: 0, targetTimestamp: null });
    }
  };

  // Recalcular quando a aba fica visível novamente
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) return;
      
      // Quando volta, recalcula o tempo baseado no timestamp
      if (status === "running" && targetTimestamp) {
        const now = Date.now();
        const remaining = Math.max(0, targetTimestamp - now);
        
        if (remaining <= 0) {
          clearTimer();
          setStatus("idle");
          setRemainingMs(0);
          setTargetTimestamp(null);
          saveTimerState({ status: "idle", remainingMs: 0, targetTimestamp: null });
        } else {
          setRemainingMs(remaining);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [status, targetTimestamp]);

  // Timer principal usando setInterval + requestAnimationFrame para maior precisão
  useEffect(() => {
    if (status !== "running" || !targetTimestamp) {
      clearTimer();
      return;
    }

    // Atualiza a cada 100ms para maior precisão
    timerRef.current = setInterval(tick, 100);

    // Também usa requestAnimationFrame para atualizações suaves
    const rafTick = () => {
      tick();
      if (status === "running") {
        rafRef.current = requestAnimationFrame(rafTick);
      }
    };
    rafRef.current = requestAnimationFrame(rafTick);

    return () => {
      clearTimer();
    };
  }, [status, targetTimestamp]);

  // Carregar estado salvo ao montar
  useEffect(() => {
    const saved = loadTimerState();
    if (saved && saved.status === "running" && saved.targetTimestamp) {
      const now = Date.now();
      const remaining = Math.max(0, saved.targetTimestamp - now);
      
      if (remaining > 0) {
        setStatus("running");
        setRemainingMs(remaining);
        setTargetTimestamp(saved.targetTimestamp);
      }
    } else if (saved && saved.status === "paused") {
      setStatus("paused");
      setRemainingMs(saved.remainingMs || 0);
    }
  }, []);

  function startTimer(ms) {
    clearTimer();
    const now = Date.now();
    const target = now + ms;
    
    setRemainingMs(ms);
    setStatus("running");
    setTargetTimestamp(target);
    saveTimerState({ status: "running", remainingMs: ms, targetTimestamp: target });
  }

  function pauseTimer() {
    if (status !== "running") return;
    clearTimer();
    setStatus("paused");
    setTargetTimestamp(null);
    saveTimerState({ status: "paused", remainingMs, targetTimestamp: null });
  }

  function resumeTimer() {
    if (status !== "paused" || remainingMs <= 0) return;
    
    const now = Date.now();
    const target = now + remainingMs;
    
    clearTimer();
    setStatus("running");
    setTargetTimestamp(target);
    saveTimerState({ status: "running", remainingMs, targetTimestamp: target });
  }

  // ---- ESTUDO (seu modelo antigo, mantido) ----
  const [activeSubject, setActiveSubject] = useState(null); // {id,name,...}
  const [currentBlockMinutes, setCurrentBlockMinutes] = useState(50); // 50/10
  const sessionIdRef = useRef(null);
  const [cycleOverrides, setCycleOverrides] = useState({}); // { [subjectId]: minutosDescontados }

  async function startSubject(subject) {
    // evita start duplicado
    if (activeSubject?.id === subject.id && (status === "running" || status === "paused")) return;

    setActiveSubject(subject);
    setCurrentBlockMinutes(50);

    // abre sessão no backend (se der erro, só ignora)
    try {
      const r = await api.post("/study/start", { subject_id: subject.id });
      sessionIdRef.current = r.data?.id ?? null;
    } catch {}
  }

  async function endCurrentBlock({ skipped = false, minutes = currentBlockMinutes } = {}) {
    if (sessionIdRef.current) {
      try {
        await api.post("/study/end", { session_id: sessionIdRef.current, duration: minutes, skipped });
      } catch {}
    }
    sessionIdRef.current = null;
    clearTimer();
    setStatus("idle");
    setRemainingMs(0);
  }

  /** PULAR BLOCO — funciona mesmo parado */
  async function skipBlock() {
    // para o timer se estiver rodando
    clearTimer();
    setStatus("idle");

    // se tinha sessão aberta, encerra como pulada (sem contar)
    if (sessionIdRef.current) {
      try {
        await api.post("/study/end", { session_id: sessionIdRef.current, duration: 0, skipped: true });
      } catch {}
      sessionIdRef.current = null;
    }

    // prepara o próximo bloco (deixa parado; se quiser, chame startTimer abaixo)
    setRemainingMs(currentBlockMinutes * 60 * 1000);
  }

  /** VOLTAR 1 bloco (apenas visual) */
  function prevBlock() {
    if (!activeSubject) return;
    setCycleOverrides((old) => {
      const m = Math.max(0, (old[activeSubject.id] || 0) + currentBlockMinutes);
      return { ...old, [activeSubject.id]: m };
    });
    clearTimer();
    setStatus("idle");
    sessionIdRef.current = null;
  }

  function resetBlock() {
    clearTimer();
    setStatus("idle");
    sessionIdRef.current = null;
    setRemainingMs(currentBlockMinutes * 60 * 1000);
  }

  function resetCycle() {
    clearTimer();
    setStatus("idle");
    setCycleOverrides({});
    sessionIdRef.current = null;
  }

  const value = useMemo(
    () => ({
      // timer API (usada no Dashboard)
      status,
      remainingMs,
      startTimer,
      pauseTimer,
      resumeTimer,
      skipBlock,
      // estudo / compat
      activeSubject,
      currentBlockMinutes,
      cycleOverrides,
      startSubject,
      endCurrentBlock,
      prevBlock,
      resetBlock,
      resetCycle,
    }),
    [status, remainingMs, activeSubject, currentBlockMinutes, cycleOverrides]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
