import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { Todo } from '../api';

interface Props {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TodoCard({ todo, onToggle, onDelete }: Props) {
  const [animating, setAnimating] = useState(false);

  const handleToggle = () => {
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onToggle(todo.id, todo.completed);
  };

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${
      todo.completed
        ? 'bg-slate-800/30 border border-slate-700/20'
        : 'bg-slate-800/60 border border-slate-700/40'
    }`}>
      <button
        onClick={handleToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          animating ? 'animate-check-pop' : ''
        } ${
          todo.completed
            ? 'bg-emerald-500 border-emerald-500'
            : 'border-slate-500 hover:border-emerald-400 active:scale-90'
        }`}
      >
        {todo.completed && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      <span className={`flex-1 text-sm transition-all ${
        todo.completed
          ? 'text-slate-500 line-through'
          : 'text-slate-200'
      }`}>
        {todo.name}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="text-slate-600 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
        style={{ opacity: 1 }}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
