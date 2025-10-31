import ModernSealAvatar from '../components/ModernSealAvatar';
import { useRef, useState, useEffect, useMemo, useCallback, memo, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Play, Pause, Music, SkipForward, SkipBack, RotateCcw, Plus, Edit2, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import { presencePing } from "@/lib/friends";
import { presenceLeave } from "@/lib/friends";
// topo do arquivo
import { setTimerState } from "@/lib/friends";
import { api } from "@/lib/api"
import { setCycleState } from "../lib/siteStyle";
import { usePageTitle } from "../hooks/usePageTitle";
import usePersistentTimer from "../hooks/usePersistentTimer";
import { alarm } from "@/lib/alarm";


// Lazy load do MusicPlayer para melhor performance
const MusicPlayer = lazy(() => import('../components/MusicPlayer'));
/* DEBUG VISÍVEL NO CONSOLE */
const dbg = (...a) => console.log("[Dashboard]", ...a);


const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';
const API = `${BACKEND_URL}/api`;
// === Helpers geométricos para o mapa do ciclo ===
const deg2rad = (deg) => (deg * Math.PI) / 180;

const polar = (cx, cy, r, deg) => ({
  x: cx + r * Math.cos(deg2rad(deg)),
  y: cy + r * Math.sin(deg2rad(deg)),
});

// Path de arco entre ângulos em graus (sentido horário)
const arcPath = (cx, cy, r, startDeg, endDeg) => {
  // normaliza e calcula flags do SVG
  const start = polar(cx, cy, r, startDeg);
  const end = polar(cx, cy, r, endDeg);
  let sweep = endDeg - startDeg;
  // garante sweep positivo (0..360)
  while (sweep < 0) sweep += 360;
  while (sweep > 360) sweep -= 360;

  const largeArcFlag = sweep > 180 ? 1 : 0;
  const sweepFlag = 1; // sentido horário

  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
};

function CalendarDebug({ API, subjects }) {
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");   // datetime-local
  const [end, setEnd] = useState("");       // datetime-local
  const [subjectId, setSubjectId] = useState("");
  const [day, setDay] = useState(() => new Date().toISOString().slice(0,10));
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);


  const toISO = (dtLocal) => {
    // input type=datetime-local vem âsem timezoneâ.
    // Vamos assumir o fuso do browser e converter pra ISO UTC.
    if (!dtLocal) return null;
    const d = new Date(dtLocal);
    return new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString();
  };

  const fetchDay = async () => {
    try {
      const res = await axios.get(`${API}/calendar/day`, {
        params: { date_iso: `${day}T00:00:00.000Z` },
        withCredentials: true
      });
      setEvents(res.data || []);
    } catch (e) {
      console.error(e);
      alert("Erro ao listar eventos do dia");
    }
  };

  const createEvent = async () => {
    if (!title || !start || !end) {
      alert("Preencha título, início e fim");
      return;
    }
    try {
      await axios.post(`${API}/calendar/event`, {
        title,
        start: toISO(start),
        end: toISO(end),
        subject_id: subjectId || null,
        checklist: []
      }, { withCredentials: true });

      setTitle("");
      setStart("");
      setEnd("");
      setSubjectId("");
      await fetchDay();
      alert("Evento criado!");
    } catch (e) {
      console.error(e);
      alert("Erro ao criar evento");
    }
  };

  const toggleDone = async (ev) => {
    try {
      await axios.patch(`${API}/calendar/event/${ev.id}`, {
        completed: !ev.completed
      }, { withCredentials: true });
      await fetchDay();
    } catch (e) {
      console.error(e);
      alert("Erro ao marcar completo");
    }
  };

  useEffect(() => { fetchDay(); /* carrega o dia atual */ }, []);


  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 app-surface">
      <h3 className="text-lg font-bold text-white mb-4">Agenda (Debug)</h3>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm text-gray-300">Tí­tulo</label>
          <input
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white app-surface"
            value={title} onChange={e=>setTitle(e.target.value)} placeholder="Ex.: Estudo"
          />

          <label className="text-sm text-gray-300">Iní­cio</label>
          <input
            type="datetime-local"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white app-surface"
            value={start} onChange={e=>setStart(e.target.value)}
          />

          <label className="text-sm text-gray-300">Fim</label>
          <input
            type="datetime-local"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white app-surface"
            value={end} onChange={e=>setEnd(e.target.value)}
          />

          <label className="text-sm text-gray-300">Matéria (opcional)</label>
          <select
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white app-surface"
            value={subjectId} onChange={e=>setSubjectId(e.target.value)}
          >
            <option value="">â sem Matéria â</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <button
            onClick={createEvent}
            className="mt-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded px-4 py-2"
          >
            Criar evento
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-gray-300">Dia</label>
          <input
            type="date"
            className="w-full bg-slate-700 border border-slate-600 rounded p-2 text-white app-surface"
            value={day} onChange={e=>setDay(e.target.value)}
          />
          <button
            onClick={fetchDay}
            className="bg-slate-700 hover:bg-slate-600 text-white rounded px-4 py-2"
          >
            Buscar eventos do dia
          </button>

          <div className="mt-3 space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="p-3 rounded bg-slate-700/30 flex items-start justify-between">
                <div>
                  <div className="text-white font-medium">
                    {ev.title} {ev.completed ? <span className="text-emerald-400 text-xs"> (completo)</span> : null}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(ev.start).toLocaleString()} â {new Date(ev.end).toLocaleString()}
                    {ev.subject_id ? <> â¢ Matéria: <b>{subjects.find(s=>s.id===ev.subject_id)?.name || ev.subject_id}</b></> : null}
                  </div>
                </div>
                <button
                  onClick={() => toggleDone(ev)}
                  className="ml-3 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1"
                >
                  {ev.completed ? "Desmarcar" : "Completar"}
                </button>
              </div>
            ))}
            {!events.length && <div className="text-sm text-gray-400">Nenhum evento para este dia.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}


