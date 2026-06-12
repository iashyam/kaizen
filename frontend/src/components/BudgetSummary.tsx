import type { BudgetToday } from '../api';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  budget: BudgetToday;
}

export default function BudgetSummary({ budget }: Props) {
  const spent = budget.today_spent;
  const available = budget.available_budget;
  const isOver = available < 0;
  const savedThisMonth = budget.total_allowance_this_month - budget.total_spent_this_month;

  // Progress: how much of today's portion is spent
  const dailyProgress = budget.daily_allowance > 0
    ? Math.min(1, spent / budget.daily_allowance)
    : 0;

  return (
    <div className="bg-gradient-to-br from-indigo-600/20 via-slate-800/80 to-violet-600/10 rounded-3xl p-6 border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
      {/* Available budget - hero number */}
      <div className="text-center mb-6">
        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">Available Today</div>
        <div className={`text-5xl font-extrabold tracking-tight ${isOver ? 'text-red-400' : 'text-white'}`}>
          <span className="text-2xl font-medium text-slate-500 mr-1">&#8377;</span>
          {Math.abs(available).toLocaleString('en-IN')}
        </div>
        {isOver && <div className="text-xs text-red-400/80 mt-1">Over budget</div>}
      </div>

      {/* Progress ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r="56" fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="56" fill="none"
              stroke={isOver ? '#f87171' : dailyProgress > 0.8 ? '#f59e0b' : '#6366f1'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - dailyProgress)}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {budget.logged_today ? (
              <>
                <span className="text-xs text-slate-500">Spent</span>
                <span className="text-xl font-bold text-slate-200">&#8377;{spent.toLocaleString('en-IN')}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-slate-500">Not logged</span>
                <span className="text-sm text-slate-400">today</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={12} className="text-slate-500" />
            <span className="text-[11px] text-slate-500 font-medium">Month Spent</span>
          </div>
          <div className="text-lg font-bold text-slate-200">
            &#8377;{budget.total_spent_this_month.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={12} className="text-emerald-500" />
            <span className="text-[11px] text-slate-500 font-medium">Saved</span>
          </div>
          <div className={`text-lg font-bold ${savedThisMonth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            &#8377;{Math.abs(savedThisMonth).toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
}
