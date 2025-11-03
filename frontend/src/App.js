/**
 * App.js - Componente Principal do Pomociclo
 * ===========================================
 * 
 * Arquivo raiz da aplicação React que gerencia:
 * - Roteamento de todas as páginas
 * - Autenticação e proteção de rotas
 * - Temas globais (loja e aparência básica)
 * - Sistema de presença (amigos online)
 * - Player de música global
 * - Notificações e consentimento de cookies
 * 
 * Estrutura:
 * - HelloProbe: Testa conexão com backend
 * - AuthHandler: Gerencia autenticação e redirecionamentos
 * - AppTheming: Aplica temas globais (loja ou aparência)
 * - GlobalMusicButton/Player: Sistema de música global
 * - App: Componente raiz com rotas
 */

import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { api } from "./lib/api";  
import { AppProvider, useApp } from "@/context/AppContext";
import { presenceOpen, presencePing, presenceLeave } from "@/lib/friends";
import * as siteStyle from "./lib/siteStyle";
import "@/App.css";

// ============================================================
// IMPORTAÇÕES DE PÁGINAS
// ============================================================

// Páginas Públicas
import LandingNew from "./pages/LandingNew";
import Sobre from "./pages/Sobre";
import AuthCallback from "./pages/AuthCallback";
import TermosDeUso from "./pages/TermosDeUso";
import Privacidade from "./pages/Privacidade";
import TecnicaPomodoro from "./pages/TecnicaPomodoro";
import Comunidade from "./pages/Comunidade";

// Páginas Protegidas
import Dashboard from "./pages/DashboardFixed";
import NicknameSetup from "./pages/NicknameSetup";
import Profile from "./pages/Profile";
import Shop from "./pages/Shop";
import Settings from "./pages/Settings";
import Appearance from "./pages/Appearance";
import Financeiro from "./pages/Financeiro";
import Friends from "./pages/Friends";
import Agenda from "./pages/Agenda";
import Rankings from "./pages/Rankings";
import Groups from "./pages/Groups";
import GroupView from "./pages/GroupView";
import Devocional from "./pages/Devocional";
import Revisao from "./pages/Revisao";
import Habitos from "./pages/Habitos";

// ============================================================
// IMPORTAÇÕES DE COMPONENTES
// ============================================================
import CookieConsent from "./components/CookieConsent";
import MusicPlayer from "./components/MusicPlayer";
import { Toaster } from "./components/ui/sonner";
import { Music } from "lucide-react";

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

/**
 * HelloProbe - Testa conexão com o backend
 * Faz um ping inicial para verificar se a API está respondendo
 */
/**
 * HelloProbe - Testa conexão com o backend
 * Faz um ping inicial para verificar se a API está respondendo
 */
function HelloProbe() {
  useEffect(() => {
    (async () => {
      try {
        // Testa endpoint raiz da API
        const r = await api.get("/");
        const msg = r?.data?.message ?? JSON.stringify(r?.data);
        console.log("[/api] hello:", msg);
      } catch (e) {
        console.error("Falha ao chamar /api:", e);
      }
    })();
  }, []);
  return null; // Não renderiza nada, apenas executa o teste
}

// ============================================================
// AUTENTICAÇÃO E PROTEÇÃO DE ROTAS
// ============================================================

/**
 * AuthHandler - Gerencia autenticação e redirecionamentos
 * 
 * Responsabilidades:
 * - Verifica se usuário está autenticado
 * - Redireciona para /setup se não tiver nickname
 * - Protege rotas que exigem autenticação
 * - Permite acesso a rotas públicas (/, /sobre, /auth/callback)
 */
function AuthHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  // ========================================
  // ESTADOS
  // ========================================
  
  /** Indica se está verificando autenticação */
  const [checking, setChecking] = useState(true);
  
  /** Dados do usuário autenticado */
  const [user, setUser] = useState(null);
  
  /** Indica se usuário está autenticado */
  const [isAuthed, setIsAuthed] = useState(false);
  
  /** Controla se já verificou autenticação uma vez (evita loops) */
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  // ========================================
  // VERIFICAÇÃO DE AUTENTICAÇÃO
  // ========================================
  
  useEffect(() => {
    let alive = true;
    
    (async () => {
      try {
        // Define rotas públicas que não precisam de autenticação
        const publicRoutes = ["/", "/sobre", "/auth/callback"];
        const isPublicRoute = publicRoutes.includes(location.pathname);
        
        // Callback do OAuth não precisa verificar autenticação
        if (location.pathname === "/auth/callback") {
          setChecking(false);
          return;
        }
        
        // Busca dados do usuário
        const r = await api.get("/auth/me").catch(() => ({ data: { ok: false, anon: true } }));
        const u = r?.data?.user ?? null;

        if (!alive) return;
        
        // Atualiza estados de autenticação
        setUser(u);
        setIsAuthed(!!u?.id);

        // ========================================
        // LÓGICA DE REDIRECIONAMENTO
        // ========================================
        
        const path = location.pathname;
        const hasNick = !!(u?.nickname && u?.tag);

        // Só redireciona no primeiro check ou quando não está em /setup
        // Isso evita loops infinitos de redirecionamento
        const shouldRedirect = !hasCheckedOnce || path !== "/setup";
        
        if (shouldRedirect) {
          if (path === "/") {
            // Landing page: redireciona usuário logado para dashboard
            if (u?.id && hasNick) navigate("/dashboard", { replace: true });
            else if (u?.id && !hasNick) navigate("/setup", { replace: true });
          } else if (path === "/sobre") {
            // /sobre é público, não redireciona
          } else if (path === "/setup") {
            // Setup exige estar logado
            if (!u?.id) navigate("/", { replace: true });
          } else {
            // Qualquer outra rota é protegida
            if (!u?.id) {
              console.warn("Usuário não autenticado, redirecionando para /");
              navigate("/", { replace: true });
            } else if (u?.id && !hasNick) {
              // Usuário logado sem nickname vai para setup
              navigate("/setup", { replace: true });
            }
          }
        }
        
        setHasCheckedOnce(true);
      } catch (err) {
        console.error("AuthHandler error:", err);
      } finally {
        if (alive) setChecking(false);
      }
    })();
    
    return () => { alive = false; };
  }, [location.pathname, navigate, hasCheckedOnce]);


  // ========================================
  // SISTEMA DE PRESENÇA (AMIGOS ONLINE)
  // ========================================
  
  /**
   * Gerencia presença do usuário para sistema de amigos
   * - Abre conexão de presença
   * - Envia pings a cada minuto
   * - Detecta atividade do usuário (cliques, teclas, scroll)
   * - Fecha conexão ao desmontar
   */

  useEffect(() => {
    if (!isAuthed) return;
    
    // Abre conexão de presença
    presenceOpen().catch(() => {});
    
    // Ping automático a cada minuto
    const t = setInterval(() => presencePing(false), 60_000);
    
    // Funções para detectar atividade do usuário
    const mark = () => presencePing(true);
    window.addEventListener("click", mark);
    window.addEventListener("keydown", mark);
    window.addEventListener("scroll", mark);
    
    // Ping inicial
    presencePing(false);

    // Limpeza ao desmontar
    return () => {
      clearInterval(t);
      window.removeEventListener("click", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("scroll", mark);
      
      // Envia beacon de saída (mais confiável que request normal)
      try {
        const url = `${api.defaults.baseURL}/presence/leave`;
        const body = new Blob([JSON.stringify({})], { type: "application/json" });
        navigator.sendBeacon?.(url, body);
      } catch {
        presenceLeave().catch(() => {});
      }
    };
  }, [isAuthed]);

  // Não renderiza UI enquanto estiver verificando
  if (checking) return null;
  return null; // Componente apenas gerencia estados globais
}

// ============================================================
// SISTEMA DE TEMAS GLOBAIS
// ============================================================

/**
 * AppTheming - Gerencia temas globais da aplicação
 * 
 * Responsabilidades:
 * - Carrega itens da loja para aplicar temas premium
 * - Aplica temas equipados (selo, borda, tema)
 * - Fallback para temas gratuitos (Aparência básica)
 * - Sincroniza com preferências do usuário
 * 
 * Ordem de prioridade:
 * 1. Tema da loja (se equipado)
 * 2. Tema gratuito (preferências de aparência)
 * 3. Tema padrão (Pomociclo)
 */