// â COMPONENTE DO MODELO - MAPA DO CICLO OTIMIZADO
function CycleMap({ subjects, currentSubject, setCurrentSubject, mapAnimKey, animateArcs, deg2rad, polar, arcPath, formatHours, totalStudiedUI }) {
  const subjectPercentages = (() => {
    if (!subjects || subjects.length === 0) return [];
    const totalGoal = subjects.reduce((s, x) => s + (x.time_goal || 0), 0);
    if (totalGoal === 0) return subjects.map((s) => ({ ...s, percentage: 100 / subjects.length }));
    return subjects.map((s) => ({
      ...s,
      percentage: ((s.time_goal || 0) / totalGoal) * 100,
    }));
  })();

  return (
    <div className="bg-gradient-to-br from-slate-800/70 via-slate-800/60 to-slate-900/70 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-2xl shadow-cyan-500/20 hover:shadow-cyan-500/30 transition-all duration-300 app-surface">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 mb-2 animate-pulse" style={{animationDuration: '3s'}}>Mapa do Ciclo</h3>
        <p className="text-sm text-gray-300 font-medium">Distribuição interativa das matérias</p>
        <div className="mt-2 h-0.5 w-20 mx-auto bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
      </div>

      {/* Container centralizado com padding proporcional */}
      <div className="relative w-full aspect-square max-w-md mx-auto mb-6 flex items-center justify-center">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <defs>
            {(() => {
              let offset = 0;
              const GAP_DEGREES = 0.15; // Gap bem pequeno para cores coladinhas sem sobreposiÃ§Ã£o
              
              return subjectPercentages.map(subject => {
                const startDegRaw = -90 + (offset * 360) / 100;
                const sweepRaw = (subject.percentage * 360) / 100;
                
                // Adiciona gap mÃ­nimo no inÃ­cio e fim para delimitar as cores
                const startDeg = startDegRaw + GAP_DEGREES;
                const endDeg = startDegRaw + sweepRaw - GAP_DEGREES;
                
                offset += subject.percentage;

                const safeId = subject.id ?? `subj-${Math.random().toString(36).slice(2)}`;
                const id = `arc-${safeId}-${mapAnimKey}`;
                // Centro em (100, 100) com raio 70
                const d = arcPath(100, 100, 70, startDeg, endDeg);
                return <path key={id} id={id} d={d} pathLength="100" />;
              });
            })()}
          </defs>

          {/* Arcos coloridos GROSSOS com bordas retas */}
          {subjectPercentages.map((subject) => {
            const id = `arc-${subject.id}-${mapAnimKey}`;
            const isActive = currentSubject?.id === subject.id;
            return (
              <use
                key={`stroke-${id}`}
                href={`#${id}`}
                stroke={subject.color}
                strokeWidth={isActive ? 54 : 50}
                fill="none"
                pathLength="100"
                onClick={() => setCurrentSubject(subject)}
                style={{
                  cursor: 'pointer',
                  filter: isActive ? `drop-shadow(0 0 12px ${subject.color}CC)` : 'none',
                  strokeDasharray: animateArcs ? '100 0' : '0 100',
                  strokeLinecap: 'butt',
                  strokeLinejoin: 'miter',
                  transition: 'stroke-dasharray 700ms ease-out, stroke-width 200ms ease, filter 200ms ease'
                }}
              />
            );
          })}

          {/* Textos curvados DENTRO dos arcos, SEM sobreposiÃ§Ã£o */}
          {(() => {
            let offset = 0;
            const GAP_DEGREES = 0.15;
            
            return subjectPercentages.map((subject) => {
              const id = `arc-${subject.id}-${mapAnimKey}`;
              const isActive = currentSubject?.id === subject.id;
              
              const startDegRaw = -90 + (offset * 360) / 100;
              const sweepRaw = (subject.percentage * 360) / 100;
              const startDeg = startDegRaw + GAP_DEGREES;
              const endDeg = startDegRaw + sweepRaw - GAP_DEGREES;
              
              offset += subject.percentage;

              // SÃ³ mostra texto se o arco for grande o suficiente
              const actualSweep = endDeg - startDeg;
              if (actualSweep < 20) return null;

              return (
                <text key={`text-${id}`} fill="#fff">
                  <textPath
                    href={`#${id}`}
                    startOffset="50%"
                    textAnchor="middle"
                    onClick={() => setCurrentSubject(subject)}
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
            });
          })()}
        </svg>

        {/* Centro com gradiente */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 -m-10 rounded-full bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 animate-pulse" style={{animationDuration: '3s'}} />
            <div className="absolute inset-0 -m-12 rounded-full bg-gradient-to-tr from-blue-500/5 via-purple-500/5 to-cyan-500/5 animate-pulse" style={{animationDuration: '4s', animationDelay: '1s'}} />
            
            <div className="relative text-center bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-md rounded-full px-7 py-5 border-2 border-cyan-500/30 shadow-2xl shadow-cyan-500/20 app-surface">
              <p className="text-xs text-cyan-300 font-bold mb-1 tracking-wider uppercase">Mapa do</p>
              <p className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 tracking-tight">CICLO</p>
              {currentSubject && (
                <>
                  <div className="mt-2 h-px w-16 mx-auto bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent"></div>
                  <p className="text-xs font-semibold mt-2 max-w-[120px] truncate" style={{color: currentSubject.color}}>
                    {currentSubject.name}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {formatHours(currentSubject.time_goal || 0)}
                  </p>
                </>
              )}
              {!currentSubject && (
                <p className="text-[10px] text-gray-500 mt-2">Clique em uma matéria</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-6">
        <h4 className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-4 flex items-center gap-2">
          <span className="w-1 h-4 bg-gradient-to-b from-cyan-400 to-blue-400 rounded-full"></span>
          Matérias do Ciclo
        </h4>
        {subjects.map((subject, index) => {
          const isActive = currentSubject?.id === subject.id;
          return (
            <div 
              key={subject.id} 
              onClick={() => setCurrentSubject(subject)}
              className={`flex items-center justify-between text-sm p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                isActive 
                  ? 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 shadow-lg shadow-cyan-500/10 app-surface' 
                  : 'hover:bg-slate-700/30 border border-transparent app-surface'
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
                {formatHours(subject.time_goal)} planejado
              </span>
            </div>
          );
        })}
        <div className="pt-4 mt-4 text-right text-xs border-t border-slate-700/50 space-y-2 app-surface">
          {(() => {
            const totalPlanned = subjects.reduce((s, x) => s + (x.time_goal || 0), 0);
            return (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tempo total do ciclo:</span>
                <b className="text-cyan-300 text-sm">{formatHours(totalPlanned)}</b>
              </div>
            );
          })()}
          {(() => {
            const totalStudiedText = formatHours(totalStudiedUI);
            return (
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Tempo de estudo:</span>
                <b className="text-emerald-300 text-sm">{totalStudiedText}</b>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}


export default function Dashboard() {
  useEffect(() => {
  // tenta deixar o contexto pronto assim que possível
  alarm.resume();
}, []);
  const navigate = useNavigate();
  const timerInitRef = useRef(false);
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [settings, setSettings] = useState({ study_duration: 50, break_duration: 10 });
  const [quests, setQuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopItems, setShopItems] = useState([]);
  const [equippedSealItem, setEquippedSealItem] = useState(null);
const [dragIndex, setDragIndex] = useState(null);
  // evita transições duplas por clique/timeout simultâneo (race)
const isTransitioningRef = useRef(false);
const beginTransition = () => {
  if (isTransitioningRef.current) return false;
  isTransitioningRef.current = true;
  // janela curta para impedir duplo manuseio (click + onComplete)
  setTimeout(() => { isTransitioningRef.current = false; }, 250);
  return true;
};

  // Integra o timer persistente com Web Worker
  const timer = usePersistentTimer({ 
    studySec: 50 * 60, 
    breakSec: 10 * 60 
  });
  
  // Study timer state
  const [currentSubject, setCurrentSubject] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Usa os estados do timer hook ao invés de estados locais
  const timeLeft = timer.timeLeft;
  const isStudying = timer.isStudying;
  const isBreak = timer.isBreak;
// delta local por Matéria: +min quando vocÃª "pula" (crÃ©dito imediato), -min quando "volta"
const [localStudyDelta, setLocalStudyDelta] = useState({}); // { [subjectId]: number }
// pilha para desfazer o Ãºltimo bloco
// Histórico em pilha (LIFO): cada item é um bloco concluído (study 50m ou break 10m)
const [blockHistory, setBlockHistory] = useState([]); // [{ type:'study'|'break', subjectId?:string|null, real:number, extra:number, firstOfCycle:boolean }]




  // Modals / UI states
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [showEditSubject, setShowEditSubject] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [newSubject, setNewSubject] = useState({ name: '', color: '#3B82F6', time_goal: 180 });
  const [progressOverrides, setProgressOverrides] = useState({}); // { [subjectId]: minutosDescontados }
  const [openReset, setOpenReset] = useState(false);
  const [visualBlockDelta, setVisualBlockDelta] = useState({}); // { [subjectId]: minutos extras p/ completar bloco }
const [showMusicPlayer, setShowMusicPlayer] = useState(false);
// duração base do bloco em segundos (derivada de settings)
const baseBlockSeconds = Math.max(1, (settings?.study_duration ?? 50) * 60);

// --- ADICIONE ESTES ESTADOS / REFS ---
const [levelUpInfo, setLevelUpInfo] = useState(null); // { oldLevel, newLevel, bonusCoins }
const [animateArcs, setAnimateArcs] = useState(false); // animaÃ§Ã£o do mapa do ciclo
const [mapAnimKey, setMapAnimKey] = useState(0);       // forÃ§a re-montar paths pra animar

// Hook para atualizar o título da página (aba)
usePageTitle(
  timeLeft * 1000, 
  isStudying ? "running" : "idle", 
  currentSubject?.name
);

// --- HELPERS ---
const minutesToCoins = (mins) => Math.floor(mins / 5);     // 1 coin a cada 5 min
const formatTotal = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}min`;
};

// helper para chave por usuÃ¡rio e semana (segunda-feira como inÃ­cio)
const weekKey = () => {
  const d = new Date(); const day = (d.getDay() + 6) % 7;
  d.setHours(0,0,0,0); d.setDate(d.getDate() - day);
  return d.toISOString().slice(0,10);
};
const storageKey = (uid) => `ciclostudy:ui:${uid || 'anon'}:${weekKey()}`;

// Função para requisitar permissão de notificação
const requestNotificationPermission = async () => {
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações");
    return false;
  }
  
  if (Notification.permission === "granted") {
    return true;
  }
  
  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }
  
  return false;
};

// Função para mostrar notificação do sistema
const showSystemNotification = (title, body, icon = "🔔") => {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body: body,
        icon: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
        badge: `data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${icon}</text></svg>`,
        requireInteraction: false,
        silent: true, // O som será tocado pela nossa função
      });
      
      // Auto-fechar após 5 segundos
      setTimeout(() => notification.close(), 5000);
      
      // Focar na aba quando clicar na notificação
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error("Erro ao mostrar notificação:", error);
    }
  }
};

// FunÃ§Ã£o para tocar som de notificaÃ§Ã£o
const playNotificationSound = (soundId, duration) => {
  if (!settings?.sound_enabled) return;

  // Reaproveita a mesma lógica do Settings (padrões por som)
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const d = Math.min(Math.max(duration || 2, 0.25), 5);

  const tone = (type, freq, t0, len, gain = 0.2) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, ctx.currentTime + t0);
    g.gain.setValueAtTime(0.0001, ctx.currentTime + t0);
    g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + len);
    o.connect(g); g.connect(ctx.destination);
    o.start(ctx.currentTime + t0);
    o.stop(ctx.currentTime + t0 + len);
  };

  const noise = (t0, len, cutoff = 1400, gain = 0.03) => {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * len), ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
    const g = ctx.createGain(); g.gain.value = gain;
    src.connect(f); f.connect(g); g.connect(ctx.destination);
    src.start(ctx.currentTime + t0);
  };

  try {
    switch (soundId) {
      case 'bell':
        tone('sine', 880, 0.00, d,     0.25);
        tone('sine', 1320,0.00, d*0.8, 0.15);
        break;
      case 'chime':
        tone('sine', 1200, 0.00, 0.25*d, 0.18);
        tone('sine', 1500, 0.12, 0.25*d, 0.18);
        tone('sine', 1800, 0.24, 0.30*d, 0.14);
        break;
      case 'ding':
        tone('sine', 1000, 0.00, d*0.6, 0.22);
        break;
      case 'gong':
        tone('sine', 196, 0.00, d*1.2, 0.30);
        tone('sine', 98,  0.00, d*1.2, 0.08);
        tone('sine', 294, 0.00, d,     0.12);
        break;
      case 'alert':
        tone('square', 880, 0.00, 0.20, 0.20);
        tone('square', 880, 0.30, 0.20, 0.20);
        tone('square', 880, 0.60, 0.20, 0.20);
        break;
      case 'soft':
        tone('sine', 600, 0.00, d, 0.12);
        break;
      case 'ping':
        tone('sine', 1500, 0.00, 0.15*d + 0.15, 0.20);
        break;
      case 'digital':
        tone('square', 1200, 0.00, 0.15, 0.15);
        tone('square', 1600, 0.18, 0.12, 0.15);
        tone('square', 2000, 0.34, 0.10, 0.12);
        break;
      case 'nature':
        noise(0.00, d, 1500, 0.02);
        tone('sine', 2500, 0.10, 0.10, 0.06);
        tone('sine', 3200, 0.26, 0.10, 0.06);
        break;
      case 'zen':
        tone('sine', 440, 0.00, d,     0.18);
        tone('sine', 660, 0.00, d*0.9, 0.10);
        break;
      default:
        tone('sine', 1000, 0.00, d*0.6, 0.2);
    }
    setTimeout(() => { try { ctx.close(); } catch {} }, d * 1000 + 200);
  } catch (e) {
    console.error('Erro ao tocar som:', e);
  }
};


