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

          {/* Contato */}
          <div>
            <h4 className="text-white font-semibold mb-4">CONTATO</h4>
            <div className="space-y-2">
              <p className="text-gray-400 text-sm">Entre em contato:</p>
              <a 
                href="mailto:pomociclo@gmail.com" 
                className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                pomociclo@gmail.com
              </a>
            </div>
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
