// src/lib/siteStyle.js - SISTEMA DE EFEITOS VISUAIS INCRÍVEIS

let __injected = false;

function injectStylesOnce() {
  if (__injected) return;
  __injected = true;
  
  const css = `
/* ============================================ */
/*          AVATAR/SELO EFFECTS                */
/*          VERSÃO LEVE - APENAS SUTIS         */
/* ============================================ */

.seal-avatar { 
  isolation: isolate; 
  position: relative;
}

/* ÓRBITAS (Rare+) - SIMPLIFICADAS */
.seal-avatar[data-orbit="slow"]::after,
.seal-avatar[data-orbit="medium"]::after,
.seal-avatar[data-orbit="fast"]::after {
  content: ""; 
  position: absolute; 
  inset: -8px;
  border-radius: 50%;
  border: 2px dashed rgba(255,255,255,.2);
  pointer-events: none;
  opacity: 0.5;
}

/* PARTÍCULAS - REMOVIDAS (muito pesadas) */

/* TRAILS - REMOVIDOS (muito pesados) */

/* ============================================ */
/*          BORDER EFFECTS (GLOBAL)            */
/*      MANTÉM: rainbow, pulse, prismatic      */
/*      REMOVE: glows intensos, rotações       */
/* ============================================ */

:root { 
  --border-thickness: 2px; 
  --border-glow-color: rgba(59, 130, 246, 0.3);
}

/* Bordas Animadas - RAINBOW (Rare) */
html[data-border-anim="rainbow"] .app-surface {
  position: relative;
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--surface), var(--surface)) padding-box,
    linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00) border-box;
  transition: all 0.3s ease;
}

/* Pulse Rainbow (Epic) */
html[data-border-anim="pulse-rainbow"] .app-surface {
  position: relative;
  border: 2px solid transparent;
  background: 
    linear-gradient(var(--surface), var(--surface)) padding-box,
    linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00) border-box;
  animation: pulse-border-subtle 3s ease-in-out infinite;
}

@keyframes pulse-border-subtle {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Prismatic (Legendary) */
html[data-border-anim="prismatic"] .app-surface {
  position: relative;
  border: 3px solid transparent;
  background: 
    linear-gradient(var(--surface), var(--surface)) padding-box,
    linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00) border-box;
  animation: pulse-border-subtle 2s ease-in-out infinite;
  box-shadow: 0 0 8px rgba(255,255,255,.15);
}

/* REMOVIDO: Sparkles, camadas ::before/::after excessivas, hover transforms */

/* ============================================ */
/*   THEME EFFECTS - REMOVIDO COMPLETAMENTE    */
/*   Temas mudam APENAS --primary e --accent   */
/*   SEM efeitos de background, glows, etc     */
/* ============================================ */

/* Todas as animações e efeitos de tema foram REMOVIDOS */
/* Apenas as variáveis CSS --primary e --accent mudam */

/* ============================================ */
/*          CELEBRATION EFFECTS                */
/* ============================================ */

/* Celebração de milestones (Legendary) */
html[data-celebrate="on"] .celebration-trigger {
  animation: celebration-burst 1s ease-out;
}

@keyframes celebration-burst {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.1); filter: brightness(1.3) saturate(1.5); }
  100% { transform: scale(1); filter: brightness(1); }
}

/* Partículas de celebração */
.celebration-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}

.celebration-particles::before,
.celebration-particles::after {
  content: "🎉";
  position: absolute;
  font-size: 24px;
  animation: particle-rise 2s ease-out forwards;
}

.celebration-particles::before {
  left: 20%;
  animation-delay: 0.1s;
}

.celebration-particles::after {
  right: 20%;
  animation-delay: 0.3s;
}

@keyframes particle-rise {
  0% { 
    bottom: -50px; 
    opacity: 0; 
    transform: translateY(0) rotate(0deg); 
  }
  50% { 
    opacity: 1; 
  }
  100% { 
    bottom: 100vh; 
    opacity: 0; 
    transform: translateY(-100px) rotate(360deg); 
  }
}

/* ============================================ */
/*          UTILITY CLASSES                    */
/*     REMOVIDOS: holographic, breathing       */
/* ============================================ */

.bordered { 
  border: var(--border-thickness) solid rgba(255,255,255,.12); 
}

.cycle-bg {
  transition: filter var(--theme-transition);
}

/* Efeitos holográficos e breathing REMOVIDOS - muito pesados */
  `.trim();

  const el = document.createElement('style');
  el.id = 'pomociclo-efx';
  el.textContent = css;
  document.head.appendChild(el);
}

// ---- helpers antigos (compat) ----
const pick = (id, list) => list[(Number(String(id).split('_')[1] || 0) || 0) % list.length];

/** Aplica um tema animado no site */
export function applyThemeById(itemId) {
  injectStylesOnce();
  const key = pick(itemId, ['aurora','nebula','sunset','matrix','holo']);
  document.documentElement.setAttribute('data-theme', key);
}

