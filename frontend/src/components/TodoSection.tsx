import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTodosToday, createTodo, completeTodo, uncompleteTodo, deleteTodo } from '../api';
import TodoCard from './TodoCard';
import { Plus } from 'lucide-react';

export default function TodoSection() {
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState('');

  const { data: todos } = useQuery({
    queryKey: ['todos-today'],
    queryFn: getTodosToday,
  });

  const addMutation = useMutation({
    mutationFn: createTodo,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['todos-today'] });
      const prev = queryClient.getQueryData<Awaited<ReturnType<typeof getTodosToday>>>(['todos-today']);
      const optimistic = {
        id: `temp-${Date.now()}`,
        name: data.name,
        due_date: new Date().toISOString().split('T')[0],
        completed: false,
        order: (prev?.length ?? 0),
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData(['todos-today'], [...(prev ?? []), optimistic]);
      setNewTodo('');
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev?: unknown } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(['todos-today'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos-today'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      if (completed) {
        await uncompleteTodo(id);
      } else {
        await completeTodo(id);
      }
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos-today'] });
      const prev = queryClient.getQueryData<any[]>(['todos-today']);
      queryClient.setQueryData(['todos-today'], prev?.map((t: any) => t.id === id ? { ...t, completed: !completed } : t));
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev?: unknown } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(['todos-today'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos-today'] }),
  });

  const delMutation = useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos-today'] });
      const prev = queryClient.getQueryData<any[]>(['todos-today']);
      queryClient.setQueryData(['todos-today'], prev?.filter((t: any) => t.id !== id));
      return { prev };
    },
    onError: (_err: unknown, _vars: unknown, ctx: { prev?: unknown } | undefined) => {
      if (ctx?.prev) queryClient.setQueryData(['todos-today'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos-today'] }),
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addMutation.mutate({ name: newTodo.trim() });
  };

  const incomplete = (todos ?? []).filter(t => !t.completed);
  const completed = (todos ?? []).filter(t => t.completed);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">{'\u{1F4CB}'}</span>
        <span className="text-xs font-bold uppercase tracking-wider text-txt-secondary">Tasks</span>
        <div className="flex-1 h-px bg-brd" />
        {todos && todos.length > 0 && (
          <span className="text-xs text-txt-muted font-bold">
            {completed.length}/{todos.length}
          </span>
        )}
      </div>

      {/* Quick add */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newTodo}
            onChange={e => setNewTodo(e.target.value)}
            placeholder="Add a task..."
            className="w-full bg-surface-input border border-brd rounded-xl px-4 py-2.5 text-sm text-txt-primary placeholder-txt-muted focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 transition-all"
          />
        </div>
        <button
          type="submit"
          disabled={!newTodo.trim()}
          className="bg-duo-green/15 hover:bg-duo-green/25 text-duo-green p-2.5 rounded-full transition-all active:scale-90 disabled:opacity-30"
        >
          <Plus size={18} />
        </button>
      </form>

      {/* Incomplete todos */}
      <div className="space-y-1.5">
        {incomplete.map(todo => (
          <TodoCard
            key={todo.id}
            todo={todo}
            onToggle={(id, completed) => toggleMutation.mutate({ id, completed })}
            onDelete={id => delMutation.mutate(id)}
          />
        ))}
      </div>

      {/* Completed todos */}
      {completed.length > 0 && (
        <div className="mt-3">
          <div className="text-[11px] text-txt-muted font-bold mb-1.5">
            Completed ({completed.length})
          </div>
          <div className="space-y-1">
            {completed.map(todo => (
              <TodoCard
                key={todo.id}
                todo={todo}
                onToggle={(id, completed) => toggleMutation.mutate({ id, completed })}
                onDelete={id => delMutation.mutate(id)}
              />
            ))}
          </div>
        </div>
      )}

      {!todos?.length && (
        <div className="text-center py-4 text-sm text-txt-muted">No tasks for today</div>
      )}
    </div>
  );
}
