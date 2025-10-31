import { useEffect, useRef } from "react";

function mmss(total) {
  const s = Math.max(0, Math.floor(total || 0));
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}

/**
 * Atualiza o título da aba no estilo Pomofocus compacto.
 * Ex.: "🔴 24:59 — Matemática | Pomociclo"
 */
export default function useTabTimerTitle({
  seconds,
  running,
  phase = "idle",           // "study" | "break" | "idle"
  subject = "",             // "Matemática"
  appName = "Pomociclo",
  compact = true,           // mantém curto por padrão
}) {
  const original = useRef(document.title);

  useEffect(() => {
    const icon =
      phase === "study" ? (running ? "🔴" : "⏸️") :
      phase === "break" ? (running ? "☕" : "⏸️") : "🟦";

    const timer = seconds != null ? mmss(seconds) : "";

    if (compact && seconds != null) {
      // 🔴 24:59 — Matemática | Pomociclo
      const right = subject ? `${subject} | ${appName}` : appName;
      document.title = `${icon} ${timer} — ${right}`;
    } else {
      // modo “completo” (fallback)
      const phaseLabel = phase === "study" ? "Estudo" :
                         phase === "break" ? "Intervalo" : "Pomociclo";
      const subj = subject ? ` · ${subject}` : "";
      document.title =
        seconds != null
          ? `${icon} ${timer} — ${phaseLabel}${subj} | ${appName}`
          : `${appName}`;
    }
  }, [seconds, running, phase, subject, appName, compact]);

  useEffect(() => () => { document.title = original.current; }, []);
}
