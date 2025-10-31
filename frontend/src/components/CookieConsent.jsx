import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { X, Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      setTimeout(() => setShow(true), 1000);
    }
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setShow(false);
  };

  const deny = () => {
    localStorage.setItem('cookie-consent', 'denied');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-slate-900/95 via-purple-900/95 to-slate-900/95 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Cookie className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white mb-2">🍪 Cookies & Privacidade</h3>
              <p className="text-gray-300 text-sm mb-4">
                Usamos cookies para melhorar sua experiência, manter você logado e analisar o uso do site. 
                Ao aceitar, você concorda com nossa política de privacidade.
              </p>
              
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={accept}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300"
                >
                  ✅ Aceitar Cookies
                </Button>
                
                <Button
                  onClick={deny}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300"
                >
                  ❌ Apenas Essenciais
                </Button>
              </div>
            </div>
            
            <button
              onClick={deny}
              className="flex-shrink-0 p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
