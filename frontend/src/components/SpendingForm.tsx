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
    <form onSubmit={handleSubmit} className="bg-surface-card rounded-xl p-5 border border-brd space-y-4">
      <div className="text-sm font-bold text-txt-primary">Log Spending</div>

      {/* Amount input */}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-txt-muted text-lg">&#8377;</span>
        <input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="0"
          className="w-full bg-surface-input border border-brd rounded-xl pl-10 pr-14 py-3.5 text-2xl font-black text-txt-primary placeholder-txt-muted focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 transition-all"
          min="0"
          inputMode="numeric"
        />
        <button
          type="submit"
          disabled={mutation.isPending || !amount}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-duo-green hover:bg-duo-green-dark disabled:bg-surface-input text-white p-2.5 rounded-full transition-all active:scale-90"
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
            className={`flex-1 py-2 rounded-full text-sm font-bold transition-all active:scale-95 ${
              amount === amt.toString()
                ? 'bg-duo-blue/15 text-duo-blue border border-duo-blue/30'
                : 'bg-surface-input text-txt-muted border border-transparent'
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
          className="text-xs text-txt-muted hover:text-txt-secondary transition-colors font-medium"
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
          className="w-full bg-surface-input border border-brd rounded-xl px-4 py-2.5 text-sm text-txt-primary placeholder-txt-muted focus:outline-none focus:border-duo-green/50 animate-fade-in-up transition-all"
        />
      )}
    </form>
  );
}
