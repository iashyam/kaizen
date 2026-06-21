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
    emoji: '\u{1F305}',
    gradient: 'from-duo-orange/20 to-duo-yellow/10',
    bg: 'bg-duo-orange/20',
    text: 'text-duo-orange',
    border: 'border-duo-orange/25',
    icon: '\u{2600}\u{FE0F}',
  },
  evening: {
    label: 'Evening',
    emoji: '\u{1F319}',
    gradient: 'from-duo-purple/20 to-duo-purple/5',
    bg: 'bg-duo-purple/20',
    text: 'text-duo-purple',
    border: 'border-duo-purple/25',
    icon: '\u{1F319}',
  },
  weekend: {
    label: 'Weekend',
    emoji: '\u{1F389}',
    gradient: 'from-duo-green/20 to-duo-green/5',
    bg: 'bg-duo-green/20',
    text: 'text-duo-green',
    border: 'border-duo-green/25',
    icon: '\u{1F33F}',
  },
  custom: {
    label: 'Anytime',
    emoji: '\u{2B50}',
    gradient: 'from-duo-blue/20 to-duo-blue/5',
    bg: 'bg-duo-blue/20',
    text: 'text-duo-blue',
    border: 'border-duo-blue/25',
    icon: '\u{2728}',
  },
};

export const DEFAULT_EMOJIS = [
  '\u{1F9D8}', '\u{1F4D6}', '\u{1F4AA}', '\u{1F3C3}', '\u{1F4A7}', '\u{1F34E}', '\u{1F4DD}', '\u{1F3AF}',
  '\u{1F9F9}', '\u{1F4A4}', '\u{1F3A8}', '\u{1F3B5}', '\u{1F48A}', '\u{1F331}', '\u{1F4F1}', '\u{1F6B6}',
];