/** Aplica um estilo de borda global */
export function applyBorderById(itemId) {
  injectStylesOnce();
  const key = pick(itemId, ['neon','circuit','auric','glass','prism']);
  document.documentElement.setAttribute('data-border', key);
}

/** Use quando entrar no app (pra reaplicar o equipado do usuário) */
export function bootApply({ themeId, borderId, themeEffects, borderEffects } = {}) {
  injectStylesOnce();
  if (themeId)  applyThemeById(themeId);
  if (borderId) applyBorderById(borderId);
  if (themeEffects)  applyThemeEffects(themeEffects);
  if (borderEffects) applyBorderEffects(borderEffects);
}

/**
 * Aplica os efeitos de um "tema" equipado.
 * IMPORTANTE: Temas mudam TODAS as cores do site!
 */
export function applyThemeEffects(effects) {
  injectStylesOnce();
  const root = document.documentElement;
  
  console.log('[siteStyle] applyThemeEffects chamado:', effects);
  
  if (!effects) {
    console.log('[siteStyle] Sem efeitos de tema, restaurando cores padrão');
    root.removeAttribute('data-theme-mode');
    root.removeAttribute('data-celebrate');
    
    // Restaura APENAS as cores de destaque padrão
    // NÃO toca em --bg, --surface ou --text
    root.style.setProperty('--primary', '#06b6d4');
    root.style.setProperty('--accent', '#8b5cf6');
    return;
  }

  // ===== APENAS MUDA AS CORES - NADA MAIS =====
  // Temas DEVEM mudar SOMENTE --primary e --accent
  // NÃO muda --bg, --surface, nem adiciona glows/brilhos
  if (effects.base_color && effects.accent_color) {
    console.log('[siteStyle] Mudando APENAS cores de destaque:', effects.base_color, effects.accent_color);
    
    // Muda APENAS as cores de destaque usadas em textos, ícones e botões
    root.style.setProperty('--primary', effects.base_color);
    root.style.setProperty('--accent', effects.accent_color);
    
    console.log('[siteStyle] ✓ Cores trocadas - cards permanecem iguais!');
  }

  // Paleta → CSS vars (fallback se não tiver base_color/accent_color)
  else if (Array.isArray(effects.palette) && effects.palette.length) {
    console.log('[siteStyle] Mudando APENAS cores de destaque (paleta):', effects.palette);
    const color0 = effects.palette[0];
    const color1 = effects.palette[1] || effects.palette[0];
    
    root.style.setProperty('--primary', color0);
    root.style.setProperty('--accent', color1);
    
    console.log('[siteStyle] ✓ Paleta aplicada - cards permanecem iguais!');
  }

  // REMOVE qualquer modo de fundo especial
  root.removeAttribute('data-theme-mode');
  root.removeAttribute('data-celebrate');
}

/**
 * Aplica os efeitos de uma "borda" equipada.
 */
export function applyBorderEffects(eff) {
  injectStylesOnce();
  const root = document.documentElement;
  
  console.log('[siteStyle] applyBorderEffects chamado:', eff);
  
  if (!eff) {
    console.log('[siteStyle] Sem efeitos de borda, removendo atributos');
    root.removeAttribute('data-border-anim');
    root.style.removeProperty('--border-thickness');
    root.style.removeProperty('--border-glow-intensity');
    return;
  }
  
  if (eff.animated) {
    console.log('[siteStyle] Aplicando animação de borda:', eff.animated);
    root.setAttribute('data-border-anim', eff.animated);
  } else {
    root.removeAttribute('data-border-anim');
  }

  if (typeof eff.thickness === 'number') {
    console.log('[siteStyle] Aplicando espessura de borda:', eff.thickness);
    root.style.setProperty('--border-thickness', `${eff.thickness}px`);
  }
  
  if (eff.glow_intensity) {
    root.style.setProperty('--border-glow-intensity', eff.glow_intensity);
  }
}

/**
 * Controla o estado do ciclo para temas "cycle-reactive".
 */
export function setCycleState(state) {
  injectStylesOnce();
  const root = document.documentElement;
  if (state === 'focus' || state === 'break') root.setAttribute('data-cycle', state);
  else root.removeAttribute('data-cycle');
}

/**
 * Trigger celebration effect (Legendary themes)
 */
export function triggerCelebration() {
  const root = document.documentElement;
  if (root.getAttribute('data-celebrate') === 'on') {
    // Add celebration particles temporarily
    const particles = document.createElement('div');
    particles.className = 'celebration-particles';
    document.body.appendChild(particles);
    
    setTimeout(() => {
      particles.remove();
    }, 2000);
  }
}
// ===== Runtime State (preview + cache do equipado) =====
let __equippedCache = { theme: null, border: null, seal: null };
let __previewing = null;

// Boot: injeta CSS base 1x
export function boot() {
  injectStylesOnce();
}

