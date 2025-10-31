// Modern Seal Avatar with unique, themed designs
import React, { useMemo } from "react";

export default function ModernSealAvatar({ user, item, size = 64, className = "", style = {} }) {
  // Para preview na loja, não precisamos de um user válido
  // Se não houver user, criamos um temporário só para o preview
  const displayUser = user || { name: "Preview", nickname: "Preview" };
  
  console.log('ModernSealAvatar render:', {
    hasUser: !!user,
    hasItem: !!item,
    itemEffects: item?.effects,
    theme: item?.effects?.theme || item?.theme
  });
  
  const handle = (displayUser?.nickname ? `${displayUser.nickname}${displayUser?.tag ? "#" + displayUser.tag : ""}` : "") || displayUser?.name || "User";
  const rarity = item?.rarity || item?.effects?.rarity || "common";
  const theme = item?.effects?.theme || item?.theme || "default";

  // Generate unique hash from nickname
  const nicknameHash = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < handle.length; i++) {
      hash = ((hash << 5) - hash) + handle.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }, [handle]);

  const initials = useMemo(() => {
    const clean = handle.replace(/[^a-zA-Z0-9#]/g," ").trim();
    const parts = clean.split(/[\s#]+/).filter(Boolean);
    if (!parts.length) return "U";
    if (parts.length === 1) return parts[0].slice(0,2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }, [handle]);

  // THEMED DESIGNS - cada tema tem sua própria identidade visual
  const themes = {
    // COMUM - Designs elegantes e atrativos (melhorados!)
    default: {
      bg: `linear-gradient(135deg, #3b82f6 0%, #2563eb 50%, #1e40af 100%)`,
      overlay: `radial-gradient(ellipse at top left, rgba(147, 197, 253, 0.15), transparent 60%), 
                radial-gradient(ellipse at bottom right, rgba(96, 165, 250, 0.1), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.45,
      iconOpacity: 0.12,
      shadow: `0 0 12px rgba(59, 130, 246, 0.4), 0 0 24px rgba(37, 99, 235, 0.25)`,
      border: `2px solid rgba(147, 197, 253, 0.3)`,
      glow: true,
    },
    
    // RARO - Designs tecnológicos e digitais (melhorados!)
    cyber: {
      bg: `linear-gradient(135deg, #06b6d4 0%, #0891b2 50%, #0e7490 100%)`,
      overlay: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(255,255,255,0.05) 3px, rgba(255,255,255,0.05) 6px),
                radial-gradient(circle at center, rgba(6, 182, 212, 0.2), transparent 70%)`,
      icon: "◧",
      iconSize: size * 0.6,
      iconOpacity: 0.15,
      shadow: `0 0 16px rgba(6, 182, 212, 0.6), 0 0 32px rgba(6, 182, 212, 0.4), 0 0 48px rgba(6, 182, 212, 0.2)`,
      border: `3px solid rgba(34, 211, 238, 0.5)`,
      glow: true,
      pulse: true,
    },
    
    neon: {
      bg: `linear-gradient(135deg, #ec4899 0%, #d946ef 50%, #a855f7 100%)`,
      overlay: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.15) 90deg, transparent 180deg, rgba(255,255,255,0.15) 270deg, transparent 360deg),
                radial-gradient(circle at center, rgba(236, 72, 153, 0.3), transparent 60%)`,
      icon: "◆",
      iconSize: size * 0.55,
      iconOpacity: 0.18,
      shadow: `0 0 16px rgba(236, 72, 153, 0.7), 0 0 32px rgba(168, 85, 247, 0.5), 0 0 48px rgba(217, 70, 239, 0.3)`,
      border: `3px solid rgba(249, 168, 212, 0.6)`,
      pulse: true,
      glow: true,
    },

    matrix: {
      bg: `linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)`,
      overlay: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.08) 2px, rgba(255,255,255,0.08) 4px),
                radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.3), transparent 70%)`,
      icon: "⊗",
      iconSize: size * 0.6,
      iconOpacity: 0.15,
      shadow: `0 0 16px rgba(16, 185, 129, 0.6), 0 0 24px rgba(5, 150, 105, 0.4)`,
      border: `3px solid rgba(52, 211, 153, 0.5)`,
      scanline: true,
      glow: true,
    },

    // ÉPICO - Designs místicos e energia
    aurora: {
      bg: `linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #3b82f6 100%)`,
      overlay: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.15), transparent 50%)`,
      icon: "◈",
      iconSize: size * 0.65,
      iconOpacity: 0.18,
      shadow: `0 0 20px rgba(139, 92, 246, 0.6), 0 0 40px rgba(99, 102, 241, 0.4), 0 0 60px rgba(59, 130, 246, 0.2)`,
      border: `3px solid rgba(139, 92, 246, 0.5)`,
      particles: true,
      glow: true,
    },

    plasma: {
      bg: `conic-gradient(from 45deg, #f59e0b 0deg, #ef4444 90deg, #8b5cf6 180deg, #06b6d4 270deg, #f59e0b 360deg)`,
      overlay: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.2) 100%)`,
      icon: "◉",
      iconSize: size * 0.7,
      iconOpacity: 0.2,
      shadow: `0 0 24px rgba(245, 158, 11, 0.6), 0 0 48px rgba(139, 92, 246, 0.4)`,
      border: `3px solid rgba(245, 158, 11, 0.5)`,
      pulse: true,
      rotate: true,
    },

    quantum: {
      bg: `radial-gradient(ellipse at 50% 0%, #7c3aed 0%, #4c1d95 50%, #1e1b4b 100%)`,
      overlay: `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg 15deg, rgba(255,255,255,0.05) 15deg 30deg)`,
      icon: "◬",
      iconSize: size * 0.65,
      iconOpacity: 0.16,
      shadow: `0 0 20px rgba(124, 58, 237, 0.7), 0 0 40px rgba(76, 29, 149, 0.5), 0 0 60px rgba(30, 27, 75, 0.3)`,
      border: `3px solid rgba(124, 58, 237, 0.6)`,
      orbitRings: true,
    },

    crystal: {
      bg: `linear-gradient(135deg, #06b6d4 0%, #0ea5e9 33%, #3b82f6 67%, #6366f1 100%)`,
      overlay: `conic-gradient(from 30deg, transparent 60deg, rgba(255,255,255,0.15) 120deg, transparent 180deg, rgba(255,255,255,0.15) 240deg, transparent 300deg)`,
      icon: "◇",
      iconSize: size * 0.7,
      iconOpacity: 0.15,
      shadow: `0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(59, 130, 246, 0.4)`,
      border: `3px solid rgba(6, 182, 212, 0.5)`,
      prism: true,
    },

    // LENDÁRIO - Designs cósmicos e transcendentais
    cosmic: {
      bg: `radial-gradient(ellipse at 20% 20%, #fbbf24 0%, #f59e0b 20%, #7c3aed 40%, #4c1d95 60%, #0c0a09 100%)`,
      overlay: `radial-gradient(circle at 80% 80%, rgba(251, 191, 36, 0.2) 0%, transparent 30%), radial-gradient(circle at 20% 20%, rgba(124, 58, 237, 0.2) 0%, transparent 30%)`,
      icon: "✦",
      iconSize: size * 0.75,
      iconOpacity: 0.25,
      shadow: `0 0 30px rgba(251, 191, 36, 0.8), 0 0 60px rgba(124, 58, 237, 0.6), 0 0 90px rgba(76, 29, 149, 0.4)`,
      border: `4px solid rgba(251, 191, 36, 0.7)`,
      stars: true,
      pulse: true,
      rotate: true,
    },

    phoenix: {
      bg: `conic-gradient(from 90deg at 50% 50%, #dc2626 0deg, #f97316 90deg, #fbbf24 180deg, #f97316 270deg, #dc2626 360deg)`,
      overlay: `radial-gradient(ellipse at 50% 30%, rgba(251, 191, 36, 0.3), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.8,
      iconOpacity: 0.22,
      shadow: `0 0 30px rgba(220, 38, 38, 0.8), 0 0 60px rgba(249, 115, 22, 0.6), 0 0 90px rgba(251, 191, 36, 0.4)`,
      border: `4px solid rgba(249, 115, 22, 0.8)`,
      flames: true,
      pulse: true,
    },

    void: {
      bg: `radial-gradient(circle at 50% 50%, #7c3aed 0%, #4c1d95 30%, #1e1b4b 60%, #0c0a09 100%)`,
      overlay: `conic-gradient(from 0deg, transparent 0deg, rgba(124, 58, 237, 0.2) 45deg, transparent 90deg, rgba(76, 29, 149, 0.2) 135deg, transparent 180deg, rgba(124, 58, 237, 0.2) 225deg, transparent 270deg, rgba(76, 29, 149, 0.2) 315deg, transparent 360deg)`,
      icon: "◯",
      iconSize: size * 0.75,
      iconOpacity: 0.2,
      shadow: `0 0 35px rgba(124, 58, 237, 0.9), 0 0 70px rgba(76, 29, 149, 0.7), 0 0 105px rgba(30, 27, 75, 0.5), inset 0 0 30px rgba(0, 0, 0, 0.8)`,
      border: `4px solid rgba(124, 58, 237, 0.7)`,
      vortex: true,
      rotate: true,
    },

    galaxy: {
      bg: `radial-gradient(ellipse at 30% 30%, #3b82f6 0%, #6366f1 20%, #8b5cf6 40%, #4c1d95 70%, #0c0a09 100%)`,
      overlay: `radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.2) 0%, transparent 25%), radial-gradient(circle at 20% 80%, rgba(139, 92, 246, 0.15) 0%, transparent 20%)`,
      icon: "✧",
      iconSize: size * 0.8,
      iconOpacity: 0.28,
      shadow: `0 0 35px rgba(59, 130, 246, 0.8), 0 0 70px rgba(99, 102, 241, 0.6), 0 0 105px rgba(139, 92, 246, 0.4)`,
      border: `4px solid rgba(59, 130, 246, 0.7)`,
      nebula: true,
      stars: true,
      rotate: true,
    },

    // === TEMAS ELEMENTAIS (COMUM) - Elegantes e Distintos ===
    fire: {
      bg: `linear-gradient(135deg, #dc2626 0%, #b91c1c 50%, #991b1b 100%)`,
      overlay: `radial-gradient(ellipse at top, rgba(252, 165, 165, 0.15), transparent 60%), 
                radial-gradient(ellipse at bottom, rgba(239, 68, 68, 0.1), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.45,
      iconOpacity: 0.12,
      shadow: `0 0 12px rgba(220, 38, 38, 0.4), 0 0 24px rgba(185, 28, 28, 0.25)`,
      border: `2px solid rgba(252, 165, 165, 0.3)`,
      glow: true,
    },

    water: {
      bg: `linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)`,
      overlay: `radial-gradient(ellipse at top left, rgba(125, 211, 252, 0.15), transparent 60%), 
                radial-gradient(ellipse at bottom right, rgba(56, 189, 248, 0.1), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.45,
      iconOpacity: 0.12,
      shadow: `0 0 12px rgba(2, 132, 199, 0.4), 0 0 24px rgba(3, 105, 161, 0.25)`,
      border: `2px solid rgba(125, 211, 252, 0.3)`,
      glow: true,
    },

    earth: {
      bg: `linear-gradient(135deg, #78716c 0%, #57534e 50%, #44403c 100%)`,
      overlay: `radial-gradient(ellipse at top, rgba(168, 162, 158, 0.15), transparent 60%), 
                radial-gradient(ellipse at bottom, rgba(120, 113, 108, 0.1), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.45,
      iconOpacity: 0.12,
      shadow: `0 0 12px rgba(120, 113, 108, 0.4), 0 0 24px rgba(87, 83, 78, 0.25)`,
      border: `2px solid rgba(168, 162, 158, 0.3)`,
      glow: true,
    },

    air: {
      bg: `linear-gradient(135deg, #a5f3fc 0%, #67e8f9 50%, #22d3ee 100%)`,
      overlay: `radial-gradient(ellipse at top, rgba(207, 250, 254, 0.2), transparent 60%), 
                radial-gradient(ellipse at bottom, rgba(165, 243, 252, 0.15), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.45,
      iconOpacity: 0.12,
      shadow: `0 0 12px rgba(34, 211, 238, 0.4), 0 0 24px rgba(103, 232, 249, 0.25)`,
      border: `2px solid rgba(207, 250, 254, 0.3)`,
      glow: true,
    },

    light: {
      bg: `linear-gradient(135deg, #fef08a 0%, #fde047 50%, #facc15 100%)`,
      overlay: `radial-gradient(ellipse at center, rgba(254, 249, 195, 0.2), transparent 60%), 
                radial-gradient(ellipse at top, rgba(253, 224, 71, 0.15), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.45,
      iconOpacity: 0.12,
      shadow: `0 0 12px rgba(250, 204, 21, 0.5), 0 0 24px rgba(253, 224, 71, 0.3)`,
      border: `2px solid rgba(254, 249, 195, 0.4)`,
      glow: true,
    },

    dark: {
      bg: `linear-gradient(135deg, #1e1b4b 0%, #1e293b 50%, #0f172a 100%)`,
      overlay: `radial-gradient(ellipse at top, rgba(99, 102, 241, 0.1), transparent 60%), 
                radial-gradient(ellipse at bottom, rgba(30, 27, 75, 0.15), transparent 60%)`,
      icon: "◈",
      iconSize: size * 0.45,
      iconOpacity: 0.15,
      shadow: `0 0 12px rgba(30, 27, 75, 0.6), 0 0 24px rgba(15, 23, 42, 0.4)`,
      border: `2px solid rgba(99, 102, 241, 0.3)`,
      glow: true,
    },

    // === TEMAS ENERGÉTICOS (RARO-ÉPICO) - Impressionantes ===
    energy: {
      bg: `linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)`,
      overlay: `repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.08) 4px, rgba(255,255,255,0.08) 8px),
                radial-gradient(circle at center, rgba(251, 191, 36, 0.25), transparent 70%)`,
      icon: "⚡",
      iconSize: size * 0.65,
      iconOpacity: 0.18,
      shadow: `0 0 18px rgba(251, 191, 36, 0.7), 0 0 36px rgba(245, 158, 11, 0.5), 0 0 54px rgba(217, 119, 6, 0.3)`,
      border: `3px solid rgba(252, 211, 77, 0.6)`,
      pulse: true,
      glow: true,
    },

    stellar: {
      bg: `linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #4f46e5 100%)`,
      overlay: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, rgba(255,255,255,0.12) 90deg, transparent 180deg, rgba(255,255,255,0.12) 270deg, transparent 360deg),
                radial-gradient(circle at center, rgba(129, 140, 248, 0.2), transparent 60%)`,
      icon: "★",
      iconSize: size * 0.65,
      iconOpacity: 0.18,
      shadow: `0 0 20px rgba(129, 140, 248, 0.7), 0 0 40px rgba(99, 102, 241, 0.5), 0 0 60px rgba(79, 70, 229, 0.3)`,
      border: `3px solid rgba(165, 180, 252, 0.6)`,
      stars: true,
      pulse: true,
      glow: true,
    },

    nebula: {
      bg: `conic-gradient(from 45deg, #ec4899 0deg, #8b5cf6 90deg, #3b82f6 180deg, #06b6d4 270deg, #ec4899 360deg)`,
      overlay: `radial-gradient(ellipse at 30% 30%, rgba(255, 255, 255, 0.15), transparent 50%),
                radial-gradient(ellipse at 70% 70%, rgba(139, 92, 246, 0.2), transparent 50%)`,
      icon: "◉",
      iconSize: size * 0.7,
      iconOpacity: 0.2,
      shadow: `0 0 22px rgba(236, 72, 153, 0.7), 0 0 44px rgba(139, 92, 246, 0.5), 0 0 66px rgba(59, 130, 246, 0.3)`,
      border: `3px solid rgba(236, 72, 153, 0.6)`,
      nebula: true,
      pulse: true,
      rotate: true,
    },

    // === TEMAS TRANSCENDENTAIS (ÉPICO-LENDÁRIO) - EXTRAORDINÁRIOS ===
    prisma: {
      bg: `conic-gradient(from 0deg, #ef4444 0deg, #f97316 60deg, #fbbf24 120deg, #10b981 180deg, #3b82f6 240deg, #8b5cf6 300deg, #ef4444 360deg)`,
      overlay: `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.15) 100%)`,
      icon: "◇",
      iconSize: size * 0.75,
      iconOpacity: 0.22,
      shadow: `0 0 28px rgba(239, 68, 68, 0.6), 0 0 56px rgba(59, 130, 246, 0.5), 0 0 84px rgba(139, 92, 246, 0.4)`,
      border: `4px solid rgba(255, 255, 255, 0.5)`,
      prism: true,
      pulse: true,
      rotate: true,
    },

    hologram: {
      bg: `linear-gradient(135deg, #06b6d4 0%, #3b82f6 25%, #8b5cf6 50%, #ec4899 75%, #06b6d4 100%)`,
      overlay: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.08) 1px, rgba(255,255,255,0.08) 2px),
                repeating-linear-gradient(90deg, transparent, transparent 1px, rgba(255,255,255,0.08) 1px, rgba(255,255,255,0.08) 2px),
                radial-gradient(circle at center, rgba(59, 130, 246, 0.2), transparent 70%)`,
      icon: "◈",
      iconSize: size * 0.75,
      iconOpacity: 0.2,
      shadow: `0 0 30px rgba(6, 182, 212, 0.7), 0 0 60px rgba(139, 92, 246, 0.6), 0 0 90px rgba(236, 72, 153, 0.4)`,
      border: `4px solid rgba(6, 182, 212, 0.7)`,
      scanline: true,
      pulse: true,
      glow: true,
    },

    spirit: {
      bg: `radial-gradient(ellipse at 50% 30%, #a78bfa 0%, #8b5cf6 30%, #6d28d9 60%, #4c1d95 100%)`,
      overlay: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.15) 0%, transparent 40%),
                conic-gradient(from 0deg, transparent 0deg, rgba(167, 139, 250, 0.15) 45deg, transparent 90deg, rgba(167, 139, 250, 0.15) 135deg, transparent 180deg)`,
      icon: "◯",
      iconSize: size * 0.78,
      iconOpacity: 0.25,
      shadow: `0 0 32px rgba(167, 139, 250, 0.8), 0 0 64px rgba(139, 92, 246, 0.6), 0 0 96px rgba(109, 40, 217, 0.4)`,
      border: `4px solid rgba(167, 139, 250, 0.7)`,
      orbitRings: true,
      pulse: true,
      glow: true,
    },

    divine: {
      bg: `radial-gradient(ellipse at 50% 0%, #fef3c7 0%, #fde68a 15%, #fbbf24 30%, #f59e0b 50%, #d97706 75%, #78350f 100%)`,
      overlay: `conic-gradient(from 0deg at 50% 50%, rgba(255,255,255,0.3) 0deg, transparent 30deg, rgba(255,255,255,0.3) 60deg, transparent 90deg, rgba(255,255,255,0.3) 120deg, transparent 150deg, rgba(255,255,255,0.3) 180deg, transparent 210deg, rgba(255,255,255,0.3) 240deg, transparent 270deg, rgba(255,255,255,0.3) 300deg, transparent 330deg, rgba(255,255,255,0.3) 360deg),
                radial-gradient(circle at 50% 50%, rgba(254, 243, 199, 0.3) 0%, transparent 50%)`,
      icon: "✦",
      iconSize: size * 0.8,
      iconOpacity: 0.28,
      shadow: `0 0 35px rgba(251, 191, 36, 0.9), 0 0 70px rgba(245, 158, 11, 0.7), 0 0 105px rgba(217, 119, 6, 0.5), 0 0 140px rgba(120, 53, 15, 0.3)`,
      border: `4px solid rgba(254, 243, 199, 0.8)`,
      stars: true,
      pulse: true,
      rotate: true,
      glow: true,
    },

    chaos: {
      bg: `conic-gradient(from 0deg at 50% 50%, #dc2626 0deg, #7c3aed 60deg, #0c0a09 120deg, #ef4444 180deg, #4c1d95 240deg, #1e1b4b 300deg, #dc2626 360deg)`,
      overlay: `repeating-conic-gradient(from 0deg at 50% 50%, transparent 0deg 10deg, rgba(255,255,255,0.08) 10deg 20deg),
                radial-gradient(circle at 30% 30%, rgba(220, 38, 38, 0.3) 0%, transparent 40%),
                radial-gradient(circle at 70% 70%, rgba(124, 58, 237, 0.3) 0%, transparent 40%)`,
      icon: "⚡",
      iconSize: size * 0.85,
      iconOpacity: 0.3,
      shadow: `0 0 40px rgba(220, 38, 38, 0.9), 0 0 80px rgba(124, 58, 237, 0.7), 0 0 120px rgba(12, 10, 9, 0.5), inset 0 0 40px rgba(239, 68, 68, 0.3)`,
      border: `4px solid rgba(220, 38, 38, 0.8)`,
      vortex: true,
      pulse: true,
      rotate: true,
      glow: true,
    },
  };

  const currentTheme = themes[theme] || themes.default;
  const angle = (nicknameHash % 360);

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size,
    position: "relative",
    overflow: "hidden",
    background: currentTheme.bg,
    boxShadow: currentTheme.shadow,
    border: currentTheme.border,
    ...style,
  };

  const animationClass = `
    ${currentTheme.pulse ? 'seal-pulse' : ''} 
    ${currentTheme.rotate ? 'seal-rotate' : ''} 
    ${currentTheme.glow ? 'seal-glow' : ''}
  `.trim();

  return (
    <>
      <style>{`
        @keyframes seal-pulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.05); filter: brightness(1.15); }
        }
        
        @keyframes seal-rotate {
          from { background-position: 0% 50%; }
          to { background-position: 100% 50%; }
        }
        
        @keyframes seal-glow {
          0%, 100% { filter: drop-shadow(0 0 8px currentColor); }
          50% { filter: drop-shadow(0 0 16px currentColor); }
        }

        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes orbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>

      <div 
        className={`${className} ${animationClass}`}
        style={containerStyle}
      >
        {/* Overlay padrão do tema */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: currentTheme.overlay,
          pointerEvents: "none",
        }} />

        {/* Efeitos especiais baseados no tema */}
        {currentTheme.scanline && (
          <div style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg, transparent 48%, rgba(255,255,255,0.1) 50%, transparent 52%)",
            animation: "scanline 3s linear infinite",
          }} />
        )}

        {currentTheme.orbitRings && (
          <>
            <div style={{
              position: "absolute",
              inset: "-15%",
              border: "1px solid rgba(124, 58, 237, 0.3)",
              borderRadius: "50%",
              animation: "orbit 8s linear infinite",
            }} />
            <div style={{
              position: "absolute",
              inset: "-25%",
              border: "1px solid rgba(124, 58, 237, 0.2)",
              borderRadius: "50%",
              animation: "orbit 12s linear infinite reverse",
            }} />
          </>
        )}

        {currentTheme.stars && (
          <>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                position: "absolute",
                width: 2,
                height: 2,
                background: "white",
                borderRadius: "50%",
                top: `${20 + (nicknameHash * (i + 1)) % 60}%`,
                left: `${15 + (nicknameHash * (i + 2)) % 70}%`,
                opacity: 0.4 + (i * 0.1),
                boxShadow: `0 0 ${2 + i}px rgba(255,255,255,0.5)`,
              }} />
            ))}
          </>
        )}

        {/* Ícone temático (marca d'água) */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: currentTheme.iconSize,
          color: "white",
          opacity: currentTheme.iconOpacity,
          userSelect: "none",
          pointerEvents: "none",
        }}>
          {currentTheme.icon}
        </div>

        {/* Efeito de brilho (gloss) */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: rarity === "legendary"
            ? "radial-gradient(120% 120% at 70% 10%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.15) 20%, transparent 50%)"
            : rarity === "epic"
            ? "radial-gradient(110% 110% at 75% 15%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.1) 25%, transparent 55%)"
            : "radial-gradient(100% 100% at 80% 20%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 30%, transparent 60%)",
          pointerEvents: "none",
        }} />

        {/* Iniciais do usuário */}
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: rarity === "legendary" ? 900 : 800,
          fontSize: size * 0.36,
          letterSpacing: rarity === "legendary" ? "2px" : "1px",
          textShadow: rarity === "legendary"
            ? "0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(255,255,255,0.3)"
            : "0 1px 4px rgba(0,0,0,0.5)",
          userSelect: "none",
          zIndex: 10,
        }}>
          {initials}
        </div>
      </div>
    </>
  );
}
