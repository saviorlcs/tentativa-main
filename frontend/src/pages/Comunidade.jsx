import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Comunidade() {
  const navigate = useNavigate();

  const socialLinks = [
    {
      name: 'WhatsApp',
      description: 'Junte-se ao nosso grupo para dicas diárias e suporte',
      icon: '💬',
      url: '#',
      color: 'from-green-500 to-emerald-600'
    },
    {
      name: 'Discord',
      description: 'Converse em tempo real, compartilhe progresso e faça amigos',
      icon: '🎮',
      url: '#',
      color: 'from-indigo-500 to-purple-600'
    },
    {
      name: 'Instagram',
      description: 'Siga-nos para inspiração, dicas e conteúdo exclusivo',
      icon: '📸',
      url: '#',
      color: 'from-pink-500 to-rose-600'
    }
  ];

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

        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
            Comunidade Pomociclo
          </h1>
          <p className="text-gray-400 text-lg">Conecte-se com outros estudantes e maximize sua produtividade</p>
        </div>

        <div className="space-y-6 mb-12">
          {socialLinks.map((social, index) => (
            <div 
              key={index}
              className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 hover:border-cyan-500/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-4xl">{social.icon}</span>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{social.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed mb-4">
                    {social.description}
                  </p>
                  <Button
                    onClick={() => window.open(social.url, '_blank')}
                    className={`bg-gradient-to-r ${social.color} hover:opacity-90 text-white font-semibold px-6 py-2 rounded-lg transition-all group-hover:scale-105`}
                  >
                    Participar
                    <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-2xl p-8 border border-cyan-500/30">
          <h2 className="text-2xl font-bold text-cyan-400 mb-4 text-center">Por que participar?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-3xl mb-2">🤝</div>
              <h3 className="text-lg font-semibold text-white mb-2">Networking</h3>
              <p className="text-gray-300 text-sm">Conheça outros estudantes e profissionais</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-3xl mb-2">💡</div>
              <h3 className="text-lg font-semibold text-white mb-2">Dicas e Truques</h3>
              <p className="text-gray-300 text-sm">Aprenda técnicas comprovadas de produtividade</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-3xl mb-2">🏆</div>
              <h3 className="text-lg font-semibold text-white mb-2">Motivação</h3>
              <p className="text-gray-300 text-sm">Mantenha-se inspirado vendo o progresso de outros</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="text-lg font-semibold text-white mb-2">Grupos de Estudo</h3>
              <p className="text-gray-300 text-sm">Forme ou participe de grupos de estudo colaborativos</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-3xl mb-2">❓</div>
              <h3 className="text-lg font-semibold text-white mb-2">Suporte</h3>
              <p className="text-gray-300 text-sm">Tire dúvidas e ajude outros usuários</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-lg p-4">
              <div className="text-3xl mb-2">🎉</div>
              <h3 className="text-lg font-semibold text-white mb-2">Eventos Exclusivos</h3>
              <p className="text-gray-300 text-sm">Participe de desafios e eventos da comunidade</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-800/30 rounded-xl p-6 border border-slate-700">
          <h3 className="text-xl font-bold text-cyan-400 mb-3">Diretrizes da Comunidade</h3>
          <ul className="text-gray-300 space-y-2 text-sm">
            <li>• Seja respeitoso e gentil com todos os membros</li>
            <li>• Compartilhe conhecimento e ajude outros usuários</li>
            <li>• Evite spam e conteúdo não relacionado</li>
            <li>• Mantenha as conversas construtivas e positivas</li>
            <li>• Respeite a privacidade e os dados de outros membros</li>
          </ul>
        </div>

      </div>

      <Footer />
    </div>
  );
}