/**
 * Converte efeitos do backend para o formato esperado pelo frontend
 */
function convertBackendEffects(effects, itemType) {
  if (!effects) return null;
  
  if (itemType === 'theme') {
    // Mapeia os effects do backend para o formato esperado
    const converted = {
      palette: [effects.base_color || '#00b4d8', effects.accent_color || '#111827'],
      bg: null, // será mapeado abaixo
      celebrate_milestones: effects.celebrate_on_complete || false,
    };
    
    // Mapeia o tema visual para o modo de background
    // Comum: solid ou gradient-animated (simples)
    // Raro: cycle-reactive (reage ao foco/break)
    // Épico/Lendário: cosmic-parallax (parallax com estrelas)
    const themeToMode = {
      // Comum - Solid/Gradient
      'default': 'solid',
      'cyber': 'gradient-animated',
      'neon': 'gradient-animated',
      'ocean': 'solid',
      'forest': 'solid',
      'sunset': 'gradient-animated',
      'twilight': 'solid',
      'midnight': 'solid',
      'slate': 'solid',
      'storm': 'gradient-animated',
      'ember': 'gradient-animated',
      'breeze': 'solid',
      'tide': 'gradient-animated',
      'shadow': 'solid',
      'dawn': 'gradient-animated',
      
      // Raro - Cycle Reactive
      'aurora': 'cycle-reactive',
      'plasma': 'cycle-reactive',
      'nebula': 'cycle-reactive',
      'crystal': 'cycle-reactive',
      'prism': 'cycle-reactive',
      
      // Épico/Lendário - Cosmic Parallax
      'cosmic': 'cosmic-parallax',
      'phoenix': 'cosmic-parallax',
      'void': 'cosmic-parallax',
      'galaxy': 'cosmic-parallax',
      'infinity': 'cosmic-parallax',
    };
    
    converted.bg = themeToMode[effects.theme] || 'solid';
    return converted;
  }
  
  if (itemType === 'border') {
    // Mapeia os effects do backend para o formato esperado
    const converted = {
      thickness: effects.thickness || 2,
      glow_intensity: effects.glow_intensity || 'low',
      animated: null, // será mapeado abaixo
    };
    
    // Mapeia o tema visual para a animação de borda
    const themeToAnim = {
      'default': null,
      'cyber': 'rainbow',
      'neon': 'rainbow',
      'circuit': 'rainbow',
      'aurora': 'pulse-rainbow',
      'plasma': 'pulse-rainbow',
      'energy': 'pulse-rainbow',
      'crystal': 'pulse-rainbow',
      'cosmic': 'prismatic',
      'divine': 'prismatic',
      'void': 'prismatic',
      'infinity': 'prismatic',
    };
    
    converted.animated = themeToAnim[effects.theme] || null;
    return converted;
  }
  
  return effects;
}

// Reaplica tudo a partir do "equipped" do usuário
export function applyFromEquipped(equipped = {}) {
  injectStylesOnce();

  // aceita string id OU objeto com effects
  let themeEff = equipped.theme?.effects || equipped.theme_effects || equipped.theme?.effects_override || null;
  let borderEff = equipped.border?.effects || equipped.border_effects || equipped.border?.effects_override || null;
  
  // Converte os efeitos do backend para o formato esperado
  themeEff = convertBackendEffects(themeEff, 'theme');
  borderEff = convertBackendEffects(borderEff, 'border');
  
  // selo é visual no avatar (feito no componente), então só cacheamos
  const sealItem = equipped.seal || null;

  __equippedCache = { theme: themeEff, border: borderEff, seal: sealItem };

  console.log('[siteStyle] applyFromEquipped convertido:', {
    themeEff,
    borderEff,
  });

  // aplica tema+borda globais
  applyThemeEffects(themeEff || null);
  applyBorderEffects(borderEff || null);
}

// Pré-visualização temporária (sem salvar/equipar)
export function previewItem(item) {
  injectStylesOnce();
  if (!item) return;
  __previewing = item;

  if (item.type === "theme") {
    applyThemeEffects(item.effects || null);
  }
  if (item.type === "border") {
    applyBorderEffects(item.effects || null);
  }
  // selo é só no avatar → não alteramos global aqui
}

// Sai da pré-visualização e volta ao que estava equipado
export function clearPreview() {
  __previewing = null;
  applyThemeEffects(__equippedCache.theme || null);
  applyBorderEffects(__equippedCache.border || null);
}

// Volta ao padrão (sem nada equipado)
export function reset() {
  __previewing = null;
  __equippedCache = { theme: null, border: null, seal: null };
  const root = document.documentElement;
  root.removeAttribute('data-theme-mode');
  root.removeAttribute('data-border-anim');
  root.removeAttribute('data-cycle');
  root.style.removeProperty('--accent-0');
  root.style.removeProperty('--accent-1');
  root.style.removeProperty('--border-thickness');
}
