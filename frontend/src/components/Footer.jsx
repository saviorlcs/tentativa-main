import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-900/95 border-t border-cyan-500/20 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Sobre o Site */}
          <div>
            <h3 className="text-cyan-400 font-bold text-lg mb-4">POMOCICLO</h3>
            <p className="text-gray-400 text-sm">
              Maximize sua produtividade com o método Pomodoro. Foque, estude e conquiste seus objetivos.
            </p>
          </div>

          {/* Produto */}
          <div>
            <h4 className="text-white font-semibold mb-4">PRODUTO</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/sobre" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Sobre o Pomociclo
                </Link>
              </li>
              <li>
                <Link to="/tecnica-pomodoro" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Técnica Pomodoro
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">LEGAL</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/termos-de-uso" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="/privacidade" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Privacidade
                </Link>
              </li>
            </ul>
          </div>

          {/* Comunidade */}
          <div>
            <h4 className="text-white font-semibold mb-4">COMUNIDADE</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/whatsapp" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  WhatsApp
                </Link>
              </li>
              <li>
                <Link to="/discord" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Discord
                </Link>
              </li>
              <li>
                <Link to="/instagram" className="text-gray-400 hover:text-cyan-400 transition-colors text-sm">
                  Instagram
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-700 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            © 2025 Pomociclo. Feito de estudante para estudantes.
          </p>
          <p className="text-gray-500 text-xs">
            Este site utiliza cookies. <Link to="/privacidade" className="underline hover:text-cyan-400">Saiba mais</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
