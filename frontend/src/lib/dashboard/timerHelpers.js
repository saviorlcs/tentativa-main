/**
 * Utilitários para formatação de tempo do timer
 * 
 * Funções auxiliares para formatar tempo em diferentes formatos
 * usados no dashboard do Pomodoro
 */

/**
 * Formata segundos para MM:SS
 * @param {number} seconds - Tempo em segundos
 * @returns {string} Tempo formatado como "MM:SS"
 * @example formatTime(125) // "02:05"
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Formata minutos para formato legível (Xh Ymin ou Ymin)
 * @param {number} minutes - Tempo em minutos
 * @returns {string} Tempo formatado
 * @example formatMinutes(125) // "2h 5min"
 * @example formatMinutes(45) // "45min"
 */
export const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}min`;
  }
  return `${mins}min`;
};

/**
 * Calcula tempo planejado de uma matéria em segundos
 * @param {Object} subject - Objeto da matéria
 * @returns {number} Tempo em segundos
 */
export const getPlannedSeconds = (subject) => {
  if (!subject) return 0;
  if (typeof subject.plannedSeconds === 'number') return subject.plannedSeconds;
  if (typeof subject.planned_minutes === 'number') return subject.planned_minutes * 60;
  if (typeof subject.plannedHours === 'number') return subject.plannedHours * 3600;
  return 0;
};

/**
 * Calcula tempo planejado de uma matéria em minutos
 * @param {Object} subject - Objeto da matéria
 * @returns {number} Tempo em minutos
 */
export const getPlannedMinutes = (subject) => {
  if (!subject) return 0;
  return Number(subject.time_goal || 0);
};

/**
 * Log condicional (apenas em desenvolvimento)
 */
export const DEBUG = process.env.NODE_ENV === 'development';
export const debugLog = (...args) => DEBUG && console.log(...args);
