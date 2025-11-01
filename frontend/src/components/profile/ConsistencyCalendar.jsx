import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConsistencyCalendar({ days = [], year }) {
  const [currentYear, setCurrentYear] = useState(year || new Date().getFullYear());
  
  // Converte array de dias em objeto para lookup rápido
  const daysMap = {};
  days.forEach(day => {
    daysMap[day.date] = day.minutes;
  });

  // Determina cor baseado em minutos estudados
  const getColor = (minutes) => {
    if (!minutes || minutes === 0) return "bg-slate-800";
    if (minutes < 30) return "bg-green-900/40";
    if (minutes < 60) return "bg-green-700/60";
    if (minutes < 120) return "bg-green-500/80";
    return "bg-green-400";
  };

  // Gera calendário do ano inteiro
  const generateYearCalendar = () => {
    const months = [];
    const monthNames = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    for (let month = 0; month < 12; month++) {
      const firstDay = new Date(currentYear, month, 1);
      const lastDay = new Date(currentYear, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();

      const weeks = [];
      let week = new Array(7).fill(null);
      let dayOfMonth = 1;

      // Preenche dias vazios antes do primeiro dia do mês
      for (let i = 0; i < startingDayOfWeek; i++) {
        week[i] = null;
      }

      // Preenche os dias do mês
      for (let i = startingDayOfWeek; i < 7 && dayOfMonth <= daysInMonth; i++) {
        week[i] = dayOfMonth++;
      }
      weeks.push([...week]);

      // Preenche semanas restantes
      while (dayOfMonth <= daysInMonth) {
        week = new Array(7).fill(null);
        for (let i = 0; i < 7 && dayOfMonth <= daysInMonth; i++) {
          week[i] = dayOfMonth++;
        }
        weeks.push([...week]);
      }

      months.push({
        name: monthNames[month],
        monthIndex: month,
        weeks
      });
    }

    return months;
  };

  const months = generateYearCalendar();

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          🔥 Consistência de Foco
        </h2>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentYear(currentYear - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-white font-bold min-w-[80px] text-center">{currentYear}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentYear(currentYear + 1)}
            disabled={currentYear >= new Date().getFullYear()}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
        <span>Menos</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700"></div>
          <div className="w-3 h-3 rounded-sm bg-green-900/40"></div>
          <div className="w-3 h-3 rounded-sm bg-green-700/60"></div>
          <div className="w-3 h-3 rounded-sm bg-green-500/80"></div>
          <div className="w-3 h-3 rounded-sm bg-green-400"></div>
        </div>
        <span>Mais</span>
      </div>

      {/* Calendário em grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {months.map((month) => (
          <div key={month.name} className="bg-slate-900/50 rounded-lg p-3">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">{month.name}</h3>
            <div className="space-y-1">
              {month.weeks.map((week, weekIdx) => (
                <div key={weekIdx} className="flex gap-1">
                  {week.map((day, dayIdx) => {
                    if (day === null) {
                      return <div key={dayIdx} className="w-4 h-4"></div>;
                    }
                    
                    const dateStr = `${currentYear}-${String(month.monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const minutes = daysMap[dateStr] || 0;
                    const color = getColor(minutes);
                    
                    return (
                      <div
                        key={dayIdx}
                        className={`w-4 h-4 rounded-sm ${color} border border-slate-700/50 hover:border-slate-500 transition-colors cursor-pointer`}
                        title={`${dateStr}: ${minutes} min`}
                      ></div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
