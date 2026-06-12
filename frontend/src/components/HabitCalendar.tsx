import { useQuery } from '@tanstack/react-query';
import { getHabitLogs } from '../api';
import { CATEGORY_CONFIG } from '../models/habit';

interface Props {
  habitId: string;
  category: string;
}

export default function HabitCalendar({ habitId, category }: Props) {
  const today = new Date();
  const start = new Date(today);
  start.setDate(start.getDate() - 34);

  const startStr = start.toISOString().split('T')[0];
  const endStr = today.toISOString().split('T')[0];

  const { data: logs } = useQuery({
    queryKey: ['habit-logs', habitId, startStr, endStr],
    queryFn: () => getHabitLogs(habitId, startStr, endStr),
  });

  const completedDates = new Set(logs?.map(l => l.date) ?? []);
  const cat = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.custom;

  // Build 5 weeks grid
  const days: { date: string; label: number; isToday: boolean; inMonth: boolean }[] = [];
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay()); // Start from Sunday

  for (let i = 0; i < 35; i++) {
    const d = new Date(gridStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({
      date: dateStr,
      label: d.getDate(),
      isToday: dateStr === endStr,
      inMonth: d.getMonth() === today.getMonth(),
    });
  }

  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="animate-fade-in-up">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekdays.map((d, i) => (
          <div key={i} className="text-center text-[10px] text-slate-600 font-medium py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const completed = completedDates.has(day.date);
          const future = day.date > endStr;
          return (
            <div
              key={day.date}
              className={`aspect-square rounded-lg text-[11px] font-medium flex items-center justify-center transition-all ${
                future
                  ? 'text-slate-700'
                  : completed
                    ? `${cat.bg} ${cat.text} shadow-sm`
                    : day.isToday
                      ? 'bg-slate-600/50 text-slate-300 ring-1 ring-slate-500'
                      : day.inMonth
                        ? 'bg-slate-800/30 text-slate-500'
                        : 'text-slate-700'
              }`}
            >
              {day.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