// carregar do storage
useEffect(() => {
  if (!user) return;
  try {
    const raw = localStorage.getItem(storageKey(user.id));
    if (raw) {
      const s = JSON.parse(raw);
      setLocalStudyDelta(s.localStudyDelta || {});
      setVisualBlockDelta(s.visualBlockDelta || {});
      setBlockHistory(s.blockHistory || []);
      setProgressOverrides(s.progressOverrides || {});
    }
  } catch {}
}, [user]);

useEffect(() => {
  // mapeie para os seus estados
  const running = isStudying;   // usa isStudying que é a variável correta
  const onBreak = isBreak;

  if (!running) { setCycleState(null); return; }
  setCycleState(onBreak ? "break" : "focus");
}, [isStudying, isBreak]);


useEffect(() => {
  const send = () => {
    try {
      const url = `${process.env.REACT_APP_BACKEND_URL || ""}/api/presence/leave`;
      const blob = new Blob([JSON.stringify({})], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } catch {
      presenceLeave(); // fallback
    }
  };
  window.addEventListener("beforeunload", send);
  window.addEventListener("pagehide", send);
  return () => {
    window.removeEventListener("beforeunload", send);
    window.removeEventListener("pagehide", send);
  };
}, []);

// salvar no storage quando mudar
useEffect(() => {
  if (!user) return;
  const payload = {
    localStudyDelta,
    visualBlockDelta,
    blockHistory,
    progressOverrides,                // << novo
    currentSubjectId: currentSubject?.id || null,
  };
  localStorage.setItem(storageKey(user.id), JSON.stringify(payload));
}, [user, localStudyDelta, visualBlockDelta, blockHistory, progressOverrides, currentSubject]);


// nÃ­veis âespeciaisâ: 10, 50, 100, 200, 500, 1000â¦ (e vai dobrando / multiplicando por 5)
const milestoneLevels = new Set([10, 50, 100, 200, 500, 1000, 2000, 5000, 10000]);
const isMilestoneLevel = (lvl) => milestoneLevels.has(lvl);

// cor aleatÃ³ria que NÃO repete nenhuma existente
const uniqueRandomColor = (blocked) => {
  const used = new Set(blocked.map(c => c.toLowerCase()));
  for (let i = 0; i < 999; i++) {
    const hex = `#${Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0')}`;
    if (!used.has(hex.toLowerCase())) return hex;
  }
  return '#3B82F6';
};

// estado principal
const [queue, setQueue] = useState([]);              // [{ id, title, ... }]
const [activeContentId, setActiveContentId] = useState(null);

// Ã­ndice derivado SEMPRE a partir do ID
const activeIndex = useMemo(
  () => Math.max(0, queue.findIndex(q => q.id === activeContentId)),
  [queue, activeContentId]
);

// inicializa/realinha o ID quando a fila muda
useEffect(() => {
  if (!queue?.length) return;
  if (!activeContentId) {
    setActiveContentId(queue[0].id);
    return;
  }
  // se o conteÃºdo ativo sumiu da fila (reordenaÃ§Ã£o ou remoÃ§Ã£o), aponta para o primeiro
  if (!queue.some(q => q.id === activeContentId)) {
    setActiveContentId(queue[0].id);
  }
}, [queue]); // << importante: dependa da FILA, nÃ£o de stats ou de um objeto gigante

const goNext = () => {
  if (!queue.length) return;
  const i = activeIndex;
  const next = queue[(i + 1) % queue.length];
  setActiveContentId(next.id);
};

const goPrev = () => {
  if (!queue.length) return;
  const i = activeIndex;
  const prev = queue[(i - 1 + queue.length) % queue.length];
  setActiveContentId(prev.id);
};



// utilidades para gerar o arco (path) e posicionar o texto
  useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      await loadData();
      // Solicita permissão para notificações do navegador
      await requestNotificationPermission();
    } catch (e) {
      console.error("[Dashboard] loadData falhou:", e);
    } finally {
      if (mounted) setLoading(false);
    }
  })();
  return () => { mounted = false; };
}, []);



  // Timer agora gerenciado pelo Web Worker no hook usePersistentTimer
  // Não precisa mais de requestAnimationFrame aqui
  
  // Atualiza elapsedTime baseado no timeLeft (para modo focus)
  useEffect(() => {
    if (isStudying && !isBreak && timeLeft < baseBlockSeconds) {
      const elapsed = baseBlockSeconds - timeLeft;
      setElapsedTime(elapsed);
    }
  }, [timeLeft, isStudying, isBreak, baseBlockSeconds]);

// quando termina o tempo




// ao abrir o modal de Nova Matéria, escolhe cor aleatÃ³ria Ãºnica
useEffect(() => {
  if (showAddSubject) {
    const existing = subjects.map(s => s.color || '');
    setNewSubject(ns => ({ ...ns, color: uniqueRandomColor(existing) }));
  }
}, [showAddSubject, subjects]);
// quando muda a quantidade de Matérias, dispara animaÃ§Ã£o do mapa
useEffect(() => {
  setAnimateArcs(false);
  const t = setTimeout(() => {
    setAnimateArcs(true);
    setMapAnimKey(k => k + 1);
  }, 30);
  return () => clearTimeout(t);
}, [subjects.length]);
// quando chegar subjects/stats do backend, popula a fila e define o ativo
// quando activeContentId muda, garanta que currentSubject acompanhe
useEffect(() => {
  if (!activeContentId) return;
  const s = subjects.find(x => x?.id === activeContentId);
  if (s && s.id !== currentSubject?.id) setCurrentSubject(s);
}, [activeContentId, subjects]);



  // SUBSTITUA sua loadData por esta:
async function loadData() {
  const reqs = [
    api.get("/auth/me"),      // 0
    api.get("/subjects"),     // 1
    api.get("/stats"),        // 2
    api.get("/settings"),     // 3
    api.get("/quests"),       // 4
  ];

  const [meR, subR, stR, setR, qR] = await Promise.allSettled(reqs);

  // helpers
  const ok = (r) => r && r.status === "fulfilled";
  const get = (r, path, fallback) => {
    try {
      if (!ok(r)) return fallback;
      let d = r.value?.data;
      // /auth/me pode vir {ok:true,user:{...}}
      if (path === "user") return d?.user ?? d ?? fallback;
      return d ?? fallback;
    } catch {
      return fallback;
    }
  };
// a matéria atual já tem pelo menos 1 registro no histórico?
const hasHistoryForCurrent =
  !!currentSubject && blockHistory.some(h => h.subjectId === currentSubject.id);

  const u   = get(meR, "user", null);
  const subj= get(subR, "",   []);
  const st  = get(stR, "",    { subjects: [], level: 1, xp: 0, coins: 0, total_time: 0, total_studied_minutes: 0, week_time: 0, cycle_progress: 0, sessions_completed: 0 });
  const set = get(setR, "",   { study_duration: 50, break_duration: 10 });
  const q   = get(qR, "",     []); // se /quests falhar, nÃ£o travar UI

  setUser(u);
  setSubjects(subj);
  setStats(st);
  setSettings(set);
  setQuests(q);

  // Carrega os itens da loja para ter os efeitos dos selos
  try {
    const shopRes = await api.get("/shop/list").catch(() => api.get("/shop/items")).catch(() => api.get("/shop"));
    const items = Array.isArray(shopRes.data) ? shopRes.data : 
                 Array.isArray(shopRes.data?.items) ? shopRes.data.items : 
                 Array.isArray(shopRes.data?.data) ? shopRes.data.data : [];
    setShopItems(items);
    
    // Atualiza o selo equipado
    if (u?.equipped_items?.seal && items.length > 0) {
      const sealItem = items.find(it => it.id === u.equipped_items.seal);
      setEquippedSealItem(sealItem || null);
    } else {
      setEquippedSealItem(null);
    }
  } catch (e) {
    console.error("[Dashboard] Erro ao carregar itens da loja:", e);
  }

  if (!timerInitRef.current) {
  timer.reset((set?.study_duration ?? 50) * 60);
  timerInitRef.current = true;
}


  // se nÃ£o logado, manda para /
  if (!u?.id) navigate("/", { replace: true });

  return { user: u, subjects: subj, stats: st, settings: set, quests: q };
};



  const handleAddSubject = async () => {
    try {
      await axios.post(`${API}/subjects`, newSubject, { withCredentials: true });
      toast.success('Matéria adicionada!');
      setShowAddSubject(false);
      setNewSubject({ name: '', color: '#3B82F6', time_goal: 180 });
      loadData();
    } catch {
      toast.error('Erro ao adicionar matéria');
    }
  };

  const handleEditSubject = async () => {
    try {
      await axios.patch(
        `${API}/subjects/${editingSubject.id}`,
        {
          name: editingSubject.name,
          color: editingSubject.color,
          time_goal: editingSubject.time_goal,
        },
        { withCredentials: true }
      );
      toast.success('Matéria atualizada!');
      setShowEditSubject(false);
      setEditingSubject(null);
      loadData();
    } catch {
      toast.error('Erro ao atualizar matéria');
    }
  };

  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Tem certeza que deseja deletar esta matéria?')) return;
    try {
      await axios.delete(`${API}/subjects/${subjectId}`, { withCredentials: true });
      toast.success('Matéria removida!');
      loadData();
    } catch {
      toast.error('Erro ao remover Matéria');
    }
  };
const handleReset = async () => {
    setCycleState(null);
  setSessionId(null);
  const secs = (settings?.study_duration || 50) * 60;
  timer.reset(secs);
  await setTimerState("paused", secs);
  setElapsedTime(0);
};

