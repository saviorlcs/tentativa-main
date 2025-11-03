/**
 * Painel de Estatísticas do Usuário
 * 
 * Exibe informações de XP, nível, coins e avatar do usuário
 */
import { Trophy, Target } from 'lucide-react';
import ModernSealAvatar from '@/components/ModernSealAvatar';

function StatsPanel({ user, stats }) {
  if (!user) return null;

  // Calcula XP para próximo nível
  const xpForNextLevel = user.level * 100;
  const xpProgress = ((user.xp % 100) / 100) * 100;

  return (
    <div className="backdrop-blur bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-6 border border-slate-700/50">
      {/* Avatar e informações do usuário */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <ModernSealAvatar
            user={user}
            size="lg"
            showLevel={true}
          />
        </div>
        
        <div className="flex-1">
          <h3 className="text-xl font-bold text-white mb-1">
            {user.name || user.email}
          </h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-yellow-400">
              <Trophy className="w-4 h-4" />
              <span className="font-semibold">Nível {user.level}</span>
            </div>
            <div className="flex items-center gap-1 text-cyan-400">
              <Target className="w-4 h-4" />
              <span className="font-semibold">{user.coins} coins</span>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de progresso XP */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">XP</span>
          <span className="text-sm font-semibold text-white">
            {user.xp % 100} / {xpForNextLevel}
          </span>
        </div>
        <div className="h-2 rounded-full bg-slate-700/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
      </div>

      {/* Estatísticas de estudo */}
      {stats && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white mb-1">
              {stats.total_study_time || 0}
              <span className="text-sm text-gray-400 ml-1">min</span>
            </div>
            <div className="text-xs text-gray-400">Tempo Total</div>
          </div>
          
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="text-2xl font-bold text-white mb-1">
              {stats.sessions_completed || 0}
            </div>
            <div className="text-xs text-gray-400">Sessões Completas</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StatsPanel;
