import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getHabits, createHabit, deleteHabit, getHabitStreak } from '../api';
import type { Habit } from '../api';
import HabitCalendar from '../components/HabitCalendar';
import StreakBadge from '../components/StreakBadge';
import { CATEGORY_CONFIG, DEFAULT_EMOJIS } from '../models/habit';
import { Plus, X, Trash2, ChevronRight, Repeat, Calendar } from 'lucide-react';

const CATEGORIES = ['morning', 'custom', 'evening', 'weekend'] as const;
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const REPEAT_OPTIONS = [
  { value: 'daily', label: 'Every Day', icon: '\u{1F4C5}' },
  { value: 'specific_days', label: 'Specific Days', icon: '\u{1F4C6}' },
  { value: 'weekly', label: 'Weekly', icon: '\u{1F504}' },
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
  const [newEmoji, setNewEmoji] = useState('');
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
      setNewEmoji('');
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
      emoji: newEmoji || undefined,
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
          <h1 className="text-2xl font-black text-txt-primary">Habits</h1>
          <div className="text-sm text-txt-secondary mt-0.5">{(habits ?? []).length} active habits</div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className={`p-2.5 rounded-xl transition-all active:scale-90 ${
            showAdd
              ? 'bg-duo-red/10 text-duo-red'
              : 'bg-duo-green/10 text-duo-green'
          }`}
        >
          {showAdd ? <X size={20} /> : <Plus size={20} />}
        </button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-surface-card rounded-xl p-5 mb-5 border border-brd space-y-4 animate-fade-in-up">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="What habit do you want to build?"
            autoFocus
            className="w-full bg-surface-input border border-brd rounded-xl px-4 py-3 text-txt-primary placeholder-txt-muted focus:outline-none focus:border-duo-green/50 focus:ring-2 focus:ring-duo-green/20 text-[15px] transition-all"
          />

          {/* Emoji */}
          <div>
            <div className="text-xs text-txt-secondary font-bold mb-2">Icon</div>
            <div className="flex gap-1.5 flex-wrap">
              {DEFAULT_EMOJIS.map(e => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setNewEmoji(newEmoji === e ? '' : e)}
                  className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all active:scale-90 ${
                    newEmoji === e
                      ? 'bg-duo-green/20 ring-2 ring-duo-green/40'
                      : 'bg-surface-input'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <div className="text-xs text-txt-secondary font-bold mb-2">Category</div>
            <div className="flex gap-2">
              {CATEGORIES.map(cat => {
                const config = CATEGORY_CONFIG[cat];
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewCategory(cat)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      newCategory === cat
                        ? `${config.bg} ${config.text} border ${config.border}`
                        : 'bg-surface-input text-txt-muted border border-transparent'
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
            <div className="text-xs text-txt-secondary font-bold mb-2">Repeat</div>
            <div className="flex gap-2">
              {REPEAT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setNewRepeatType(opt.value)}
                  className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                    newRepeatType === opt.value
                      ? 'bg-duo-blue/15 text-duo-blue border border-duo-blue/30'
                      : 'bg-surface-input text-txt-muted border border-transparent'
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
              <div className="text-xs text-txt-secondary font-bold mb-2">Select Days</div>
              <div className="flex gap-1.5">
                {DAY_LABELS.map((label, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold transition-all duration-200 ${
                      newRepeatDays.includes(idx)
                        ? 'bg-duo-blue text-white'
                        : 'bg-surface-input text-txt-muted'
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
            className="w-full bg-duo-green text-white py-3 rounded-xl font-bold text-[15px] transition-all active:scale-[0.98] disabled:opacity-40"
          >
            Create Habit
          </button>
        </form>
      )}

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-3 border-duo-green border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!isLoading && (habits ?? []).length === 0 && (
        <div className="text-center py-16 animate-bounce-in">
          <div className="text-6xl mb-4">{'\u{1F331}'}</div>
          <div className="text-lg font-black text-txt-primary mb-1">No Habits Yet</div>
          <div className="text-sm text-txt-secondary">Tap + to create your first habit</div>
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
              <span className={`text-xs font-black uppercase tracking-wider ${config.text}`}>
                {config.label}
              </span>
              <div className="flex-1 h-px bg-brd" />
              <span className="text-xs text-txt-muted font-bold">{items.length}</span>
            </div>
            <div className="space-y-2.5">
              {items.map(habit => (
                <div key={habit.id}>
                  <button
                    onClick={() => setExpandedId(expandedId === habit.id ? null : habit.id)}
                    className="w-full text-left"
                  >
                    <div className={`flex items-center gap-3 p-4 transition-all ${
                      expandedId === habit.id
                        ? `bg-surface-card border border-b-0 ${config.border} rounded-t-xl`
                        : 'bg-surface-card border border-brd rounded-xl'
                    }`}>
                      <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center text-lg`}>
                        {habit.emoji || config.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-semibold text-txt-primary truncate">{habit.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs ${config.text} font-medium`}>{config.label}</span>
                          <span className="text-brd">{'\u{00B7}'}</span>
                          <span className="text-xs text-txt-muted flex items-center gap-1">
                            <Repeat size={10} />
                            {repeatLabel(habit)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={16}
                        className={`text-txt-muted transition-transform ${expandedId === habit.id ? 'rotate-90' : ''}`}
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
    <div className={`bg-surface-card rounded-b-xl p-4 border border-t-0 ${cat.border} space-y-4 animate-fade-in-up`}>
      {/* Repeat info */}
      <div className="flex items-center gap-2 text-xs text-txt-secondary bg-surface-input rounded-xl px-3 py-2">
        <Repeat size={12} />
        <span>{repeatLabel(habit)}</span>
        {habit.repeat_type === 'specific_days' && habit.repeat_days?.length > 0 && (
          <div className="flex gap-1 ml-auto">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((label, idx) => (
              <span
                key={idx}
                className={`w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-bold ${
                  habit.repeat_days.includes(idx)
                    ? 'bg-duo-blue/20 text-duo-blue'
                    : 'text-txt-muted'
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
        className="flex items-center gap-2 text-duo-red/70 hover:text-duo-red text-sm px-3 py-2 rounded-xl hover:bg-duo-red/10 transition-all active:scale-95"
      >
        <Trash2 size={14} />
        Delete Habit
      </button>
    </div>
  );
}