const onChangeSubject = async (subj) => {
  setCurrentSubject(subj);
  timer.setSubject(subj.name);
  await setTimerState(isBreak ? "break" : (isStudying ? "focus" : "paused"), timeLeft);
};


  const handleStartStudy = async (subject) => {
  try {
    const res = await axios.post(`${API}/study/start`, { subject_id: subject.id }, { withCredentials: true });
    setSessionId(res.data.id);
    setCurrentSubject(subject);
    timer.start((settings?.study_duration || 50) * 60, subject.name, "focus");
    await setTimerState("focus", (settings?.study_duration || 50) * 60);
    setElapsedTime(0);
    toast.success(`Iniciando: ${subject.name}`);
  } catch {
    toast.error("Erro ao iniciar sessão");
  }
};


  const handleStopStudy = async (skipped = false) => {
  if (!sessionId) return;

  try {
    const duration = Math.floor(elapsedTime / 60);
    const prevLevel = stats?.level ?? user?.level ?? 0;

    const res = await axios.post(
      `${API}/study/end`,
      { session_id: sessionId, duration, skipped },
      { withCredentials: true }
    );

    if (!skipped && res.data?.coins_earned > 0) {
      toast.success(`+${res.data.coins_earned} coins, +${res.data.xp_earned} XP!`);
    }

    // === Reset de timer/estado com o hook (sem perder condições) ===
    const secs = (settings?.study_duration || 50) * 60;
    timer.reset(secs);                          // zera o contador para o próximo bloco de estudo
    await setTimerState("paused", secs);        // publica estado "pausado" (para presença / amigos)
    setCurrentSubject(null);                    // limpa matéria ativa
    setSessionId(null);                         // limpa sessão
    setElapsedTime(0);                          // zera cronômetro de sessão

    // === Recarrega dados e checa level-up/marcos como antes ===
    const fresh = await loadData();
    if (fresh?.stats) {
      const newLevel = fresh.stats.level ?? 0;
      if (newLevel > prevLevel) {
        let bonusCoins = 0;
        if (isMilestoneLevel(newLevel)) {
          const totalMins =
            fresh.stats.total_studied_minutes ??
            (fresh.stats.subjects || []).reduce((s, x) => s + (x.time_total || x.time_studied || 0), 0);

          bonusCoins = Math.floor(totalMins / 50); // 10% das horas ⇒ /50
          try {
            await axios.post(
              `${API}/rewards/level-bonus`,
              { level: newLevel, bonus_coins: bonusCoins },
              { withCredentials: true }
            );
          } catch {/* ok se não existir */}
        }

        setLevelUpInfo({ oldLevel: prevLevel, newLevel, bonusCoins });
      }
    }
  } catch {
    toast.error("Erro ao finalizar sessão");
  }
};
// Registra o bloco no backend e atualiza stats.
// Se creditFullBlock=true, credita o bloco inteiro; senão, credita o que já passou.
const commitStudy = async ({ creditFullBlock = false } = {}) => {
  if (!sessionId || !currentSubject) return;

  const blockMin = settings?.study_duration || 50;
  const duration = creditFullBlock
    ? blockMin
    : Math.max(0, Math.floor(elapsedTime / 60));

  try {
    await axios.post(
      `${API}/study/end`,
      {
        session_id: sessionId,
        subject_id: currentSubject.id,
        duration,
        // quando "pula" (creditFullBlock), queremos computar como concluído;
        // quando não, marcamos 'skipped' se o bloco não foi completo.
        skipped: !creditFullBlock && duration < blockMin,
      },
      { withCredentials: true }
    );
  } catch (e) {
    console.error("[Dashboard] commitStudy falhou:", e);
  }
};



  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatHours = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  // % do donut baseado no PLANEJADO (time_goal), nÃ£o no estudado
  const getPlannedPercentages = () => {
    if (!subjects || subjects.length === 0) return [];
    const totalGoal = subjects.reduce((s, x) => s + (x.time_goal || 0), 0);
    if (totalGoal === 0) return subjects.map((s) => ({ ...s, percentage: 100 / subjects.length }));
    return subjects.map((s) => ({
      ...s,
      percentage: ((s.time_goal || 0) / totalGoal) * 100,
    }));
  };

  // progresso de UMA Matéria (considerando desconto visual do "bloco anterior")
  // progresso de UMA Matéria (usa stats + delta local da queue - overrides)
// Se tiver "stats" do backend:
// minutos estudados (UI) por Matéria
// minutos estudados (UI) por Matéria

// Lê minutos estudados de um subject do backend, cobrindo chaves diferentes
// Helper já usado em outros pontos (deixe aqui se ainda não estiver no arquivo)
// Lê minutos estudados do backend cobrindo chaves diferentes
// Lê minutos estudados do backend cobrindo chaves diferentes
const getBackendStudied = (sid) => {
  const subj = (stats?.subjects || []).find(x => x?.id === sid) || {};
  return (
    (typeof subj.time_studied === "number" ? subj.time_studied : null) ??
    (typeof subj.time_total   === "number" ? subj.time_total   : null) ??
    (typeof subj.studied      === "number" ? subj.studied      : null) ??
    0
  );
};

// Escolhe uma matéria que tenha “room” para desfazer (delta visual OU backend)
const pickSubjectWithRoom = () => {
  if (currentSubject) {
    const sid = currentSubject.id;
    const delta = (visualBlockDelta?.[sid] || 0);
    const room  = Math.max(0, getBackendStudied(sid) - (progressOverrides?.[sid] || 0));
    if (delta > 0 || room > 0) return currentSubject;
  }
  for (const s of (subjects || [])) {
    const sid = s.id;
    const delta = (visualBlockDelta?.[sid] || 0);
    const room  = Math.max(0, getBackendStudied(sid) - (progressOverrides?.[sid] || 0));
    if (delta > 0 || room > 0) return s;
  }
  return null;
};



const handleBackBlock = async () => {
  if (!beginTransition()) return;

  const blockMin = settings?.study_duration || 50;
  const breakMin = settings?.break_duration || 10;

  const targetType = isBreak ? "break" : "study";
  const sid = currentSubject?.id;

  // cópias mutáveis
  let newHistory   = [...(blockHistory || [])];
  let newVDelta    = { ...(visualBlockDelta || {}) };
  let newOverrides = { ...(progressOverrides || {}) };

  // achar o ÚLTIMO item do MESMO TIPO do bloco ATUAL
  let idx = -1;
  for (let i = newHistory.length - 1; i >= 0; i--) {
    const it = newHistory[i];
    // se tiver matéria atual, preferimos desfazer desta matéria;
    // se não houver match por matéria, desfazemos o do tipo atual globalmente
    const sameType = it?.type === targetType;
    const sameSubject = !sid || it?.subjectId === sid;
    if (sameType && sameSubject) { idx = i; break; }
  }

  if (idx === -1) {
    toast.info(targetType === "study" ? "Nenhum bloco de estudo para desfazer." : "Nenhuma pausa para desfazer.");
    return;
  }

  const last = newHistory[idx];

  // correto (coerente com o canBack e com teu histórico novo)
if (last?.firstOfSubject) {
  toast.info("O primeiro bloco dessa matéria não pode ser desfeito.");
  return;
}


  // remover só ESTE item
  newHistory.splice(idx, 1);

  // ajustar barras apenas se era ESTUDO
  if (last.type === "study") {
    const toSubtract = Math.max(0, (last?.real || 0) + (last?.extra || 0));

    // zera delta visual desta matéria
    if (last.subjectId) {
      const prevExtra = newVDelta[last.subjectId] || 0;
      newVDelta[last.subjectId] = Math.max(0, prevExtra - toSubtract);

      // devolve override até o limite do backend (para não ficar negativo)
      const backendStudied = getBackendStudied(last.subjectId);  // minutos
      const alreadyOverridden = newOverrides[last.subjectId] || 0;
      const room = Math.max(0, backendStudied - alreadyOverridden);
      const take = Math.min(toSubtract, room);
      if (take > 0) newOverrides[last.subjectId] = alreadyOverridden + take;
    }
  }

  // aplica estados
  setBlockHistory(newHistory);
  setVisualBlockDelta(newVDelta);
  setProgressOverrides(newOverrides);

  // posiciona o timer no modo OPOSTO ao que foi desfeito (apenas navega 1 bloco)
   // posiciona o timer no modo OPOSTO ao que foi desfeito (apenas navega 1 bloco)
  const breakSecs = (settings?.break_duration || 10) * 60;
  const studySecs = (settings?.study_duration || 50) * 60;

  if (last.type === "study") {
    // desfiz estudo → volta para PAUSA (sem desfazer nenhuma pausa)
    timer.reset(breakSecs);
    await setTimerState("paused", breakSecs).catch(() => {});
    setElapsedTime(0);
    toast.success("✓ Estudo desfeito. Voltou para a pausa.");
  } else {
    // desfiz pausa → volta para ESTUDO (sem desfazer nenhum estudo)
    timer.reset(studySecs);
    await setTimerState("paused", studySecs).catch(() => {});
    setElapsedTime(0);
    toast.success("✓ Pausa desfeita. Voltou para o estudo.");
  }

  // persistir storage (opcional; mantenha seu esquema atual)
  try {
    localStorage.setItem(
      storageKey(user?.id),
      JSON.stringify({
        localStudyDelta,
        visualBlockDelta: newVDelta,
        blockHistory: newHistory,
        progressOverrides: newOverrides,
        currentSubjectId: currentSubject?.id || null,
      })
    );
  } catch {}
};



