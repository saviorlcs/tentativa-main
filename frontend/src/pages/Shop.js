/**
 * Loja - Sistema de Customização
 * ================================
 * 
 * Loja virtual com itens cosméticos e de personalização.
 * Sistema completo de compra, equipamento e preview.
 * 
 * Funcionalidades:
 * - Categorias: Selos (avatares), Temas, Bordas
 * - Sistema de moedas (coins)
 * - Preview em tempo real
 * - Equipamento de itens
 * - Filtros por tipo
 * - Efeitos visuais aplicados dinamicamente
 * 
 * Tipos de itens:
 * - Seal: Avatares personalizados (básico, moderno, avançado)
 * - Theme: Esquemas de cores completos
 * - Border: Bordas decorativas para perfil
 * 
 * Integração:
 * - Backend: API de compra/equipamento
 * - Context: Atualização global do usuário
 * - SiteStyle: Aplicação de efeitos visuais
 */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import {
   applyThemeEffects,
   applyBorderEffects,
   bootApply,
   applyThemeById,
   applyBorderById,
 } from "@/lib/siteStyle";
import ModernSealAvatar from "@/components/ModernSealAvatar";
import AdvancedSealAvatar from "@/components/AdvancedSealAvatar";
import ModernBorderPreview from "@/components/ModernBorderPreview";
import ModernThemePreview from "@/components/ModernThemePreview";
import SealAvatar from "@/components/SealAvatar";
import { useApp } from "@/context/AppContext.jsx"; 
import * as siteStyle from "../lib/siteStyle";
import { setCycleState } from "../lib/siteStyle";
import Footer from '../components/Footer';
// ============================================================
// CONSTANTES E CONFIGURAÇÕES
// ============================================================

/**
 * Tipos de itens visíveis na loja
 * Atualmente apenas "seal" (selos/avatares)
 */
const VISIBLE_TYPES = ["seal"];

/**
 * Estilos CSS para animações da loja
 */
const shopStyles = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================
/**
 * Tenta múltiplos endpoints para obter lista da loja
 * @param {Object} apiClient - Cliente API
 * @returns {Object} - { endpoint, data }
 */
async function getAnyShopList(apiClient) {
  const endpoints = ["/shop/list", "/shop/items", "/shop", "/shop/all"];
  let lastErr = null;
  for (const ep of endpoints) {
    try {
      const r = await apiClient.get(ep);
      return { endpoint: ep, data: r.data };
    } catch (e) { lastErr = e; }
  }
  throw lastErr;
}

/**
 * Extrai array de itens de diferentes formatos de resposta
 * @param {*} payload - Resposta da API
 * @returns {Array} - Array de itens
 */
function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (payload && typeof payload === "object") {
    const arrays = Object.values(payload).filter(v => Array.isArray(v));
    for (const arr of arrays) {
      if (arr.length && typeof arr[0] === "object" && ("id" in arr[0] || "item_type" in arr[0])) return arr;
    }
  }
  return [];
}
async function postAny(paths, body) {
  let lastErr = null;
  for (const p of paths) {
    try { return await api.post(p, body); }
    catch (e) { lastErr = e; }
  }
  throw lastErr;
}

const RARITY_LABEL = { common: "Comum", rare: "Raro", epic: "Especial", legendary: "Lendário" };
const rarityUI = {
  common:    { badge: "bg-slate-600 text-slate-200", ring: "ring-slate-500/40", glow: "" },
  rare:      { badge: "bg-sky-500/15 text-sky-300 border border-sky-400/30", ring: "ring-sky-400/40", glow: "shadow-[0_0_16px_rgba(56,189,248,0.18)]" },
  epic:      { badge: "bg-purple-500/15 text-purple-300 border border-purple-400/30", ring: "ring-purple-400/50", glow: "shadow-[0_0_18px_rgba(168,85,247,0.28)]" },
  legendary: { badge: "bg-amber-500/15 text-amber-300 border border-amber-400/40", ring: "ring-amber-400/70", glow: "shadow-[0_0_22px_rgba(251,191,36,0.35)]" },
};

const ItemPreview = ({ item, user }) => {
  if (!item) return (
    <div style={{width:80, height:80, background:'#444', borderRadius:8}} />
  );

  try {
    if (item.item_type === "border") {
      return <ModernBorderPreview effects={item.effects} size={120} />;
    }
    if (item.item_type === "theme") {
      return <ModernThemePreview effects={item.effects} size={120} />;
    }
    // selo
    return <ModernSealAvatar user={user} item={item} size={80} />;
  } catch (e) {
    console.error("Preview error:", e);
    return (
      <div style={{width:80, height:80, background:'#444', borderRadius:8}} />
    );
  }
};


