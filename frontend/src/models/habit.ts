import type { HabitWithStatus } from '../api';

export interface HabitCreate {
  name: string;
  category: string;
  emoji?: string;
  reminder_time?: string;
}

export const CATEGORY_CONFIG: Record<string, {
  label: string;
  emoji: string;
  gradient: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}> = {
  morning: {
    label: 'Morning',
    emoji: '🌅',
    gradient: 'from-amber-500/20 to-orange-500/10',
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/20',
    icon: '☀️',
  },
  evening: {
    label: 'Evening',
    emoji: '🌙',
    gradient: 'from-violet-500/20 to-purple-500/10',
    bg: 'bg-violet-500/10',
    text: 'text-violet-400',
    border: 'border-violet-500/20',
    icon: '🌙',
  },
  weekend: {
    label: 'Weekend',
    emoji: '🎉',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/20',
    icon: '🌿',
  },
  custom: {
    label: 'Anytime',
    emoji: '⭐',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/20',
    icon: '✨',
  },
};

export const DEFAULT_EMOJIS = [
  '🧘', '📖', '💪', '🏃', '💧', '🍎', '📝', '🎯',
  '🧹', '💤', '🎨', '🎵', '💊', '🌱', '📱', '🚶',
];
