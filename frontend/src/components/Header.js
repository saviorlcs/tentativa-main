/**
 * Header - Barra de Navegação Principal do Pomociclo
 * ==================================================
 * 
 * Componente de cabeçalho responsivo com navegação completa.
 * Gerencia autenticação, perfil do usuário e menu de navegação.
 * 
 * Funcionalidades:
 * - Logo e navegação para páginas principais
 * - Exibição de stats do usuário (nível, moedas)
 * - Avatar customizável com selos equipados
 * - Sistema de notificações integrado
 * - Menu mobile responsivo
 * - Logout e autenticação Google
 * 
 * Integrações:
 * - ModernSealAvatar: Avatar personalizado com selos
 * - Notifications: Sistema de notificações em tempo real
 * 
 * @component
 */

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Trophy, ShoppingBag, Users, Settings, LogOut, ListOrdered, Book, Brain, Target, Palette } from "lucide-react";
import ModernSealAvatar from "./ModernSealAvatar";
import Notifications from "./Notifications";

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Redireciona para login do Google
 * Constrói URL do backend corretamente e inicia fluxo OAuth
 */
function loginGoogle() {
  // Remove barras finais da URL do backend
  const backendUrl = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8001")
    .replace(/\/+$/, "");
  
  // Garante que /api está presente apenas uma vez
  const apiUrl = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;
  
  // Redireciona para endpoint de autenticação
  window.location.href = `${apiUrl}/auth/google/login`;
  console.log("🔐 Redirecionando para login:", `${apiUrl}/auth/google/login`);
}

// ============================================================
// COMPONENTE PRINCIPAL - HEADER
// ============================================================

/**
 * Header - Barra de navegação principal
 * 
 * @param {Object} userProp - Dados do usuário (opcional, pode ser carregado automaticamente)
 */
