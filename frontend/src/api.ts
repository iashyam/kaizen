const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

// Auth
export interface User { id: string; email: string; name: string; }
export interface TokenResponse { access_token: string; token_type: string; user: User; }

export const authSignup = (data: { email: string; password: string; name: string }) =>
  request<TokenResponse>('/auth/signup', { method: 'POST', body: JSON.stringify(data) });
export const authLogin = (data: { email: string; password: string }) =>
  request<TokenResponse>('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const authMe = () => request<User>('/auth/me');

// Habits
export const getHabitsToday = () => request<HabitWithStatus[]>('/habits/today');
export const getHabits = () => request<Habit[]>('/habits');
export const createHabit = (data: { name: string; category: string; emoji?: string; repeat_type?: string; repeat_days?: number[]; reminder_time?: string }) =>
  request<Habit>('/habits', { method: 'POST', body: JSON.stringify(data) });
export const updateHabit = (id: string, data: Partial<Habit>) =>
  request<Habit>(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteHabit = (id: string) =>
  request(`/habits/${id}`, { method: 'DELETE' });
export const checkHabit = (id: string, date: string) =>
  request(`/habits/${id}/check`, { method: 'POST', body: JSON.stringify({ date }) });
export const uncheckHabit = (id: string, date: string) =>
  request(`/habits/${id}/check/${date}`, { method: 'DELETE' });
export const getHabitStreak = (id: string) =>
  request<{ current_streak: number; longest_streak: number }>(`/habits/${id}/streak`);
export const getHabitLogs = (id: string, start: string, end: string) =>
  request<{ date: string; completed: boolean }[]>(`/habits/${id}/logs?start=${start}&end=${end}`);

// Budget
export const getBudgetToday = () => request<BudgetToday>('/budget/today');
export const logSpending = (data: { amount_spent: number; note?: string }) =>
  request('/budget/log', { method: 'POST', body: JSON.stringify(data) });
export const updateSpending = (date: string, data: { amount_spent: number; note?: string }) =>
  request(`/budget/log/${date}`, { method: 'PUT', body: JSON.stringify(data) });
export const getBudgetHistory = (month?: string) =>
  request<BudgetLog[]>(`/budget/history${month ? `?month=${month}` : ''}`);
export const getBudgetSummary = (month?: string) =>
  request<BudgetSummary>(`/budget/summary${month ? `?month=${month}` : ''}`);
export const withdrawSavings = () =>
  request<{ ok: boolean; reset_date: string }>('/budget/withdraw', { method: 'POST' });

// Todos
export const getTodosToday = () => request<Todo[]>('/todos/today');
export const getTodosByDate = (date: string) => request<Todo[]>(`/todos/by-date?date=${encodeURIComponent(date)}`);
export const createTodo = (data: { name: string; due_date?: string }) =>
  request<Todo>('/todos', { method: 'POST', body: JSON.stringify(data) });
export const updateTodo = (id: string, data: { name?: string; due_date?: string }) =>
  request<Todo>(`/todos/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const deleteTodo = (id: string) =>
  request(`/todos/${id}`, { method: 'DELETE' });
export const completeTodo = (id: string) =>
  request(`/todos/${id}/complete`, { method: 'POST' });
export const uncompleteTodo = (id: string) =>
  request(`/todos/${id}/complete`, { method: 'DELETE' });

// Challenges
export const getChallenges = () => request<Challenge[]>('/challenges');
export const getChallenge = (id: string) => request<Challenge>(`/challenges/${id}`);
export const createChallenge = (data: { name: string; habit_ids: string[]; target_days?: number }) =>
  request<Challenge>('/challenges', { method: 'POST', body: JSON.stringify(data) });
export const updateChallenge = (id: string, data: { name?: string; habit_ids?: string[]; target_days?: number }) =>
  request<Challenge>(`/challenges/${id}`, { method: 'PUT', body: JSON.stringify(data) });
export const extendChallenge = (id: string, extra_days: number) =>
  request<Challenge>(`/challenges/${id}/extend`, { method: 'POST', body: JSON.stringify({ extra_days }) });
export const deleteChallenge = (id: string) =>
  request(`/challenges/${id}`, { method: 'DELETE' });
export const getChallengeToday = (id: string) =>
  request<ChallengeToday>(`/challenges/${id}/today`);
export const getChallengeCalendar = (id: string, start: string, end: string) =>
  request<{ date: string; completed: boolean }[]>(`/challenges/${id}/calendar?start=${start}&end=${end}`);

// Reorder
export const reorderItems = (items: { type: string; id: string; order: number }[]) =>
  request('/reorder', { method: 'POST', body: JSON.stringify(items) });

// Settings
export const getSettings = () => request<AppSettings>('/settings');
export const updateSettings = (data: Partial<AppSettings>) =>
  request('/settings', { method: 'PUT', body: JSON.stringify(data) });
export const subscribePush = (subscription: PushSubscriptionJSON) =>
  request('/notifications/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) });
export const getVapidPublicKey = () => request<{ public_key: string }>('/vapid-public-key');
export const testNotification = () => request('/notifications/test', { method: 'POST' });

// Types
export interface Habit {
  id: string;
  name: string;
  category: string;
  reminder_time?: string;
  repeat_type: string;  // daily | specific_days | weekly
  repeat_days: number[]; // 0=Mon..6=Sun
  emoji?: string;
  order: number;
  created_at: string;
  archived: boolean;
}

export interface HabitWithStatus extends Habit {
  completed_today: boolean;
  current_streak: number;
}

export interface BudgetToday {
  date: string;
  daily_allowance: number;
  available_budget: number;
  logged_today: boolean;
  today_spent: number;
}

export interface BudgetLog {
  date: string;
  amount_spent: number;
  note?: string;
}

export interface BudgetSummary {
  month: string;
  total_allowance: number;
  total_spent: number;
  total_saved: number;
  days_logged: number;
  days_in_month: number;
  avg_daily_spend: number;
}

export interface Todo {
  id: string;
  name: string;
  due_date: string;
  completed: boolean;
  order: number;
  created_at: string;
}

export interface ChallengeMilestone {
  days: number;
  reached: boolean;
  date?: string | null;
}

export interface Challenge {
  id: string;
  name: string;
  habit_ids: string[];
  target_days: number;
  current_streak: number;
  longest_streak: number;
  last_completed_date?: string;
  started_at?: string | null;
  completed_at?: string | null;
  milestones: ChallengeMilestone[];
  created_at: string;
  archived: boolean;
}

export interface ChallengeToday {
  habits: { habit_id: string; name: string; category: string; completed: boolean }[];
  all_completed_today: boolean;
  completed_count: number;
  total_count: number;
}

export interface AppSettings {
  daily_allowance: number;
  monthly_reset_day: number;
  telegram_chat_id: string;
  timezone: string;
}
