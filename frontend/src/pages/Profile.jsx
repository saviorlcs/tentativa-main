import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import Header from "@/components/Header";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PeriodFilter from "@/components/profile/PeriodFilter";
import StatsCard from "@/components/profile/StatsCard";
import ConsistencyCalendar from "@/components/profile/ConsistencyCalendar";
import { Button } from "@/components/ui/button";
import { Clock, Flame, Calendar, TrendingUp, Target, CheckCircle, Download, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export default function Profile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [calendarData, setCalendarData] = useState({ days: [], year: new Date().getFullYear() });
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [currentUser, setCurrentUser] = useState(null);
  const [exporting, setExporting] = useState(false);

  // Busca usuário atual
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const res = await api.get("/auth/me");
        if (res.data.ok && res.data.user) {
          setCurrentUser(res.data.user);
        }
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };
    fetchCurrentUser();
  }, []);

  // Determina qual ID usar (próprio ou de outro usuário)
  const targetUserId = userId || currentUser?.id;

  // Busca estatísticas
  useEffect(() => {
    if (!targetUserId) return;
    
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/profile/${targetUserId}/stats`, {
          params: { period: selectedPeriod }
        });
        setStats(res.data);
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast.error("Erro ao carregar estatísticas");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [targetUserId, selectedPeriod]);

  // Busca dados do calendário
  useEffect(() => {
    if (!targetUserId) return;
    
    const fetchCalendar = async () => {
      try {
        const year = new Date().getFullYear();
        const res = await api.get(`/profile/${targetUserId}/calendar`, {
          params: { year }
        });
        setCalendarData(res.data);
      } catch (error) {
        console.error("Error fetching calendar:", error);
      }
    };

    fetchCalendar();
  }, [targetUserId]);

  const handleExport = async (format = "json") => {
    setExporting(true);
    try {
      const res = await api.get("/profile/export", {
        params: { format },
        responseType: "blob"
      });
      
      // Cria download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `profile_export_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Carregando perfil...</div>
      </div>
    );
  }

  const isOwnProfile = !userId || userId === currentUser?.id;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Profile Header */}
        <ProfileHeader user={stats.user} />

        {/* Period Filter */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <PeriodFilter selected={selectedPeriod} onChange={setSelectedPeriod} />
          
          {isOwnProfile && (
            <Button
              onClick={() => handleExport("json")}
              disabled={exporting}
              variant="outline"
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              {exporting ? "Exportando..." : "Exportar"}
            </Button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard
            icon={Clock}
            title="Tempo Total de Foco"
            value={`${Math.floor(stats.stats.total_focus_time_hours)}h ${Math.round((stats.stats.total_focus_time_hours % 1) * 60)}m`}
            subtitle={`Últimos ${stats.period_days} dias`}
            color="blue"
          />
          
          <StatsCard
            icon={Flame}
            title="Sequência de Foco"
            value={`${stats.stats.streak_days} dias`}
            subtitle="Sequência atual"
            color="orange"
          />
          
          <StatsCard
            icon={Calendar}
            title="Dias Ativos"
            value={stats.stats.active_days}
            subtitle={`Nos últimos ${stats.period_days} dias`}
            color="green"
          />
          
          <StatsCard
            icon={TrendingUp}
            title="Média por Dia"
            value={`${Math.round(stats.stats.average_per_day_minutes)}m`}
            subtitle={`Nos últimos ${stats.period_days} dias`}
            color="purple"
          />
          
          <StatsCard
            icon={Target}
            title="Ciclos Completos"
            value={stats.stats.cycles_completed}
            subtitle={`Últimos ${stats.period_days} dias`}
            color="pink"
          />
          
          <StatsCard
            icon={CheckCircle}
            title="Blocos Completos"
            value={stats.stats.blocks_completed}
            subtitle={`Últimos ${stats.period_days} dias`}
            color="yellow"
          />
        </div>

        {/* Consistency Calendar */}
        <ConsistencyCalendar days={calendarData.days} year={calendarData.year} />
      </div>
    </div>
  );
}
