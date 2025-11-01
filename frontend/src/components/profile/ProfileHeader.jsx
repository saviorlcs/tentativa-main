import { User } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ProfileHeader({ user }) {
  if (!user) return null;

  const { nickname, tag, name, avatar, level, xp, xp_for_next_level } = user;
  const xpProgress = xp_for_next_level > 0 ? (xp / xp_for_next_level) * 100 : 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700 shadow-xl">
      <div className="flex items-center gap-6">
        {/* Avatar */}
        <div className="relative">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center border-4 border-blue-500 shadow-lg">
              <span className="text-4xl font-bold text-white">
                {(nickname || name || "?")[0].toUpperCase()}
              </span>
            </div>
          )}
          
          {/* Level badge */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg border-2 border-slate-900">
            Nível {level}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1">
          {nickname && tag ? (
            <h1 className="text-3xl font-bold text-white mb-1">
              {nickname}
              <span className="text-slate-400">#{tag}</span>
            </h1>
          ) : (
            <h1 className="text-3xl font-bold text-white mb-1">{name}</h1>
          )}
          
          {/* XP Progress */}
          <div className="mt-4 max-w-md">
            <div className="flex items-center justify-between text-sm text-slate-400 mb-2">
              <span>Nível {level}</span>
              <span>{xp} / {xp_for_next_level} XP</span>
            </div>
            <Progress value={xpProgress} className="h-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
