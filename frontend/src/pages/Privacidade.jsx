import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Privacidade() {
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
            Política de Privacidade
          </h1>
          <p className="text-gray-400">Última atualização: Janeiro de 2025</p>
        </div>

        {/* Conteúdo */}
        <div className="space-y-8 bg-slate-800/50 rounded-2xl p-8 border border-slate-700">
          
          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">1. Informações que Coletamos</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Ao usar o Pomociclo, coletamos os seguintes dados:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Informações de Conta:</strong> Nome, email e foto de perfil (via Google OAuth)</li>
              <li><strong>Dados de Uso:</strong> Sessões de estudo, tempo focado, matérias estudadas</li>
              <li><strong>Progresso:</strong> Coins, XP, níveis, conquistas e estatísticas</li>
              <li><strong>Dados Sociais:</strong> Amigos, grupos, preferências de privacidade</li>
              <li><strong>Preferências:</strong> Configurações de timer, temas e personalização</li>
              <li><strong>Dados Técnicos:</strong> Endereço IP, tipo de navegador, logs de acesso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">2. Como Usamos Suas Informações</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Utilizamos seus dados para:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Personalizar sua experiência na plataforma</li>
              <li>Calcular e exibir estatísticas de progresso</li>
              <li>Facilitar interações sociais (amigos, grupos, rankings)</li>
              <li>Enviar notificações relevantes sobre seu progresso</li>
              <li>Detectar e prevenir fraudes ou abusos</li>
              <li>Analisar o uso da plataforma para melhorias</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">3. Compartilhamento de Dados</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Nós NÃO vendemos seus dados pessoais. Podemos compartilhar informações limitadas apenas nas seguintes situações:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Com Outros Usuários:</strong> Nickname, nível e status de presença (quando você adiciona amigos ou participa de grupos)</li>
              <li><strong>Serviços de Terceiros:</strong> Google (para autenticação), serviços de hospedagem (banco de dados)</li>
              <li><strong>Requisitos Legais:</strong> Quando exigido por lei ou para proteger nossos direitos</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">4. Cookies e Tecnologias Similares</h2>
            <p className="text-gray-300 leading-relaxed">
              Utilizamos cookies essenciais para:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-3">
              <li>Manter sua sessão ativa (session_token)</li>
              <li>Proteger contra ataques CSRF (csrf_token)</li>
              <li>Salvar preferências de tema e configurações</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Você pode desabilitar cookies nas configurações do navegador, mas isso pode afetar a funcionalidade do site.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">5. Segurança dos Dados</h2>
            <p className="text-gray-300 leading-relaxed">
              Implementamos medidas de segurança para proteger seus dados, incluindo:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4 mt-3">
              <li>Criptografia HTTPS para todas as comunicações</li>
              <li>Tokens JWT para autenticação segura</li>
              <li>Proteção contra ataques CSRF e XSS</li>
              <li>Rate limiting para prevenir abusos</li>
              <li>Armazenamento seguro de senhas (via Google OAuth)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">6. Seus Direitos</h2>
            <p className="text-gray-300 leading-relaxed mb-3">
              Você tem direito a:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li><strong>Acesso:</strong> Ver todos os dados que temos sobre você</li>
              <li><strong>Correção:</strong> Atualizar informações incorretas</li>
              <li><strong>Exclusão:</strong> Deletar sua conta e todos os dados associados</li>
              <li><strong>Portabilidade:</strong> Exportar seus dados em formato JSON ou CSV</li>
              <li><strong>Objeção:</strong> Opor-se ao processamento de certos dados</li>
            </ul>
            <p className="text-gray-300 leading-relaxed mt-3">
              Para exercer qualquer desses direitos, acesse a seção "Configurações" ou entre em contato conosco.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">7. Retenção de Dados</h2>
            <p className="text-gray-300 leading-relaxed">
              Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer o serviço. 
              Ao deletar sua conta, todos os seus dados pessoais são permanentemente removidos em até 30 dias, 
              exceto quando exigido por lei.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">8. Menores de Idade</h2>
            <p className="text-gray-300 leading-relaxed">
              O Pomociclo é destinado a usuários maiores de 13 anos. Não coletamos intencionalmente dados de crianças 
              menores de 13 anos. Se você acredita que coletamos dados de uma criança, entre em contato imediatamente 
              para que possamos remover essas informações.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">9. Transferências Internacionais</h2>
            <p className="text-gray-300 leading-relaxed">
              Seus dados podem ser armazenados e processados em servidores localizados em diferentes países. 
              Tomamos medidas apropriadas para garantir que seus dados sejam tratados com segurança e de acordo 
              com esta Política de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">10. Alterações nesta Política</h2>
            <p className="text-gray-300 leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças 
              significativas através da plataforma ou por email. Recomendamos revisar esta página regularmente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-cyan-400 mb-4">11. Contato</h2>
            <p className="text-gray-300 leading-relaxed">
              Para questões sobre privacidade ou para exercer seus direitos, entre em contato através de nossos 
              canais de suporte na seção Comunidade.
            </p>
          </section>

        </div>
      </div>

      <Footer />
    </div>
  );
}