/* ---------- componente ---------- */
export default function Shop() {
  const navigate = useNavigate();

  
  const [shopItems, setShopItems] = useState([]);
  const [equippedItems, setEquippedItems] = useState({ seal: null, border: null, theme: null });
  const [loading, setLoading] = useState(true);
  const [ownedIds, setOwnedIds] = useState(new Set());   // ids comprados do usuário

  const ctx = useApp() || {};
  const { me: user, setEquipped, refreshUser } = ctx;
  const safeRefresh = () => { try { if (typeof refreshUser === "function") refreshUser(); } catch {} };

  useEffect(() => {
  // injeta o CSS dos efeitos (selos, temas e bordas)
  bootApply();

  (async () => {
    try {
      const me = await api.get("/auth/me");
      const u = me.data?.user || me.data || null;
      
      // Se não há usuário autenticado, redireciona
      if (!me.data?.user?.id) {
        console.warn("[Shop] No user authenticated, redirecting to /");
        navigate("/", { replace: true });
        return;
      }
      
      // Atualiza owned items
      setOwnedIds(new Set(u?.items_owned || []));
      
      const { data } = await getAnyShopList(api);
      const items = extractItems(data);
      setShopItems(items);

      // mapa por id para converter ids -> objetos
      const byId = Object.fromEntries(items.map(it => [it.id, it]));
      
      // 🔥 CORREÇÃO: Busca equipped_items direto do user
      const eq = u?.equipped_items ?? { seal:null, border:null, theme:null };

      console.log("[Shop] Loaded equipped_items from backend:", eq);

      // Guarda os IDs equipados - SEMPRE atualiza do servidor
      const equippedIds = {
        seal:   eq.seal   || null,
        border: eq.border || null,
        theme:  eq.theme  || null,
      };
      setEquippedItems(equippedIds);

      // aplica os efeitos reais do equipado assim que a tela abre
      bootApply({
        themeEffects:  byId[eq.theme]?.effects  || null,
        borderEffects: byId[eq.border]?.effects || null,
      });
      
      console.log("[Shop] Applied equipped items:", equippedIds);
    } catch (e) {
      console.error("[Shop] load error:", e?.response?.status, e?.response?.data || e?.message);
      // Se erro de autenticação, redireciona
      if (e?.response?.status === 401) {
        navigate("/", { replace: true });
        return;
      }
      toast.error("Erro ao carregar a loja");
    } finally {
      setLoading(false);
    }
  })();
}, [navigate]);

  // Reaplica efeitos visuais quando o user do contexto muda
  useEffect(() => {
    if (!user || !shopItems.length) return;
    
    const byId = Object.fromEntries(shopItems.map(it => [it.id, it]));
    const eq = user?.equipped_items || { seal: null, border: null, theme: null };
    
    // 🔥 CORREÇÃO: Sincroniza equippedItems com o user do contexto
    setEquippedItems({
      seal: eq.seal || null,
      border: eq.border || null,
      theme: eq.theme || null,
    });
    
    bootApply({
      themeEffects:  byId[eq.theme]?.effects  || null,
      borderEffects: byId[eq.border]?.effects || null,
    });
  }, [user, shopItems]);

  // guarda de carregamento
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-xl text-white">Carregando...</div>
      </div>
    );
  }

  // estado “sem itens”
  if (shopItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
        <div className="text-white/90 text-center space-y-2">
          <div className="text-lg">Não foi possível carregar os itens da loja.</div>
          <div className="opacity-70 text-sm">Confira se o backend está rodando e as rotas /shop/list, /shop ou /shop/items existem.</div>
        </div>
      </div>
    );
  }

  async function handleBuy(item) {
    try {
      await postAny(["/shop/purchase", "/shop/buy", "/user/shop/purchase"], { item_id: item.id });
      
      // Atualiza o estado local imediatamente
      setOwnedIds(prev => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      
      safeRefresh();
      toast.success(`${item.name} comprado!`);
    } catch (err) {
      console.error("[Shop] buy error:", err?.response?.status, err?.response?.data || err?.message);
      toast.error(err?.response?.data?.detail || "Falha ao comprar");
    }
  }

  async function handleEquip(item) {
    try {
      console.log("[Shop] Equipando item:", item.id, item.item_type);
      await api.post("/shop/equip", { item_id: item.id });

      // Atualiza estado local com ID
      setEquippedItems(prev => {
        const newState = {
          ...prev,
          [item.item_type]: item.id
        };
        console.log("[Shop] Estado atualizado:", newState);
        return newState;
      });

      // atualiza contexto global
      if (typeof setEquipped === "function") {
        setEquipped(item.item_type, item.id);
      }

      // aplica na UI global (tema/borda)
      if (item.item_type === "theme") {
        siteStyle.applyThemeEffects(item.effects);
      }
      if (item.item_type === "border") {
        siteStyle.applyBorderEffects(item.effects);
      }

      // 🔥 Força refresh do user para sincronizar
      await safeRefresh();
      
      toast.success(`${item.name} equipado!`);
    } catch (e) {
      console.error("[Shop] Erro ao equipar:", e?.response?.data || e?.message);
      toast.error("Erro ao equipar item");
    }
  }

  async function handleUnequip(itemType) {
    try {
      console.log("[Shop] Desequipando item tipo:", itemType);
      await api.post("/shop/unequip", { item_type: itemType });

      // Atualiza estado local
      setEquippedItems(prev => {
        const newState = {
          ...prev,
          [itemType]: null
        };
        console.log("[Shop] Estado após desequipar:", newState);
        return newState;
      });

      // atualiza contexto global
      if (typeof setEquipped === "function") {
        setEquipped(itemType, null);
      }

      // remove efeitos visuais
      if (itemType === "theme") {
        siteStyle.applyThemeEffects(null);
      }
      if (itemType === "border") {
        siteStyle.applyBorderEffects(null);
      }

      // 🔥 Força refresh do user para sincronizar
      await safeRefresh();
      
      toast.success("Item desequipado!");
    } catch (e) {
      console.error("[Shop] Erro ao desequipar:", e?.response?.data || e?.message);
      toast.error("Erro ao desequipar item");
    }
  }
function handlePreview(item) {
  if (!item) return;
  if (item.item_type === "theme" || item.item_type === "border") {
    siteStyle.previewItem(item);
  }
  // selo: prévia visual no próprio card/mini avatar; não alteramos global
}

function clearPreview() {
  siteStyle.clearPreview();
}


function previewItem(item) {
  if (!item) return;
  if (item.item_type === "theme")  applyThemeEffects(item.effects);
  if (item.item_type === "border") applyBorderEffects(item.effects);
  // selos já pré-visualizam sozinhos via <SealAvatar item={item} />
}

function restoreEquipped(equippedIds) {
  // CORREÇÃO: busca os objetos completos dos itens equipados
  const themeItem = shopItems.find(it => it.id === equippedIds?.theme);
  const borderItem = shopItems.find(it => it.id === equippedIds?.border);
  
  applyThemeEffects(themeItem?.effects || null);
  applyBorderEffects(borderItem?.effects || null);
}


  return (
    
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900" style={{ fontFamily: "Inter, sans-serif" }}>
      <style>{shopStyles}</style>
      <Header user={user} />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
              <ShoppingBag className="inline w-8 h-8 mr-3 text-cyan-400" />
              Loja
            </h1>
            <p className="text-gray-400 mt-1">Compre e equipe itens exclusivos</p>
          </div>
        </div>


        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6 max-w-md mx-auto">
          <h2 className="text-lg font-bold text-white mb-4 text-center">Items Equipados</h2>
          <div className="space-y-3">

            {VISIBLE_TYPES.map(type => {

              const equippedId = equippedItems[type];
              const item = shopItems.find(it => it.id === equippedId);
              const typeLabels = { seal: "Selo", border: "Borda", theme: "Tema" };
              
              return (
                <div key={type} className="bg-slate-700/30 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {item ? (
                      <ItemPreview item={item} user={user} />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-slate-600/30 flex items-center justify-center">
                        <span className="text-slate-500 text-xs">—</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 mb-0.5">{typeLabels[type]}</p>
                    {item ? (
                      <p className="text-white font-semibold text-sm truncate">{item.name}</p>
                    ) : (
                      <p className="text-gray-500 text-xs">Nenhum equipado</p>
                    )}
                  </div>
                  
                  {item && (
                    <Button
                      onClick={() => handleUnequip(type)}
                      size="sm"
                      className="flex-shrink-0 bg-red-500/20 border border-red-500/50 text-red-300 hover:bg-red-500/30 text-xs px-3 py-1 h-auto"
                    >
                      Desequipar
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-6">
          <Tabs defaultValue="seal" className="w-full">
            <TabsList className="bg-slate-700 mb-6 grid w-full max-w-md grid-cols-2">
  {VISIBLE_TYPES.includes("seal") && (
    <TabsTrigger value="seal" className="data-[state=active]:bg-cyan-500">Selos</TabsTrigger>
  )}
  {VISIBLE_TYPES.includes("border") && (
    <TabsTrigger value="border" className="data-[state=active]:bg-purple-500">Bordas</TabsTrigger>
  )}
  {VISIBLE_TYPES.includes("theme") && (
    <TabsTrigger value="theme" className="data-[state=active]:bg-pink-500">Temas</TabsTrigger>
  )}
</TabsList>


            {VISIBLE_TYPES.map((type) => (

              <TabsContent key={type} value={type}>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {shopItems
                    .filter(item => item.item_type === type)
                    .map((item, idx) => {
                      // Verificação de item equipado
                      const owned = ownedIds.has(item.id);
                      const isEquipped = equippedItems[item.item_type] === item.id;
                      
                      const meetsLevel = (user?.level ?? 1) >= (item.level_required ?? 1);
                      const canAfford  = (user?.coins ?? 0) >= (item.price ?? 0);
                      const rui = rarityUI[item.rarity] ?? rarityUI.common;
                      
                      // Novos campos do sistema de raridade exponencial
                      const rarityScore = item.rarity_score || 0;
                      const hoursValue = item.hours_value || 0;
                      const uniquenessFeatures = item.uniqueness_features || [];

                      return (
                        <div
                          key={item.id}
                          className={`relative group app-surface border rounded-2xl p-4 text-center transition-all hover:scale-105 ${rui.glow} ${
                            isEquipped 
                              ? `ring-4 ${rui.ring} border-cyan-400/70 shadow-xl shadow-cyan-500/30` 
                              : "border-slate-600/40"
                          }`}
                          onMouseEnter={() => previewItem(item)}
                          onMouseLeave={() => restoreEquipped(equippedItems)}
                        >
                          {/* Badge Equipado */}
                          {isEquipped && (
                            <div className="absolute left-2 top-2 text-[10px] px-2 py-1 rounded-full font-bold bg-cyan-500 text-white z-10 animate-pulse">
                              ✓ EQUIPADO
                            </div>
                          )}
                          
                          {/* Badge de Raridade */}
                          <div className={`absolute ${isEquipped ? 'right-2' : 'left-2'} top-2 text-[10px] px-2 py-0.5 rounded-full font-semibold ${rui.badge}`}>
                            {RARITY_LABEL[item.rarity] || "Comum"}
                          </div>

                          {/* Badge de Score (canto superior direito) */}
                          {rarityScore > 0 && (
                            <div className="absolute right-2 top-2 text-[9px] px-1.5 py-0.5 rounded-full bg-slate-700/80 text-slate-300 font-mono">
                              {(rarityScore * 100).toFixed(0)}%
                            </div>
                          )}

                          <div className="mb-3 mt-4">
                            <ItemPreview item={item} user={user} />
                          </div>

                          <p className="font-semibold text-sm text-white mb-1 line-clamp-2 min-h-[2.5rem]">{item.name}</p>
                          
                          {/* Informações de preço e valor */}
                          <div className="mb-3 space-y-1">
                            <p className="text-xs font-bold text-cyan-400">C${item.price.toLocaleString()}</p>
                            {hoursValue > 0 && (
                              <p className="text-[10px] text-gray-500">≈ {hoursValue}h de estudo</p>
                            )}
                          </div>

                          {/* Features de Uniqueness (hover para ver) */}
                          {uniquenessFeatures.length > 0 && (
                            <div className="mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                              <div className="bg-slate-900/80 rounded-lg p-2 text-[10px] text-left text-slate-300 max-h-24 overflow-y-auto">
                                <p className="font-semibold text-cyan-400 mb-1">Features especiais:</p>
                                <ul className="space-y-0.5">
                                  {uniquenessFeatures.slice(0, 5).map((feature, idx) => (
                                    <li key={idx} className="truncate">• {feature}</li>
                                  ))}
                                  {uniquenessFeatures.length > 5 && (
                                    <li className="text-slate-400">+ {uniquenessFeatures.length - 5} mais...</li>
                                  )}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Botões de ação */}
                          {!owned ? (
                            <Button
                              onClick={() => handleBuy(item)}
                              disabled={!meetsLevel || !canAfford}
                              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white"
                              data-testid={`buy-button-${item.id}`}
                            >
                              {!meetsLevel ? `Nível ${item.level_required}` : canAfford ? "Comprar" : "Sem coins"}
                            </Button>
                          ) : isEquipped ? (
                            <Button
                              onClick={() => handleUnequip(item.item_type)}
                              className="w-full bg-red-500/30 border-2 border-red-500 text-red-200 hover:bg-red-500/50 font-bold"
                              data-testid={`unequip-button-${item.id}`}
                            >
                              Desequipar
                            </Button>
                          ) : (
                            <Button
                              onClick={() => handleEquip(item)}
                              className="w-full bg-green-500/20 border border-green-500/50 text-green-300 hover:bg-green-500/30"
                              data-testid={`equip-button-${item.id}`}
                            >
                              Equipar
                            </Button>
                          )}

                        </div>
                      );
                    })}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
}
