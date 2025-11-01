export default function StatsCard({ icon: Icon, title, value, subtitle, color = "blue" }) {
  const colorClasses = {
    blue: "from-blue-500/20 to-blue-600/20 border-blue-500/30",
    orange: "from-orange-500/20 to-orange-600/20 border-orange-500/30",
    green: "from-green-500/20 to-green-600/20 border-green-500/30",
    purple: "from-purple-500/20 to-purple-600/20 border-purple-500/30",
    pink: "from-pink-500/20 to-pink-600/20 border-pink-500/30",
    yellow: "from-yellow-500/20 to-yellow-600/20 border-yellow-500/30"
  };

  const iconColorClasses = {
    blue: "text-blue-400",
    orange: "text-orange-400",
    green: "text-green-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
    yellow: "text-yellow-400"
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl p-6 border backdrop-blur-sm`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-slate-800/50 ${iconColorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      <div>
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className="text-white text-3xl font-bold mb-1">{value}</p>
        {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
      </div>
    </div>
  );
}
