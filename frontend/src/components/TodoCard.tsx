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
    setTimeout(() => setAnimating(false), 500);
    onToggle(todo.id, todo.completed);
  };

  return (
    <div className={`flex items-center gap-3 p-3.5 rounded-xl transition-all duration-300 ${
      todo.completed
        ? 'bg-surface-card border border-brd opacity-60'
        : 'bg-surface-card border border-brd'
    }`}>
      <button
        onClick={handleToggle}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 flex-shrink-0 ${
          animating ? 'animate-jelly' : ''
        } ${
          todo.completed
            ? 'bg-duo-green border-duo-green'
            : 'border-txt-muted active:scale-90'
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
          ? 'text-txt-muted line-through'
          : 'text-txt-primary'
      }`}>
        {todo.name}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="text-txt-muted hover:text-duo-red p-1 rounded-xl hover:bg-duo-red/10 transition-all active:scale-90"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}
