import React, { useState, useEffect, useMemo } from 'react';
import { Check, Book, Heart, Sparkles, Calendar } from 'lucide-react';
import axios from 'axios';
import Header from '../components/Header';

const API = process.env.REACT_APP_BACKEND_URL || '';

// Helper: dia do ano
function getDayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

// Helper: converter dia do ano em Date
function dayOfYearToDate(dayOfYear) {
  const year = new Date().getFullYear();
  const date = new Date(year, 0);
  date.setDate(dayOfYear);
  return date;
}

function Devocional() {
  const [progress, setProgress] = useState({});
  const [biblePlan, setBiblePlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  const currentDayOfYear = getDayOfYear();

  useEffect(() => {
    loadDevotionalData();
  }, []);

  const loadDevotionalData = async () => {
    try {
      setLoading(true);

      // Progresso
      const progressRes = await axios.get(`${API}/api/devocional/progress`, {
        withCredentials: true,
      });
      setProgress(progressRes.data.progress || {});

      // Plano de leitura
      const planRes = await axios.get(`${API}/api/devocional/plan`);
      setBiblePlan(planRes.data.plan || {});
    } catch (error) {
      console.error('Erro ao carregar devocional:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = async (dayOfYear, field) => {
    const currentValue = progress[dayOfYear]?.[field] || false;
    const newValue = !currentValue;

    // Otimista local
    setProgress((prev) => ({
      ...prev,
      [dayOfYear]: {
        ...prev[dayOfYear],
        [field]: newValue,
      },
    }));

    // Persistir
    try {
      await axios.post(
        `${API}/api/devocional/update`,
        { day_of_year: dayOfYear, [field]: newValue },
        { withCredentials: true },
      );
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
      // Reverter
      setProgress((prev) => ({
        ...prev,
        [dayOfYear]: {
          ...prev[dayOfYear],
          [field]: currentValue,
        },
      }));
    }
  };

  // Filtrar dias por mês
  const daysInSelectedMonth = useMemo(() => {
    const days = [];
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const startDay =
      daysInMonth.slice(0, selectedMonth - 1).reduce((a, b) => a + b, 0) + 1;
    const endDay = startDay + daysInMonth[selectedMonth - 1] - 1;

    for (let dayOfYear = startDay; dayOfYear <= endDay; dayOfYear++) {
      if (biblePlan[dayOfYear]) {
        const date = dayOfYearToDate(dayOfYear);
        const dayOfMonth = date.getDate();
        days.push({
          dayOfYear,
          dayOfMonth,
          reading: biblePlan[dayOfYear].ref,
        });
      }
    }
    return days;
  }, [selectedMonth, biblePlan]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = Object.keys(biblePlan).length;
    let completedDays = 0;
    let bibleReadCount = 0;
    let devotionalCount = 0;
    let prayerCount = 0;

    Object.entries(progress).forEach(([_, day]) => {
      if (day.read_bible && day.did_devotional && day.did_prayer) {
        completedDays++;
      }
      if (day.read_bible) bibleReadCount++;
      if (day.did_devotional) devotionalCount++;
      if (day.did_prayer) prayerCount++;
    });

    return {
      total,
      completedDays,
      bibleReadCount,
      devotionalCount,
      prayerCount,
      percentage: total > 0 ? Math.round((completedDays / total) * 100) : 0,
    };
  }, [progress, biblePlan]);

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="text-white">Carregando devocional...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Header />
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Book className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Devocional</h1>
                <p className="text-gray-400">A Bíblia em um ano</p>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm text-gray-400">Dias Completos</span>
                </div>
                <div className="text-2xl font-bold">
                  {stats.completedDays}/{stats.total}
                </div>
                <div className="text-sm text-gray-400">{stats.percentage}%</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Book className="w-5 h-5" />
                  <span className="text-sm text-gray-400">Leu a Bíblia</span>
                </div>
                <div className="text-2xl font-bold">{stats.bibleReadCount}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Heart className="w-5 h-5" />
                  <span className="text-sm text-gray-400">Fez Devocional</span>
                </div>
                <div className="text-2xl font-bold">{stats.devotionalCount}</div>
              </div>

              <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-5 h-5" />
                  <span className="text-sm text-gray-400">Fez Oração</span>
                </div>
                <div className="text-2xl font-bold">{stats.prayerCount}</div>
              </div>

              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-5 h-5" />
                  <span className="text-sm">Progresso Geral</span>
                </div>
                <div className="text-3xl font-bold">{stats.percentage}%</div>
              </div>
            </div>

            {/* Seletor de Mês */}
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <label className="text-sm text-gray-400 mb-2 block">
                Selecione o Mês:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full md:w-auto bg-slate-700 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-purple-500"
              >
                {monthNames.map((name, index) => (
                  <option key={index + 1} value={index + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Lista de Dias */}
          <div className="space-y-2">
            {daysInSelectedMonth.map(({ dayOfYear, dayOfMonth, reading }) => {
              const dayProgress = progress[dayOfYear] || {};
              const isToday = dayOfYear === currentDayOfYear;
              const isComplete =
                dayProgress.read_bible &&
                dayProgress.did_devotional &&
                dayProgress.did_prayer;

              return (
                <div
                  key={dayOfYear}
                  data-testid={`devotional-day-${dayOfYear}`}
                  className={`bg-slate-800 rounded-xl p-4 border transition-all ${
                    isToday
                      ? 'border-purple-500 ring-2 ring-purple-500/20'
                      : isComplete
                      ? 'border-green-500/50'
                      : 'border-slate-700'
                  } hover:border-purple-400`}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    {/* Dia */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center ${
                          isToday
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500'
                            : isComplete
                            ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                            : 'bg-slate-700'
                        }`}
                      >
                        <div className="text-xs opacity-70">DIA</div>
                        <div className="text-2xl font-bold">{dayOfMonth}</div>
                      </div>
                    </div>

                    {/* Leitura */}
                    <div className="flex-grow">
                      <div className="text-sm text-gray-400 mb-1">
                        {monthNames[selectedMonth - 1]} {dayOfMonth}
                        {isToday && (
                          <span className="ml-2 text-purple-400 font-semibold">
                            • Hoje
                          </span>
                        )}
                      </div>
                      <div className="text-lg font-medium">{reading}</div>
                    </div>

                    {/* Checkboxes */}
                    <div className="flex flex-col md:flex-row gap-3">
                      {/* Leu a Bíblia */}
                      <label
                        className="flex items-center gap-2 cursor-pointer group"
                        data-testid={`checkbox-read-bible-${dayOfYear}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            dayProgress.read_bible
                              ? 'bg-blue-500 border-blue-500'
                              : 'border-slate-600 group-hover:border-blue-400'
                          }`}
                        >
                          {dayProgress.read_bible && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-300">
                          Leu a Bíblia
                        </span>
                        <input
                          type="checkbox"
                          checked={dayProgress.read_bible || false}
                          onChange={() =>
                            handleCheckboxChange(dayOfYear, 'read_bible')
                          }
                          className="hidden"
                        />
                      </label>

                      {/* Fez Devocional */}
                      <label
                        className="flex items-center gap-2 cursor-pointer group"
                        data-testid={`checkbox-devotional-${dayOfYear}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            dayProgress.did_devotional
                              ? 'bg-red-500 border-red-500'
                              : 'border-slate-600 group-hover:border-red-400'
                          }`}
                        >
                          {dayProgress.did_devotional && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-300">
                          Fez Devocional
                        </span>
                        <input
                          type="checkbox"
                          checked={dayProgress.did_devotional || false}
                          onChange={() =>
                            handleCheckboxChange(dayOfYear, 'did_devotional')
                          }
                          className="hidden"
                        />
                      </label>

                      {/* Fez Oração */}
                      <label
                        className="flex items-center gap-2 cursor-pointer group"
                        data-testid={`checkbox-prayer-${dayOfYear}`}
                      >
                        <div
                          className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                            dayProgress.did_prayer
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-slate-600 group-hover:border-purple-400'
                          }`}
                        >
                          {dayProgress.did_prayer && (
                            <Check className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-sm text-gray-300">
                          Fez Oração
                        </span>
                        <input
                          type="checkbox"
                          checked={dayProgress.did_prayer || false}
                          onChange={() =>
                            handleCheckboxChange(dayOfYear, 'did_prayer')
                          }
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Devocional;
