// src/components/Notifications.jsx
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Bell, Calendar, Target, Brain, Users, X, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

function formatTime(isoString) {
  try {
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return '';
  }
}

function formatDate(isoString) {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  } catch {
    return '';
  }
}

function shouldShowHabitToday(habit) {
  const today = new Date().toISOString().slice(0, 10);
  const todayDate = new Date(today + 'T00:00:00');
  const dayOfWeek = todayDate.getDay(); // 0 = domingo, 6 = sábado

  // Verifica se já foi completado hoje
  const completedToday = habit.completions?.some(c => c.date === today);
  if (completedToday) return false;

  switch (habit.frequency) {
    case 'daily':
      return true;
    
    case 'weekly':
      // Só mostra se hoje é um dos dias selecionados
      return habit.weekdays?.includes(dayOfWeek) || false;
    
    case 'monthly':
      // Só mostra se hoje é o dia do mês selecionado
      return todayDate.getDate() === habit.day_of_month;
    
    case 'custom':
      // Verifica se passaram X dias desde a última conclusão
      if (!habit.completions?.length) return true;
      const lastCompletion = habit.completions
        .map(c => c.date)
        .sort()
        .reverse()[0];
      const lastDate = new Date(lastCompletion + 'T00:00:00');
      const daysSince = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      return daysSince >= (habit.custom_days || 1);
    
    default:
      return false;
  }
}

