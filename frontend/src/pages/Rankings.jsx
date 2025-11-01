// src/pages/Rankings.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import ModernSealAvatar from "@/components/ModernSealAvatar";
import { Users, Globe2, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import Footer from '../components/Footer';
const PeriodPill = ({ value, current, onChange, children }) => (
  <button
    onClick={() => onChange(value)}
    className={`px-2.5 py-1 rounded-full text-xs border ${
      current === value ? "bg-cyan-600 text-white border-cyan-500" : "text-zinc-300 border-slate-700 hover:bg-slate-800/60"
    }`}
  >
    {children}
  </button>
);

// Helper para formatar minutos em "Xh Ymin"
function formatMinutes(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  return `${h}h ${m}min`;
}

function RankRow({ i, item, shopItems = [] }) {
  const rank = i + 1;
  
  const getBgGradient = () => {
    if (rank === 1) return "from-amber-500/10 to-yellow-500/10 border-amber-500/30";
    if (rank === 2) return "from-slate-400/10 to-zinc-400/10 border-slate-400/30";
    if (rank === 3) return "from-orange-600/10 to-amber-700/10 border-orange-600/30";
    return "from-slate-800/60 to-slate-800/40 border-slate-700";
  };

  // Buscar o item do selo equipado ou usar o selo padrão
  let sealItem = shopItems.find(shopItem => shopItem.id === item.equipped_seal);
  
  // Se não tiver selo equipado, usa o primeiro selo (padrão)
  if (!sealItem) {
    sealItem = shopItems.find(shopItem => shopItem.id === 'seal_001') || shopItems.find(shopItem => shopItem.item_type === 'seal');
  }

  // Badge de ranking para top 3
  const getRankBadge = () => {
    if (rank === 1) return { emoji: "🥇", color: "text-amber-400" };
    if (rank === 2) return { emoji: "🥈", color: "text-slate-300" };
    if (rank === 3) return { emoji: "🥉", color: "text-orange-400" };
    return null;
  };

  const rankBadge = getRankBadge();

  return (
    <div className={`grid grid-cols-12 items-center gap-3 rounded-xl border bg-gradient-to-r ${getBgGradient()} p-4 hover:shadow-lg hover:shadow-cyan-500/10 transition-all duration-300`}>
      <div className="col-span-2 sm:col-span-1 flex items-center justify-center relative">
        <ModernSealAvatar 
          user={{ name: item.name, nickname: item.handle?.split('#')[0], tag: item.handle?.split('#')[1] }}
          item={sealItem}
          size={48}
          className={`${rankBadge ? 'ring-2 ring-offset-2 ring-offset-slate-900' : ''} ${
            rank === 1 ? 'ring-amber-400/50' : rank === 2 ? 'ring-slate-300/50' : rank === 3 ? 'ring-orange-400/50' : ''
          }`}
        />
        {rankBadge && (
          <div className="absolute -top-1 -right-1 text-lg drop-shadow-lg">
            {rankBadge.emoji}
          </div>
        )}
      </div>
      <div className="col-span-6 sm:col-span-7 truncate">
        <div className="text-white font-semibold text-lg truncate flex items-center gap-2">
          {item.handle || item.name || "Usuário"}
        </div>
        <div className="text-xs text-zinc-400 truncate">{item.group_name || item.subtitle || ""}</div>
      </div>
      <div className="col-span-4 sm:col-span-4 text-right">
        <div className="text-cyan-300 font-bold text-lg">{item.blocks} blocos</div>
        <div className="text-xs text-zinc-400">{formatMinutes(item.minutes)} de foco</div>
      </div>
    </div>
  );
}

export default function Rankings() {
  const [user, setUser] = useState(undefined);
  const [tab, setTab] = useState("global"); // global | friends | groups
  const [period, setPeriod] = useState("week"); // day | week | month | all
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myGroups, setMyGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [shopItems, setShopItems] = useState([]);

  useEffect(() => {
    api.get("/auth/me").then((r) => setUser(r.data || null)).catch(() => setUser(null));
    // Carrega itens da loja para mostrar selos
    api.get("/shop/all").then((r) => setShopItems(r.data?.items || [])).catch(() => setShopItems([]));
  }, []);

  useEffect(() => {
    if (tab === "groups") {
      api.get("/rankings/my-groups")
        .then((r) => {
          const groups = Array.isArray(r.data) ? r.data : [];
          setMyGroups(groups);
          if (groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(groups[0].id);
          }
        })
        .catch(() => setMyGroups([]));
    }
  }, [tab]);

  const fetchers = {
    global: () => api.get("/rankings/global", { params: { period } }),
    friends: () => api.get("/rankings/friends", { params: { period } }),
    groups: () => {
      if (!selectedGroupId) return Promise.resolve({ data: [] });
      return api.get(`/rankings/groups/${selectedGroupId}`, { params: { period } });
    },
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (fetchers[tab]() || Promise.resolve({ data: [] }))
      .then((r) => {
        if (!alive) return;
        setData(Array.isArray(r.data) ? r.data : []);
      })
      .catch(() => alive && setData([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [tab, period, selectedGroupId]);

  const title =
    tab === "global" ? "Ranking Global"
      : tab === "friends" ? "Ranking entre Amigos"
      : "Ranking por Grupos";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Header user={user} />
      <div className="container mx-auto px-4 py-6 max-w-5xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-3">
            🏆 Rankings
          </h1>
          <p className="text-zinc-400 text-sm">
            Conta apenas <b className="text-cyan-300">blocos completos de foco real</b> (sem pulos ou resets)
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setTab("global")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              tab === "global" 
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30" 
                : "text-zinc-300 bg-slate-800/60 hover:bg-slate-700/60"
            }`}
          >
            🌍 Global
          </button>
          <button
            onClick={() => setTab("friends")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              tab === "friends"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                : "text-zinc-300 bg-slate-800/60 hover:bg-slate-700/60"
            }`}
          >
            👥 Amigos
          </button>
          <button
            onClick={() => setTab("groups")}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              tab === "groups"
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/30"
                : "text-zinc-300 bg-slate-800/60 hover:bg-slate-700/60"
            }`}
          >
            🛡️ Grupos
          </button>
        </div>

        {tab === "groups" && myGroups.length > 0 && (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 app-surface">
            <label className="text-gray-300 text-sm font-semibold mb-2 block">Selecione o Grupo</label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full bg-slate-700 border-slate-600 rounded-xl px-4 py-2 text-white app-surface"
            >
              {myGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <PeriodPill value="day" current={period} onChange={setPeriod}>Hoje</PeriodPill>
          <PeriodPill value="week" current={period} onChange={setPeriod}>Semana</PeriodPill>
          <PeriodPill value="month" current={period} onChange={setPeriod}>Mês</PeriodPill>
          <PeriodPill value="all" current={period} onChange={setPeriod}>Histórico</PeriodPill>
        </div>

        <div className="bg-gradient-to-br from-slate-800/60 to-slate-800/40 border border-slate-700 rounded-2xl p-6 app-surface">
          <h2 className="text-white font-bold text-2xl mb-6">{title}</h2>
          {loading ? (
            <p className="text-gray-400 text-center py-8">Carregando...</p>
          ) : data.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-gray-300 text-lg mb-2">Nenhum dado ainda</p>
              <p className="text-gray-400 text-sm">Complete blocos de estudo para aparecer no ranking!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((item, i) => (
                <RankRow key={i} i={i} item={item} shopItems={shopItems} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
