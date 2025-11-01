import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import Footer from "../components/Footer";
import { 
  Clock, Target, Trophy, Users, Sparkles, Zap, Heart, Star, 
  BookOpen, Calendar, Award, TrendingUp, Flame, Gift, 
  Shield, Repeat, CheckCircle, Brain, Coffee, Timer,
  ListChecks, BarChart3, Coins, Crown, Gem
} from "lucide-react";
import AnimatedBackground from "../components/AnimatedBackground";
import { api } from "@/lib/api";

function loginGoogle() {
  const isDev = location.hostname === "localhost" || location.hostname === "127.0.0.1";
  if (isDev) {
    window.location.assign("/api/auth/google/login");
    return;
  }
  const backend = (import.meta.env?.VITE_BACKEND_URL || process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/,"");
  window.location.assign(`${backend}/api/auth/google/login`);
}

export default function Sobre() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="relative z-10 border-b border-cyan-500/20 bg-slate-900/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/")}
          >
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

      <div className="relative z-10 container mx-auto px-4 py-12">
        
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30 backdrop-blur-sm mb-8">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-200 text-sm font-semibold">Transforme seus estudos em uma jornada épica</span>
          </div>

          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              O Que É o Pomociclo?
            </span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-4 leading-relaxed">
            Cansado de cronogramas rígidos que não funcionam? Estudar não precisa ser uma batalha perdida.
          </p>
          
          <p className="text-lg text-gray-400 leading-relaxed">
            O <strong className="text-cyan-400">Pomociclo</strong> é uma plataforma completa que combina <strong>técnica Pomodoro</strong>, 
            <strong className="text-cyan-400"> gamificação envolvente</strong> e <strong>ciclos flexíveis</strong> para transformar 
            seus estudos em uma experiência produtiva, motivadora e — acredite — até divertida! 🎮📚
          </p>
        </section>

        {/* O Problema */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-3xl p-8 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                  <Flame className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-3xl font-black text-white">O Problema Que Você Conhece Bem</h2>
              </div>
              
              <div className="space-y-3 text-gray-300">
                <p className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">❌</span>
                  <span>Cronogramas fixos que <strong>não respeitam seu ritmo</strong></span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">❌</span>
                  <span>Falta de <strong>motivação</strong> para manter a constância</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">❌</span>
                  <span><strong>Procrastinação</strong> que devora seu tempo</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">❌</span>
                  <span>Estudar sozinho sem saber se está <strong>no caminho certo</strong></span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-red-400 mt-1">❌</span>
                  <span>Perder a conta de <strong>quanto tempo realmente estudou</strong></span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* A Solução */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              <span className="bg-gradient-to-r from-green-400 to-cyan-400 bg-clip-text text-transparent">
                A Solução: Pomociclo
              </span>
            </h2>
            <p className="text-xl text-gray-400">Uma plataforma completa pensada para <strong className="text-cyan-400">estudantes reais</strong></p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Card 1: Timer Pomodoro */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-cyan-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-red-500/50 transition-all duration-300 group-hover:scale-110">
                  <Timer className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Timer Pomodoro Completo</h3>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                Use a técnica comprovada de estudos com intervalos:
              </p>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                  <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                  <span className="text-gray-300"><strong className="text-white">50 minutos</strong> de foco intenso</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                  <Coffee className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-gray-300"><strong className="text-white">10 minutos</strong> de pausa curta</span>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-700/30">
                  <Repeat className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span className="text-gray-300"><strong className="text-white">30 minutos</strong> de pausa longa a cada 4 ciclos</span>
                </div>
              </div>
              
              <p className="text-gray-400 text-sm mt-4 italic">
                💡 Totalmente personalizável! Configure os tempos do seu jeito.
              </p>
            </div>

            {/* Card 2: Ciclos Flexíveis */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-110">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Ciclos Semanais Flexíveis</h3>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                Esqueça cronogramas rígidos! No Pomociclo você:
              </p>
              
              <div className="space-y-2 text-gray-300">
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Define <strong className="text-white">metas semanais</strong> para cada matéria</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Estuda <strong className="text-white">quando quiser</strong>, no seu ritmo</span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Completa 100% da meta para <strong className="text-white">fechar o ciclo</strong></span>
                </p>
                <p className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Recomeça toda semana com <strong className="text-white">metas renovadas</strong></span>
                </p>
              </div>
              
              <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-blue-300 text-sm">
                  <strong>Exemplo:</strong> Matemática 5h, Física 3h, Português 2h → Estude no ritmo que funciona pra você!
                </p>
              </div>
            </div>

            {/* Card 3: Gamificação */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-amber-500/50 transition-all duration-300 group-hover:scale-110">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Sistema de Gamificação</h3>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                Transforme seus estudos em uma <strong className="text-amber-400">aventura épica</strong>:
              </p>
              
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <Star className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">XP</div>
                  <div className="text-xs text-gray-400">Experiência a cada estudo</div>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">Níveis</div>
                  <div className="text-xs text-gray-400">Suba de nível estudando</div>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <Coins className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">Coins</div>
                  <div className="text-xs text-gray-400">Moedas para gastar</div>
                </div>
                
                <div className="p-4 rounded-xl bg-slate-700/30 text-center">
                  <Gift className="w-8 h-8 text-pink-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white mb-1">Loja</div>
                  <div className="text-xs text-gray-400">Itens cosméticos</div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <p className="text-purple-300 text-sm">
                  🎨 Personalize seu perfil com <strong>selos</strong>, <strong>bordas</strong> e <strong>temas</strong> exclusivos!
                </p>
              </div>
            </div>

            {/* Card 4: Social */}
            <div className="group p-8 rounded-3xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-green-500/20 backdrop-blur-sm hover:border-green-500/50 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:shadow-green-500/50 transition-all duration-300 group-hover:scale-110">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-white">Recursos Sociais</h3>
              </div>
              
              <p className="text-gray-300 mb-4 leading-relaxed">
                Estude melhor em <strong className="text-green-400">comunidade</strong>:
              </p>
              
              <div className="space-y-2 text-gray-300">
                <p className="flex items-start gap-2">
                  <Heart className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Amigos:</strong> Adicione e acompanhe o progresso deles</span>
                </p>
                <p className="flex items-start gap-2">
                  <Users className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Grupos:</strong> Crie ou entre em grupos de estudo</span>
                </p>
                <p className="flex items-start gap-2">
                  <Crown className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Rankings:</strong> Compita de forma saudável e divertida</span>
                </p>
                <p className="flex items-start gap-2">
                  <Shield className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Presença:</strong> Veja quem está online estudando agora</span>
                </p>
              </div>
              
              <div className="mt-4 p-3 rounded-xl bg-green-500/10">
                <p className="text-green-300 text-sm">
                  💪 A motivação aumenta quando você estuda com outras pessoas!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recursos Adicionais */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                E Tem Muito Mais!
              </span>
            </h2>
            <p className="text-xl text-gray-400">Ferramentas completas para sua <strong className="text-purple-400">produtividade</strong></p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Quests Semanais */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-purple-500/20 backdrop-blur-sm hover:border-purple-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
                <ListChecks className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Quests Semanais</h3>
              <p className="text-gray-400 text-sm">
                Missões personalizadas toda semana com recompensas de XP e coins. Mantenha a motivação sempre alta!
              </p>
            </div>

            {/* Agenda */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-blue-500/20 backdrop-blur-sm hover:border-blue-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <Calendar className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Agenda & Calendário</h3>
              <p className="text-gray-400 text-sm">
                Organize seus eventos, aulas e revisões. Eventos completados automaticamente quando você estuda!
              </p>
            </div>

            {/* Sistema de Revisão */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Sistema de Revisão</h3>
              <p className="text-gray-400 text-sm">
                Gerencie suas revisões com repetição espaçada. Nunca mais esqueça o que estudou!
              </p>
            </div>

            {/* Hábitos */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-green-500/20 backdrop-blur-sm hover:border-green-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Rastreador de Hábitos</h3>
              <p className="text-gray-400 text-sm">
                Construa e acompanhe hábitos saudáveis além dos estudos. Corpo são, mente sã!
              </p>
            </div>

            {/* Estatísticas */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-amber-500/20 backdrop-blur-sm hover:border-amber-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Estatísticas Detalhadas</h3>
              <p className="text-gray-400 text-sm">
                Visualize seu progresso com gráficos e mapas de calor. Dados que motivam!
              </p>
            </div>

            {/* Personalização */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-pink-500/20 backdrop-blur-sm hover:border-pink-500/40 transition-all">
              <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-4">
                <Gem className="w-6 h-6 text-pink-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Totalmente Personalizável</h3>
              <p className="text-gray-400 text-sm">
                Tempos do timer, cores, temas visuais — ajuste tudo do seu jeito!
              </p>
            </div>
          </div>
        </section>

        {/* Como Funciona - Passo a Passo */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Como Começar em 4 Passos
              </span>
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {/* Passo 1 */}
            <div className="flex items-start gap-6 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg text-xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Faça Login com Google</h3>
                <p className="text-gray-400">
                  Rápido, seguro e sem complicação. Em segundos você está dentro!
                </p>
              </div>
            </div>

            {/* Passo 2 */}
            <div className="flex items-start gap-6 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg text-xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Configure Suas Matérias</h3>
                <p className="text-gray-400">
                  Adicione as disciplinas que está estudando e defina metas semanais realistas para cada uma.
                </p>
              </div>
            </div>

            {/* Passo 3 */}
            <div className="flex items-start gap-6 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg text-xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Inicie o Timer Pomodoro</h3>
                <p className="text-gray-400">
                  Escolha uma matéria, clique em Play e mergulhe em 50 minutos de foco total. O timer cuida do resto!
                </p>
              </div>
            </div>

            {/* Passo 4 */}
            <div className="flex items-start gap-6 p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/20 backdrop-blur-sm hover:border-cyan-500/40 transition-all">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center font-bold text-white shadow-lg text-xl">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">Ganhe Recompensas e Complete Ciclos</h3>
                <p className="text-gray-400">
                  A cada sessão, ganhe XP e coins. Complete 100% das suas metas semanais e feche o ciclo com grandes bônus!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Por Que Funciona */}
        <section className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-3xl p-10 backdrop-blur-sm">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 mb-4 shadow-lg shadow-cyan-500/50">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-black text-white mb-3">Por Que o Pomociclo Funciona?</h2>
                <p className="text-cyan-300 text-lg">Baseado em ciência e psicologia comportamental</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Técnica Pomodoro Comprovada</h4>
                      <p className="text-gray-400 text-sm">Melhora foco e previne burnout com pausas estratégicas</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Gamificação que Motiva</h4>
                      <p className="text-gray-400 text-sm">Recompensas ativam dopamina, criando hábitos positivos</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Flexibilidade Real</h4>
                      <p className="text-gray-400 text-sm">Respeita seu ritmo e evita culpa de cronogramas quebrados</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">Efeito Comunidade</h4>
                      <p className="text-gray-400 text-sm">Responsabilidade social aumenta consistência</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final - Super Persuasivo */}
        <section className="max-w-5xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600/20 via-blue-600/20 to-purple-600/20 border border-cyan-500/30 backdrop-blur-xl p-12 text-center">
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse" />
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-6">
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
                <Star className="w-10 h-10 text-yellow-400" />
                <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
              </div>
              
              <h2 className="text-4xl md:text-5xl font-black mb-4">
                <span className="bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                  Pronto Para Transformar Seus Estudos?
                </span>
              </h2>
              
              <p className="text-xl text-gray-200 mb-3">
                Junte-se a <strong className="text-cyan-400">centenas de estudantes</strong> que já estudam melhor com o Pomociclo
              </p>
              
              <p className="text-lg text-gray-300 mb-8">
                100% gratuito. Sem truques. Só resultados reais. 🚀
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button
                  onClick={loginGoogle}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold px-12 py-6 text-xl rounded-2xl shadow-2xl shadow-cyan-500/50 hover:shadow-cyan-500/80 transition-all duration-300 hover:scale-110 group"
                >
                  <Zap className="w-6 h-6 mr-2 group-hover:animate-pulse" />
                  Começar Agora - É Grátis!
                </Button>
                
                <Button
                  onClick={() => navigate("/")}
                  size="lg"
                  variant="outline"
                  className="border-cyan-500/50 text-cyan-200 hover:bg-cyan-500/20 hover:text-white px-8 py-6 text-lg rounded-2xl transition-all duration-300"
                >
                  Voltar ao Início
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-8 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Sem cartão de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Login em 10 segundos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span>Comece hoje mesmo</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