function AppTheming() {
  const { me: user } = useApp();
  
  // ========================================
  // ESTADOS
  // ========================================
  
  /** Lista de itens disponíveis na loja */
  const [shopItems, setShopItems] = useState([]);
  
  /** Indica se já carregou os itens da loja */
  const [loadedItems, setLoadedItems] = useState(false);

  // ========================================
  // CARREGAMENTO DE ITENS DA LOJA
  // ========================================
  
  /**
   * Carrega itens da loja uma vez para ter os efeitos
   * Tenta múltiplos endpoints para compatibilidade
   */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/shop/list")
          .catch(() => api.get("/shop/items"))
          .catch(() => api.get("/shop"));
        
        // Normaliza resposta (pode vir em formatos diferentes)
        const items = Array.isArray(res.data) ? res.data : 
                     Array.isArray(res.data?.items) ? res.data.items : 
                     Array.isArray(res.data?.data) ? res.data.data : [];
        
        setShopItems(items);
        setLoadedItems(true);
      } catch (e) {
        console.error("[AppTheming] Erro ao carregar itens da loja:", e);
        setLoadedItems(true); // Marca como carregado mesmo com erro
      }
    })();
  }, []);

  // ========================================
  // APLICAÇÃO DE TEMAS
  // ========================================
  
  /**
   * Aplica temas baseado em prioridade:
   * 1º: Tema da loja (premium)
   * 2º: Tema gratuito (aparência)
   * 3º: Tema padrão
   */
  useEffect(() => {
    // Injeta CSS base uma vez
    siteStyle.boot?.();
    
    // Aguarda carregar os itens da loja
    if (!loadedItems) return;
    
    // ========================================
    // CASO 1: TEMA DA LOJA (PREMIUM)
    // ========================================
    if (user?.equipped_items?.theme && shopItems.length > 0) {
      // Cria mapa de id -> item para busca rápida
      const itemsById = Object.fromEntries(shopItems.map(it => [it.id, it]));
      
      // Busca os itens equipados completos
      const equippedData = {
        seal: user.equipped_items.seal ? itemsById[user.equipped_items.seal] : null,
        border: user.equipped_items.border ? itemsById[user.equipped_items.border] : null,
        theme: user.equipped_items.theme ? itemsById[user.equipped_items.theme] : null,
      };
      
      console.log("[AppTheming] Aplicando efeitos equipados da loja:", {
        sealId: user.equipped_items.seal,
        borderId: user.equipped_items.border,
        themeId: user.equipped_items.theme,
        sealEffects: equippedData.seal?.effects,
        borderEffects: equippedData.border?.effects,
        themeEffects: equippedData.theme?.effects,
      });
      
      // Aplica tema + borda da loja
      siteStyle.applyFromEquipped?.(equippedData);
    } 
    // ========================================
    // CASO 2: TEMA GRATUITO (APARÊNCIA)
    // ========================================
    else if (user?.id) {
      (async () => {
        try {
          // Busca preferências de aparência do usuário
          const prefsRes = await api.get('/user/appearance').catch(() => ({ data: {} }));
          const prefs = prefsRes.data || {};
          const colorScheme = prefs.color_scheme || 'pomociclo-default';
          
          // ========================================
          // ESQUEMAS DE CORES GRATUITOS
          // Sincronizado com Appearance.jsx
          // ========================================
          const FREE_SCHEMES = {
            'pomociclo-default': {
              primary: '#22d3ee',
              accent: '#a78bfa',
              bg: '#0f172a',
              surface: '#1e293b',
              text: '#f1f5f9'
            },
            'midnight-blue': {
              primary: '#60a5fa',
              accent: '#93c5fd',
              bg: '#0c1a2e',
              surface: '#1e3a5f',
              text: '#f0f9ff'
            },
            'dark-slate': {
              primary: '#94a3b8',
              accent: '#cbd5e1',
              bg: '#0f172a',
              surface: '#1e293b',
              text: '#f8fafc'
            },
            'deep-space': {
              primary: '#a78bfa',
              accent: '#c4b5fd',
              bg: '#1e1b4b',
              surface: '#312e81',
              text: '#f5f3ff'
            },
            'emerald-forest': {
              primary: '#34d399',
              accent: '#6ee7b7',
              bg: '#022c22',
              surface: '#065f46',
              text: '#ecfdf5'
            },
            'sunset-orange': {
              primary: '#fb923c',
              accent: '#fbbf24',
              bg: '#1c1917',
              surface: '#44403c',
              text: '#fef3c7'
            },
            'pink-passion': {
              primary: '#f472b6',
              accent: '#ec4899',
              bg: '#1e1b3e',
              surface: '#3b2b5f',
              text: '#fce7f3'
            },
            'cyber-aqua': {
              primary: '#06b6d4',
              accent: '#14b8a6',
              bg: '#0a1f2e',
              surface: '#1e3a4f',
              text: '#cffafe'
            }
          };
          
          // Seleciona esquema (com fallback para padrão)
          const scheme = FREE_SCHEMES[colorScheme] || FREE_SCHEMES['pomociclo-default'];
          
          // Aplica variáveis CSS em :root e body
          const root = document.documentElement;
          const body = document.body;
          
          root.style.setProperty('--primary', scheme.primary);
          root.style.setProperty('--accent', scheme.accent);
          root.style.setProperty('--bg', scheme.bg);
          root.style.setProperty('--surface', scheme.surface);
          root.style.setProperty('--text', scheme.text);
          
          body.style.setProperty('--primary', scheme.primary);
          body.style.setProperty('--accent', scheme.accent);
          body.style.setProperty('--bg', scheme.bg);
          body.style.setProperty('--surface', scheme.surface);
          body.style.setProperty('--text', scheme.text);
          
          console.log("[AppTheming] Aplicando tema gratuito:", colorScheme, scheme);
        } catch (e) {
          console.error("[AppTheming] Erro ao carregar preferências de aparência:", e);
        }
      })();
    } 
    // ========================================
    // CASO 3: RESET (DESLOGADO)
    // ========================================
    else {
      siteStyle.reset?.(); // Volta ao padrão se deslogar
    }
  }, [user, shopItems, loadedItems]);

  return null; // Não renderiza nada, apenas aplica estilos
}

