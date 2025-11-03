/**
 * Visualização do Ciclo de Estudos
 * 
 * Mapa circular interativo mostrando a distribuição de matérias
 * com arcos proporcionais ao tempo de cada uma
 */
import { arcPath } from '@/lib/dashboard/geometryHelpers';
import { formatMinutes } from '@/lib/dashboard/timerHelpers';

function CycleVisualization({ 
  subjects, 
  currentSubject, 
  onSubjectSelect,
  totalStudied 
}) {
  if (!subjects || subjects.length === 0) {
    return (
      <div className="flex items-center justify-center h-80">
        <p className="text-gray-400 text-center">
          Adicione matérias para<br />visualizar o mapa
        </p>
      </div>
    );
  }

  const GAP_DEGREES = 0.15;
  const totalGoal = subjects.reduce((sum, s) => sum + (s.time_goal || 0), 0);

  // Calcula tempo total do ciclo com pausas
  const studyBlockCount = subjects.reduce((sum, s) => {
    const blocks = Math.ceil((s.time_goal || 0) / 50);
    return sum + blocks;
  }, 0);
  const longBreakCount = Math.floor(studyBlockCount / 4);
  const shortBreakCount = studyBlockCount - longBreakCount;
  const totalCycleTimeWithBreaks = totalGoal + (longBreakCount * 30) + (shortBreakCount * 10);

  return (
    <div className="flex flex-col items-center">
      {/* SVG do Mapa Circular */}
      <div className="relative w-full aspect-square max-w-md mx-auto mb-6 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {subjects.map((subject, idx) => {
              let offset = 0;
              for (let i = 0; i < idx; i++) {
                const pct = totalGoal > 0 
                  ? ((subjects[i].time_goal || 0) / totalGoal) * 100 
                  : 100 / subjects.length;
                offset += pct;
              }

              const percentage = totalGoal > 0 
                ? ((subject.time_goal || 0) / totalGoal) * 100 
                : 100 / subjects.length;
              
              const startDegRaw = -90 + (offset * 360) / 100;
              const sweepRaw = (percentage * 360) / 100;
              const startDeg = startDegRaw + GAP_DEGREES;
              const endDeg = startDegRaw + sweepRaw - GAP_DEGREES;

              const safeId = subject.id ?? `subj-${Math.random().toString(36).slice(2)}`;
              const id = `arc-${safeId}`;
              const d = arcPath(100, 100, 70, startDeg, endDeg);
              
              return <path key={id} id={id} d={d} pathLength="100" />;
            })}
          </defs>

          {/* Arcos coloridos */}
          {subjects.map((subject) => {
            const id = `arc-${subject.id}`;
            const isActive = currentSubject?.id === subject.id;

            return (
              <use
                key={`stroke-${id}`}
                href={`#${id}`}
                stroke={subject.color}
                strokeWidth={isActive ? 54 : 50}
                fill="none"
                pathLength="100"
                onClick={() => onSubjectSelect(subject)}
                style={{
                  cursor: 'pointer',
                  filter: isActive ? `drop-shadow(0 0 12px ${subject.color}CC)` : 'none',
                  strokeLinecap: 'butt',
                  strokeLinejoin: 'miter',
                  transition: 'stroke-width 200ms ease, filter 200ms ease'
                }}
              />
            );
          })}

          {/* Textos curvados */}
          {subjects.map((subject, idx) => {
            let offset = 0;
            for (let i = 0; i < idx; i++) {
              const pct = totalGoal > 0 
                ? ((subjects[i].time_goal || 0) / totalGoal) * 100 
                : 100 / subjects.length;
              offset += pct;
            }

            const percentage = totalGoal > 0 
              ? ((subject.time_goal || 0) / totalGoal) * 100 
              : 100 / subjects.length;
            
            const id = `arc-${subject.id}`;
            const isActive = currentSubject?.id === subject.id;

            const startDegRaw = -90 + (offset * 360) / 100;
            const sweepRaw = (percentage * 360) / 100;
            const startDeg = startDegRaw + GAP_DEGREES;
            const endDeg = startDegRaw + sweepRaw - GAP_DEGREES;

            const actualSweep = endDeg - startDeg;
            if (actualSweep < 20) return null;

            return (
              <text key={`text-${id}`} fill="#fff">
                <textPath
                  href={`#${id}`}
                  startOffset="50%"
                  textAnchor="middle"
                  onClick={() => onSubjectSelect(subject)}
                  style={{
                    fontSize: isActive ? 8 : 7.5,
                    fontWeight: 900,
                    cursor: 'pointer',
                    letterSpacing: '0.02em',
                    transition: 'font-size 200ms ease',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  {subject.name}
                </textPath>
              </text>
            );
          })}
        </svg>

        {/* Centro com informações */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Efeitos de gradiente animados */}
            <div className="absolute inset-0 -m-10 rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" 
                 style={{animationDuration: '3s'}} />
            <div className="absolute inset-0 -m-12 rounded-full bg-gradient-to-tr from-blue-500/5 via-purple-500/5 to-cyan-500/5 animate-pulse" 
                 style={{animationDuration: '4s', animationDelay: '1s'}} />

            {/* Informações centrais */}
            <div className="relative text-center bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-full px-7 py-5 border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20">
              <p className="text-xs text-cyan-300 font-bold mb-1 tracking-wider uppercase">Mapa do</p>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 tracking-tight">CICLO</p>
              
              {currentSubject ? (
                <>
                  <div className="mt-2 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
                  <p className="text-xs font-semibold mt-2 max-w-[120px] truncate" 
                     style={{color: currentSubject.color}}>
                    {currentSubject.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {formatMinutes(currentSubject.time_goal)}
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-gray-500 mt-2">Clique em uma matéria</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Matérias */}
      <div className="w-full space-y-3 mt-6">
        <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></span>
          Matérias do Ciclo
        </h4>
        
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {subjects.map((subject, index) => {
            const isActive = currentSubject?.id === subject.id;
            
            return (
              <div
                key={subject.id}
                onClick={() => onSubjectSelect(subject)}
                className={`flex items-center justify-between text-sm p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10'
                    : 'hover:bg-slate-700/30 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3 h-3 rounded-full transition-all duration-300 ${isActive ? 'scale-125' : ''}`}
                    style={{
                      backgroundColor: subject.color,
                      boxShadow: isActive ? `0 0 12px ${subject.color}` : 'none'
                    }}
                  />
                  <span className={`${isActive ? 'text-white font-bold' : 'text-gray-300'} transition-all`}>
                    {index + 1}. {subject.name}
                  </span>
                </div>
                <span className={`text-xs ${isActive ? 'text-cyan-300 font-semibold' : 'text-gray-400'}`}>
                  {formatMinutes(subject.time_goal)} planejado
                </span>
              </div>
            );
          })}
        </div>

        {/* Totais */}
        <div className="pt-4 mt-4 text-right text-xs border-t border-slate-700/50 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Tempo total do ciclo:</span>
            <b className="text-cyan-300 text-sm">{formatMinutes(totalCycleTimeWithBreaks)}</b>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 ml-2">• Estudo:</span>
            <span className="text-gray-400">{formatMinutes(totalGoal)}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="text-gray-500 ml-2">• Pausas longas:</span>
            <span className="text-gray-400">{formatMinutes(totalCycleTimeWithBreaks - totalGoal)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Tempo de estudo:</span>
            <b className="text-emerald-300 text-sm">{formatMinutes(totalStudied)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CycleVisualization;
