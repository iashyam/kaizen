import { useState } from 'react';
import { Flame } from 'lucide-react';
import type { HabitWithStatus } from '../api';
import { CATEGORY_CONFIG } from '../models/habit';

interface Props {
  habit: HabitWithStatus;
  onToggle: (id: string, completed: boolean) => void;
}

export default function HabitCard({ habit, onToggle }: Props) {
  const [animating, setAnimating] = useState(false);
  const cat = CATEGORY_CONFIG[habit.category] || CATEGORY_CONFIG.custom;
  const emoji = (habit as any).emoji || cat.icon;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onToggle(habit.id, habit.completed_today);
  };

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 ${
        habit.completed_today
          ? `bg-gradient-to-r ${cat.gradient} border ${cat.border}`
          : 'bg-slate-800/80 border border-slate-700/50 hover:border-slate-600/50'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Emoji + Checkbox */}
        <button
          onClick={handleToggle}
          className={`relative w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
            animating ? 'animate-check-pop' : ''
          } ${
            habit.completed_today
              ? `${cat.bg} shadow-lg`
              : 'bg-slate-700/50 active:scale-90'
          }`}
        >
          {habit.completed_today ? (
            <span className="text-2xl">{emoji}</span>
          ) : (
            <span className="text-xl opacity-40">{emoji}</span>
          )}
          {habit.completed_today && (
            <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </button>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <div className={`text-[15px] font-semibold truncate transition-colors ${
            habit.completed_today ? 'text-slate-300' : 'text-slate-100'
          }`}>
            {habit.name}
          </div>
          <div className={`text-xs mt-0.5 ${cat.text} opacity-70`}>
            {cat.label}
          </div>
        </div>

        {/* Streak */}
        {habit.current_streak > 0 && (
          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-bold ${
            habit.current_streak >= 7
              ? 'bg-orange-500/20 text-orange-400 animate-streak-glow'
              : 'bg-slate-700/50 text-slate-400'
          }`}>
            <Flame size={14} className={habit.current_streak >= 7 ? 'text-orange-400' : 'text-slate-500'} />
            {habit.current_streak}
          </div>
        )}
      </div>
    </div>
  );
}