// ============================================================
// COMPONENTE PRINCIPAL - APP
// ============================================================

/**
 * App - Componente raiz da aplicação
 * 
 * Estrutura:
 * - AppProvider: Context global para estado compartilhado
 * - BrowserRouter: Sistema de roteamento
 * - AuthHandler: Gerencia autenticação e redirecionamentos
 * - AppTheming: Aplica temas globais
 * - HelloProbe: Testa conexão com backend
 * - Routes: Define todas as rotas da aplicação
 * - CookieConsent: Banner de consentimento de cookies
 * - GlobalMusicButton/Player: Sistema de música global
 * - Toaster: Notificações toast
 */
export default function App() {
  return (
    <AppProvider>
      <div className="App app-surface">
        <BrowserRouter>
          {/* Gerenciamento global */}
          <AuthHandler />
          <AppTheming />
          <HelloProbe />
          
          {/* ========================================
              ROTAS DA APLICAÇÃO
              ======================================== */}
          <Routes>
            {/* Rotas Públicas */}
            <Route path="/" element={<LandingNew />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/tecnica-pomodoro" element={<TecnicaPomodoro />} />
            <Route path="/whatsapp" element={<Comunidade />} />
            <Route path="/discord" element={<Comunidade />} />
            <Route path="/instagram" element={<Comunidade />} />
            
            {/* Rotas de Configuração Inicial */}
            <Route path="/setup" element={<NicknameSetup />} />
            
            {/* Rotas Principais do Aplicativo */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/revisao" element={<Revisao />} />
            <Route path="/habitos" element={<Habitos />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/devocional" element={<Devocional />} />
            
            {/* Rotas Sociais */}
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/grupos" element={<Groups />} />
            <Route path="/grupos/:id" element={<GroupView />} />
            <Route path="/amigos" element={<Friends />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            
            {/* Rotas de Personalização */}
            <Route path="/loja" element={<Shop />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/aparencia" element={<Appearance />} />
            <Route path="/configuracoes" element={<Settings />} />
          </Routes>
          
          {/* Componentes Globais */}
          <CookieConsent />
          <GlobalMusicButton />
          <GlobalMusicPlayer />
        </BrowserRouter>
        
        {/* Sistema de notificações toast */}
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  );
}

// ============================================================
// COMPONENTES GLOBAIS DE MÚSICA
// ============================================================

/**
 * GlobalMusicButton - Botão flutuante para abrir player de música
 * 
 * Funcionalidades:
 * - Botão fixo no canto inferior direito
 * - Oculta quando player está aberto
 * - Não aparece na landing page
 */
function GlobalMusicButton() {
  const { showMusicPlayer, openMusicPlayer } = useApp();
  const location = useLocation();
  
  // Não mostrar o botão na landing page
  if (location.pathname === '/') return null;
  
  return (
    <button
      onClick={openMusicPlayer}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 shadow-lg z-40 flex items-center justify-center transition-all hover:scale-110"
      title="Abrir player de música"
      data-testid="music-button"
      style={{ display: showMusicPlayer ? 'none' : 'flex' }}
    >
      <Music className="w-6 h-6 text-white" />
    </button>
  );
}

/**
 * GlobalMusicPlayer - Player de música global
 * 
 * Funcionalidades:
 * - Modal overlay com player de música
 * - Controlado por contexto global (useApp)
 * - Playlist com músicas para estudo/foco
 */
function GlobalMusicPlayer() {
  const { showMusicPlayer, closeMusicPlayer } = useApp();
  
  return (
    <MusicPlayer
      isOpen={showMusicPlayer}
      onClose={closeMusicPlayer}
    />
  );
}