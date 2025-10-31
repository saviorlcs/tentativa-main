// src/pages/AuthCallback.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 5;
    
    const checkAuth = async () => {
      try {
        // Aguarda um pouco para o cookie ser setado
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const r = await api.get("/auth/me");
        
        if (r?.data?.user?.id) {
          // Autenticado com sucesso
          const hasNick = !!(r.data.user.nickname && r.data.user.tag);
          navigate(hasNick ? "/dashboard" : "/setup", { replace: true });
        } else {
          // Ainda não autenticado, tenta novamente
          attempts++;
          if (attempts < maxAttempts) {
            setTimeout(checkAuth, 1000);
          } else {
            setError("Falha na autenticação. Por favor, tente novamente.");
            setTimeout(() => navigate("/", { replace: true }), 2000);
          }
        }
      } catch (err) {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(checkAuth, 1000);
        } else {
          setError("Erro ao verificar autenticação. Redirecionando...");
          setTimeout(() => navigate("/", { replace: true }), 2000);
        }
      }
    };
    
    checkAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="text-center">
        {!error ? (
          <>
            <div className="mb-4">
              <div className="inline-block w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-white text-lg">Autenticando...</p>
            <p className="text-gray-400 text-sm mt-2">Aguarde um momento</p>
          </>
        ) : (
          <>
            <div className="mb-4">
              <div className="inline-block w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-red-400 text-lg">{error}</p>
          </>
        )}
      </div>
    </div>
  );
}
