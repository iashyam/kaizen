import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHabits, createHabit, deleteHabit, getHabitStreak } from '../api';
import type { Habit } from '../api';
import HabitCalendar from '../components/HabitCalendar';
import StreakBadge from '../components/StreakBadge';
import { CATEGORY_CONFIG } from '../models/habit';
import { Plus, X, Trash2, ChevronRight, Repeat, Calendar } from 'lucide-react';

const CATEGORIES = ['morning', 'evening', 'weekend', 'custom'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const REPEAT_OPTIONS = [
  { value: 'daily', label: 'Every Day', icon: '📅' },
  { value: 'specific_days', label: 'Specific Days', icon: '📆' },
  { value: 'weekly', label: 'Weekly', icon: '🔄' },
] as const;

function repeatLabel(habit: Habit): string {
  if (habit.repeat_type === 'daily') return 'Every day';
  if (habit.repeat_type === 'weekly') return 'Weekly';
  if (habit.repeat_type === 'specific_days' && habit.repeat_days?.length) {
    return habit.repeat_days.map(d => DAY_LABELS[d]).join(', ');
  }
  return 'Every day';
}

export default function HabitsPage() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('morning');
  const [newRepeatType, setNewRepeatType] = useState('daily');
  const [newRepeatDays, setNewRepeatDays] = useState<number[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: habits, isLoading } = useQuery({
    queryKey: ['habits'],
    queryFn: getHabits,
  });

  const addMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits-today'] });
      setNewName('');
      setNewRepeatType('daily');
      setNewRepeatDays([]);
      setShowAdd(false);
    },
  });

  const delMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habits-today'] });
    },
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addMutation.mutate({
      name: newName.trim(),
      category: newCategory,
      repeat_type: newRepeatType,
      repeat_days: newRepeatType === 'specific_days' ? newRepeatDays : [],
    });
  };

  const toggleDay = (day: number) => {
    setNewRepeatDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    );
  };

  const grouped = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = (habits ?? []).filter(h => h.category === cat);
    return acc;
  }, {} as Record<string, Habit[]>);

  return (
    <div className="px-4 pt-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Habits</h1>
          <div className="text-sm text-slate-500 mt-0.5">{(habits ?? []).length} active habits</div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`p-2.5 rounded-xl transition-all active:scale-90 ${
            showAdd
              ? 'bg-red-500/10 text-red-400'
              : 'bg-indigo-500/10 text-indigo-400'
          }`}
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-slate-800/80 backdrop-blur rounded-2xl p-5 mb-5 border border-slate-700/50 space-y-4 animate-fade-in-up">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="What habit do you want to build?"
            autoFocus
            className="w-full bg-slate-700/50 border border-slate-600/50 rounded-xl px-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 text-[15px]"
          />

          {/* Category */}
          <div>
            <div className="text-xs text-slate-500 font-medium mb-2">Category</div>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => {
                const config = CATEGORY_CONFIG[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                      newCategory === cat
                        ? `${config.bg} ${config.text} border ${config.border}`
                        : 'bg-slate-700/30 text-slate-500 border border-transparent'
                    }`}
                  >
                    <span className="text-base">{config.emoji}</span>
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Repeat */}
          <div>
            <div className="text-xs text-slate-500 font-medium mb-2">Repeat</div>
            <div className="flex gap-2">
              {REPEAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewRepeatType(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    newRepeatType === opt.value
                      ? 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-700/30 text-slate-500 border border-transparent'
                  }`}
                >
                  <span className="text-base">{opt.icon}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Day picker for specific_days */}
          {newRepeatType === 'specific_days' && (
            <div className="animate-fade-in-up">
              <div className="text-xs text-slate-500 font-medium mb-2">Select Days</div>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      newRepeatDays.includes(idx)
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-700/40 text-slate-500 hover:bg-slate-700/60'
                    }`}
                  >
                    {label.charAt(0)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={addMutation.isPending || !newName.trim() || (newRepeatType === 'specific_days' && newRepeatDays.length === 0)}
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white py-3 rounded-xl font-semibold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Create Habit
          </button>
        </form>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (habits ?? []).length === 0 && (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🌱</div>
          <div className="text-lg font-semibold text-slate-300 mb-1">No Habits Yet</div>
          <div className="text-sm text-slate-500">Tap + to create your first habit</div>
        </div>
      )}

      {CATEGORIES.map(cat => {
        const items = grouped[cat];
        if (!items?.length) return null;
        const config = CATEGORY_CONFIG[cat];
        return (
          <div key={cat} className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">{config.emoji}</span>
              <span className={`text-xs font-semibold uppercase tracking-wider ${config.text}`}>
                {config.label}
              </span>
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-xs text-slate-600">{items.length}</span>
            </div>
            <div className="space-y-2">
              {items.map(habit => (
                <div key={habit.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === habit.id ? null : habit.id)}
                    className="w-full text-left"
                  >
                    <div className={`flex items-center gap-3 p-4 rounded-2xl transition-all ${
                      expandedId === habit.id
                        ? `bg-gradient-to-r ${config.gradient} border ${config.border}`
                        : 'bg-slate-800/80 border border-slate-700/50 hover:border-slate-600/50'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-lg`}>
                        {config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-slate-100 truncate">{habit.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${config.text} opacity-60`}>{config.label}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Repeat size={10} />
                            {repeatLabel(habit)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`text-slate-500 transition-transform ${expandedId === habit.id ? 'rotate-90' : ''}`}
                      />
                    </div>
                  </button>

                  {expandedId === habit.id && (
                    <ExpandedHabitManagement
                      habit={habit}
                      onDelete={() => {
                        if (confirm(`Delete "${habit.name}"?`)) {
                          delMutation.mutate(habit.id);
                          setExpandedId(null);
                        }
                      }}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ExpandedHabitManagement({ habit, onDelete }: { habit: Habit; onDelete: () => void }) {
  const cat = CATEGORY_CONFIG[habit.category] || CATEGORY_CONFIG.custom;

  const { data: streak } = useQuery({
    queryKey: ['streak', habit.id],
    queryFn: () => getHabitStreak(habit.id),
  });

  return (
    <div className={`bg-slate-800/50 rounded-b-2xl p-4 border border-t-0 ${cat.border} space-y-4 -mt-1 animate-fade-in-up`}>
      {/* Repeat info */}
      <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-700/30 rounded-lg px-3 py-2">
        <Repeat size={12} />
        <span>{repeatLabel(habit)}</span>
        {habit.repeat_type === 'specific_days' && habit.repeat_days?.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {DAY_LABELS.map((label, idx) => (
              <span
                key={idx}
                className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center font-semibold ${
                  habit.repeat_days.includes(idx)
                    ? 'bg-indigo-500/30 text-indigo-400'
                    : 'text-slate-600'
                }`}
              >
                {label.charAt(0)}
              </span>
            ))}
          </div>
        )}
      </div>

      {streak && <StreakBadge current={streak.current_streak} longest={streak.longest_streak} />}
      <HabitCalendar habitId={habit.id} category={habit.category} />
      <button
        onClick={onDelete}
        className="flex items-center gap-2 text-red-400/70 hover:text-red-400 text-sm px-3 py-2 rounded-lg hover:bg-red-500/10 transition-all"
      >
        <Trash2 size={14} />
        Delete Habit
      </button>
    </div>
  );
}
