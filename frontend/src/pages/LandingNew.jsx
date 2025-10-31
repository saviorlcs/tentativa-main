import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Clock, Target, Trophy, Users, Sparkles, Zap, Heart, Star } from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";

// src/pages/LandingNew.jsx (ou Landing.js)
import { api } from "@/lib/api";

function loginGoogle() {
  const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (isDev) {
    window.location.assign("/api/auth/google/login"); // proxy
    return;
  }
  // produção: monte com seu domínio do backend
  const backend = (import.meta.env?.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/,"");
  window.location.assign(`${backend}/api/auth/google/login`);
}

// use <Button onClick={loginGoogle}>Entrar com Google</Button>

export default function LandingNew() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50">
              <span className="text-2xl">🍅</span>
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Pomociclo
            </span>
          </div>
          
          <Button 
            onClick={loginGoogle}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-cyan-500/50 transition-all duration-300 hover:scale-105"
          >
            🔐 Entrar com Google
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm mb-8 animate-in fade-in slide-in-from-top duration-700">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-200 text-sm font-semibold">Estude de forma inteligente, não cansativa</span>
          </div>

          {/* Title */}
          <h1 className="text-6xl md:text-7xl font-black mb-6 animate-in fade-in slide-in-from-bottom duration-700 delay-100">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Pomociclo
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-4 animate-in fade-in slide-in-from-bottom duration-700 delay-200">
            Aprenda sem cronogramas rígidos.
          </p>
          
          <p className="text-lg text-gray-400 mb-12 animate-in fade-in slide-in-from-bottom duration-700 delay-300">
            Use ciclos de estudo flexíveis com Pomodoro integrado. <br />
            Gamificação, XP, níveis e muito mais!
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-in fade-in slide-in-from-bottom duration-700 delay-400">
            <Button
              onClick={loginGoogle}
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/80 transition-all duration-300 hover:scale-105"
            >
              <Zap className="w-5 h-5 mr-2" />
              Começar Gratuitamente
            </Button>
            
            <Button
              onClick={() => navigate("/sobre")}
              size="lg"
              variant="outline"
              className="border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/20 hover:text-white px-8 py-6 text-lg rounded-2xl transition-all duration-300 hover:scale-105"
            >
              Saiba Mais
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-in fade-in zoom-in duration-700 delay-500">
            <div className="text-center">
              <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                100%
              </div>
              <div className="text-sm text-gray-400">Gratuito</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                50:10
              </div>
              <div className="text-sm text-gray-400">Pomodoro</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
                ∞
              </div>
              <div className="text-sm text-gray-400">Ciclos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <h2 className="text-4xl font-black text-center mb-16">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Por que Pomociclo?
          </span>
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Feature 1 */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300 group-hover:scale-110">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pomodoro Timer</h3>
            <p className="text-gray-400 text-sm">
              Técnica comprovada de estudos com intervalos configuráveis (padrão 50:10)
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-cyan-500/50 transition-all duration-300 group-hover:scale-110">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Ciclos Flexíveis</h3>
            <p className="text-gray-400 text-sm">
              Meta semanal sem cronogramas rígidos. Estude no seu ritmo!
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-amber-500/50 transition-all duration-300 group-hover:scale-110">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Gamificação</h3>
            <p className="text-gray-400 text-sm">
              Ganhe XP, suba de nível, conquiste coins e desbloqueie itens
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group p-6 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mb-4 shadow-lg group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-110">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Social</h3>
            <p className="text-gray-400 text-sm">
              Amigos, grupos, rankings e compita de forma saudável
            </p>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <h2 className="text-4xl font-black text-center mb-16">
          <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Como Funciona?
          </span>
        </h2>

        <div className="max-w-3xl mx-auto space-y-8">
          <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
              1
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Defina suas matérias</h3>
              <p className="text-gray-400">
                Adicione as matérias que quer estudar e defina uma meta semanal para cada uma
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
              2
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Estude com Pomodoro</h3>
              <p className="text-gray-400">
                Use o timer integrado (50 min estudo + 10 min pausa) para estudar de forma eficiente
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
              3
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Ganhe recompensas</h3>
              <p className="text-gray-400">
                A cada sessão concluída, ganhe XP, coins e suba de nível. Desbloqueie itens na loja!
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all duration-300">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg">
              4
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Complete seus ciclos</h3>
              <p className="text-gray-400">
                Ao atingir 100% da sua meta semanal, complete o ciclo e comece outro!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center p-12 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/30 backdrop-blur-xl shadow-2xl shadow-cyan-500/20">
          <Star className="w-16 h-16 mx-auto mb-6 text-yellow-400 animate-pulse" />
          <h2 className="text-4xl font-black mb-6">
            <span className="bg-gradient-to-r from-cyan-300 to-blue-300 bg-clip-text text-transparent">
              Pronto para Estudar Melhor?
            </span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se a centenas de estudantes que já melhoraram seus estudos com o Pomociclo
          </p>
          
          <Button
            onClick={loginGoogle}
            size="lg"
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-12 py-6 text-xl rounded-2xl shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/80 transition-all duration-300 hover:scale-110"
          >
            <Heart className="w-6 h-6 mr-2" />
            Começar Agora - É Grátis!
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl py-8">
        <div className="container mx-auto px-4 text-center text-gray-400 text-sm">
          <p>© 2025 Pomociclo. Feito com 💙 para estudantes.</p>
        </div>
      </footer>
    </div>
  );
}
