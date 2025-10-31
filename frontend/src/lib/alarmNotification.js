// Sistema de alarme e notificação melhorado
class AlarmSystem {
  constructor() {
    this.audioContext = null;
    this.hasPermission = false;
    this.init();
  }

  async init() {
    // Solicitar permissão para notificações
    if ('Notification' in window && Notification.permission === 'default') {
      try {
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
      } catch (e) {
        console.log('Erro ao solicitar permissão de notificação:', e);
      }
    } else if (Notification.permission === 'granted') {
      this.hasPermission = true;
    }

    // Criar contexto de áudio
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioContext = new AudioContext();
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        this.hasPermission = permission === 'granted';
        return this.hasPermission;
      } catch (e) {
        console.log('Erro ao solicitar permissão:', e);
        return false;
      }
    }
    return false;
  }

  showNotification(title, body, icon = '⏰') {
    if (!this.hasPermission) {
      console.log('Sem permissão para notificações');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon,
        badge: icon,
        tag: 'study-timer',
        requireInteraction: true, // Notificação permanece até usuário fechar
        silent: false, // Com som
      });

      // Auto-fechar após 10 segundos
      setTimeout(() => {
        notification.close();
      }, 10000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.log('Erro ao mostrar notificação:', e);
    }
  }

  // Criar alarme de alta qualidade inspirado no vídeo
  async playAlarm(durationSeconds = 4) {
    if (!this.audioContext) return;

    // Retomar contexto se suspenso
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    const ctx = this.audioContext;
    const now = ctx.currentTime;
    
    // Criar master gain
    const masterGain = ctx.createGain();
    masterGain.connect(ctx.destination);
    masterGain.gain.setValueAtTime(0.3, now);

    // Função para criar um bipe com envelope
    const createBeep = (frequency, startTime, duration, volume = 1) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(masterGain);
      
      oscillator.frequency.setValueAtTime(frequency, startTime);
      oscillator.type = 'sine';
      
      // Envelope ADSR
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.05); // Attack
      gainNode.gain.linearRampToValueAtTime(volume * 0.7, startTime + 0.1); // Decay
      gainNode.gain.setValueAtTime(volume * 0.7, startTime + duration - 0.1); // Sustain
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration); // Release
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    // Criar padrão de alarme (inspirado em despertadores clássicos)
    // Bipes em série: 800Hz e 1000Hz alternados
    const beepDuration = 0.15;
    const beepGap = 0.08;
    const patternDuration = (beepDuration + beepGap) * 4; // 4 bipes por padrão
    
    const numPatterns = Math.ceil(durationSeconds / patternDuration);
    
    for (let p = 0; p < numPatterns; p++) {
      const patternStart = now + p * patternDuration;
      
      // 2 bipes agudos
      createBeep(1000, patternStart, beepDuration, 0.8);
      createBeep(1000, patternStart + beepDuration + beepGap, beepDuration, 0.8);
      
      // 2 bipes graves
      createBeep(800, patternStart + (beepDuration + beepGap) * 2, beepDuration, 0.7);
      createBeep(800, patternStart + (beepDuration + beepGap) * 3, beepDuration, 0.7);
    }

    // Limpar após tocar
    setTimeout(() => {
      masterGain.disconnect();
    }, durationSeconds * 1000 + 100);
  }

  // Alarme principal que toca e mostra notificação
  async trigger(title = '⏰ Timer Completo!', body = 'Seu tempo acabou!') {
    // Tocar alarme
    await this.playAlarm(4);
    
    // Mostrar notificação
    this.showNotification(title, body);
    
    // Se a página estiver em background, tentar dar foco
    if (document.hidden) {
      try {
        window.focus();
      } catch (e) {
        // Alguns navegadores bloqueiam window.focus()
      }
    }
  }

  // Testar alarme
  async test() {
    await this.playAlarm(2);
    this.showNotification('🔔 Teste de Alarme', 'Alarme funcionando corretamente!');
  }
}

// Exportar instância singleton
export const alarmSystem = new AlarmSystem();