export default function Header({ user: userProp }) {
  const navigate = useNavigate();
  
  // ========================================
  // ESTADOS
  // ========================================
  
  /** Dados do usuário autenticado */
  const [user, setUser] = useState(userProp ?? null);
  
  /** Indica se está carregando dados do usuário */
  const [loading, setLoading] = useState(userProp === undefined);
  
  /** Controla visibilidade do menu mobile */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  /** Lista de itens disponíveis na loja */
  const [shopItems, setShopItems] = useState([]);
  
  /** Item de selo atualmente equipado pelo usuário */
  const [equippedSealItem, setEquippedSealItem] = useState(null);

  // ========================================
  // DADOS DERIVADOS
  // ========================================
  
  /** Handle do usuário no formato nickname#tag */
  const handle = user?.nickname && user?.tag ? `${user.nickname}#${user.tag}` : null;
  
  /** Nome de exibição (prioriza handle, depois nome, senão "Usuário") */
  const displayName = handle || user?.name || "Usuário";

  // ========================================
  // EFFECTS - CARREGAMENTO DE DADOS
  // ========================================

  /**
   * Carrega itens da loja para exibir selos equipados
   * Tenta múltiplos endpoints para compatibilidade
   */
  useEffect(() => {
    (async () => {
      try {
        // Tenta diferentes endpoints do backend
        const res = await api.get("/shop/list")
          .catch(() => api.get("/shop/items"))
          .catch(() => api.get("/shop"));
        
        // Normaliza resposta (pode vir em formatos diferentes)
        const items = Array.isArray(res.data) ? res.data : 
                     Array.isArray(res.data?.items) ? res.data.items : 
                     Array.isArray(res.data?.data) ? res.data.data : [];
        
        setShopItems(items);
      } catch (e) {
        console.error("[Header] Erro ao carregar itens:", e);
      }
    })();
  }, []);

  /**
   * Atualiza o selo equipado quando usuário ou itens mudarem
   * Busca o item equipado na lista de itens da loja
   */
  useEffect(() => {
    if (user?.equipped_items?.seal && shopItems.length > 0) {
      const sealItem = shopItems.find(it => it.id === user.equipped_items.seal);
      setEquippedSealItem(sealItem || null);
    } else {
      setEquippedSealItem(null);
    }
  }, [user, shopItems]);

  /**
   * Carrega dados do usuário se não foram passados via props
   * Se userProp está definido, usa ele. Senão, busca do backend.
   */
  useEffect(() => {
    // Se userProp tem dados válidos, usa ele
    if (userProp && userProp.id) {
      setUser(userProp);
      setLoading(false);
      return;
    }
    
    // Senão, busca do backend
    setLoading(true);
    (async () => {
      try {
        const r = await api.get("/auth/me");
        // Backend retorna {ok: true, user: {...}} ou {ok: false, anon: true}
        if (r.data?.ok && r.data?.user) {
          setUser(r.data.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userProp]);

  // ========================================
  // HANDLERS
  // ========================================

  /**
   * Realiza logout do usuário
   * - Chama endpoint de logout no backend
   * - Limpa estado local
   * - Redireciona para página inicial
   */
  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      console.log("✅ Logout bem-sucedido");
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
    }
    
    // Limpa estado local
    setUser(null);
    
    // Força reload completo para limpar TUDO e redirecionar para landing
    window.location.href = "/";
  };

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  // Não renderiza nada enquanto estiver carregando
  if (loading) return null;

  return (
    <header 
      className="bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20 sticky top-0 z-50 shadow-2xl" 
      data-version="4.0"
      data-testid="main-header"
    >
      {/* Container principal */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          
          {/* ==================== LOGO + STATS ==================== */}
          <div className="flex items-center gap-4">
            {/* Logo clicável */}
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 group"
              aria-label="Ir para o painel"
              data-testid="logo-button"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:shadow-cyan-500/50 transition-all group-hover:scale-110">
                <span className="text-white font-black text-lg">P</span>
              </div>
              <span 
                className="hidden sm:block text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 group-hover:from-cyan-300 group-hover:to-blue-300 transition-all"
                style={{ fontFamily: "Space Grotesk, sans-serif" }}
              >
                POMOCICLO
              </span>
            </button>

            {/* Stats compactos (nível e moedas) - Visível apenas em desktop */}
            {user && (
              <div className="hidden md:flex items-center gap-2">
                {/* Nível do usuário */}
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 px-3 py-1.5 rounded-lg app-surface">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-bold">{user.level}</span>
                </div>
                {/* Moedas do usuário */}
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 px-3 py-1.5 rounded-lg app-surface">
                  <span className="text-cyan-200 text-sm font-bold">{user.coins}C$</span>
                </div>
              </div>
            )}
          </div>

          {/* ==================== NAVEGAÇÃO DESKTOP ==================== */}
          {/* Menu horizontal com ícones - Visível apenas em telas grandes */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {/* Agenda */}
            <Link
              to="/agenda"
              className="group relative px-3 py-2 rounded-lg hover:bg-cyan-500/10 transition-all"
              title="Agenda"
              data-testid="nav-agenda"
            >
              <div className="text-2xl group-hover:scale-110 transition-transform">📅</div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Agenda
              </span>
            </Link>
            
            {/* Revisão Hermann (sistema de revisão espaçada) */}
            <Link
              to="/revisao"
              className="group relative px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-all"
              title="Revisão Hermann"
              data-testid="nav-revisao"
            >
              <Brain className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Revisão
              </span>
            </Link>
            
            {/* Hábitos */}
            <Link
              to="/habitos"
              className="group relative px-3 py-2 rounded-lg hover:bg-pink-500/10 transition-all"
              title="Hábitos"
              data-testid="nav-habitos"
            >
              <Target className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Hábitos
              </span>
            </Link>
            
            {/* Financeiro */}
            <Link
              to="/financeiro"
              className="group relative px-3 py-2 rounded-lg hover:bg-green-500/10 transition-all"
              title="Financeiro"
              data-testid="nav-financeiro"
            >
              <div className="text-2xl group-hover:scale-110 transition-transform">💰</div>
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-green-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Financeiro
              </span>
            </Link>

            {/* Rankings */}
            <Link
              to="/rankings"
              className="group relative px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-all"
              title="Rankings"
              data-testid="nav-rankings"
            >
              <Trophy className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Rankings
              </span>
            </Link>

            {/* Devocional */}
            <button
              onClick={() => navigate("/devocional")}
              className="group relative px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-all"
              title="Devocional"
              data-testid="nav-devocional"
            >
              <Book className="w-6 h-6 text-amber-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Devocional
              </span>
            </button>

            {/* Loja */}
            <button
              onClick={() => navigate("/loja")}
              className="group relative px-3 py-2 rounded-lg hover:bg-pink-500/10 transition-all"
              title="Loja"
              data-testid="nav-loja"
            >
              <ShoppingBag className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Loja
              </span>
            </button>

            {/* Grupos */}
            <button
              onClick={() => navigate("/grupos")}
              className="group relative px-3 py-2 rounded-lg hover:bg-blue-500/10 transition-all"
              title="Grupos"
              data-testid="nav-grupos"
            >
              <Users className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Grupos
              </span>
            </button>

            {/* Amigos */}
            <button
              onClick={() => navigate("/amigos")}
              className="group relative px-3 py-2 rounded-lg hover:bg-teal-500/10 transition-all"
              title="Amigos"
              data-testid="nav-amigos"
            >
              <Users className="w-6 h-6 text-teal-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Amigos
              </span>
            </button>

            {/* Aparência */}
            <button
              onClick={() => navigate("/aparencia")}
              className="group relative px-3 py-2 rounded-lg hover:bg-purple-500/10 transition-all"
              title="Aparência"
              data-testid="nav-aparencia"
            >
              <Palette className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Aparência
              </span>
            </button>

            {/* Configurações */}
            <button
              onClick={() => navigate("/configuracoes")}
              className="group relative px-3 py-2 rounded-lg hover:bg-slate-500/10 transition-all"
              title="Configurações"
              data-testid="nav-configuracoes"
            >
              <Settings className="w-6 h-6 text-slate-400 group-hover:scale-110 transition-transform group-hover:rotate-90" />
              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Config
              </span>
            </button>
          </nav>

          {/* ==================== BOTÃO HAMBURGUER MOBILE ==================== */}
          {/* Botão para abrir/fechar menu em telas pequenas */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-all"
            aria-label="Menu"
            data-testid="mobile-menu-toggle"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>

          {/* ==================== ÁREA DE PERFIL ==================== */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Sistema de Notificações */}
                <Notifications user={user} />
                
                {/* Avatar com informações do usuário */}
                <div className="group relative">
                  {/* Avatar clicável */}
                  <div 
                    onClick={() => navigate("/profile")}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-800/50 transition-all cursor-pointer"
                    data-testid="profile-avatar"
                  >
                    <ModernSealAvatar
                      size={36}
                      user={user}
                      item={equippedSealItem}
                    />
                    {/* Nome do usuário (visível apenas em telas maiores) */}
                    <div className="hidden sm:block text-right leading-tight">
                      <div className="text-xs text-cyan-400 font-semibold">{handle || user?.name}</div>
                    </div>
                  </div>
                  
                  {/* Tooltip com informações detalhadas (aparece no hover) */}
                  <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-cyan-500/30 rounded-xl p-3 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all app-surface">
                    <div className="flex items-center gap-2 mb-2">
                      <ModernSealAvatar
                        size={40}
                        user={user}
                        item={equippedSealItem}
                      />
                      <div>
                        <div className="text-sm font-bold text-white">{user?.name}</div>
                        <div className="text-xs text-cyan-400">{handle}</div>
                      </div>
                    </div>
                    {/* Stats completos no tooltip */}
                    <div className="flex items-center justify-between text-xs border-t border-slate-700 pt-2 mt-2">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3 h-3 text-amber-400" />
                        <span className="text-amber-200">Nv {user.level}</span>
                      </div>
                      <div className="text-cyan-200">{user.coins} C$</div>
                    </div>
                  </div>
                </div>

                {/* Botão de Logout */}
                <button
                  data-testid="logout-button"
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all group"
                  title="Sair"
                >
                  <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </>
            ) : (
              /* Botão de Login (usuário não autenticado) */
              <Button 
                onClick={loginGoogle} 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-4 py-2 rounded-lg shadow-lg hover:shadow-indigo-500/50 transition-all text-sm"
                data-testid="login-button"
              >
                🔐 Entrar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Linha decorativa animada */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>

      {/* ==================== MENU MOBILE (DROPDOWN) ==================== */}
      {/* Exibido apenas quando mobileMenuOpen === true */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900/98 backdrop-blur-xl border-b border-cyan-500/20 shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
            {/* Stats do usuário no mobile */}
            {user && (
              <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-700">
                {/* Nível */}
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-400/30 px-3 py-1.5 rounded-lg flex-1 justify-center app-surface">
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-200 text-sm font-bold">Nível {user.level}</span>
                </div>
                {/* Moedas */}
                <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-400/30 px-3 py-1.5 rounded-lg flex-1 justify-center app-surface">
                  <span className="text-cyan-200 text-sm font-bold">{user.coins} C$</span>
                </div>
              </div>
            )}

            {/* Links de navegação mobile */}
            <Link
              to="/agenda"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-cyan-500/10 transition-all text-white"
              data-testid="mobile-nav-agenda"
            >
              <span className="text-2xl">📅</span>
              <span className="font-semibold">Agenda</span>
            </Link>

            <Link
              to="/revisao"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-500/10 transition-all text-white"
              data-testid="mobile-nav-revisao"
            >
              <Brain className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Revisão Hermann</span>
            </Link>

            <Link
              to="/habitos"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-500/10 transition-all text-white"
              data-testid="mobile-nav-habitos"
            >
              <Target className="w-6 h-6 text-pink-400" />
              <span className="font-semibold">Hábitos</span>
            </Link>

            <Link
              to="/financeiro"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-500/10 transition-all text-white"
              data-testid="mobile-nav-financeiro"
            >
              <span className="text-2xl">💰</span>
              <span className="font-semibold">Financeiro</span>
            </Link>

            <Link
              to="/rankings"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-500/10 transition-all text-white"
              data-testid="mobile-nav-rankings"
            >
              <Trophy className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Rankings</span>
            </Link>

            <button
              onClick={() => { navigate("/devocional"); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-amber-500/10 transition-all text-white"
              data-testid="mobile-nav-devocional"
            >
              <Book className="w-6 h-6 text-amber-400" />
              <span className="font-semibold">Devocional</span>
            </button>

            <button
              onClick={() => { navigate("/loja"); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-pink-500/10 transition-all text-white"
              data-testid="mobile-nav-loja"
            >
              <ShoppingBag className="w-6 h-6 text-pink-400" />
              <span className="font-semibold">Loja</span>
            </button>

            <button
              onClick={() => { navigate("/grupos"); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-500/10 transition-all text-white"
              data-testid="mobile-nav-grupos"
            >
              <Users className="w-6 h-6 text-blue-400" />
              <span className="font-semibold">Grupos</span>
            </button>

            <button
              onClick={() => { navigate("/amigos"); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-teal-500/10 transition-all text-white"
              data-testid="mobile-nav-amigos"
            >
              <Users className="w-6 h-6 text-teal-400" />
              <span className="font-semibold">Amigos</span>
            </button>

            <button
              onClick={() => { navigate("/aparencia"); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-purple-500/10 transition-all text-white"
              data-testid="mobile-nav-aparencia"
            >
              <Palette className="w-6 h-6 text-purple-400" />
              <span className="font-semibold">Aparência</span>
            </button>

            <button
              onClick={() => { navigate("/configuracoes"); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-500/10 transition-all text-white"
              data-testid="mobile-nav-configuracoes"
            >
              <Settings className="w-6 h-6 text-slate-400" />
              <span className="font-semibold">Configurações</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
