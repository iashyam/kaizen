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

  const days: { date: string; label: number; isToday: boolean; inMonth: boolean }[] = [];
  const gridStart = new Date(start);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

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
          <div key={i} className="text-center text-[10px] text-txt-muted font-bold py-1">
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
              className={`aspect-square rounded-lg text-[11px] font-bold flex items-center justify-center transition-all ${
                future
                  ? 'text-txt-muted/30'
                  : completed
                    ? `${cat.bg} ${cat.text}`
                    : day.isToday
                      ? 'bg-surface-input text-txt-primary ring-1 ring-brd'
                      : day.inMonth
                        ? 'bg-surface-input/50 text-txt-muted'
                        : 'text-txt-muted/30'
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
