import type { BudgetToday } from '../api';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  budget: BudgetToday;
}

export default function BudgetSummary({ budget }: Props) {
  const spent = budget.today_spent;
  const available = budget.available_budget;
  const isOver = available < 0;

  const dailyProgress = budget.daily_allowance > 0
    ? Math.min(1, spent / budget.daily_allowance)
    : 0;

  return (
    <div className="bg-surface-card rounded-xl p-6 border border-brd">
      {/* Available budget - hero number */}
      <div className="text-center mb-6">
        <div className="text-xs text-txt-muted font-bold uppercase tracking-wider mb-2">Available Balance</div>
        <div className={`text-5xl font-black tracking-tight ${isOver ? 'text-duo-red' : 'text-txt-primary'}`}>
          <span className="text-2xl font-medium text-txt-muted mr-1">&#8377;</span>
          {Math.abs(available).toLocaleString('en-IN')}
        </div>
        {isOver && <div className="text-xs text-duo-red/80 font-semibold mt-1">Over budget</div>}
      </div>

      {/* Progress ring */}
      <div className="flex justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
            <circle cx="64" cy="64" r="56" fill="none" stroke="var(--border-color)" strokeWidth="8" />
            <circle
              cx="64" cy="64" r="56" fill="none"
              stroke={isOver ? '#FF4B4B' : dailyProgress > 0.8 ? '#FF9600' : '#58CC02'}
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
                <span className="text-xs text-txt-muted">Spent</span>
                <span className="text-xl font-black text-txt-primary">&#8377;{spent.toLocaleString('en-IN')}</span>
              </>
            ) : (
              <>
                <span className="text-xs text-txt-muted">Not logged</span>
                <span className="text-sm text-txt-secondary">today</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-input rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown size={12} className="text-txt-muted" />
            <span className="text-[11px] text-txt-muted font-bold">Today Spent</span>
          </div>
          <div className="text-lg font-black text-txt-primary">
            &#8377;{spent.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-surface-input rounded-xl p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp size={12} className="text-duo-green" />
            <span className="text-[11px] text-txt-muted font-bold">Daily Rate</span>
          </div>
          <div className="text-lg font-black text-duo-green">
            &#8377;{budget.daily_allowance.toLocaleString('en-IN')}
          </div>
        </div>
      </div>
    </div>
  );
}
