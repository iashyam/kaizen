import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBudgetToday, getBudgetHistory, getBudgetSummary } from '../api';
import BudgetSummary from '../components/BudgetSummary';
import SpendingForm from '../components/SpendingForm';
import SpendingLog from '../components/SpendingLog';
import SpendingChart from '../components/SpendingChart';
import { BarChart3 } from 'lucide-react';

export default function BudgetPage() {
  const [showChart, setShowChart] = useState(false);
  const { data: budget, isLoading } = useQuery({
    queryKey: ['budget', 'today'],
    queryFn: getBudgetToday,
  });

  const { data: history } = useQuery({
    queryKey: ['budget', 'history'],
    queryFn: () => getBudgetHistory(),
  });

  const { data: summary } = useQuery({
    queryKey: ['budget', 'summary'],
    queryFn: () => getBudgetSummary(),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <div className="w-8 h-8 border-3 border-duo-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm text-txt-secondary font-medium">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
          <h1 className="text-2xl font-black text-txt-primary">Budget</h1>
        </div>
        <button
          onClick={() => setShowChart(true)}
          className="w-10 h-10 rounded-xl bg-duo-blue/10 flex items-center justify-center hover:bg-duo-blue/20 transition-colors active:scale-90"
        >
          <BarChart3 size={20} className="text-duo-blue" />
        </button>
      </div>

      {budget && <BudgetSummary budget={budget} />}

      <SpendingForm />

      {/* Monthly stats bar */}
      {summary && (
        <div className="bg-surface-card rounded-xl p-4 border border-brd">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-bold text-txt-secondary uppercase tracking-wider">Monthly Stats</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Avg/Day" value={`\u20B9${Math.round(summary.avg_daily_spend).toLocaleString('en-IN')}`} />
            <StatCard label="Logged" value={`${summary.days_logged}/${summary.days_in_month}`} />
            <StatCard
              label="Saved"
              value={`\u20B9${Math.abs(summary.total_saved).toLocaleString('en-IN')}`}
              highlight={summary.total_saved >= 0}
            />
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div className="text-xs font-bold text-txt-secondary uppercase tracking-wider mb-3">History</div>
        <SpendingLog logs={history ?? []} />
      </div>

      {showChart && (
        <SpendingChart
          logs={history ?? []}
          dailyAllowance={budget?.daily_allowance ?? 0}
          onClose={() => setShowChart(false)}
        />
      )}
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[11px] text-txt-muted mb-0.5">{label}</div>
      <div className={`text-sm font-black ${highlight ? 'text-duo-green' : 'text-txt-primary'}`}>{value}</div>
    </div>
  );
}
