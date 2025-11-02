import { useEffect } from 'react';

/**
 * Hook para carregar e aplicar o tema salvo no localStorage
 * Deve ser usado no App.js principal
 */
export function useThemeLoader() {
  useEffect(() => {
    // Tenta carregar do localStorage primeiro (resposta imediata)
    const savedMode = localStorage.getItem('theme_mode');
    const savedScheme = localStorage.getItem('color_scheme');
    const savedColors = localStorage.getItem('theme_colors');
    
    if (savedColors && savedScheme) {
      try {
        const colors = JSON.parse(savedColors);
        applyThemeColors(colors);
        console.log('[ThemeLoader] Tema restaurado do localStorage:', savedScheme);
      } catch (e) {
        console.error('[ThemeLoader] Erro ao restaurar tema:', e);
      }
    }
    
    // Listener para mudanças de tema
    const handleThemeChange = (e) => {
      if (e.detail?.colors) {
        applyThemeColors(e.detail.colors);
      }
    };
    
    window.addEventListener('themeChanged', handleThemeChange);
    
    return () => {
      window.removeEventListener('themeChanged', handleThemeChange);
    };
  }, []);
}

/**
 * Aplica as cores do tema no document root e body
 */
function applyThemeColors(colors) {
  const root = document.documentElement;
  const body = document.body;
  
  if (!colors) return;
  
  // Aplica no root
  root.style.setProperty('--primary', colors.primary);
  root.style.setProperty('--accent', colors.accent);
  root.style.setProperty('--bg', colors.bg);
  root.style.setProperty('--surface', colors.surface);
  root.style.setProperty('--text', colors.text);
  
  // Aplica no body
  body.style.setProperty('--primary', colors.primary);
  body.style.setProperty('--accent', colors.accent);
  body.style.setProperty('--bg', colors.bg);
  body.style.setProperty('--surface', colors.surface);
  body.style.setProperty('--text', colors.text);
}