const studiedUIById = useMemo(() => {
  const map = {};
  for (const s of subjects) {
    const sid = s?.id;
    if (!sid) continue;
    const backend = getBackendStudied(sid);
    const local   = localStudyDelta[sid] || 0;
    const extra   = visualBlockDelta[sid] || 0;
    const snapped = Math.max(0, backend - (progressOverrides[sid] || 0));
    map[sid] = Math.max(0, snapped + local + extra);
  }
  return map;
}, [subjects, stats, localStudyDelta, visualBlockDelta, progressOverrides]);
// Verifica se pode pular bloco (não deve permitir pular o último bloco)
// Pular bloco está sempre disponível (remove depois se quiser adicionar lógica específica)
const canBack = useMemo(() => {
  if (!blockHistory?.length) return false;
  if (!currentSubject?.id) return false;

  const targetType = isBreak ? "break" : "study";
  const sid = currentSubject.id;

  // Procura de trás pra frente o ÚLTIMO item do mesmo tipo e MESMA matéria
  for (let i = blockHistory.length - 1; i >= 0; i--) {
    const it = blockHistory[i];
    if (it?.type !== targetType) continue;
    if (it?.subjectId !== sid) continue;

    // Se é o primeiro bloco daquela matéria → não pode voltar
    if (it.firstOfSubject) return false;

    return true; // existe um bloco elegível a ser desfeito
  }
  return false;
}, [blockHistory, isBreak, currentSubject]);


const canSkip = useMemo(() => {
  if (!currentSubject) return false;

  const blockMin = settings?.study_duration || 50;
  const timeGoal = currentSubject.time_goal || 0;
  const studied = studiedUIById[currentSubject.id] || 0;

  // A) Quando já finalizou TODOS os blocos da matéria → não pode pular (em nenhum modo)
  if (timeGoal > 0 && studied >= timeGoal) return false;

  // B) Se estou em ESTUDO, bloquear se este pulo completaria a meta (seria o "último bloco")
  if (!isBreak && timeGoal > 0 && studied + blockMin >= timeGoal) return false;

  // Caso contrário, pode pular
  return true;
}, [currentSubject, isBreak, settings, studiedUIById]);










// total estudado (UI)
const totalStudiedUI = useMemo(
  () => Object.values(studiedUIById).reduce((a, b) => a + b, 0),
  [studiedUIById]
);

// % do ciclo (UI) = estudado / planejado
const cycleProgressUI = useMemo(() => {
  const totalGoal = subjects.reduce((s, x) => s + (x.time_goal || 0), 0);
  return totalGoal ? Math.min(100, (totalStudiedUI / totalGoal) * 100) : 0;
}, [subjects, totalStudiedUI]);

// progresso da Matéria atual
function subjectProgressPct(subject) {
  const sid = subject?.id;
  if (!sid) return 0;
  const studied = studiedUIById[sid] || 0;
  return subject?.time_goal > 0 ? Math.min(100, (studied / subject.time_goal) * 100) : 0;
}





/* âââ ALTERNATIVA (se vocÃª NÃO usa stats/time_studied) âââ
   Caso seu modelo use "queue" com consumedMin (estudo+pausa juntos),
   converta o consumo total do item em "somente ESTUDO" para a barra: */

function buildPlan(totalMin, studyLen, breakLen) {
  const unit = studyLen + breakLen;
  const full = Math.floor(totalMin / unit);
  const rem = totalMin - full * unit;
  const plan = []; // [{ kind: 'study'|'break', min: number }]

  for (let i = 0; i < full; i++) {
    plan.push({ kind: 'study', min: studyLen });
    plan.push({ kind: 'break', min: breakLen });
  }

  if (rem > 0) {
    const s = Math.max(5, Math.round((rem * 5) / 6));
    const b = Math.max(0, rem - s);
    plan.push({ kind: 'study', min: s });
    if (b > 0) plan.push({ kind: 'break', min: b });
  }
  return plan;
}

function studyConsumedForItem(item, studyLen, breakLen) {
  const plan = buildPlan(item.totalMin, studyLen, breakLen);
  let left = Math.max(0, item.consumedMin || 0);
  let study = 0;

  for (const p of plan) {
    const take = Math.min(left, p.min);
    if (take <= 0) break;
    if (p.kind === 'study') study += take;
    left -= take;
  }
  return study;
}

// DependÃªncias comuns (troque pelos seus estados reais):
// queue: Array<{ id: string; title: string; totalMin: number; consumedMin?: number }>
// currentIndex: number
// phaseIndex: number
// remainingMs: number (ms do bloco atual)
// studyLen, breakLen: nÃºmeros
// setQueue, setCurrentIndex, setPhaseIndex, setRemainingMs, setRunning, setEndAt...
// (opcional) setLogs: se vocÃª mantÃ©m logs para histÃ³rico

function currentPlan() {
  const item = queue[currentIndex];
  return item ? buildPlan(item.totalMin, studyLen, breakLen) : [];
}

// AvanÃ§a o cursor para o prÃ³ximo bloco/item
function goNextPhase() {
  const plan = currentPlan();
  if (!plan.length) return;

  if (phaseIndex < plan.length - 1) {
    const nextIdx = phaseIndex + 1;
    setPhaseIndex(nextIdx);
    setRemainingMs(plan[nextIdx].min * 60 * 1000);
    return;
  }

  // fim do item â prÃ³ximo item
  const nextItemIndex = (currentIndex + 1) % Math.max(1, queue.length);
  setCurrentIndex(nextItemIndex);
  const nextPlan = queue[nextItemIndex] ? buildPlan(queue[nextItemIndex].totalMin, studyLen, breakLen) : [];
  const firstMin = nextPlan[0]?.min ?? studyLen;
  setPhaseIndex(0);
  setRemainingMs(firstMin * 60 * 1000);
}

// Handler para finalizar o BLOCO ATUAL (usado por "pular" e tambÃ©m quando o tempo zera)
function finishCurrentBlock(opts = {}) {
  const { bySkip = false } = opts;
  const item = queue[currentIndex];
  const plan = currentPlan();
  const phase = plan[phaseIndex];
  if (!item || !phase) return;

  // minutos "vividos" no bloco atual
  const baseMin = phase.min;
  const elapsedMin = Math.max(1, Math.floor((baseMin * 60 * 1000 - Math.max(0, remainingMs)) / 60000));
  // se for pausa, nunca credita; se for estudo, credita "elapsedMin"
  const creditStudy = phase.kind === "study" ? elapsedMin : 0;

  // 1) aplica consumo no item (consumedMin conta estudo+pausa; OK)
  setQueue(q => {
    const copy = [...q];
    const cur = { ...copy[currentIndex] };
    cur.consumedMin = Math.max(0, (cur.consumedMin || 0) + baseMin); // bloco inteiro foi percorrido
    copy[currentIndex] = cur;
    return copy;
  });

  // 2) aplica delta local na barra (sÃ³ estudo)
  if (creditStudy) {
    setLocalStudyDelta(d => ({ ...d, [item.id]: (d[item.id] || 0) + creditStudy }));
  }

  // 3) (opcional) log para histÃ³rico
  // setLogs?.(arr => [...arr, { id: crypto.randomUUID(), title: item.title, minutes: creditStudy, dateISO: new Date().toISOString().slice(0,10) }]);

  // 4) prepara prÃ³ximo bloco
  setRunning(false);
  setEndAt(null);
  goNextPhase();
}

// CLICK: "Pular bloco"
function onSkipBlock() {
  finishCurrentBlock({ bySkip: true });
}
function Bar({ value, className = "" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className={`h-2 rounded bg-slate-700 overflow-hidden ${className}`}>
      <div className="h-full rounded bg-cyan-500 transition-[width] duration-300" style={{ width: `${v}%` }} />
    </div>
  );
}


// CLICK: "Voltar bloco" (desfaz o Ãºltimo bloco concluÃ­do e reposiciona o cursor)
function onBackBlock() {
  if (!queue.length) return;

  // pare qualquer contagem
  setRunning(false);
  setEndAt(null);

  const curItem = queue[currentIndex];
  const curPlan = currentPlan();
  if (!curItem || !curPlan.length) return;

  // Se jÃ¡ consumimos alguma coisa deste item, voltamos dentro dele
  const consumed = curItem.consumedMin || 0;
  if (consumed > 0) {
    // acha o Ã­ndice do Ãºltimo bloco completamente concluÃ­do com base no consumed
    let acc = 0, lastIdx = -1;
    for (let i = 0; i < curPlan.length; i++) {
      if (acc + curPlan[i].min <= consumed) { acc += curPlan[i].min; lastIdx = i; } else break;
    }
    if (lastIdx >= 0) {
      const prevPhase = curPlan[lastIdx];

      // devolve consumo total do bloco (estudo+pausa) no item
      setQueue(q => {
        const copy = [...q];
        const it = { ...copy[currentIndex] };
        it.consumedMin = Math.max(0, (it.consumedMin || 0) - prevPhase.min);
        copy[currentIndex] = it;
        return copy;
      });

      // se era ESTUDO, devolve tambÃ©m na barra (delta negativo = barra desce)
      if (prevPhase.kind === "study") {
        setLocalStudyDelta(d => ({ ...d, [curItem.id]: Math.max(0, (d[curItem.id] || 0) - prevPhase.min) }));
        // (opcional) remova do log o Ãºltimo registro compatÃ­vel
        // setLogs(old => { const arr=[...old]; const i=arr.findLastIndex(l=>l.title===curItem.title&&l.minutes===prevPhase.min); if(i>=0) arr.splice(i,1); return arr; });
      }

      setPhaseIndex(lastIdx);
      setRemainingMs(prevPhase.min * 60 * 1000);
      return;
    }
  }

  // caso contrÃ¡rio, precisamos voltar para o item anterior
  const prevItemIndex = (currentIndex - 1 + queue.length) % queue.length;
  const prevItem = queue[prevItemIndex];
  const prevPlan = prevItem ? buildPlan(prevItem.totalMin, studyLen, breakLen) : [];
  const lastIdx = Math.max(0, prevPlan.length - 1);
  const prevPhase = prevPlan[lastIdx];


const undoOneBlockUI = async () => {
  if (!currentSubject) {
    toast.error('Nenhuma Matéria ativa');
    return;
  }

  const blockMin = settings?.study_duration || 50;

  // desfaz 1 bloco só na UI (sem mexer em XP/coins do backend)
  setVisualBlockDelta(prev => {
    const cur = (prev[currentSubject.id] || 0) - blockMin;
    return { ...prev, [currentSubject.id]: Math.max(0, cur) };
  });

  // rearmar timer (pausado e cheio)
  setCycleState(null);
  setSessionId(null);

  const secs = blockMin * 60;
  timer.reset(secs);
  await setTimerState("paused", secs);
  setElapsedTime(0);

  toast('Progresso do bloco anterior desconsiderado (XP/coins mantidos).');
};





  // devolve consumo desse Ãºltimo bloco do item anterior
  setQueue(q => {
    const copy = [...q];
    const it = { ...copy[prevItemIndex] };
    it.consumedMin = Math.max(0, (it.consumedMin || 0) - (prevPhase?.min || 0));
    copy[prevItemIndex] = it;
    return copy;
  });

  if (prevPhase?.kind === "study" && prevItem) {
    setLocalStudyDelta(d => ({ ...d, [prevItem.id]: Math.max(0, (d[prevItem.id] || 0) - prevPhase.min) }));
    // (opcional) remova do log equivalente aqui tambÃ©m
  }

  setCurrentIndex(prevItemIndex);
  setPhaseIndex(lastIdx);
  setRemainingMs((prevPhase?.min || studyLen) * 60 * 1000);
}


