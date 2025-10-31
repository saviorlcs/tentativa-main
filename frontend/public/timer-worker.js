// Timer Web Worker - Roda em thread separada, não é afetado por tab visibility
let timerId = null;
let endTime = null;
let mode = 'idle';
let isPaused = false;

self.onmessage = function(e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'START':
      // payload: { seconds, mode: 'focus'|'break' }
      mode = payload.mode || 'focus';
      endTime = Date.now() + (payload.seconds * 1000);
      isPaused = false;
      
      if (timerId) clearInterval(timerId);
      
      // Envia update imediato
      self.postMessage({
        type: 'TICK',
        timeLeft: payload.seconds,
        mode: mode,
        isRunning: true
      });
      
      // Atualiza a cada 100ms para maior precisão
      timerId = setInterval(() => {
        if (isPaused) return;
        
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
        
        self.postMessage({
          type: 'TICK',
          timeLeft: remaining,
          mode: mode,
          isRunning: true
        });
        
        if (remaining <= 0) {
          clearInterval(timerId);
          timerId = null;
          self.postMessage({
            type: 'COMPLETE',
            mode: mode
          });
        }
      }, 100); // 100ms para melhor precisão
      break;

    case 'PAUSE':
      isPaused = true;
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      const remainingOnPause = endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;
      self.postMessage({
        type: 'PAUSED',
        timeLeft: remainingOnPause,
        mode: mode
      });
      break;

    case 'RESUME':
      // payload: { seconds }
      if (payload && payload.seconds !== undefined) {
        endTime = Date.now() + (payload.seconds * 1000);
        isPaused = false;
        
        if (timerId) clearInterval(timerId);
        
        timerId = setInterval(() => {
          const now = Date.now();
          const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
          
          self.postMessage({
            type: 'TICK',
            timeLeft: remaining,
            mode: mode,
            isRunning: true
          });
          
          if (remaining <= 0) {
            clearInterval(timerId);
            timerId = null;
            self.postMessage({
              type: 'COMPLETE',
              mode: mode
            });
          }
        }, 100);
      }
      break;

    case 'STOP':
      if (timerId) {
        clearInterval(timerId);
        timerId = null;
      }
      endTime = null;
      isPaused = false;
      mode = 'idle';
      self.postMessage({
        type: 'STOPPED'
      });
      break;

    case 'GET_STATE':
      const currentRemaining = endTime ? Math.max(0, Math.ceil((endTime - Date.now()) / 1000)) : 0;
      self.postMessage({
        type: 'STATE',
        timeLeft: currentRemaining,
        mode: mode,
        isRunning: !isPaused && timerId !== null,
        isPaused: isPaused
      });
      break;

    default:
      console.warn('Unknown message type:', type);
  }
};

// Mantém o worker ativo
self.postMessage({ type: 'READY' });
