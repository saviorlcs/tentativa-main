/**
 * Componente de Barra de Progresso
 * 
 * Exibe uma barra de progresso animada com gradiente
 * Otimizado com React.memo para evitar re-renders desnecessários
 */
import { memo } from 'react';

const ProgressBar = memo(function ProgressBar({ value, className = "", forceUpdateKey }) {
  // Garante que o valor está entre 0 e 100
  const normalizedValue = Math.max(0, Math.min(100, Number(value) || 0));
  
  return (
    <div 
      className={`h-2 rounded-full bg-slate-700/50 overflow-hidden ${className}`} 
      key={forceUpdateKey}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-cyan-500 transition-[width] duration-500"
        style={{ width: `${normalizedValue}%` }}
      />
    </div>
  );
});

export default ProgressBar;
