import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermosDeUso() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Botão Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Cabeçalho */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Termos de Uso
          </h1>
          <p className="text-gray-400">Última atualização: Janeiro de 2025</p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">1. Aceitação dos Termos</h2>
            <p className="text-gray-300 leading-relaxed">
              Ao acessar e usar o Pomociclo, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deverá usar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">2. Descrição do Serviço</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              O Pomociclo é uma plataforma de produtividade baseada na técnica Pomodoro que oferece:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Timer de estudos com sistema de blocos e pausas</li>
              <li>Rastreamento de progresso e estatísticas</li>
              <li>Sistema de recompensas (coins e XP)</li>
              <li>Funcionalidades sociais (amigos e grupos)</li>
              <li>Loja virtual de personalização</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. Conta de Usuário</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Para usar o Pomociclo, você deve:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Criar uma conta usando autenticação do Google</li>
              <li>Fornecer informações verdadeiras e precisas</li>
              <li>Manter a segurança de sua conta</li>
              <li>Não compartilhar suas credenciais com terceiros</li>
              <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">4. Conduta do Usuário</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Você concorda em NÃO:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Usar o serviço para qualquer propósito ilegal</li>
              <li>Tentar acessar áreas restritas do sistema</li>
              <li>Interferir no funcionamento normal do serviço</li>
              <li>Usar bots ou automação para manipular recompensas</li>
              <li>Assediar, intimidar ou prejudicar outros usuários</li>
              <li>Usar linguagem ofensiva ou inadequada</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">5. Moeda Virtual e Recompensas</h2>
            <p className="text-gray-300 leading-relaxed">
              Os "coins" e "XP" são moedas virtuais sem valor monetário real. Eles são concedidos como parte 
              do sistema de gamificação e podem ser usados exclusivamente dentro da plataforma para personalização 
              e desbloqueio de recursos. A Pomociclo reserva-se o direito de ajustar valores e recompensas a qualquer momento.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">6. Propriedade Intelectual</h2>
            <p className="text-gray-300 leading-relaxed">
              Todo o conteúdo, design, código, logos e materiais do Pomociclo são propriedade exclusiva da plataforma 
              e protegidos por leis de direitos autorais. Você não pode copiar, modificar, distribuir ou reproduzir 
              qualquer parte do serviço sem autorização prévia por escrito.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">7. Suspensão e Término</h2>
            <p className="text-gray-300 leading-relaxed">
              Reservamo-nos o direito de suspender ou encerrar sua conta a qualquer momento, sem aviso prévio, 
              caso você viole estes Termos de Uso ou por qualquer outra razão que consideremos apropriada. 
              Você pode encerrar sua conta a qualquer momento através das configurações do perfil.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">8. Limitação de Responsabilidade</h2>
            <p className="text-gray-300 leading-relaxed">
              O Pomociclo é fornecido "como está" sem garantias de qualquer tipo. Não nos responsabilizamos por:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-3">
              <li>Perda de dados ou progresso</li>
              <li>Interrupções ou indisponibilidade do serviço</li>
              <li>Danos indiretos ou consequenciais</li>
              <li>Uso indevido por terceiros</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">9. Modificações dos Termos</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos atualizar estes Termos de Uso periodicamente. Mudanças significativas serão notificadas através 
              da plataforma. O uso continuado do serviço após as alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">10. Contato</h2>
            <p className="text-gray-300 leading-relaxed">
              Para questões sobre estes Termos de Uso, entre em contato através de nossos canais de suporte 
              na seção Comunidade.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
