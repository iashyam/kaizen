import type { BudgetLog } from '../api';

interface Props {
  logs: BudgetLog[];
}

export default function SpendingLog({ logs }: Props) {
  if (!logs.length) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-2">{'\u{1F4DD}'}</div>
        <div className="text-sm text-txt-muted">No spending logged this month</div>
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
            className={`flex items-center justify-between rounded-xl p-4 transition-all ${
              isToday
                ? 'bg-duo-green/10 border border-duo-green/20'
                : 'bg-surface-card border border-brd'
            }`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                isToday ? 'bg-duo-green/20 text-duo-green' : 'bg-surface-input text-txt-secondary'
              }`}>
                {new Date(log.date + 'T00:00:00').getDate()}
              </div>
              <div>
                <div className="text-sm font-semibold text-txt-primary">
                  {new Date(log.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', month: 'short' })}
                  {isToday && <span className="text-xs text-duo-green font-bold ml-2">Today</span>}
                </div>
                {log.note && <div className="text-xs text-txt-muted mt-0.5">{log.note}</div>}
              </div>
            </div>
            <div className="text-sm font-black text-txt-primary">
              &#8377;{log.amount_spent.toLocaleString('en-IN')}
            </div>
          </div>
        );
      })}
    </div>
  );
}
