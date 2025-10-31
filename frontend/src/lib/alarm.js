// src/lib/alarm.js
import { api } from "./api";

// Sons disponíveis - Google Actions Library (sem copyright)
const SOUND_OPTIONS = [
  { 
    id: 'bell', 
    name: '🔔 Sino Clássico',
    url: 'https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg'
  },
  { 
    id: 'chime', 
    name: '🎶 Campainha Suave',
    url: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
  },
  { 
    id: 'digital', 
    name: '📟 Digital Moderno',
    url: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg'
  },
  { 
    id: 'morning', 
    name: '🌅 Alarme Matinal',
    url: 'https://actions.google.com/sounds/v1/alarms/medium_bell_ringing_near.ogg'
  },
  { 
    id: 'gentle', 
    name: '🌙 Suave e Gentil',
    url: 'https://actions.google.com/sounds/v1/alarms/phone_alerts_and_rings.ogg'
  },
  { 
    id: 'bugle', 
    name: '🎺 Corneta',
    url: 'https://actions.google.com/sounds/v1/alarms/bugle_tune.ogg'
  },
  { 
    id: 'buzzer', 
    name: '⚡ Buzzer Elétrico',
    url: 'https://actions.google.com/sounds/v1/alarms/buzzer.ogg'
  },
  { 
    id: 'marimba', 
    name: '🎵 Marimba Suave',
    url: 'https://actions.google.com/sounds/v1/alarms/marimba_flourish.ogg'
  },
  { 
    id: 'mechanical', 
    name: '⚙️ Relógio Mecânico',
    url: 'https://actions.google.com/sounds/v1/alarms/mechanical_clock_ring.ogg'
  },
  { 
    id: 'spaceship', 
    name: '🚀 Nave Espacial',
    url: 'https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg'
  },
  { 
    id: 'rooster', 
    name: '🐓 Galo de Manhã',
    url: 'https://actions.google.com/sounds/v1/animals/rooster_crow.ogg'
  },
  { 
    id: 'computer', 
    name: '💻 Alerta de Computador',
    url: 'https://actions.google.com/sounds/v1/alarms/computerized_alarm_clock.ogg'
  },
];

export { SOUND_OPTIONS };

class Alarm {
  constructor() {
    this.ctx = null;
    this._unlocked = false;
    this._unlockHandler = this._unlockHandler.bind(this);
    this._resumeIfNeeded = this._resumeIfNeeded.bind(this);
    this.currentAudio = null;
    this.settings = null;

    // Tente "auto" preparar: alguns browsers permitem antes do gesto
    this._ensureContext();
    this._loadSettings();

    // Listeners para destravar com QUALQUER gesto do usuário
    window.addEventListener("pointerdown", this._unlockHandler, { passive: true });
    window.addEventListener("keydown", this._unlockHandler, { passive: true });
    window.addEventListener("touchstart", this._unlockHandler, { passive: true });

    // Se a aba ficar oculta/visível, garanta que o contexto não permaneça suspenso
    document.addEventListener("visibilitychange", this._resumeIfNeeded);
    window.addEventListener("focus", this._resumeIfNeeded);
  }

  async _loadSettings() {
    try {
      const res = await api.get('/settings');
      this.settings = res.data || { sound_enabled: true, sound_id: 'bell', sound_duration: 2 };
    } catch {
      this.settings = { sound_enabled: true, sound_id: 'bell', sound_duration: 2 };
    }
  }

  _ensureContext() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC({ latencyHint: "interactive" });
    }
    return this.ctx;
  }

  async _unlockHandler() {
    // Primeiro gesto do usuário → podemos retomar o contexto
    await this.resume();
    this._unlocked = true;

    // Já destravou? remove os listeners de desbloqueio
    window.removeEventListener("pointerdown", this._unlockHandler);
    window.removeEventListener("keydown", this._unlockHandler);
    window.removeEventListener("touchstart", this._unlockHandler);
  }

  async _resumeIfNeeded() {
    // Sempre que foco/visibilidade mudar, tente garantir o contexto ativo
    await this.resume();
  }

  async resume() {
    const ctx = this._ensureContext();
    if (!ctx) return false;
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {}
    }
    return ctx.state === "running";
  }

  /**
   * Beep simples com WebAudio (backup se settings não estiver disponível)
   */
  async playBeep() {
    const ctx = this._ensureContext();
    if (!ctx) return;

    await this.resume();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.connect(ctx.destination);

    const mkTone = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.connect(gain);

      const a = 0.01, d = 0.08;
      gain.gain.linearRampToValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.8, start + a);
      gain.gain.exponentialRampToValueAtTime(0.001, start + a + d);

      osc.start(start);
      osc.stop(start + dur);
    };

    mkTone(700, now + 0.00, 0.18);
    mkTone(550, now + 0.22, 0.18);
  }

  /**
   * Toca o som configurado pelo usuário usando arquivos de áudio
   */
  async playConfiguredSound() {
    // Recarrega settings para garantir que está atualizado
    if (!this.settings) {
      await this._loadSettings();
    }

    // Se som desabilitado, não toca
    if (!this.settings.sound_enabled) {
      return true;
    }

    // Para qualquer som que esteja tocando
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
    }

    // Encontra o som pelo ID
    const soundId = this.settings.sound_id || 'bell';
    const sound = SOUND_OPTIONS.find(s => s.id === soundId);
    
    if (!sound || !sound.url) {
      // Fallback para beep se não encontrar o som
      await this.playBeep();
      return true;
    }

    return new Promise((resolve) => {
      this.currentAudio = new Audio(sound.url);
      this.currentAudio.volume = 0.7;
      
      const duration = Math.min(Math.max(this.settings.sound_duration || 2, 0.5), 5) * 1000;
      let timeoutId;

      const cleanup = () => {
        clearTimeout(timeoutId);
        if (this.currentAudio) {
          this.currentAudio.pause();
          this.currentAudio.currentTime = 0;
        }
        this.currentAudio = null;
        resolve(true);
      };

      this.currentAudio.addEventListener('ended', cleanup);
      this.currentAudio.addEventListener('error', () => {
        console.warn('Erro ao tocar som, usando beep');
        cleanup();
        this.playBeep().then(() => resolve(true));
      });

      timeoutId = setTimeout(cleanup, duration);

      this.currentAudio.play().catch(() => {
        cleanup();
        this.playBeep().then(() => resolve(true));
      });
    });
  }

  /**
   * API pública: toca o som configurado ou beep como fallback
   */
  async play() {
    const ok = await this.resume();
    try {
      if (!this.settings) {
        await this._loadSettings();
      }
      await this.playConfiguredSound();
      return true;
    } catch {
      await this.playBeep();
      return !!ok;
    }
  }

  get unlocked() {
    return this._unlocked;
  }
}

export const alarm = new Alarm();