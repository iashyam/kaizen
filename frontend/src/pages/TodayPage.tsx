import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHabitsToday, checkHabit, uncheckHabit,
  getTodosToday, createTodo, completeTodo, uncompleteTodo, deleteTodo,
  reorderItems,
} from '../api';
import type { HabitWithStatus, Todo } from '../api';
import { CATEGORY_CONFIG } from '../models/habit';
import { Flame, Plus, GripVertical, Trash2 } from 'lucide-react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TodayItem = {
  kind: 'habit';
  data: HabitWithStatus;
  id: string;
  name: string;
  completed: boolean;
  order: number;
} | {
  kind: 'todo';
  data: Todo;
  id: string;
  name: string;
  completed: boolean;
  order: number;
};

function uniqueId(item: TodayItem) {
  return `${item.kind}-${item.id}`;
}

export default function TodayPage() {
  const queryClient = useQueryClient();
  const [newTodo, setNewTodo] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const { data: habits, isLoading: habitsLoading } = useQuery({
    queryKey: ['habits-today'],
    queryFn: getHabitsToday,
  });

  const { data: todos, isLoading: todosLoading } = useQuery({
    queryKey: ['todos-today'],
    queryFn: getTodosToday,
  });

  const items: TodayItem[] = useMemo(() => {
    const merged: TodayItem[] = [];
    for (const h of habits ?? []) {
      merged.push({ kind: 'habit', data: h, id: h.id, name: h.name, completed: h.completed_today, order: h.order });
    }
    for (const t of todos ?? []) {
      merged.push({ kind: 'todo', data: t, id: t.id, name: t.name, completed: t.completed, order: t.order });
    }
    merged.sort((a, b) => a.order - b.order);
    return merged;
  }, [habits, todos]);

  const incomplete = items.filter(i => !i.completed);
  const completed = items.filter(i => i.completed);
  const totalCompleted = completed.length;
  const totalItems = items.length;
  const progress = totalItems > 0 ? totalCompleted / totalItems : 0;

  const habitToggle = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const today = new Date().toISOString().split('T')[0];
      completed ? await uncheckHabit(id, today) : await checkHabit(id, today);
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['habits-today'] });
      const prev = queryClient.getQueryData<HabitWithStatus[]>(['habits-today']);
      queryClient.setQueryData<HabitWithStatus[]>(['habits-today'], old =>
        old?.map(h => h.id === id ? { ...h, completed_today: !completed, current_streak: completed ? Math.max(0, h.current_streak - 1) : h.current_streak + 1 } : h)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['habits-today'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['habits-today'] }),
  });

  const todoToggle = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      completed ? await uncompleteTodo(id) : await completeTodo(id);
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ['todos-today'] });
      const prev = queryClient.getQueryData<Todo[]>(['todos-today']);
      queryClient.setQueryData<Todo[]>(['todos-today'], old =>
        old?.map(t => t.id === id ? { ...t, completed: !completed } : t)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos-today'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos-today'] }),
  });

  const todoDeleteMut = useMutation({
    mutationFn: deleteTodo,
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ['todos-today'] });
      const prev = queryClient.getQueryData<Todo[]>(['todos-today']);
      queryClient.setQueryData<Todo[]>(['todos-today'], old => old?.filter(t => t.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos-today'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos-today'] }),
  });

  const addTodo = useMutation({
    mutationFn: createTodo,
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ['todos-today'] });
      const prev = queryClient.getQueryData<Todo[]>(['todos-today']);
      const optimistic: Todo = {
        id: `temp-${Date.now()}`,
        name: data.name,
        due_date: new Date().toISOString().split('T')[0],
        completed: false,
        order: (prev?.length ?? 0),
        created_at: new Date().toISOString(),
      };
      queryClient.setQueryData<Todo[]>(['todos-today'], old => [...(old ?? []), optimistic]);
      setNewTodo('');
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['todos-today'], ctx.prev);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos-today'] }),
  });

  const reorderMutation = useMutation({
    mutationFn: reorderItems,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits-today'] });
      queryClient.invalidateQueries({ queryKey: ['todos-today'] });
    },
  });

  const handleToggle = (item: TodayItem) => {
    if (item.kind === 'habit') {
      habitToggle.mutate({ id: item.id, completed: item.completed });
    } else {
      todoToggle.mutate({ id: item.id, completed: item.completed });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = incomplete.findIndex(i => uniqueId(i) === active.id);
    const newIndex = incomplete.findIndex(i => uniqueId(i) === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(incomplete, oldIndex, newIndex);
    const updates = reordered.map((item, i) => ({
      type: item.kind,
      id: item.id,
      order: i,
    }));
    // Also include completed items with their orders
    completed.forEach((item, i) => {
      updates.push({ type: item.kind, id: item.id, order: reordered.length + i });
    });
    reorderMutation.mutate(updates);
  };

  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    addTodo.mutate({ name: newTodo.trim() });
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
  const isLoading = habitsLoading || todosLoading;

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-sm text-slate-500 font-medium">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </div>
          <h1 className="text-2xl font-bold text-slate-100 mt-1">{greeting}</h1>
        </div>

        <div className="relative w-14 h-14">
          <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
            <circle cx="28" cy="28" r="24" fill="none" stroke="#1e293b" strokeWidth="4" />
            <circle
              cx="28" cy="28" r="24" fill="none"
              stroke={progress === 1 ? '#10b981' : '#6366f1'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress)}`}
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs font-bold text-slate-100">{totalCompleted}</span>
            <span className="text-[8px] text-slate-500">/{totalItems}</span>
          </div>
        </div>
      </div>

      {/* All done */}
      {totalItems > 0 && progress === 1 && (
        <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-4 mb-5 text-center animate-fade-in-up">
          <div className="text-2xl mb-1">🎉</div>
          <div className="text-sm font-semibold text-emerald-400">All done for today!</div>
        </div>
      )}

      {/* Quick add */}
      <form onSubmit={handleAddTodo} className="flex gap-2 mb-5">
        <input
          type="text"
          value={newTodo}
          onChange={e => setNewTodo(e.target.value)}
          placeholder="Add a task..."
          className="flex-1 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30"
        />
        <button
          type="submit"
          disabled={!newTodo.trim()}
          className="bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 p-2.5 rounded-xl transition-all active:scale-90 disabled:opacity-30"
        >
          <Plus size={18} />
        </button>
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* Sortable incomplete items */}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={incomplete.map(uniqueId)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 mb-4">
                {incomplete.map(item => (
                  <SortableCard
                    key={uniqueId(item)}
                    uid={uniqueId(item)}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onDelete={item.kind === 'todo' ? () => todoDeleteMut.mutate(item.id) : undefined}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Completed */}
          {completed.length > 0 && (
            <>
              <div className="flex items-center gap-2 mb-2 mt-6">
                <div className="h-px flex-1 bg-slate-800" />
                <span className="text-[11px] text-slate-600 font-medium">Completed ({completed.length})</span>
                <div className="h-px flex-1 bg-slate-800" />
              </div>
              <div className="space-y-1.5">
                {completed.map(item => (
                  <UnifiedCard
                    key={uniqueId(item)}
                    item={item}
                    onToggle={() => handleToggle(item)}
                    onDelete={item.kind === 'todo' ? () => todoDeleteMut.mutate(item.id) : undefined}
                  />
                ))}
              </div>
            </>
          )}

          {totalItems === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">🌱</div>
              <div className="text-lg font-semibold text-slate-300 mb-1">Your Day is Clear</div>
              <div className="text-sm text-slate-500">Add tasks above or create habits in the Habits tab</div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Sortable wrapper
function SortableCard({ uid, item, onToggle, onDelete }: {
  uid: string;
  item: TodayItem;
  onToggle: () => void;
  onDelete?: () => void;
}) {
  const {
    attributes, listeners, setNodeRef, setActivatorNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <UnifiedCard
        item={item}
        onToggle={onToggle}
        onDelete={onDelete}
        dragHandleRef={setActivatorNodeRef}
        dragListeners={listeners}
        isDragging={isDragging}
      />
    </div>
  );
}

// Card component
function UnifiedCard({
  item,
  onToggle,
  onDelete,
  dragHandleRef,
  dragListeners,
  isDragging,
}: {
  item: TodayItem;
  onToggle: () => void;
  onDelete?: () => void;
  dragHandleRef?: (el: HTMLElement | null) => void;
  dragListeners?: Record<string, Function>;
  isDragging?: boolean;
}) {
  const [animating, setAnimating] = useState(false);
  const isHabit = item.kind === 'habit';
  const habitData = isHabit ? item.data as HabitWithStatus : null;
  const cat = isHabit ? (CATEGORY_CONFIG[habitData!.category] || CATEGORY_CONFIG.custom) : null;

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setAnimating(true);
    setTimeout(() => setAnimating(false), 300);
    onToggle();
  };

  const showDragHandle = !item.completed && dragHandleRef;

  return (
    <div
      className={`flex items-center gap-2.5 p-3.5 rounded-2xl transition-all duration-300 ${
        isDragging ? 'shadow-2xl shadow-indigo-500/20 scale-[1.02]' : ''
      } ${
        item.completed
          ? isHabit
            ? `bg-gradient-to-r ${cat!.gradient} border ${cat!.border} opacity-50`
            : 'bg-slate-800/30 border border-slate-700/20 opacity-50'
          : isHabit
            ? `bg-gradient-to-r ${cat!.gradient} border ${cat!.border}`
            : 'bg-slate-800/60 border border-slate-700/40'
      }`}
    >
      {/* Drag handle */}
      {showDragHandle && (
        <div
          ref={dragHandleRef}
          {...dragListeners}
          className="touch-none cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-400 transition-colors p-0.5 -ml-1"
        >
          <GripVertical size={16} />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 flex-shrink-0 ${
          animating ? 'animate-check-pop' : ''
        } ${
          item.completed
            ? isHabit ? `${cat!.bg} shadow-lg` : 'bg-emerald-500/20'
            : isHabit ? 'bg-slate-700/50 active:scale-90' : 'bg-slate-700/40 active:scale-90'
        }`}
      >
        {isHabit ? (
          <span className={`text-lg ${item.completed ? '' : 'opacity-40'}`}>{cat!.icon}</span>
        ) : (
          item.completed ? (
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 7L5.5 10.5L12 3.5" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-500" />
          )
        )}
        {item.completed && isHabit && (
          <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className={`text-[14px] font-medium truncate transition-all ${
          item.completed ? 'text-slate-500 line-through' : 'text-slate-100'
        }`}>
          {item.name}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {isHabit && cat && (
            <span className={`text-[11px] ${cat.text} opacity-60`}>{cat.label}</span>
          )}
          {!isHabit && (
            <span className="text-[11px] text-slate-500">Task</span>
          )}
        </div>
      </div>

      {/* Streak or delete */}
      {isHabit && habitData && habitData.current_streak > 0 && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
          habitData.current_streak >= 7
            ? 'bg-orange-500/20 text-orange-400 animate-streak-glow'
            : 'bg-slate-700/50 text-slate-400'
        }`}>
          <Flame size={12} />
          {habitData.current_streak}
        </div>
      )}

      {!isHabit && onDelete && (
        <button
          onClick={onDelete}
          className="text-slate-600 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-all"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}
