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
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="text-sm text-slate-500 font-medium">
            {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Budget</h1>
        </div>
        <button
          onClick={() => setShowChart(true)}
          className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center hover:bg-indigo-500/20 transition-colors"
        >
          <BarChart3 size={20} className="text-indigo-400" />
        </button>
      </div>

      {budget && <BudgetSummary budget={budget} />}

      <SpendingForm />

      {/* Monthly stats bar */}
      {summary && (
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-4 border border-slate-700/30">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Monthly Stats</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Avg/Day" value={`₹${Math.round(summary.avg_daily_spend).toLocaleString('en-IN')}`} />
            <StatCard label="Logged" value={`${summary.days_logged}/${summary.days_in_month}`} />
            <StatCard
              label="Saved"
              value={`₹${Math.abs(summary.total_saved).toLocaleString('en-IN')}`}
              highlight={summary.total_saved >= 0}
            />
          </div>
        </div>
      )}

      {/* History */}
      <div>
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">History</div>
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
      <div className="text-[11px] text-slate-500 mb-0.5">{label}</div>
      <div className={`text-sm font-bold ${highlight ? 'text-emerald-400' : 'text-slate-200'}`}>{value}</div>
    </div>
  );
}
