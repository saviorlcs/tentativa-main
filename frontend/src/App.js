// frontend/src/App.js
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { api } from "./lib/api";  
import LandingNew from "./pages/LandingNew";
import Sobre from "./pages/Sobre";
import CookieConsent from "./components/CookieConsent";
import Dashboard from "./pages/DashboardFixed";
import Shop from "./pages/Shop";
import Settings from "./pages/Settings";
import Financeiro from "./pages/Financeiro";
import Friends from "./pages/Friends";
import NicknameSetup from "./pages/NicknameSetup";
import Agenda from "./pages/Agenda";
import Rankings from "./pages/Rankings";
import Groups from "./pages/Groups";
import GroupView from "./pages/GroupView";
import AuthCallback from "./pages/AuthCallback";
import Devocional from "./pages/Devocional";
import Revisao from "./pages/Revisao";
import Habitos from "./pages/Habitos";
import { Toaster } from "./components/ui/sonner";
import "@/App.css";
import { bootApply } from "@/lib/siteStyle";
import { presenceOpen, presencePing, presenceLeave } from "@/lib/friends";
import MusicPlayer from "./components/MusicPlayer";
import { Music } from "lucide-react";
import * as siteStyle from "./lib/siteStyle";
import { AppProvider, useApp } from "@/context/AppContext";
import Profile from "./pages/Profile";
import TermosDeUso from "./pages/TermosDeUso";
import Privacidade from "./pages/Privacidade";
import TecnicaPomodoro from "./pages/TecnicaPomodoro";
import Comunidade from "./pages/Comunidade";
/* ---------------- Ping simples ao /api (equivalente ao primeiro código) ---------------- */
function HelloProbe() {
  useEffect(() => {
    (async () => {
      try {
        // Se @/lib/api tiver baseURL = `${REACT_APP_BACKEND_URL}/api`,
        // então GET "/" equivale a GET `${REACT_APP_BACKEND_URL}/api/`
        const r = await api.get("/");
        const msg = r?.data?.message ?? JSON.stringify(r?.data);
        console.log("[/api] hello:", msg);
      } catch (e) {
        console.error("Falha ao chamar /api:", e);
      }
    })();
  }, []);
  return null; // não renderiza nada
}

