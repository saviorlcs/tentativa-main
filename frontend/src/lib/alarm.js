// src/lib/alarm.js
class Alarm {
  constructor() {
    this.ctx = null;
    this._unlocked = false;
    this._unlockHandler = this._unlockHandler.bind(this);
    this._resumeIfNeeded = this._resumeIfNeeded.bind(this);

    // Tente “auto” preparar: alguns browsers permitem antes do gesto
    this._ensureContext();

    // Listeners para destravar com QUALQUER gesto do usuário
    window.addEventListener("pointerdown", this._unlockHandler, { passive: true });
    window.addEventListener("keydown", this._unlockHandler, { passive: true });
    window.addEventListener("touchstart", this._unlockHandler, { passive: true });

    // Se a aba ficar oculta/visível, garanta que o contexto não permaneça suspenso
    document.addEventListener("visibilitychange", this._resumeIfNeeded);
    window.addEventListener("focus", this._resumeIfNeeded);
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
   * Beep simples com WebAudio (sem arquivo de áudio).
   * Toca 2 bipes curtos (700Hz e 550Hz) com envelope suave.
   */
  async playBeep() {
    const ctx = this._ensureContext();
    if (!ctx) return;

    // Garante que o contexto está ativo; se não estiver, falhará silenciosamente
    await this.resume();

    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.connect(ctx.destination);

    const mkTone = (freq, start, dur) => {
      const osc = ctx.createOscillator();
      osc.frequency.value = freq;
      osc.connect(gain);

      // Envelope: ataque/decay rápidos para evitar “click”
      const a = 0.01, d = 0.08;
      gain.gain.linearRampToValueAtTime(0.0001, start);
      gain.gain.linearRampToValueAtTime(0.8, start + a);
      gain.gain.exponentialRampToValueAtTime(0.001, start + a + d);

      osc.start(start);
      osc.stop(start + dur);
    };

    // Dois bipes em sequência
    mkTone(700, now + 0.00, 0.18);
    mkTone(550, now + 0.22, 0.18);
  }

  /**
   * API pública: tenta tocar; se estiver bloqueado, nós forçamos um resume
   * e deixamos um retorno boolean para UI opcional (exibir dica/toast).
   */
  async play() {
    const ok = await this.resume();
    try {
      await this.playBeep();
      return true;
    } catch {
      return !!ok;
    }
  }

  get unlocked() {
    return this._unlocked;
  }
}

export const alarm = new Alarm();
