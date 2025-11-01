import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { ArrowLeft, Settings as SettingsIcon, Volume2, Trash2, AlertTriangle } from 'lucide-react';
import Header from '../components/Header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Sons disponÃ­veis
// Sons disponíveis
const SOUND_OPTIONS = [
  { id: 'bell',    name: '🔔 Sino' },
  { id: 'chime',   name: '🎶 Melodia' },
  { id: 'ding',    name: '✨ Ding' },
  { id: 'gong',    name: '🛕 Gongo' },
  { id: 'alert',   name: '⚠️ Alerta' },
  { id: 'soft',    name: '🌙 Suave' },
  { id: 'ping',    name: '📍 Ping' },
  { id: 'digital', name: '📟 Digital' },
  { id: 'nature',  name: '🌿 Natureza' },
  { id: 'zen',     name: '🧘 Zen' },
];


export default function Settings() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState({ 
    study_duration: 50, 
    break_duration: 10,
    long_break_duration: 30,
    long_break_interval: 4,
    sound_enabled: true,
    sound_id: 'bell',
    sound_duration: 2
  });

  const [nickname, setNickname] = useState('');
  const [tag, setTag] = useState('');

  const [canChangeNickname, setCanChangeNickname] = useState(true);
  const [daysUntilChange, setDaysUntilChange] = useState(0);

  const [loading, setLoading] = useState(true);
  const [playingSound, setPlayingSound] = useState(false);

  useEffect(() => {
    let alive = true;

    async function loadData() {
      try {
        const [userRes, settingsRes] = await Promise.all([
          api.get('/auth/me'),
          api.get('/settings'),
        ]);

        const u = userRes.data?.user || null;
 if (userRes.data?.anon) {
   // não logado: volta pro início
   navigate('/', { replace: true });
   return;
 }

        if (!alive) return;

        setUser(u);

        setSettings({
          study_duration: Number(settingsRes?.data?.study_duration ?? 50),
          break_duration: Number(settingsRes?.data?.break_duration ?? 10),
          long_break_duration: Number(settingsRes?.data?.long_break_duration ?? 30),
          long_break_interval: Number(settingsRes?.data?.long_break_interval ?? 4),
          sound_enabled: settingsRes?.data?.sound_enabled ?? true,
          sound_id: settingsRes?.data?.sound_id || 'bell',
          sound_duration: settingsRes?.data?.sound_duration ?? 2,
        });

        setNickname(u?.nickname ?? '');
        setTag(u?.tag ?? '');

        if (u?.last_nickname_change) {
          const lastChange = new Date(u.last_nickname_change);
          const now = new Date();
          const daysSince = Math.floor((now - lastChange) / (1000 * 60 * 60 * 24));
          if (daysSince < 60) {
            setCanChangeNickname(false);
            setDaysUntilChange(60 - daysSince);
          }
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          navigate('/', { replace: true });
          return;
        }
        toast.error(error?.response?.data?.detail || 'Falha ao carregar configurações');
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadData();
    return () => { alive = false; };
  }, [navigate]);

  async function handleSaveSettings() {
    try {
      await api.post('/settings', settings);
      toast.success('Configurações salvas!');
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Erro ao salvar configurações');
    }
  }

  async function handleChangeNickname() {
    if (!canChangeNickname) {
      toast.error(`Você poderá alterar novamente em ${daysUntilChange} dias`);
      return;
    }
    
    if (!nickname.trim() || !tag.trim()) {
      toast.error('Preencha nickname e tag');
      return;
    }

    try {
      await api.post('/user/nickname', { nickname: nickname.trim(), tag: tag.trim() });
      toast.success('Nickname#tag atualizado!');
      // Recarrega dados para atualizar o contador de dias
      window.location.reload();
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Erro ao atualizar nickname#tag');
    }
  }

  async function handleDeleteAccount() {
    try {
      await api.delete('/auth/me');
      toast.success('Conta excluída com sucesso');
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      toast.error(error?.response?.data?.detail || 'Erro ao excluir conta');
    }
  }

function playSoundById(soundId, duration = 2, onend) {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const d = Math.min(Math.max(duration, 0.25), 5);

  const finish = () => { try { ctx.close(); } catch {} ; onend && onend(); };

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

  switch (soundId) {
    case 'bell':    // sino metálico
      tone('sine', 880, 0.00, d,     0.25);
      tone('sine', 1320,0.00, d*0.8, 0.15);
      break;
    case 'chime':   // três notinhas ascendentes
      tone('sine', 1200, 0.00, 0.25*d, 0.18);
      tone('sine', 1500, 0.12, 0.25*d, 0.18);
      tone('sine', 1800, 0.24, 0.30*d, 0.14);
      break;
    case 'ding':    // um toque curto
      tone('sine', 1000, 0.00, d*0.6, 0.22);
      break;
    case 'gong':    // grave, longo, com parciais
      tone('sine', 196, 0.00, d*1.2, 0.30);
      tone('sine', 98,  0.00, d*1.2, 0.08);
      tone('sine', 294, 0.00, d,     0.12);
      break;
    case 'alert':   // beep-beep-beep
      tone('square', 880, 0.00, 0.20, 0.20);
      tone('square', 880, 0.30, 0.20, 0.20);
      tone('square', 880, 0.60, 0.20, 0.20);
      break;
    case 'soft':    // suave e curto
      tone('sine', 600, 0.00, d, 0.12);
      break;
    case 'ping':    // ping curtinho
      tone('sine', 1500, 0.00, 0.15*d + 0.15, 0.20);
      break;
    case 'digital': // passinhos quadrados
      tone('square', 1200, 0.00, 0.15, 0.15);
      tone('square', 1600, 0.18, 0.12, 0.15);
      tone('square', 2000, 0.34, 0.10, 0.12);
      break;
    case 'nature':  // ruído leve + "pássaros"
      noise(0.00, d, 1500, 0.02);
      tone('sine', 2500, 0.10, 0.10, 0.06);
      tone('sine', 3200, 0.26, 0.10, 0.06);
      break;
    case 'zen':     // “taça tibetana”
      tone('sine', 440, 0.00, d,     0.18);
      tone('sine', 660, 0.00, d*0.9, 0.10);
      break;
    default:
      tone('sine', 1000, 0.00, d*0.6, 0.2);
  }

  setTimeout(finish, d * 1000 + 200);
}


  function playTestSound() {
    if (playingSound) return;
    setPlayingSound(true);
    // usa a mesma engine da página (playSoundById) para soar exatamente igual
    try {
      playSoundById(settings.sound_id, settings.sound_duration || 2, () => {
        setPlayingSound(false);
      });
    } catch {
      setPlayingSound(false);
    }
  }



  if (!loading && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
        <Header user={null} />
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-300 text-lg font-semibold mb-2">Erro ao carregar configurações</p>
            <p className="text-gray-400 mb-4">Não foi possível carregar seus dados.</p>
            <Button onClick={() => navigate('/dashboard')} className="bg-cyan-500 hover:bg-cyan-600">
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      <Header user={user} />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="text-gray-400 hover:text-white hover:bg-slate-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
              <SettingsIcon className="inline w-8 h-8 mr-3 text-cyan-400" />
              Configurações
            </h1>
          </div>
        </div>

        <div className="space-y-6">
          {/* Nickname#Tag */}
          <Card className="bg-gradient-to-br from-slate-800/70 to-slate-800/50 backdrop-blur-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10 app-surface">
            <CardHeader>
              <CardTitle className="text-white text-xl">Nickname#Tag</CardTitle>
              <CardDescription className="text-gray-400">
                {canChangeNickname
                  ? 'Você pode alterar seu nickname#tag agora'
                  : `⚠️ Você poderá alterar novamente em ${daysUntilChange} dia(s)`}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 font-semibold">Nickname (4-16 caracteres)</Label>
                <Input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  maxLength={16}
                  disabled={!canChangeNickname}
                  placeholder={user?.nickname || 'Seu nickname'}
                  className="bg-slate-700/50 border-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed app-surface"
                />
              </div>
              <div>
                <Label className="text-gray-300 font-semibold">Tag (3-4 caracteres)</Label>
                <Input
                  value={tag}
                  onChange={(e) => setTag(e.target.value.replace(/[^a-zA-Z0-9]/g, ''))}
                  maxLength={4}
                  disabled={!canChangeNickname}
                  placeholder={user?.tag || 'Tag'}
                  className="bg-slate-700/50 border-slate-600 text-white disabled:opacity-50 disabled:cursor-not-allowed app-surface"
                />
              </div>
              <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-4 app-surface">
                <p className="text-sm text-gray-400 mb-2">Preview:</p>
                <p className="text-cyan-300 font-bold text-xl">
                  {nickname.trim() && tag.trim()
                    ? `${nickname}#${tag}`
                    : user?.nickname && user?.tag
                      ? `${user.nickname}#${user.tag}`
                      : <span className="text-gray-500 italic">Defina seu nickname e tag acima</span>}
                </p>
              </div>

              <Button
                onClick={handleChangeNickname}
                disabled={!canChangeNickname}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Salvar Nickname#Tag
              </Button>
            </CardContent>
          </Card>

          {/* Pomodoro Settings */}
          <Card className="bg-gradient-to-br from-slate-800/70 to-slate-800/50 backdrop-blur-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10 app-surface">
            <CardHeader>
              <CardTitle className="text-white text-xl">Configurações do Pomodoro</CardTitle>
              <CardDescription className="text-gray-400">
                Personalize os tempos de estudo e pausa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-gray-300 font-semibold">Tempo de Estudo (minutos)</Label>
                <Input
                  type="number"
                  value={settings.study_duration}
                  onChange={(e) => setSettings({ ...settings, study_duration: Number(e.target.value) })}
                  min={1}
                  max={120}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300 font-semibold">Tempo de Pausa Curta (minutos)</Label>
                <Input
                  type="number"
                  value={settings.break_duration}
                  onChange={(e) => setSettings({ ...settings, break_duration: Number(e.target.value) })}
                  min={1}
                  max={60}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-gray-300 font-semibold">Tempo de Pausa Longa (minutos)</Label>
                <Input
                  type="number"
                  value={settings.long_break_duration}
                  onChange={(e) => setSettings({ ...settings, long_break_duration: Number(e.target.value) })}
                  min={1}
                  max={120}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Pausa longa substitui a pausa curta e não é contabilizada no progresso
                </p>
              </div>
              <div>
                <Label className="text-gray-300 font-semibold">Pausa Longa a Cada X Blocos de Estudo</Label>
                <Input
                  type="number"
                  value={settings.long_break_interval}
                  onChange={(e) => setSettings({ ...settings, long_break_interval: Number(e.target.value) })}
                  min={1}
                  max={10}
                  className="bg-slate-700/50 border-slate-600 text-white"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Exemplo: 4 = pausa longa após cada 4 blocos de estudo
                </p>
              </div>
              <Button
                onClick={handleSaveSettings}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-semibold"
              >
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>

          {/* NotificaÃ§Ãµes Sonoras */}
          <Card className="bg-gradient-to-br from-slate-800/70 to-slate-800/50 backdrop-blur-xl border border-cyan-500/20 shadow-lg shadow-cyan-500/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <Volume2 className="w-5 h-5 text-cyan-400" />
                Notificações Sonoras
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure os sons ao terminar blocos de estudo e pausa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={settings.sound_enabled}
                  onChange={(e) => setSettings({ ...settings, sound_enabled: e.target.checked })}
                  className="w-5 h-5 accent-cyan-500"
                />
                <Label className="text-gray-300 font-semibold">Ativar sons de notificação</Label>
              </div>

              {settings.sound_enabled && (
                <>
                  <div>
                    <Label className="text-gray-300 font-semibold mb-2 block">Tipo de Som</Label>
                    <select
                      value={settings.sound_id}
                      onChange={(e) => setSettings({ ...settings, sound_id: e.target.value })}
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-xl px-4 py-2.5 text-white"
                    >
                      {SOUND_OPTIONS.map(sound => (
                        <option key={sound.id} value={sound.id}>{sound.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label className="text-gray-300 font-semibold mb-2 block">
                      Duração do Som: {settings.sound_duration.toFixed(1)}s
                    </Label>
                    <input
                      type="range"
                      min="0.5"
                      max="4"
                      step="0.5"
                      value={settings.sound_duration}
                      onChange={(e) => setSettings({ ...settings, sound_duration: Number(e.target.value) })}
                      className="w-full accent-cyan-500"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.5s</span>
                      <span>4s</span>
                    </div>
                  </div>

                  <Button
                    onClick={playTestSound}
                    disabled={playingSound}
                    variant="outline"
                    className="w-full border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10"
                  >
                    {playingSound ? 'Tocando...' : '🔊 Testar som'}
                  </Button>
                </>
              )}

              <Button
                onClick={handleSaveSettings}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-semibold"
              >
                Salvar Configurações de Som
              </Button>
            </CardContent>
          </Card>

          {/* Zona de Perigo - Excluir Conta */}
          <Card className="bg-gradient-to-br from-red-900/30 to-slate-800/50 backdrop-blur-xl border border-red-500/30 shadow-lg shadow-red-500/10">
            <CardHeader>
              <CardTitle className="text-white text-xl flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Zona de Perigo
              </CardTitle>
              <CardDescription className="text-gray-400">
                Ações irreversíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-500 font-semibold">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta Permanentemente
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-red-500/30">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white text-xl">⚠️ Atenção!</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-300">
                      Você tem certeza que deseja excluir sua conta?
                      <br /><br />
                      <strong className="text-red-400">Esta ação é IRREVERSÍVEL!</strong>
                      <br /><br />
                      Todos os seus dados serão permanentemente removidos:
                      <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                        <li>Progresso de estudos</li>
                        <li>Estatísticas e nível</li>
                        <li>Matérias e revisões</li>
                        <li>Itens e moedas</li>
                        <li>Amigos e grupos</li>
                      </ul>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-700 text-white hover:bg-slate-600">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-red-600 hover:bg-red-500 text-white"
                    >
                      Sim, excluir minha conta
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}