/* ---------------- Auth / Guard ---------------- */
function AuthHandler() {
  
  const navigate = useNavigate();
  const location = useLocation();

  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  // carrega /auth/me e faz o roteamento protegido
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        // Rotas públicas que não precisam de autenticação
        const publicRoutes = ["/", "/sobre", "/auth/callback"];
        const isPublicRoute = publicRoutes.includes(location.pathname);
        
        // Skip auth check in public routes except for the home page redirect logic
        if (location.pathname === "/auth/callback") {
          setChecking(false);
          return;
        }
        
        const r = await api.get("/auth/me").catch(() => ({ data: { ok: false, anon: true } }));
        
        // Backend retorna {ok: true, user: {...}} ou {ok: false, anon: true}
        const u = r?.data?.user ?? null;

        if (!alive) return;
        
        setUser(u);
        setIsAuthed(!!u?.id);

        // rotas
        const path = location.pathname;
        const hasNick = !!(u?.nickname && u?.tag);

        // ✅ FIX: Só redireciona no primeiro check ou quando não está em /setup
        const shouldRedirect = !hasCheckedOnce || path !== "/setup";
        
        if (shouldRedirect) {
          if (path === "/") {
            if (u?.id && hasNick) navigate("/dashboard", { replace: true });
            else if (u?.id && !hasNick) navigate("/setup", { replace: true });
          } else if (path === "/sobre") {
            // /sobre é público, não redireciona
            // Usuários logados podem acessar, usuários não logados também
          } else if (path === "/setup") {
            // Se não tem user, volta pro login
            if (!u?.id) navigate("/", { replace: true });
          } else {
            // qualquer outra rota protegida
            if (!u?.id) {
              console.warn("No user found, redirecting to /");
              navigate("/", { replace: true });
            } else if (u?.id && !hasNick) {
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




  
  // aplica tema/borda equipados (se houver)
  

  // presença apenas quando logado
  useEffect(() => {
    if (!isAuthed) return;
    presenceOpen().catch(() => {});
    const t = setInterval(() => presencePing(false), 60_000);
    const mark = () => presencePing(true);
    window.addEventListener("click", mark);
    window.addEventListener("keydown", mark);
    window.addEventListener("scroll", mark);
    presencePing(false);

    return () => {
      clearInterval(t);
      window.removeEventListener("click", mark);
      window.removeEventListener("keydown", mark);
      window.removeEventListener("scroll", mark);
      try {
        const url = `${api.defaults.baseURL}/presence/leave`;
        const body = new Blob([JSON.stringify({})], { type: "application/json" });
        navigator.sendBeacon?.(url, body);
      } catch {
        presenceLeave().catch(() => {});
      }
    };
  }, [isAuthed]);

  if (checking) return null; // splash/loader opcional
  return null;               // não renderiza UI — só guarda e efeitos globais
}
function AppTheming() {
  const { me: user } = useApp();
  const [shopItems, setShopItems] = useState([]);
  const [loadedItems, setLoadedItems] = useState(false);

  // Carrega os itens da loja uma vez para ter os efeitos
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/shop/list").catch(() => api.get("/shop/items")).catch(() => api.get("/shop"));
        const items = Array.isArray(res.data) ? res.data : 
                     Array.isArray(res.data?.items) ? res.data.items : 
                     Array.isArray(res.data?.data) ? res.data.data : [];
        setShopItems(items);
        setLoadedItems(true);
      } catch (e) {
        console.error("[AppTheming] Erro ao carregar itens da loja:", e);
        setLoadedItems(true); // marca como carregado mesmo com erro
      }
    })();
  }, []);

  useEffect(() => {
    siteStyle.boot?.(); // injeta CSS base uma vez
    
    if (!loadedItems) return; // aguarda carregar os itens
    
    if (user?.equipped_items && shopItems.length > 0) {
      // Cria um mapa de id -> item
      const itemsById = Object.fromEntries(shopItems.map(it => [it.id, it]));
      
      // Busca os itens equipados completos
      const equippedData = {
        seal: user.equipped_items.seal ? itemsById[user.equipped_items.seal] : null,
        border: user.equipped_items.border ? itemsById[user.equipped_items.border] : null,
        theme: user.equipped_items.theme ? itemsById[user.equipped_items.theme] : null,
      };
      
      console.log("[AppTheming] Aplicando efeitos equipados:", {
        sealId: user.equipped_items.seal,
        borderId: user.equipped_items.border,
        themeId: user.equipped_items.theme,
        sealEffects: equippedData.seal?.effects,
        borderEffects: equippedData.border?.effects,
        themeEffects: equippedData.theme?.effects,
      });
      
      siteStyle.applyFromEquipped?.(equippedData); // aplica tema + borda
    } else {
      siteStyle.reset?.(); // volta ao padrão se deslogar
    }
  }, [user, shopItems, loadedItems]);

  return null; // não renderiza nada
}

/* ---------------- App ---------------- */
export default function App() {
  return (
    <AppProvider>
      <div className="App app-surface">
        <BrowserRouter>
          <AuthHandler />
          <AppTheming />
          <HelloProbe /> {/* integra o "helloWorldApi" do primeiro código */}
          <Routes>
            <Route path="/" element={<LandingNew />} />
            <Route path="/sobre" element={<Sobre />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/setup" element={<NicknameSetup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/rankings" element={<Rankings />} />
            <Route path="/grupos" element={<Groups />} />
            <Route path="/grupos/:id" element={<GroupView />} />
            <Route path="/loja" element={<Shop />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/configuracoes" element={<Settings />} />
            <Route path="/financeiro" element={<Financeiro />} />
            <Route path="/amigos" element={<Friends />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/devocional" element={<Devocional />} />
            <Route path="/revisao" element={<Revisao />} />
            <Route path="/habitos" element={<Habitos />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/termos-de-uso" element={<TermosDeUso />} />
            <Route path="/privacidade" element={<Privacidade />} />
            <Route path="/tecnica-pomodoro" element={<TecnicaPomodoro />} />
            <Route path="/whatsapp" element={<Comunidade />} />
            <Route path="/discord" element={<Comunidade />} />
            <Route path="/instagram" element={<Comunidade />} />
          </Routes>
          <CookieConsent />
          
          
          {/* Botão flutuante de música (disponível em todas as páginas) */}
          <GlobalMusicButton />
          
          {/* Music Player Global */}
          <GlobalMusicPlayer />
        </BrowserRouter>
        <Toaster position="top-right" />
      </div>
    </AppProvider>
  );
}

/* ---------------- Componentes Globais de Música ---------------- */
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

function GlobalMusicPlayer() {
  const { showMusicPlayer, closeMusicPlayer } = useApp();
  
  return (
    <MusicPlayer
      isOpen={showMusicPlayer}
      onClose={closeMusicPlayer}
    />
  );
}