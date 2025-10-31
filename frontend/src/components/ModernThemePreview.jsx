// Modern Theme Preview with unique atmospheric designs
import React from 'react';

export default function ModernThemePreview({ effects, size = 120 }) {
  const theme = effects?.theme || 'default';
  
  // THEMED DESIGNS - Cada tema tem uma atmosfera única
  const themes = {
    // COMUM - Temas simples e clean
    default: {
      bg: 'linear-gradient(135deg, #1e40af 0%, #1e293b 100%)',
      accent: '#3b82f6',
      name: 'Oceano Azul',
      icon: '◐',
    },

    // RARO - Temas tecnológicos e vibrantes
    cyber: {
      bg: 'linear-gradient(135deg, #06b6d4 0%, #0c4a6e 100%)',
      accent: '#06b6d4',
      name: 'Cyber Tech',
      icon: '◧',
      pattern: 'repeating-linear-gradient(45deg, transparent, transparent 5px, rgba(6,182,212,0.1) 5px, rgba(6,182,212,0.1) 10px)',
    },

    neon: {
      bg: 'linear-gradient(135deg, #ec4899 0%, #7c3aed 50%, #0c0a09 100%)',
      accent: '#ec4899',
      name: 'Neon City',
      icon: '◆',
      glow: true,
    },

    sunset: {
      bg: 'linear-gradient(135deg, #f97316 0%, #dc2626 50%, #7c2d12 100%)',
      accent: '#f97316',
      name: 'Pôr do Sol',
      icon: '◎',
    },

    forest: {
      bg: 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)',
      accent: '#10b981',
      name: 'Floresta',
      icon: '✦',
      pattern: 'radial-gradient(circle at 20% 80%, rgba(16,185,129,0.15) 0%, transparent 50%)',
    },

    // ÉPICO - Temas místicos e atmosféricos
    aurora: {
      bg: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 33%, #3b82f6 67%, #0c0a09 100%)',
      accent: '#8b5cf6',
      name: 'Aurora Boreal',
      icon: '◈',
      pattern: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.3), transparent 70%)',
      animated: true,
    },

    plasma: {
      bg: 'conic-gradient(from 45deg, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #f59e0b)',
      accent: '#f59e0b',
      name: 'Energia Plasma',
      icon: '◉',
      animated: true,
    },

    ocean: {
      bg: 'radial-gradient(ellipse at 50% 0%, #0ea5e9 0%, #0369a1 40%, #0c4a6e 80%, #020617 100%)',
      accent: '#0ea5e9',
      name: 'Oceano Profundo',
      icon: '◯',
      pattern: 'radial-gradient(circle at 70% 30%, rgba(14,165,233,0.2) 0%, transparent 40%)',
    },

    twilight: {
      bg: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 20%, #ec4899 40%, #f97316 60%, #fbbf24 80%, #0c0a09 100%)',
      accent: '#7c3aed',
      name: 'Crepúsculo',
      icon: '◈',
      animated: true,
    },

    // LENDÁRIO - Temas cósmicos e transcendentais
    cosmic: {
      bg: 'radial-gradient(ellipse at 30% 30%, #fbbf24 0%, #f59e0b 15%, #7c3aed 35%, #4c1d95 60%, #0c0a09 100%)',
      accent: '#fbbf24',
      name: 'Cósmico',
      icon: '✦',
      stars: true,
      animated: true,
      glow: true,
    },

    phoenix: {
      bg: 'conic-gradient(from 90deg, #dc2626 0deg, #f97316 90deg, #fbbf24 180deg, #f97316 270deg, #dc2626 360deg)',
      accent: '#f97316',
      name: 'Fênix',
      icon: '◈',
      pattern: 'radial-gradient(ellipse at 50% 30%, rgba(251,191,36,0.3), transparent 60%)',
      animated: true,
      glow: true,
    },

    void: {
      bg: 'radial-gradient(circle at 50% 50%, #7c3aed 0%, #4c1d95 25%, #1e1b4b 50%, #0c0a09 100%)',
      accent: '#7c3aed',
      name: 'Vazio Cósmico',
      icon: '◯',
      pattern: 'conic-gradient(from 0deg, transparent 0deg, rgba(124,58,237,0.2) 90deg, transparent 180deg)',
      animated: true,
      stars: true,
    },

    galaxy: {
      bg: 'radial-gradient(ellipse at 40% 40%, #3b82f6 0%, #6366f1 15%, #8b5cf6 30%, #4c1d95 60%, #0c0a09 100%)',
      accent: '#3b82f6',
      name: 'Galáxia',
      icon: '✧',
      stars: true,
      animated: true,
      glow: true,
    },
  };

  const currentTheme = themes[theme] || themes.default;

  return (
    <>
      <style>{`
        @keyframes themeShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes themeGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.2); }
        }
        
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `}</style>

      <div style={{
        width: size,
        height: size,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        background: currentTheme.bg,
        backgroundSize: '200% 200%',
        animation: currentTheme.animated ? 'themeShift 8s ease-in-out infinite' : 'none',
        boxShadow: `0 0 20px ${currentTheme.accent}33`,
      }}>
        {/* Pattern overlay */}
        {currentTheme.pattern && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: currentTheme.pattern,
            backgroundSize: '200% 200%',
          }} />
        )}

        {/* Stars for cosmic themes */}
        {currentTheme.stars && (
          <>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 2,
                height: 2,
                background: 'white',
                borderRadius: '50%',
                top: `${15 + (i * 13)}%`,
                left: `${20 + (i * 11)}%`,
                opacity: 0.5,
                boxShadow: '0 0 2px white',
                animation: `starTwinkle ${1 + (i * 0.3)}s ease-in-out infinite`,
              }} />
            ))}
          </>
        )}

        {/* Central icon */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.4,
          color: 'white',
          opacity: 0.15,
          textShadow: `0 0 10px ${currentTheme.accent}`,
        }}>
          {currentTheme.icon}
        </div>

        {/* Theme name */}
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          textAlign: 'center',
          color: 'white',
          fontSize: size * 0.1,
          fontWeight: 'bold',
          textShadow: '0 1px 3px rgba(0,0,0,0.8)',
        }}>
          {currentTheme.name}
        </div>

        {/* Glow effect */}
        {currentTheme.glow && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(circle at 50% 50%, ${currentTheme.accent}22, transparent 70%)`,
            animation: 'themeGlow 2s ease-in-out infinite',
          }} />
        )}
      </div>
    </>
  );
}
