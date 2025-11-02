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
/*          VERSÃO LEVE - APENAS SUTIS         */
/* ============================================ */

:root { 
  --border-thickness: 2px; 
  --border-glow-color: rgba(59, 130, 246, 0.5);
}

/* Bordas Animadas - RAINBOW (Rare) - SIMPLIFICADO */
html[data-border-anim="rainbow"] .app-surface {
  position: relative;
  border: 2px solid;
  border-image: linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00) 1;
  transition: border 0.5s ease;
}

/* Pulse Rainbow (Epic) - MUITO SIMPLIFICADO */
html[data-border-anim="pulse-rainbow"] .app-surface {
  position: relative;
  border: 2px solid;
  border-image: linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00) 1;
  animation: pulse-border-simple 3s ease-in-out infinite;
}

@keyframes pulse-border-simple {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; }
}

/* Prismatic (Legendary) - SIMPLIFICADO AO MÁXIMO */
html[data-border-anim="prismatic"] .app-surface {
  position: relative;
  border: 2px solid;
  border-image: linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00) 1;
  animation: pulse-border-simple 2s ease-in-out infinite;
  box-shadow: 0 0 10px rgba(255,255,255,.2);
}

/* REMOVIDAS: Camadas ::before e ::after pesadas, rotações, sparkles */

/* ============================================ */
/*          THEME EFFECTS (BACKGROUNDS)        */
/*          VERSÃO LEVE - SEM SOBRECARREGAR    */
/* ============================================ */

:root {
  --accent-0: #00b4d8;
  --accent-1: #111827;
  --theme-transition: 0.5s ease;
}

/* Backgrounds por tipo - VERSÃO SIMPLIFICADA */

/* Solid (Common) - background padrão */
html[data-theme-mode="solid"] {
  background: var(--accent-1);
  transition: background var(--theme-transition);
}

/* Gradient Animated (Rare) - SIMPLIFICADO */
html[data-theme-mode="gradient-animated"] {
  background: linear-gradient(135deg, var(--accent-1), color-mix(in srgb, var(--accent-0) 20%, var(--accent-1)));
  transition: background var(--theme-transition);
}

/* Cycle Reactive (Epic) - Reage a focus/break - SIMPLIFICADO */
html[data-theme-mode="cycle-reactive"] {
  background: linear-gradient(180deg, color-mix(in srgb, var(--accent-1) 40%, #000) 0%, #000 100%);
  transition: filter var(--theme-transition);
}

html[data-theme-mode="cycle-reactive"][data-cycle="focus"] {
  filter: saturate(1.10) brightness(1.02);
}

html[data-theme-mode="cycle-reactive"][data-cycle="break"] {
  filter: saturate(0.90) brightness(0.98);
}

/* Cosmic Parallax (Legendary) - MUITO SIMPLIFICADO */
html[data-theme-mode="cosmic-parallax"] {
  background: 
    radial-gradient(ellipse at 50% 50%, color-mix(in srgb, var(--accent-0) 15%, transparent) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, color-mix(in srgb, var(--accent-1) 60%, #000) 0%, #000 100%);
  transition: background var(--theme-transition);
}

/* REMOVIDAS: Animações pesadas, nebula overlay, starfield */

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
/* ============================================ */

.bordered { 
  border: var(--border-thickness) solid rgba(255,255,255,.12); 
}

.cycle-bg {
  transition: filter var(--theme-transition);
}

/* Breathing effect para temas (Rare+) */
.breathing-effect {
  animation: breathe 4s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.01); opacity: 0.95; }
}

/* Holographic UI (Legendary) */
.holographic {
  background: linear-gradient(135deg, 
    rgba(255,255,255,.05) 0%, 
    transparent 40%, 
    rgba(255,255,255,.03) 50%, 
    transparent 60%,
    rgba(255,255,255,.05) 100%);
  background-size: 200% 200%;
  animation: holographic-shift 3s ease-in-out infinite;
}

@keyframes holographic-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
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
    
    // Restaura cores padrão
    root.style.setProperty('--primary', '#06b6d4');
    root.style.setProperty('--accent', '#8b5cf6');
    root.style.setProperty('--bg', '#0b1220');
    root.style.setProperty('--surface', '#0f172a');
    root.style.setProperty('--text', '#e5e7eb');
    root.style.setProperty('--accent-0', '#00b4d8');
    root.style.setProperty('--accent-1', '#111827');
    return;
  }

  // ===== APLICAR CORES DO TEMA EM TODAS AS VARIÁVEIS CSS =====
  if (effects.base_color && effects.accent_color) {
    console.log('[siteStyle] Aplicando TODAS as cores do tema ao site:', effects.base_color, effects.accent_color);
    
    // Cores principais que são usadas em todo o site
    root.style.setProperty('--primary', effects.base_color);
    root.style.setProperty('--accent', effects.accent_color);
    
    // Backgrounds - tons mais escuros derivados das cores principais
    root.style.setProperty('--bg', effects.base_color);
    root.style.setProperty('--surface', effects.accent_color);
    root.style.setProperty('--text', '#e5e7eb'); // Mantém texto sempre legível
    
    // Para efeitos de tema avançados
    root.style.setProperty('--accent-0', effects.base_color);
    root.style.setProperty('--accent-1', effects.accent_color);
    
    console.log('[siteStyle] ✓ Cores aplicadas - o site inteiro deve mudar de cor agora!');
  }

  // Paleta → CSS vars (fallback se não tiver base_color/accent_color)
  else if (Array.isArray(effects.palette) && effects.palette.length) {
    console.log('[siteStyle] Aplicando paleta:', effects.palette);
    const color0 = effects.palette[0];
    const color1 = effects.palette[1] || effects.palette[0];
    
    root.style.setProperty('--primary', color0);
    root.style.setProperty('--accent', color1);
    root.style.setProperty('--bg', color1);
    root.style.setProperty('--surface', color0);
    root.style.setProperty('--accent-0', color0);
    root.style.setProperty('--accent-1', color1);
    
    console.log('[siteStyle] ✓ Paleta aplicada - o site inteiro deve mudar de cor agora!');
  }

  // Modo de fundo (apenas solid para performance)
  root.setAttribute('data-theme-mode', 'solid');

  // Flags opcionais removidas
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
