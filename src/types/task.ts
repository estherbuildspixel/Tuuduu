import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type CategoryType = 'general' | 'work' | 'personal' | 'urgent';

export type PriorityType = 'low' | 'medium' | 'high';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export type SortMode = 'newest' | 'oldest' | 'priority' | 'due' | 'alpha';

export type FilterType = 'all' | 'active' | 'completed';

export type ThemePreference = 'system' | 'light' | 'dark';

export type ColorScheme = 'light' | 'dark';

export type DateTimeMode = 'date' | 'time';

export type DateTimeField = 'startAt' | 'dueAt';

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  text: string;
  notes: string;
  completed: boolean;
  category: CategoryType;
  priority: PriorityType;
  createdAt: number;
  completedAt: number | null;
  startAt: number | null;
  dueAt: number | null;
  preDueMinutes: number;
  repeat: RepeatType;
  subtasks: Subtask[];
}

export interface Category {
  id: CategoryType;
  label: string;
  color: string;
  icon: IconName;
}

export interface PriorityOption {
  id: PriorityType;
  label: string;
  color: string;
  rank: number;
}

export interface SortOption {
  key: SortMode;
  label: string;
  icon: IconName;
}

export interface RepeatOption {
  id: RepeatType;
  label: string;
}

export interface TaskStats {
  completed: number;
  total: number;
  active: number;
  percent: number;
  streak: number;
  overdue: number;
  reminders: number;
  doneToday: number;
}

export interface AppSettings {
  remindersEnabled: boolean;
  preDueMinutes: number;
  focusMinutes: number;
  themePref: ThemePreference;
}

export interface FocusSession {
  taskId: string;
  title: string;
  endsAt: number | null;
  pausedRemaining: number | null;
}

export interface UndoState {
  task: Task;
  index: number;
}

export interface DatePickerState {
  field: DateTimeField;
  value: number | null;
  mode: DateTimeMode;
}
