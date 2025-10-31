import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import { Trophy, ShoppingBag, Users, Settings, LogOut, Menu, X, Calendar, Award } from "lucide-react";
import SealAvatar from "./SealAvatar";
import ModernSealAvatar from "./ModernSealAvatar.jsx";
function loginGoogle() {
  const backendUrl = (process.env.REACT_APP_BACKEND_URL || "http://localhost:8001")
    .replace(/\/+$/, "");
  const apiUrl = backendUrl.endsWith('/api') ? backendUrl : `${backendUrl}/api`;
  window.location.href = `${apiUrl}/auth/google/login`;
  console.log("🔐 Redirecionando para login:", `${apiUrl}/auth/google/login`);
}

export default function HeaderNew({ user: userProp }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(userProp ?? null);
  const [loading, setLoading] = useState(userProp === undefined);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handle = user?.nickname && user?.tag ? `${user.nickname}#${user.tag}` : null;

  useEffect(() => {
    if (userProp && userProp.id) {
      setUser(userProp);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    (async () => {
      try {
        const r = await api.get("/auth/me");
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

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
      console.log("✅ Logout bem-sucedido");
    } catch (e) {
      console.error("Erro ao fazer logout:", e);
    }
    
    setUser(null);
    window.location.href = "/";
  };

  if (loading) return null;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-cyan-500/20 shadow-2xl shadow-cyan-500/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/dashboard")}
                className="group flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50 group-hover:shadow-cyan-500/80 transition-all duration-300 group-hover:scale-110">
                  <span className="text-2xl">🍅</span>
                </div>
                <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:via-blue-300 group-hover:to-cyan-300 transition-all duration-300">
                  Pomociclo
                </span>
              </button>

              {user && (
                <div className="hidden lg:flex items-center gap-3 ml-4">
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30 backdrop-blur-sm app-surface">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-400" />
                      <span className="text-amber-100 font-bold text-sm">Nível {user.level}</span>
                    </div>
                  </div>
                  
                  <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 backdrop-blur-sm app-surface">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl text-blue-400">💰</span>
                      <span className="text-blue-100 font-bold text-sm">{user.coins} C$</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-2">
              <Link
                to="/agenda"
                className="px-4 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Agenda
              </Link>
              
              <Link
                to="/rankings"
                className="px-4 py-2 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <Award className="w-4 h-4 inline mr-2" />
                Rankings
              </Link>
              
              <button
                onClick={() => navigate("/loja")}
                className="px-4 py-2 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <ShoppingBag className="w-4 h-4 inline mr-2" />
                Loja
              </button>
              
              <button
                onClick={() => navigate("/grupos")}
                className="px-4 py-2 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Grupos
              </button>
              
              <button
                onClick={() => navigate("/amigos")}
                className="px-4 py-2 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Amigos
              </button>
              
              <button
                onClick={() => navigate("/configuracoes")}
                className="p-2 rounded-xl text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <Settings className="w-5 h-5" />
              </button>
            </nav>

            {/* User Profile / Login */}
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/50 border border-cyan-500/30 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 app-surface">
                    <SealAvatar
                      size={36}
                      user={user}
                      item={user?.equipped_items?.seal}
                    />
                    <div className="leading-tight">
                      <div className="text-xs font-semibold text-cyan-300">{handle || "—"}</div>
                      <div className="text-white font-bold text-sm">{user?.name || "Usuário"}</div>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-red-500/20 border border-transparent hover:border-red-500/40 transition-all duration-300 group app-surface"
                    title="Sair"
                  >
                    <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </button>
                </>
              ) : (
                <Button 
                  onClick={loginGoogle} 
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
                >
                  🔐 Entrar com Google
                </Button>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-cyan-500/20 bg-slate-900/95 backdrop-blur-xl">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
              <Link
                to="/agenda"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 transition-all duration-300"
              >
                <Calendar className="w-4 h-4 inline mr-2" />
                Agenda
              </Link>
              
              <Link
                to="/rankings"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-3 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300"
              >
                <Award className="w-4 h-4 inline mr-2" />
                Rankings
              </Link>
              
              <button
                onClick={() => { navigate("/loja"); setMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300 text-left"
              >
                <ShoppingBag className="w-4 h-4 inline mr-2" />
                Loja
              </button>
              
              <button
                onClick={() => { navigate("/grupos"); setMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300 text-left"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Grupos
              </button>
              
              <button
                onClick={() => { navigate("/amigos"); setMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300 text-left"
              >
                <Users className="w-4 h-4 inline mr-2" />
                Amigos
              </button>
              
              <button
                onClick={() => { navigate("/configuracoes"); setMobileMenuOpen(false); }}
                className="px-4 py-3 rounded-xl font-semibold text-cyan-200 hover:text-white hover:bg-slate-800/50 transition-all duration-300 text-left"
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Configurações
              </button>
            </nav>
          </div>
        )}
      </header>
      
      {/* Spacer para compensar o header fixo */}
      <div className="h-20"></div>
    </>
  );
}