// quanto foi estudado (em min) na Matéria ativa (para habilitar âBloco anteriorâ)
const getSubjectStudiedMins = (subject) => {
  const stat = (stats?.subjects || []).find(s => s.id === subject.id) || {};
  const queueItem = queue.find(i => i.id === subject.id);
  const deltaLocal = Math.max(0, (queueItem?.studiedMinutes || 0) - (stat.time_studied || 0));
  return Math.max(0, (stat.time_studied || 0) + deltaLocal - (progressOverrides[subject.id] || 0));
};


  const handleBigStart = async () => {
    if (isStudying) {
      await handleStopStudy(false);
      return;
    }
    const subject = currentSubject || subjects[0];
    if (!subject) {
      toast.error('Adicione uma Matéria para começar');
      return;
    }
    await handleStartStudy(subject);
  };

 











  const handleResetBlock = async () => {
  if (!currentSubject && !isBreak) { // se estiver em estudo sem matéria
    toast.error("Selecione uma matéria para resetar o bloco.");
    return;
  }

  // Se houver sessão ativa, finalize-a como 'skipped' (descarta progresso do bloco em andamento)
  if (sessionId) {
    try {
      await axios.post(
        `${API}/study/end`,
        {
          session_id: sessionId,
          subject_id: currentSubject.id,
          duration: 0,
          skipped: true
        },
        { withCredentials: true }
      );
    } catch (e) {
      console.error("[Dashboard] Erro ao finalizar sessão no reset:", e);
    }
  }

  setSessionId(null);
  setCycleState(null);

  // ⬇️ AQUI está o ajuste: usa a duração conforme o modo atual
  const secs = (isBreak ? (settings?.break_duration || 10) : (settings?.study_duration || 50)) * 60;

  timer.reset(secs);
  await setTimerState("paused", secs);
  setElapsedTime(0);

  // persiste UI (opcional)
  try {
    localStorage.setItem(
      storageKey(user?.id),
      JSON.stringify({
        localStudyDelta,
        visualBlockDelta,
        blockHistory,
        progressOverrides,
        currentSubjectId: currentSubject?.id || null,
      })
    );
  } catch {}

  setOpenReset(false);
  toast.success('Bloco atual resetado!');
};




  const handleResetCycleUI = async () => {
  // 1) tira um "snapshot" do estudado atual (backend) para cada matéria
  const snap = {};
  for (const s of subjects) {
    const backend = getBackendStudied(s.id);

    snap[s.id] = backend;
  }
  setProgressOverrides(snap);

  // 2) zera deltas locais e histórico visual
  setVisualBlockDelta({});
  setLocalStudyDelta({});
  setBlockHistory([]);

  // 3) reseta timer
  setCycleState(null);
  setSessionId(null);
  const secs = (settings?.study_duration || 50) * 60;
  timer.reset(secs);
  await setTimerState("paused", secs);
  setElapsedTime(0);


  // 4) persiste no storage (incluindo progressOverrides)
  try {
    localStorage.setItem(
      storageKey(user?.id),
      JSON.stringify({
        localStudyDelta: {},
        visualBlockDelta: {},
        blockHistory: [],
        progressOverrides: snap,               // << persistimos o snapshot
        currentSubjectId: null,
      })
    );
  } catch {}

  // 5) Não precisa forçar loadData agora — as barras já refletem com overrides
  toast.success('Ciclo resetado e barras zeradas!');
  setOpenReset(false);
};



  const subjectPercentages = getPlannedPercentages().filter(s => s && s.id != null);




// --- BotÃµes: lÃ³gica de rÃ³tulo/aÃ§Ãµes ---
const atInitialBlock =
  !isStudying && !isBreak && elapsedTime === 0 && timeLeft === baseBlockSeconds;

const mainBtnLabel = isStudying ? "Pausar" : (atInitialBlock ? "Iniciar" : "Retomar");

const handlePrimary = async () => {
  if (isStudying) {
    timer.pause();
    await setTimerState("paused", timeLeft);
    setCycleState(null);
    return;
  }

  const subj = currentSubject || subjects[0];
  if (!subj) {
    toast.error("Adicione uma Matéria para começar");
    setCycleState("focus");
    return;
  }

  if (atInitialBlock && !sessionId) {
    await handleStartStudy(subj);
  } else {
    timer.resume();
    await setTimerState(isBreak ? "break" : "focus", timeLeft);
  }
};


useEffect(() => {
  // publica o que estÃ¡ realmente na tela assim que a pÃ¡gina carrega
  if (!currentSubject || timeLeft == null) {
    setTimerState("idle").catch(()=>{});
    return;
  }
  if (!isStudying && !isBreak) {
    setTimerState("paused", timeLeft).catch(()=>{});
  } else if (isBreak) {
    setTimerState("break", timeLeft).catch(()=>{});
  } else if (isStudying) {
    setTimerState("focus", timeLeft).catch(()=>{});
  }
  // rode quando algum destes mudar na UI
}, [isStudying, isBreak, timeLeft, currentSubject]);




useEffect(() => {
  if (!currentSubject && subjects && subjects.length > 0) {
    setCurrentSubject(subjects[0]);
  }
}, [subjects]);



// Configura callback para quando o timer completar
useEffect(() => {
  timer.setOnComplete(async (mode) => {
    if (mode === "focus") {
      // fim de bloco de ESTUDO
      const blockMin = settings?.study_duration || 50;
      // tocar beep ao finalizar bloco, mesmo em background


      if (currentSubject) {
  setBlockHistory(h => {
    const isFirstOfSubject =
      !h.some(x => x.type === 'study' && x.subjectId === currentSubject.id);
    return [
      ...h,
      {
        type: 'study',
        subjectId: currentSubject.id,
        real: blockMin,
        extra: 0,
        firstOfSubject: isFirstOfSubject
      }
    ];
  });
}


      await commitStudy(); // fecha sessão no backend + recarrega stats

      // NÃO inicia pausa automaticamente - apenas reseta o timer para o estado pausado
      const secs = (settings?.break_duration || 10) * 60;
      timer.reset(secs);
      await setTimerState("paused", secs);
      setElapsedTime(0);
      await loadData();

      // Toca som E mostra notificação do sistema
      playNotificationSound(settings?.sound_id || "bell", settings?.sound_duration || 2);
      // tocar beep ao finalizar bloco, mesmo em background
alarm.play().then((ok) => {
  if (!ok && typeof toast !== "undefined") {
    // opcional: uma única dica se o som ainda estiver bloqueado
    toast.info("Clique uma vez no site para habilitar o som do alarme.");
  }
});

      showSystemNotification(
        "⏱️ Bloco de Estudo Concluído!", 
        "Parabéns! Você completou um bloco de estudo. Hora de descansar um pouco.",
        "✅"
        
      );
      toast.success("✅ Bloco de estudo concluído! Clique em Iniciar para começar a pausa.", { duration: 6000 });
    } else if (mode === "break") {
  // fim de PAUSA → volta para estado pausado com duração do estudo
  const secs = (settings?.study_duration || 50) * 60;

  // bip (mesmo em background)
  await alarm.play().catch(()=>{});

  timer.reset(secs);
  await setTimerState("paused", secs);
  setElapsedTime(0);

  // Notificações
  playNotificationSound(settings?.sound_id || "bell", settings?.sound_duration || 2);
  showSystemNotification("☕ Pausa Concluída!", "Descansou bem? Está pronto para mais um bloco de estudo!", "⏰");
  toast.success("Pausa concluída! Pronto para mais estudo?", { duration: 4000 });

  // registra no histórico (amarra na matéria atual, se houver)
  const brk = settings?.break_duration || 10;
setBlockHistory(h => {
  const subjId = currentSubject?.id || null;
  const isFirstOfSubject =
    subjId ? !h.some(x => x.type === 'break' && x.subjectId === subjId) : false;
  return [
    ...h,
    {
      type: 'break',
      subjectId: subjId,
      real: brk,
      extra: 0,
      firstOfSubject: isFirstOfSubject
    }
  ];
});

}

  });
}, [timer, settings, currentSubject]);


