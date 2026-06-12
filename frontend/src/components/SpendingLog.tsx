import type { BudgetLog } from '../api';

interface Props {
  logs: BudgetLog[];
}

export default function SpendingLog({ logs }: Props) {
  if (!logs.length) {
    return (
      <div className="text-center py-10">
        <div className="text-3xl mb-2">📝</div>
        <div className="text-sm text-slate-500">No spending logged this month</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log, i) => {
        const isToday = log.date === new Date().toISOString().split('T')[0];
        return (
          <div
            key={log.date}
            className={`flex items-center justify-between rounded-2xl p-4 transition-all ${
              isToday
                ? 'bg-indigo-500/10 border border-indigo-500/20'
                : 'bg-slate-800/60 border border-slate-700/30'
            }`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold ${
                isToday ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700/50 text-slate-400'
              }`}>
                {new Date(log.date + 'T00:00:00').getDate()}
              </div>
              <div>
                <div className="text-sm font-medium text-slate-300">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short' })}
                  {isToday && <span className="text-xs text-indigo-400 ml-2">Today</span>}
                </div>
                {log.note && <div className="text-xs text-slate-500 mt-0.5">{log.note}</div>}
              </div>
            </div>
            <div className="text-sm font-bold text-slate-200">
              &#8377;{log.amount_spent.toLocaleString('en-IN')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