export default function Notifications({ user }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState({
    events: [],
    habits: [],
    reviews: [],
    friendRequests: [],
    recentStudySessions: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const totalCount = 
    notifications.events.length +
    notifications.habits.length +
    notifications.reviews.length +
    notifications.friendRequests.length +
    notifications.recentStudySessions.length;

  useEffect(() => {
    if (isOpen && user?.id) {
      loadNotifications();
    }
  }, [isOpen, user]);

  async function loadNotifications() {
    if (loading) return;
    setLoading(true);

    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // 1. Eventos do dia
      const eventsRes = await api.get('/calendar/day', { 
        params: { date_iso: today } 
      }).catch(() => ({ data: [] }));
      const todayEvents = (eventsRes.data || []).filter(e => !e.completed);

      // 2. Hábitos do dia
      const habitsRes = await api.get('/habits').catch(() => ({ data: [] }));
      const todayHabits = (habitsRes.data || []).filter(h => shouldShowHabitToday(h));

      // 3. Revisões programadas para hoje
      const reviewsRes = await api.get('/review/subjects').catch(() => ({ data: [] }));
      const todayReviews = (reviewsRes.data || []).filter(r => {
        if (!r.next_review_date) return false;
        const reviewDate = r.next_review_date.slice(0, 10);
        return reviewDate === today;
      });

      // 4. Solicitações de amizade pendentes
      const friendsRes = await api.get('/friends/requests').catch(() => ({ data: [] }));
      const pendingRequests = friendsRes.data || [];

      // 5. Sessões de estudo recentes (últimas 5 sessões completadas hoje)
      const sessionsRes = await api.get('/study/recent-sessions').catch(() => ({ data: [] }));
      const recentSessions = (sessionsRes.data || []).filter(s => {
        const sessionDate = s.start_time?.slice(0, 10);
        return sessionDate === today && s.completed && !s.skipped && (s.coins_earned > 0 || s.xp_earned > 0);
      }).slice(0, 5);

      setNotifications({
        events: todayEvents,
        habits: todayHabits,
        reviews: todayReviews,
        friendRequests: pendingRequests,
        recentStudySessions: recentSessions,
      });
    } catch (err) {
      console.error('[Notifications] Erro ao carregar:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAcceptFriend(requestId) {
    try {
      await api.post(`/friends/requests/${requestId}/accept`);
      toast.success('Amizade aceita!');
      loadNotifications();
    } catch (err) {
      toast.error('Erro ao aceitar solicitação');
    }
  }

  async function handleRejectFriend(requestId) {
    try {
      await api.delete(`/friends/requests/${requestId}`);
      toast.success('Solicitação recusada');
      loadNotifications();
    } catch (err) {
      toast.error('Erro ao recusar solicitação');
    }
  }

  async function handleCompleteHabit(habitId) {
    try {
      await api.post(`/habits/${habitId}/complete`);
      toast.success('Hábito completado! 🎉');
      loadNotifications();
    } catch (err) {
      toast.error('Erro ao completar hábito');
    }
  }

  if (!user?.id) return null;

  return (
    <div className="relative">
      {/* Botão do Sino */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-gray-300 hover:text-white hover:bg-slate-800/50 transition-all group"
        data-testid="notifications-button"
      >
        <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
        {totalCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {totalCount > 9 ? '9+' : totalCount}
          </span>
        )}
      </button>

      {/* Dropdown de Notificações */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Card de Notificações */}
          <div className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] z-50">
            <Card className="bg-slate-900/98 border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-500/20 backdrop-blur-xl max-h-[80vh] overflow-hidden flex flex-col app-surface">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <h3 className="text-white font-bold text-lg flex items-center gap-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  Notificações
                </h3>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Conteúdo */}
              <div className="overflow-y-auto flex-1">
                {loading ? (
                  <div className="p-8 text-center text-gray-400">
                    Carregando...
                  </div>
                ) : totalCount === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-6xl mb-3">✨</div>
                    <div className="text-gray-400 text-sm">Nenhuma notificação pendente</div>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700">
                    {/* Eventos do Dia */}
                    {notifications.events.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-3 text-sm">
                          <Calendar className="w-4 h-4" />
                          Eventos Hoje ({notifications.events.length})
                        </div>
                        <div className="space-y-2">
                          {notifications.events.map(event => (
                            <button
                              key={event.id}
                              onClick={() => {
                                navigate('/agenda');
                                setIsOpen(false);
                              }}
                              className="w-full text-left bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 transition-all app-surface"
                            >
                              <div className="text-white font-semibold text-sm">{event.title}</div>
                              <div className="text-gray-400 text-xs mt-1">
                                {formatTime(event.start)} - {formatTime(event.end)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hábitos do Dia */}
                    {notifications.habits.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-pink-400 font-semibold mb-3 text-sm">
                          <Target className="w-4 h-4" />
                          Hábitos Hoje ({notifications.habits.length})
                        </div>
                        <div className="space-y-2">
                          {notifications.habits.map(habit => (
                            <div
                              key={habit.id}
                              className="bg-slate-800/50 rounded-lg p-3 app-surface"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="text-white font-semibold text-sm">{habit.name}</div>
                                  {habit.description && (
                                    <div className="text-gray-400 text-xs mt-1">{habit.description}</div>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => handleCompleteHabit(habit.id)}
                                  className="bg-emerald-600 hover:bg-emerald-500 ml-2"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Revisões do Dia */}
                    {notifications.reviews.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-purple-400 font-semibold mb-3 text-sm">
                          <Brain className="w-4 h-4" />
                          Revisões Hoje ({notifications.reviews.length})
                        </div>
                        <div className="space-y-2">
                          {notifications.reviews.map(review => (
                            <button
                              key={review.id}
                              onClick={() => {
                                navigate('/revisao');
                                setIsOpen(false);
                              }}
                              className="w-full text-left bg-slate-800/50 hover:bg-slate-800 rounded-lg p-3 transition-all app-surface"
                            >
                              <div className="text-white font-semibold text-sm">{review.subject_name}</div>
                              <div className="text-gray-400 text-xs mt-1">
                                Revisão programada para hoje
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Solicitações de Amizade */}
                    {notifications.friendRequests.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-blue-400 font-semibold mb-3 text-sm">
                          <Users className="w-4 h-4" />
                          Solicitações de Amizade ({notifications.friendRequests.length})
                        </div>
                        <div className="space-y-2">
                          {notifications.friendRequests.map(req => (
                            <div
                              key={req.id}
                              className="bg-slate-800/50 rounded-lg p-3 app-surface"
                            >
                              <div className="text-white font-semibold text-sm mb-2">
                                {req.from_nickname}#{req.from_tag}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleAcceptFriend(req.id)}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-500"
                                >
                                  Aceitar
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleRejectFriend(req.id)}
                                  variant="ghost"
                                  className="flex-1 text-gray-300 hover:text-white"
                                >
                                  Recusar
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sessões de Estudo Recentes */}
                    {notifications.recentStudySessions.length > 0 && (
                      <div className="p-4">
                        <div className="flex items-center gap-2 text-amber-400 font-semibold mb-3 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Blocos Completados Hoje ({notifications.recentStudySessions.length})
                        </div>
                        <div className="space-y-2">
                          {notifications.recentStudySessions.map((session, idx) => (
                            <div
                              key={session.id || idx}
                              className="bg-gradient-to-r from-amber-900/30 to-emerald-900/30 rounded-lg p-3 border border-amber-500/20 app-surface"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="text-white font-semibold text-sm">
                                  {session.subject_name || 'Estudo'} • {session.duration || 0} min
                                </div>
                                <div className="text-xs text-gray-400">
                                  {formatTime(session.start_time)}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 bg-amber-500/20 px-2.5 py-1 rounded-md border border-amber-500/30">
                                  <span className="text-lg">💰</span>
                                  <span className="text-amber-200 font-bold text-sm">+{session.coins_earned || 0}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-blue-500/20 px-2.5 py-1 rounded-md border border-blue-500/30">
                                  <span className="text-lg">⭐</span>
                                  <span className="text-blue-200 font-bold text-sm">+{session.xp_earned || 0}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