useEffect(() => {
  const reqId = axios.interceptors.request.use(c => {
    console.log('HTTP â', c.method?.toUpperCase(), c.url, c.data);
    return c;
  });
  const resId = axios.interceptors.response.use(
    r => { console.log('HTTP â', r.status, r.config.url, r.data); return r; },
    e => { console.log('HTTP â', e?.response?.status, e?.config?.url, e?.response?.data); return Promise.reject(e); }
  );
  return () => { axios.interceptors.request.eject(reqId); axios.interceptors.response.eject(resId); };
}, []);
// Creditar minutos reais se fechar a aba antes de concluir (sem contar no ciclo)
// Creditar minutos reais se fechar a aba antes de concluir (sem contar no ciclo)
useEffect(() => {
  const flushOnUnload = () => {
    try {
      if (!sessionId || !currentSubject) return;
      const mins = Math.floor(elapsedTime / 60);
      if (mins <= 0) return;

      const payload = JSON.stringify({
        session_id: sessionId,
        subject_id: currentSubject.id,
        duration: mins,
        skipped: true,                 // parcial â NÃO entra no progresso do ciclo
      });

      const url = `${API}/study/end`;
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon(url, blob); // envia mesmo fechando a aba
    } catch {}
  };

  window.addEventListener("beforeunload", flushOnUnload);
  window.addEventListener("pagehide", flushOnUnload);
  return () => {
    window.removeEventListener("beforeunload", flushOnUnload);
    window.removeEventListener("pagehide", flushOnUnload);
  };
}, [sessionId, currentSubject, elapsedTime]);

useEffect(() => {
  // envia batimento a cada 60s
  const t = setInterval(() => presencePing(false), 60000);

  // marca interaÃ§Ã£o do usuÃ¡rio
  const mark = () => presencePing(true);

  window.addEventListener("click", mark);
  window.addEventListener("keydown", mark);
  window.addEventListener("scroll", mark);

  // dispara 1x logo que monta (opcional)
  presencePing(false);

  return () => {
    clearInterval(t);
    window.removeEventListener("click", mark);
    window.removeEventListener("keydown", mark);
    window.removeEventListener("scroll", mark);
  };
}, []);


// pular bloco
// pular bloco
const handleSkip = async () => {
  if (!beginTransition()) return;
  if (!currentSubject) {
    toast.error('Selecione uma matéria');
    return;
  }

  const blockMin = settings?.study_duration || 50;
  const breakMin = settings?.break_duration || 10;

  if (!isBreak) {
  // Pulando ESTUDO → registra ESTUDO "extra" (se quiser contar progresso)
  const studySecs = (settings?.study_duration || 50) * 60;
  const breakSecs = (settings?.break_duration || 10) * 60;

  setBlockHistory(h => {
  const isFirstOfSubject =
    !h.some(x => x.type === 'study' && x.subjectId === currentSubject.id);
  return [
    ...h,
    {
      subjectId: currentSubject.id,
      type: "study",
      real: 0,
      extra: blockMin,
      ts: Date.now(),
      firstOfSubject: isFirstOfSubject
    }
  ];
});


  // atualiza barra (critério: ambos os botões alteram a barra)
  setVisualBlockDelta(prev => ({
    ...prev,
    [currentSubject.id]: (prev[currentSubject.id] || 0) + blockMin
  }));

  timer.reset(breakSecs);
  await setTimerState("paused", breakSecs).catch(() => {});
  setElapsedTime(0);
  toast.info('⏭️ Estudo pulado. Timer em pausa.', { duration: 3000 });
} else {
  // Pulando PAUSA → registra PAUSA e vai para ESTUDO (não mexe barra)
  const studySecs = (settings?.study_duration || 50) * 60;

  setBlockHistory(h => {
  const isFirstOfSubject =
    !h.some(x => x.type === 'break' && x.subjectId === currentSubject.id);
  return [
    ...h,
    {
      subjectId: currentSubject.id,
      type: "break",
      real: 0,
      extra: breakMin,
      ts: Date.now(),
      firstOfSubject: isFirstOfSubject
    }
  ];
});


  timer.reset(studySecs);
  await setTimerState("paused", studySecs).catch(() => {});
  setElapsedTime(0);
  toast.info('⏭️ Pausa pulada! Timer em estudo.', { duration: 3000 });
}

};


const syncTimer = (state, secs) => setTimerState(state, secs).catch(() => {});







  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div className="text-xl text-white">Carregando...</div>
    </div>
  );
}

// se terminou de carregar e mesmo assim não tem dados:
if (!user || !stats) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-white">
        Falha ao carregar dados. <button className="underline" onClick={() => {
          setLoading(true);
          // força um novo carregamento
          (async () => {
            try { await loadData(); } finally { setLoading(false); }
          })();
        }}>Tentar novamente</button>
      </div>
    </div>
  );
}





  
// --- Quests: sempre exibir 4 -----------------------------------------------
const minutesStudiedSoFar = (stats?.subjects || []).reduce(
  (s, x) => s + (x.time_studied || 0),
  0
);

// Matéria menos estudada (pra escolher uma quest focada)
const lowestSubjectInfo = subjects.reduce((acc, subj) => {
  const st = (stats?.subjects || []).find(ss => ss.id === subj.id) || {};
  const studied = st.time_studied || 0;
  if (!acc || studied < acc.studied) return { subject: subj, studied };
  return acc;
}, null);



const onDragStartSubject = (index) => setDragIndex(index);
const onDragOverSubject  = (e) => e.preventDefault(); // necessÃ¡rio para permitir drop
const onDropSubject = async (index) => {
  if (dragIndex === null || dragIndex === index) return;
  const newOrder = [...subjects];
  const [moved] = newOrder.splice(dragIndex, 1);
  newOrder.splice(index, 0, moved);
  setSubjects(newOrder);
  setDragIndex(null);

  // se tiver endpoint pra persistir a ordem, Ã³timo; se nÃ£o, sÃ³ ignora
  try {
    await axios.post(`${API}/subjects/reorder`, { order: newOrder.map(s => s.id) }, { withCredentials: true });
  } catch {}
};


// gera uma quest com recompensa baseada no esforÃ§o
// gera uma quest com recompensa baseada no esforÃ§o
const genQuest = (key, title, target, progress, difficulty = "medium") => {
  const diffMultMap = { easy: 0.8, medium: 1, hard: 1.5 };
  const diffMult = diffMultMap[difficulty] ?? 1;

  // 1 coin = 5 min; quando nÃ£o hÃ¡ alvo claro, usamos 60 como base
  const baseCoins = Math.ceil(((target ?? 60) / 5));
  const coins = Math.max(5, Math.round(baseCoins * diffMult));
  const xp = coins * 10;

  return {
    id: `local-${key}`,
    title,
    target,
    progress,
    coins_reward: coins,
    xp_reward: xp,
    completed: progress >= (target ?? 0),
    _difficulty: difficulty, // para fallback em merges
  };
};

// garante que toda quest tenha coins/xp mesmo que venha "incompleta" do backend
const ensureRewards = (q) => {
  const diffMultMap = { easy: 0.8, medium: 1, hard: 1.5 };
  const diffMult = diffMultMap[q?._difficulty] ?? 1;
  const baseCoins = Math.ceil(((q?.target ?? 60) / 5));
  const coinsCalc = Math.max(5, Math.round(baseCoins * diffMult));

  if (q.coins_reward == null) q.coins_reward = coinsCalc;
  if (q.xp_reward == null) q.xp_reward = q.coins_reward * 10;
  return q;
};

const buildFourQuests = () => {
  const provided = Array.isArray(quests) ? quests : [];
  const auto = [];

  // 1) completar 1 ciclo
  auto.push(
    genQuest(
      "complete-cycle",
      "Completar 1 ciclo",
      1,
      (stats?.cycle_progress ?? 0) >= 100 ? 1 : 0,
      "medium"
    )
  );

  // 2) estudar 300 min na semana
  auto.push(
    genQuest("study-300", "Estudar 300 min na semana", 300, minutesStudiedSoFar, "medium")
  );

  // 3) focar na Matéria menos estudada (se existir)
  if (lowestSubjectInfo?.subject) {
    auto.push(
      genQuest(
        "focus-subject",
        `Estudar ${lowestSubjectInfo.subject.name} por 120 min`,
        120,
        lowestSubjectInfo.studied,
        "hard"
      )
    );
  }

  // 4) concluir 6 sessÃµes de estudo
  auto.push(
    genQuest(
      "sessions-6",
      "Concluir 6 sessões de estudo",
      6,
      stats?.sessions_completed || 0,
      "easy"
    )
  );

  // Prioriza AUTO (tem recompensas) e preenche faltantes das do backend
  const candidates = [
    ...auto,
    ...provided.map(ensureRewards),
  ];

  const seen = new Set();
  const result = [];
  for (const q of candidates) {
    if (!q?.title) continue;
    if (seen.has(q.title)) continue;
    seen.add(q.title);
    result.push(ensureRewards(q));
    if (result.length === 4) break;
  }
  return result;
};


 



const weeklyQuests = buildFourQuests();
// ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header user={user} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Timer & Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 app-surface app-surface">
              {/* Avatar do usuÃ¡rio (selo equipado) */}
              <div className="flex justify-center mb-4">
                <ModernSealAvatar size={72} user={user} item={equippedSealItem} />
              </div>

              <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-white mb-2">{isStudying ? (isBreak ? 'Pausa' : 'Estudo') : 'Estudo'}</h2>
                {currentSubject && (
                  <p className="text-lg" style={{ color: currentSubject.color }}>
                    {currentSubject.name}
                  </p>
                )}
                {!isStudying && subjects.length > 0 && <p className="text-gray-400 text-sm">Selecione uma matéria ao lado para começar</p>}
              </div>

              <div className="text-8xl font-bold text-white text-center mb-8" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                {formatTime(timeLeft)}
              </div>

              <div className="text-center text-gray-400 mb-6">{settings.study_duration} min</div>

              {/* Controls */}
              <div className="flex flex-wrap items-center justify-center gap-3">
  {/* BotÃ£o principal: Iniciar / Pausar / Retomar */}
  <Button
    onClick={handlePrimary}
    className="h-12 px-6 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white"
  >
    {mainBtnLabel}
  </Button>

  {/* Pular bloco â sempre disponÃ­vel */}
   <Button
    onClick={handleSkip}
    disabled={!canSkip}
    className="h-12 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
  >
    Pular bloco
  </Button>

  {/* Bloco anterior (mesmo estilo, mas pode ficar desabilitado) */}
  <Button
  onClick={handleBackBlock}
  disabled={!canBack}
  className="h-12 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
