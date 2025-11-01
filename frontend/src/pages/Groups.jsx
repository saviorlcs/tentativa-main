// src/pages/Groups.jsx
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import { api } from "@/lib/api";
import { createGroup, listMyGroups, searchGroups, joinGroupByInvite } from "@/lib/groups";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import Footer from '../components/Footer';
export default function Groups() {
  const [user, setUser] = useState(undefined);
  const [mine, setMine] = useState([]);
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [invite, setInvite] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/auth/me").then(r => setUser(r.data || null)).catch(()=>setUser(null));
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const [m] = await Promise.all([listMyGroups()]);
      setMine(m || []);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    refresh();
  }, []);

  const onCreate = async () => {
    if (!name.trim()) return toast.error("Dê um nome ao grupo");
    try {
      const g = await createGroup(name, desc, "public");
      toast.success("Grupo criado!");
      navigate(`/grupos/${g.id}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Erro ao criar");
    }
  };
  const onJoin = async () => {
    if (!invite.trim()) return toast.error("Cole o código de convite");
    try {
      const r = await joinGroupByInvite(invite.trim());
      toast.success("Você entrou no grupo!");
      navigate(`/grupos/${r.group_id}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Convite inválido");
    }
  };
  const onSearch = async () => {
    const data = await searchGroups(q.trim());
    setResults(data || []);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <Header user={user} />
      <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 mb-3">
            🛡️ Grupos de Estudo
          </h1>
          <p className="text-zinc-400 text-sm">
            Crie ou participe de grupos para estudar em equipe e competir nos rankings
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-6">
          <div className="md:col-span-5 space-y-4">
            <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm p-6 space-y-4 shadow-lg shadow-cyan-500/10 app-surface">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                ✨ Criar Grupo Novo
              </h3>
              <Input 
                placeholder="Nome do grupo" 
                value={name} 
                onChange={(e)=>setName(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Input 
                placeholder="Descrição (opcional)" 
                value={desc} 
                onChange={(e)=>setDesc(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
              />
              <Button 
                onClick={onCreate}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 font-semibold"
              >
                Criar Grupo
              </Button>
            </div>

            <div className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-slate-800/60 to-slate-800/40 backdrop-blur-sm p-6 space-y-4 shadow-lg shadow-blue-500/10 app-surface">
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                🔑 Entrar por Convite
              </h3>
              <Input 
                placeholder="Cole o código aqui" 
                value={invite} 
                onChange={(e)=>setInvite(e.target.value)}
                className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 font-mono"
              />
              <Button 
                onClick={onJoin}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 font-semibold"
              >
                Entrar no Grupo
              </Button>
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg app-surface">
              <h3 className="text-white font-bold text-lg mb-4">🔍 Buscar Grupos Públicos</h3>
              <div className="flex items-center gap-2">
                <Input 
                  placeholder="Digite para buscar..." 
                  value={q} 
                  onChange={e=>setQ(e.target.value)}
                  onKeyDown={(e)=>e.key==="Enter" && onSearch()}
                  className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400"
                />
                <Button 
                  onClick={onSearch}
                  className="bg-cyan-600 hover:bg-cyan-500"
                >
                  Buscar
                </Button>
              </div>
              <div className="mt-4 space-y-2">
                {results.length === 0 ? (
                  <div className="text-zinc-400 text-sm text-center py-8">
                    Use a busca para descobrir grupos públicos.
                  </div>
                ) : results.map(g => (
                  <div 
                    key={g.id} 
                    className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-900/60 to-slate-800/60 p-4 flex items-center justify-between hover:border-cyan-500/30 transition-all duration-300"
                  >
                    <div>
                      <div className="text-white font-semibold text-lg">{g.name}</div>
                      <div className="text-xs text-zinc-400">{g.description || "Sem descrição"}</div>
                    </div>
                    <Link 
                      to={`/grupos/${g.id}`} 
                      className="text-cyan-300 text-sm font-semibold hover:text-cyan-200 underline"
                    >
                      Ver Grupo →
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-700 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg app-surface">
              <h3 className="text-white font-bold text-lg mb-4">📚 Meus Grupos</h3>
              {loading ? (
                <div className="text-zinc-400 text-sm text-center py-8">Carregando…</div>
              ) : mine.length === 0 ? (
                <div className="text-zinc-400 text-sm text-center py-8">
                  Você ainda não participa de nenhum grupo.<br/>
                  Crie um ou entre por convite!
                </div>
              ) : (
                <div className="space-y-2">
                  {mine.map(g => (
                    <div 
                      key={g.id} 
                      className="rounded-xl border border-slate-700 bg-gradient-to-r from-slate-900/60 to-slate-800/60 p-4 flex items-center justify-between hover:border-blue-500/30 transition-all duration-300"
                    >
                      <div className="flex-1">
                        <div className="text-white font-semibold text-lg">{g.name}</div>
                        <div className="text-xs text-zinc-400">{g.description || "Sem descrição"}</div>
                        {g.role && (
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            {g.role === "admin" ? "👑 Admin" : g.role === "mod" ? "⭐ Moderador" : "👤 Membro"}
                          </span>
                        )}
                      </div>
                      <Link 
                        to={`/grupos/${g.id}`} 
                        className="text-cyan-300 text-sm font-semibold hover:text-cyan-200 underline ml-4"
                      >
                        Abrir →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
