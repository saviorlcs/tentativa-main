// frontend/src/hooks/usePageTitle.js
import { useEffect } from 'react';

/**
 * Hook para atualizar o título da página (aba do navegador)
 * Similar ao Pomofocus - mostra timer, status e matéria
 */
export function usePageTitle(remainingMs, status, subjectName) {
  useEffect(() => {
    // Se não tiver timer ativo, volta ao título padrão
    if (status === "idle" || !remainingMs) {
      document.title = "Pomociclo - Estudo Focado";
      return;
    }

    // Formata o tempo restante
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    // Define o emoji baseado no status
    const statusEmoji = status === "running" ? "⏱️" : "⏸️";
    const statusText = status === "running" ? "Estudando" : "Pausado";

    // Monta o título
    let title = `${timeStr} - ${statusText}`;
    
    if (subjectName) {
      title += ` - ${subjectName}`;
    }
    
    title += " | Pomociclo";

    document.title = title;
  }, [remainingMs, status, subjectName]);
}