>
  <SkipBack className="w-5 h-5 mr-2" />
  Bloco anterior
</Button>


  {/* Resetar */}
  <Button
    onClick={() => setOpenReset(true)}
    className="h-12 px-6 rounded-xl bg-slate-700 hover:bg-slate-600 text-white"
  >
    <RotateCcw className="w-5 h-5 mr-2" />
    Resetar
  </Button>
</div>


            </div>

            {/* Progress Bars */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 app-surface app-surface">
              <div className="space-y-4">
                <div>
                  {(() => {
                    const s = currentSubject;
                    const pct = currentSubject ? subjectProgressPct(currentSubject) : 0;
                    return (
                      <>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-gray-400">Progresso do conteúdo atual</span>
                          <span className="text-sm text-gray-400">{Math.round(pct)}%</span>
                        </div>
                        <Bar value={pct} />

                      </>
                    );
                  })()}
                </div>

                <div>
  <div className="flex justify-between mb-2">
    <span className="text-sm text-gray-400">Progresso do ciclo</span>
    <span className="text-sm text-cyan-400">{Math.round(cycleProgressUI)}%</span>
  </div>
  <Bar value={cycleProgressUI} />
</div>

              </div>
            </div>

            {/* Subjects Queue */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 app-surface app-surface">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Fila de conteúdos</h3>
                <Dialog open={showAddSubject} onOpenChange={setShowAddSubject}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-cyan-500 hover:bg-cyan-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-slate-800 border-slate-700 text-white app-surface">
                    <DialogHeader>
                      <DialogTitle>Nova Matéria</DialogTitle>
                      <DialogDescription className="text-gray-400">Adicione uma nova Matéria ao ciclo</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Nome</Label>
                        <Input
                          value={newSubject.name}
                          onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                          placeholder="Ex: Matemática"
                          className="bg-slate-700 border-slate-600 text-white app-surface"
                        />
                      </div>
                      
                      <div>
                        <Label className="text-gray-300">Cor</Label>
                        <Input type="color" value={newSubject.color} onChange={(e) => setNewSubject({ ...newSubject, color: e.target.value })} className="h-10 bg-slate-700 border-slate-600 app-surface" />
                      </div>
                      <div>
                        <Label className="text-gray-300">Meta semanal (minutos)</Label>
                        <Input
                          type="number"
                          value={newSubject.time_goal}
                          onChange={(e) => setNewSubject({ ...newSubject, time_goal: parseInt(e.target.value) })}
                          className="bg-slate-700 border-slate-600 text-white app-surface"
                        />
                      </div>
                      <Button onClick={handleAddSubject} className="w-full bg-cyan-500 hover:bg-cyan-600">
                        Adicionar Matéria
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
  {subjects.map((subject, index) => (
    <div
      key={subject.id}
      className={`w-full p-3 rounded-lg hover:bg-slate-700/30 transition-colors cursor-grab ${dragIndex === index ? 'opacity-50' : ''}`}
      draggable
      onDragStart={() => onDragStartSubject(index)}
      onDragOver={onDragOverSubject}   
      onDrop={() => onDropSubject(index)}
    >
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
        <span className="flex-1 text-white">{subject.name}</span>
        <span className="text-gray-400 text-sm">{formatHours(subject.time_goal)}</span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-cyan-400 hover:bg-cyan-500/10"
            onClick={() => handleStartStudy(subject)}
          >
            <Play className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-gray-400 hover:bg-slate-600"
            onClick={() => {
              setEditingSubject(subject);
              setShowEditSubject(true);
            }}
          >
            <Edit2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-red-500/10"
            onClick={() => handleDeleteSubject(subject.id)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* barra de progresso desta Matéria */}
      <div className="mt-2">
        <Bar value={subjectProgressPct(subject)} />
      </div>
    </div>
  ))}
</div>

            </div>

            {/* About Section */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 app-surface">
              <h3 className="text-xl font-bold text-white mb-4">Sobre o Pomociclo</h3>
              <div className="text-gray-300 space-y-3 text-sm leading-relaxed">
                <p>
                  <strong>Obrigado por usar o Pomociclo!</strong> 
                </p>
                <p>
                  Este site foi desenvolvido com muito carinho, tempo e investimento (muito MESMO). 
                  Se você está gostando e quer apoiar o projeto, qualquer contribuição é muito bem-vinda (e extremamente necessária)! 
                </p>
                <p className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-lg p-4 mt-4 app-surface">
                  <span className="text-cyan-400 font-bold text-sm block mb-2"> Ajude com uma doação simbólica via PIX:</span>
                  <span className="text-white font-mono text-base bg-slate-900/50 px-3 py-2 rounded border border-slate-700 inline-block app-surface">[pomociclo@gmail.com]</span>
                </p>
                <p className="text-xs text-gray-400 mt-4 italic">
                  Sua contribuição ajuda a manter o site no ar e trazer novas funcionalidades! ✨
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel - Cycle Map & Stats */}
          <div className="space-y-6">
            {/* Cycle Map */}
            <CycleMap
              subjects={subjects}
              currentSubject={currentSubject}
              setCurrentSubject={setCurrentSubject}
              mapAnimKey={mapAnimKey}
              animateArcs={animateArcs}
              deg2rad={deg2rad}
              polar={polar}
              arcPath={arcPath}
              formatHours={formatHours}
              totalStudiedUI={totalStudiedUI}
            />

            {/* Quests */}
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 app-surface app-surface">
              <h3 className="text-lg font-bold text-white mb-4">Quests Semanais</h3>
              <div className="space-y-3">
  {weeklyQuests.map((quest, i) => (
    <div key={quest.id ?? i} className="p-3 bg-slate-700/30 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold text-white text-sm">{quest.title}</p>
        {quest.completed && (
          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
            Concluída
          </span>
        )}
      </div>

      <Progress
        value={(quest.progress / quest.target) * 100}
        className="h-1.5 mb-2 bg-slate-600"
      />

      <div className="flex justify-between text-xs">
        <span className="text-gray-400">
          {quest.progress} / {quest.target}
        </span>
        <span className="text-cyan-400">
  +C${quest.coins_reward} +{quest.xp_reward} XP
</span>

      </div>
    </div>
  ))}
</div>

            </div>
          </div>
          {/* end Right Panel */}
        </div>
        {/* end grid */}
      </div>
      {/* end container */}

      {/* Floating Music Button (fora do container, mas dentro do min-h-screen) */}
      <Button onClick={() => setShowMusicPlayer(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-purple-600 hover:bg-purple-500 shadow-lg z-40" data-testid="music-button">
        <Music className="w-6 h-6" />
      </Button>

      {/* Edit Subject Dialog */}
      <Dialog open={showEditSubject} onOpenChange={setShowEditSubject}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white app-surface">
          <DialogHeader>
            <DialogTitle>Editar Matéria</DialogTitle>
            <DialogDescription className="text-gray-400">Altere as informações da Matéria</DialogDescription>
          </DialogHeader>
          {editingSubject && (
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300">Nome</Label>
                <Input value={editingSubject.name} onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })} className="bg-slate-700 border-slate-600 text-white app-surface" />
              </div>
              <div>
                <Label className="text-gray-300">Cor</Label>
                <Input type="color" value={editingSubject.color} onChange={(e) => setEditingSubject({ ...editingSubject, color: e.target.value })} className="h-10 bg-slate-700 border-slate-600 app-surface" />
              </div>
              <div>
                <Label className="text-gray-300">Meta semanal (minutos)</Label>
                <Input type="number" value={editingSubject.time_goal} onChange={(e) => setEditingSubject({ ...editingSubject, time_goal: parseInt(e.target.value) })} className="bg-slate-700 border-slate-600 text-white app-surface" />
              </div>
              <Button onClick={handleEditSubject} className="w-full bg-cyan-500 hover:bg-cyan-600">
                Salvar Alterações
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reset Dialog */}
      <Dialog open={openReset} onOpenChange={setOpenReset}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white app-surface">
          <DialogHeader>
            <DialogTitle>Resetar</DialogTitle>
            <DialogDescription className="text-gray-400">Escolha o que deseja resetar.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <Button onClick={handleResetCycleUI} className="w-full bg-cyan-600 hover:bg-cyan-500">
               Resetar ciclo (100%)
            </Button>
            <Button onClick={handleResetBlock} variant="secondary" className="w-full">
               Resetar bloco atual
            </Button>
          </div>
        </DialogContent>
      </Dialog>
<Dialog open={!!levelUpInfo} onOpenChange={() => setLevelUpInfo(null)}>
  <DialogContent className="bg-slate-900 border-slate-700 text-white text-center app-surface">
    <DialogHeader>
      <DialogTitle className="text-2xl">Subiu de nível!</DialogTitle>
      <DialogDescription className="text-gray-400">
        {levelUpInfo
          ? <>Você passou do nível <b>{levelUpInfo.oldLevel}</b> para <b>{levelUpInfo.newLevel}</b>!</>
          : null}
      </DialogDescription>
    </DialogHeader>

    {levelUpInfo?.bonusCoins > 0 ? (
      <div className="mt-3">
        <p className="text-lg">
           <b>Nível especial!</b> Você ganhou um bônus de <b className="text-cyan-300">{levelUpInfo.bonusCoins} C$</b> <br />
          (10% de todas as horas estudadas até hoje).
        </p>
      </div>
    ) : (
      <p className="text-lg mt-3">Continue assim a cada sessão te deixa mais forte. </p>
    )}

    <div className="mt-4">
      <Button onClick={() => setLevelUpInfo(null)} className="bg-cyan-600 hover:bg-cyan-500">Bora estudar mais!</Button>
    </div>
  </DialogContent>
</Dialog>

<Music className="w-4 h-4" />

</div>
);
}
