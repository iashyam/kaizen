import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { BudgetLog } from '../api';
import { X } from 'lucide-react';

interface Props {
  logs: BudgetLog[];
  dailyAllowance: number;
  onClose: () => void;
}

export default function SpendingChart({ logs, dailyAllowance, onClose }: Props) {
  const data = [...logs]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((l) => ({
      date: l.date.slice(8), // day number
      amount: l.amount_spent,
    }));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-700/50 rounded-t-3xl p-5 pb-8 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Daily Spending</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400">
            <X size={18} />
          </button>
        </div>

        {data.length === 0 ? (
          <div className="text-center text-slate-500 py-12 text-sm">No spending data this month</div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data} margin={{ top: 8, right: 4, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: 12,
                  fontSize: 13,
                }}
                labelFormatter={(label: string) => `Day ${label}`}
                formatter={(value: number) => [`\u20B9${value.toLocaleString('en-IN')}`, 'Spent']}
                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
              />
              {dailyAllowance > 0 && (
                <ReferenceLine
                  y={dailyAllowance}
                  stroke="#6366f1"
                  strokeDasharray="4 4"
                  strokeOpacity={0.6}
                />
              )}
              <Bar
                dataKey="amount"
                fill="#6366f1"
                radius={[4, 4, 0, 0]}
                maxBarSize={28}
              />
            </BarChart>
          </ResponsiveContainer>
        )}

        {dailyAllowance > 0 && data.length > 0 && (
          <div className="flex items-center gap-2 mt-3 justify-center">
            <div className="w-4 h-0 border-t border-dashed border-indigo-400/60" />
            <span className="text-[11px] text-slate-500">
              Daily budget: {'\u20B9'}{dailyAllowance.toLocaleString('en-IN')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
