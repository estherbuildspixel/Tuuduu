import type {
  AppSettings,
  Category,
  PriorityOption,
  RepeatOption,
  SortOption,
  Task,
} from '@/types/task';

export const STORAGE_KEYS = {
  tasks: '@tuuduu_tasks_v1',
  settings: '@tuuduu_settings_v1',
  focus: '@tuuduu_focus_v1',
  onboarding: '@tuuduu_onboarding_v1',
} as const;

export const WEB_DEMO_STORAGE_KEYS = {
  tasks: '@tuuduu_demo_tasks_v1',
  settings: '@tuuduu_demo_settings_v1',
  focus: '@tuuduu_demo_focus_v1',
  onboarding: '@tuuduu_demo_onboarding_v1',
} as const;

export const CATEGORIES: readonly Category[] = [
  { id: 'general', label: 'General', color: '#6366F1', icon: 'apps-outline' },
  { id: 'work', label: 'Work', color: '#8B5CF6', icon: 'briefcase-outline' },
  { id: 'personal', label: 'Personal', color: '#EC4899', icon: 'heart-outline' },
  { id: 'urgent', label: 'Urgent', color: '#EF4444', icon: 'flash-outline' },
];

export const PRIORITIES: readonly PriorityOption[] = [
  { id: 'low', label: 'Low', color: '#38BDF8', rank: 0 },
  { id: 'medium', label: 'Medium', color: '#F59E0B', rank: 1 },
  { id: 'high', label: 'High', color: '#EF4444', rank: 2 },
];

export const SORT_MODES: readonly SortOption[] = [
  { key: 'newest', label: 'New', icon: 'arrow-down-outline' },
  { key: 'oldest', label: 'Old', icon: 'arrow-up-outline' },
  { key: 'priority', label: 'Top', icon: 'flag-outline' },
  { key: 'due', label: 'Due', icon: 'calendar-outline' },
  { key: 'alpha', label: 'A-Z', icon: 'text-outline' },
];

export const REPEAT_OPTIONS: readonly RepeatOption[] = [
  { id: 'none', label: 'Never' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

export const PRE_DUE_OPTIONS = [5, 10, 15, 30] as const;
export const FOCUS_OPTIONS = [5, 15, 25, 50] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  remindersEnabled: false,
  preDueMinutes: 10,
  focusMinutes: 25,
  themePref: 'system',
};

export const INITIAL_TASKS: Task[] = [
  {
    id: 'welcome',
    text: 'Welcome to Tuuduu! 👋',
    notes: 'Your day, sorted. Tap a task to add reminders, notes, subtasks, and more.',
    completed: true,
    category: 'general',
    priority: 'low',
    createdAt: Date.now() - 7200000,
    completedAt: Date.now() - 7000000,
    startAt: null,
    dueAt: null,
    preDueMinutes: 10,
    repeat: 'none',
    subtasks: [],
  },
  {
    id: 'try-reminder',
    text: 'Set a reminder on a task',
    notes: '',
    completed: false,
    category: 'personal',
    priority: 'medium',
    createdAt: Date.now() - 3600000,
    completedAt: null,
    startAt: null,
    dueAt: null,
    preDueMinutes: 10,
    repeat: 'none',
    subtasks: [],
  },
  {
    id: 'try-focus',
    text: 'Try a focus session 🎯',
    notes: '',
    completed: false,
    category: 'work',
    priority: 'high',
    createdAt: Date.now(),
    completedAt: null,
    startAt: null,
    dueAt: null,
    preDueMinutes: 10,
    repeat: 'none',
    subtasks: [],
  },
];
