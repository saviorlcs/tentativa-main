/**
 * Display do Timer Pomodoro
 * 
 * Mostra o timer principal com controles de play/pause,
 * skip, reset e navegação entre blocos
 */
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from 'lucide-react';
import { Button } from '../ui/button';
import { formatTime } from '@/lib/dashboard/timerHelpers';

function TimerDisplay({ 
  timeLeft,
  isRunning,
  currentPhase,
  currentSubject,
  onToggle,
  onSkip,
  onPrevious,
  onReset
}) {
  // Define nome e emoji da fase atual
  const phaseName = currentPhase === 'study' 
    ? 'Estudo' 
    : currentPhase === 'long_break' 
      ? 'Pausa Longa' 
      : 'Pausa Curta';
      
  const phaseEmoji = currentPhase === 'study' 
    ? '📚' 
    : currentPhase === 'long_break' 
      ? '🌟' 
      : '☕';

  return (
    <div className="backdrop-blur bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700/50 shadow-2xl">
      {/* Fase atual */}
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">{phaseEmoji}</div>
        <h2 className="text-2xl font-bold text-white mb-1">{phaseName}</h2>
        {currentPhase === 'study' && currentSubject && (
          <p className="text-cyan-400 font-semibold">{currentSubject.name}</p>
        )}
      </div>

      {/* Timer Display */}
      <div className="text-center mb-8">
        <div className="text-7xl font-bold text-white tabular-nums tracking-tight">
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Controles */}
      <div className="flex items-center justify-center gap-3">
        {/* Botão Voltar */}
        <Button
          size="lg"
          variant="outline"
          onClick={onPrevious}
          className="h-14 w-14 rounded-full border-slate-600 hover:bg-slate-700/50 hover:border-slate-500"
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        {/* Botão Play/Pause */}
        <Button
          size="lg"
          onClick={onToggle}
          className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25"
        >
          {isRunning ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        {/* Botão Pular */}
        <Button
          size="lg"
          variant="outline"
          onClick={onSkip}
          className="h-14 w-14 rounded-full border-slate-600 hover:bg-slate-700/50 hover:border-slate-500"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* Botão Reset */}
      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-gray-400 hover:text-white hover:bg-slate-700/30"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Resetar Bloco
        </Button>
      </div>
    </div>
  );
}

export default TimerDisplay;
