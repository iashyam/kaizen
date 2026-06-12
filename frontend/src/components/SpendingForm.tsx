import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logSpending } from '../api';
import { ArrowRight } from 'lucide-react';

export default function SpendingForm() {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: logSpending,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget'] });
      setAmount('');
      setNote('');
      setShowNote(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(amount);
    if (isNaN(val) || val < 0) return;
    mutation.mutate({ amount_spent: val, note });
  };

  const quickAmounts = [100, 200, 300, 500];

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/80 backdrop-blur rounded-2xl p-5 border border-slate-700/50 space-y-4">
      <div className="text-sm font-semibold text-slate-300">Log Spending</div>

      {/* Amount input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-lg">&#8377;</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl pl-10 pr-14 py-3.5 text-2xl font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
          min="0"
          inputMode="numeric"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !amount}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-600 text-white p-2.5 rounded-lg transition-all active:scale-90"
        >
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Quick amounts */}
      <div className="flex gap-2">
        {quickAmounts.map(amt => (
          <button
            key={amt}
            type="button"
            onClick={() => setAmount(amt.toString())}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              amount === amt.toString()
                ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                : 'bg-slate-700/30 text-slate-500 border border-transparent hover:bg-slate-700/50'
            }`}
          >
            {amt}
          </button>
        ))}
      </div>

      {/* Note toggle + input */}
      {!showNote ? (
        <button
          type="button"
          onClick={() => setShowNote(true)}
          className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
        >
          + Add a note
        </button>
      ) : (
        <input
          type="text"
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="What did you spend on?"
          autoFocus
          className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 animate-fade-in-up"
        />
      )}
    </form>
  );
}
