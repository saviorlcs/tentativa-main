import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TecnicaPomodoro() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Técnica Pomodoro
          </h1>
          <p className="text-gray-400">Método de gerenciamento de tempo comprovado</p>
        </div>

        <div className="space-y-8 bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">O que é a Técnica Pomodoro?</h2>
            <p className="text-gray-300 leading-relaxed">
              Desenvolvida por Francesco Cirillo no final dos anos 80, a Técnica Pomodoro é um método de 
              gerenciamento de tempo que utiliza um timer para dividir o trabalho em intervalos tradicionalmente 
              de 25 minutos, separados por breves pausas. Cada intervalo é conhecido como um "pomodoro", da 
              palavra italiana para tomate, em referência ao timer de cozinha em forma de tomate que Cirillo usava.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Como Funciona?</h2>
            <div className="space-y-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-cyan-400">
                <h3 className="text-lg font-semibold text-white mb-2">1. Escolha uma tarefa</h3>
                <p className="text-gray-300">Selecione a matéria ou atividade que deseja trabalhar.</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-blue-400">
                <h3 className="text-lg font-semibold text-white mb-2">2. Configure o timer</h3>
                <p className="text-gray-300">Ajuste para 25 minutos (ou sua preferência) e inicie o foco.</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-purple-400">
                <h3 className="text-lg font-semibold text-white mb-2">3. Trabalhe sem interrupções</h3>
                <p className="text-gray-300">Concentre-se completamente na tarefa até o timer tocar.</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-green-400">
                <h3 className="text-lg font-semibold text-white mb-2">4. Faça uma pausa curta</h3>
                <p className="text-gray-300">Descanse por 5-10 minutos. Afaste-se da tela!</p>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-4 border-l-4 border-amber-400">
                <h3 className="text-lg font-semibold text-white mb-2">5. Repita o ciclo</h3>
                <p className="text-gray-300">A cada 4 pomodoros, faça uma pausa mais longa (15-30 minutos).</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Benefícios da Técnica</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <li className="bg-slate-900/30 rounded-lg p-4">
                <div className="text-cyan-400 font-semibold mb-1">🎯 Foco Intenso</div>
                <p className="text-gray-300 text-sm">Elimina distrações e aumenta a concentração</p>
              </li>
              <li className="bg-slate-900/30 rounded-lg p-4">
                <div className="text-cyan-400 font-semibold mb-1">⏱️ Gestão de Tempo</div>
                <p className="text-gray-300 text-sm">Ajuda a estimar quanto tempo tarefas levam</p>
              </li>
              <li className="bg-slate-900/30 rounded-lg p-4">
                <div className="text-cyan-400 font-semibold mb-1">💪 Combate Procrastinação</div>
                <p className="text-gray-300 text-sm">Intervalos curtos tornam tarefas menos intimidadoras</p>
              </li>
              <li className="bg-slate-900/30 rounded-lg p-4">
                <div className="text-cyan-400 font-semibold mb-1">🧠 Previne Fadiga Mental</div>
                <p className="text-gray-300 text-sm">Pausas regulares mantm a mente fresca</p>
              </li>
              <li className="bg-slate-900/30 rounded-lg p-4">
                <div className="text-cyan-400 font-semibold mb-1">📈 Rastreamento de Progresso</div>
                <p className="text-gray-300 text-sm">Visualize quanto você realmente estudou</p>
              </li>
              <li className="bg-slate-900/30 rounded-lg p-4">
                <div className="text-cyan-400 font-semibold mb-1">⚖️ Equilíbrio Saudável</div>
                <p className="text-gray-300 text-sm">Força pausas para descanso e recuperação</p>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Dicas para Maximizar Resultados</h2>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Planeje seus pomodoros no início do dia</li>
              <li>Elimine todas as distrações antes de começar</li>
              <li>Se uma tarefa requer mais de 5-7 pomodoros, divida-a</li>
              <li>Use as pausas para movimento físico (alongamento, caminhar)</li>
              <li>Registre interrupções e retome o foco após gerê-las</li>
              <li>Ajuste os tempos à sua preferência (50/10, 45/15, etc.)</li>
              <li>Não pule as pausas - elas são essenciais!</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">Como o Pomociclo Ajuda?</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              O Pomociclo implementa a Técnica Pomodoro com recursos modernos:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Timer customizável com notificações</li>
              <li>Rastreamento automático de progresso por matéria</li>
              <li>Sistema de recompensas para motivação</li>
              <li>Estatísticas detalhadas e calendário de consistência</li>
              <li>Grupos de estudos para responsabilidade social</li>
              <li>Sincronização entre dispositivos</li>
            </ul>
          </section>

          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl p-6 mt-8">
            <p className="text-center text-gray-300 text-lg">
              <span className="text-2xl">🍅</span> Pronto para começar? Experimente seu primeiro pomodoro hoje!
            </p>
            <div className="text-center mt-4">
              <Button
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold px-8 py-3 rounded-xl"
              >
                Iniciar Agora
              </Button>
            </div>
          </div>

        </div>
      </div>

      <Footer />
    </div>
  );
}
