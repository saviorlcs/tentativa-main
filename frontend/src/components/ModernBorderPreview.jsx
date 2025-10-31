// Modern Border Preview with unique themed designs
import React from 'react';

export default function ModernBorderPreview({ effects, size = 120 }) {
  const theme = effects?.theme || 'default';
  const rarity = effects?.rarity || 'common';

  // THEMED BORDER DESIGNS
  const themes = {
    // COMUM - Bordas simples mas elegantes
    default: {
      border: '3px solid #3b82f6',
      boxShadow: '0 0 10px rgba(59, 130, 246, 0.3)',
      background: 'linear-gradient(135deg, #1e40af 0%, #3730a3 100%)',
    },

    // RARO - Bordas tecnológicas e digitais
    cyber: {
      border: '3px solid #06b6d4',
      boxShadow: '0 0 15px rgba(6, 182, 212, 0.5), 0 0 30px rgba(6, 182, 212, 0.3)',
      background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      pattern: 'repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px)',
      animation: 'borderPulse 2s ease-in-out infinite',
    },

    neon: {
      border: '3px solid #ec4899',
      boxShadow: '0 0 15px rgba(236, 72, 153, 0.6), 0 0 30px rgba(168, 85, 247, 0.4)',
      background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 100%)',
      animation: 'borderGlow 1.5s ease-in-out infinite',
    },

    circuit: {
      border: '3px solid #10b981',
      boxShadow: '0 0 15px rgba(16, 185, 129, 0.5), 0 0 25px rgba(5, 150, 105, 0.3)',
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      pattern: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
    },

    // ÉPICO - Bordas místicas e energia
    aurora: {
      border: '4px solid transparent',
      borderImage: 'linear-gradient(135deg, #8b5cf6, #6366f1, #3b82f6) 1',
      boxShadow: '0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(99, 102, 241, 0.4), inset 0 0 20px rgba(139, 92, 246, 0.2)',
      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)',
      animation: 'borderFlow 3s linear infinite',
    },

    plasma: {
      border: '4px solid transparent',
      background: 'conic-gradient(from 45deg, #f59e0b, #ef4444, #8b5cf6, #06b6d4, #f59e0b)',
      boxShadow: '0 0 25px rgba(245, 158, 11, 0.7), 0 0 50px rgba(139, 92, 246, 0.5)',
      animation: 'borderRotate 4s linear infinite',
    },

    energy: {
      border: '4px solid #7c3aed',
      boxShadow: '0 0 20px rgba(124, 58, 237, 0.7), 0 0 40px rgba(76, 29, 149, 0.5), inset 0 0 15px rgba(124, 58, 237, 0.3)',
      background: 'radial-gradient(ellipse at 50% 0%, #7c3aed, #4c1d95)',
      pattern: 'repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg 15deg, rgba(255,255,255,0.05) 15deg 30deg)',
    },

    crystal: {
      border: '4px solid #06b6d4',
      boxShadow: '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(59, 130, 246, 0.4), inset 0 0 20px rgba(6, 182, 212, 0.2)',
      background: 'linear-gradient(135deg, #06b6d4 0%, #0ea5e9 33%, #3b82f6 67%, #6366f1 100%)',
      pattern: 'conic-gradient(from 30deg, transparent 60deg, rgba(255,255,255,0.15) 120deg, transparent 180deg)',
    },

    // LENDÁRIO - Bordas cósmicas e transcendentais
    cosmic: {
      border: '5px solid transparent',
      borderImage: 'linear-gradient(45deg, #fbbf24, #f59e0b, #7c3aed, #4c1d95, #fbbf24) 1',
      boxShadow: '0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(124, 58, 237, 0.6), 0 0 90px rgba(76, 29, 149, 0.4), inset 0 0 30px rgba(251, 191, 36, 0.3)',
      background: 'radial-gradient(ellipse at 30% 30%, #fbbf24, #f59e0b, #7c3aed, #0c0a09)',
      animation: 'borderPulse 2s ease-in-out infinite, borderRotate 8s linear infinite',
    },

    divine: {
      border: '5px solid transparent',
      borderImage: 'conic-gradient(from 0deg, #dc2626, #f97316, #fbbf24, #f97316, #dc2626) 1',
      boxShadow: '0 0 35px rgba(220, 38, 38, 0.9), 0 0 70px rgba(249, 115, 22, 0.7), inset 0 0 25px rgba(251, 191, 36, 0.4)',
      background: 'conic-gradient(from 90deg, #dc2626, #f97316, #fbbf24, #f97316, #dc2626)',
      animation: 'borderFlow 3s linear infinite, borderGlow 2s ease-in-out infinite',
    },

    void: {
      border: '5px solid #7c3aed',
      boxShadow: '0 0 40px rgba(124, 58, 237, 0.9), 0 0 80px rgba(76, 29, 149, 0.7), 0 0 120px rgba(30, 27, 75, 0.5), inset 0 0 40px rgba(0, 0, 0, 0.8)',
      background: 'radial-gradient(circle, #7c3aed 0%, #4c1d95 40%, #1e1b4b 70%, #0c0a09 100%)',
      pattern: 'conic-gradient(from 0deg, transparent 0deg, rgba(124, 58, 237, 0.3) 90deg, transparent 180deg)',
      animation: 'borderRotate 6s linear infinite',
    },

    infinity: {
      border: '5px solid transparent',
      borderImage: 'linear-gradient(135deg, #3b82f6, #6366f1, #8b5cf6, #6366f1, #3b82f6) 1',
      boxShadow: '0 0 35px rgba(59, 130, 246, 0.8), 0 0 70px rgba(99, 102, 241, 0.6), 0 0 105px rgba(139, 92, 246, 0.4), inset 0 0 35px rgba(59, 130, 246, 0.3)',
      background: 'radial-gradient(ellipse at 50% 50%, #3b82f6, #6366f1, #8b5cf6, #0c0a09)',
      animation: 'borderFlow 4s linear infinite, borderPulse 3s ease-in-out infinite',
    },
  };

  const currentTheme = themes[theme] || themes.default;

  return (
    <>
      <style>{`
        @keyframes borderPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.9; }
        }
        
        @keyframes borderGlow {
          0%, 100% { filter: brightness(1); }
          50% { filter: brightness(1.3); }
        }
        
        @keyframes borderRotate {
          from { filter: hue-rotate(0deg); }
          to { filter: hue-rotate(360deg); }
        }
        
        @keyframes borderFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div style={{
        width: size,
        height: size,
        borderRadius: '12px',
        position: 'relative',
        overflow: 'hidden',
        border: currentTheme.border,
        borderImage: currentTheme.borderImage,
        boxShadow: currentTheme.boxShadow,
        background: currentTheme.background,
        backgroundSize: '200% 200%',
        animation: currentTheme.animation,
      }}>
        {/* Pattern overlay */}
        {currentTheme.pattern && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: currentTheme.pattern,
            opacity: 0.8,
          }} />
        )}

        {/* Preview content */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: size * 0.12,
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}>
          BORDA
        </div>
      </div>
    </>
  );
}
