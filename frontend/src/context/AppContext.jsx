// frontend/src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

const AppContext = createContext(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};

export function AppProvider({ children }) {
  // --- música (seu estado atual) ---
  const [showMusicPlayer, setShowMusicPlayer] = useState(false);

  // --- usuário global ---
  const [me, setMe] = useState(null);
  const [booted, setBooted] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const r = await api.get("/auth/me");
      const userData = r?.data?.user ?? null;
      console.log("[AppContext] User refreshed:", userData?.id, "equipped:", userData?.equipped_items);
      setMe(userData);
    } catch {
      setMe(null);
    } finally {
      setBooted(true);
    }
  }, []);

  useEffect(() => { refreshUser(); }, [refreshUser]);

  // Atualiza apenas no cliente (para refletir imediatamente ao equipar/desequipar)
  const setEquipped = useCallback((itemType, itemId) => {
    setMe(prev => !prev ? prev : {
      ...prev,
      equipped_items: {
        ...(prev.equipped_items || { seal: null, border: null, theme: null }),
        [itemType]: itemId
      }
    });
  }, []);

  const value = {
    // música
    showMusicPlayer,
    setShowMusicPlayer,
    openMusicPlayer: () => setShowMusicPlayer(true),
    closeMusicPlayer: () => setShowMusicPlayer(false),
    toggleMusicPlayer: () => setShowMusicPlayer(p => !p),

    // usuário
    me,
    setMe,
    refreshUser,
    setEquipped,
    booted,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
