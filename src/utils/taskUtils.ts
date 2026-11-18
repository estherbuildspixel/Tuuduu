import { CATEGORIES, PRIORITIES } from '@/constants';
import type {
  CategoryType,
  FilterType,
  PriorityType,
  RepeatType,
  SortMode,
  Subtask,
  Task,
  TaskStats,
} from '@/types/task';

const CATEGORY_IDS = CATEGORIES.map((category) => category.id);
const PRIORITY_IDS = PRIORITIES.map((priority) => priority.id);
const REPEAT_IDS: readonly RepeatType[] = ['none', 'daily', 'weekly', 'monthly'];

export const newId = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asTimestamp(value: unknown): number | null {
  const parsed = asNumber(value, 0);
  return parsed > 0 ? parsed : null;
}

function asCategory(value: unknown): CategoryType {
  return CATEGORY_IDS.includes(value as CategoryType) ? (value as CategoryType) : 'general';
}

function asPriority(value: unknown): PriorityType {
  return PRIORITY_IDS.includes(value as PriorityType) ? (value as PriorityType) : 'medium';
}

function asRepeat(value: unknown): RepeatType {
  return REPEAT_IDS.includes(value as RepeatType) ? (value as RepeatType) : 'none';
}

function asSubtasks(value: unknown): Subtask[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const candidate = item as Partial<Subtask>;
    if (typeof candidate.text !== 'string' || !candidate.text.trim()) return [];
    return [{
      id: typeof candidate.id === 'string' && candidate.id ? candidate.id : newId(),
      text: candidate.text,
      done: Boolean(candidate.done),
    }];
  });
}

export function normalizeTask(raw?: Partial<Task> | null): Task {
  const value = raw ?? {};
  return {
    id: typeof value.id === 'string' && value.id ? value.id : newId(),
    text: typeof value.text === 'string' ? value.text : '',
    notes: typeof value.notes === 'string' ? value.notes : '',
    completed: Boolean(value.completed),
    category: asCategory(value.category),
    priority: asPriority(value.priority),
    createdAt: asNumber(value.createdAt, Date.now()),
    completedAt: asTimestamp(value.completedAt),
    startAt: asTimestamp(value.startAt),
    dueAt: asTimestamp(value.dueAt),
    preDueMinutes: asNumber(value.preDueMinutes, 10),
    repeat: asRepeat(value.repeat),
    subtasks: asSubtasks(value.subtasks),
  };
}

export function makeDraft(task?: Task | null): Task {
  if (task) return normalizeTask(task);
  return normalizeTask({
    category: 'general',
    priority: 'medium',
    preDueMinutes: 10,
    repeat: 'none',
  });
}

export function startOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export function addDays(timestamp: number, days: number): number {
  const date = new Date(timestamp);
  date.setDate(date.getDate() + days);
  return date.getTime();
}

export function advanceRecurrence(timestamp: number | null, repeat: RepeatType): number | null {
  if (!timestamp || repeat === 'none') return null;
  const date = new Date(timestamp);
  if (repeat === 'daily') date.setDate(date.getDate() + 1);
  if (repeat === 'weekly') date.setDate(date.getDate() + 7);
  if (repeat === 'monthly') date.setMonth(date.getMonth() + 1);
  return date.getTime();
}

export function formatDate(timestamp: number | null): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(timestamp: number | null): string {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function relativeTime(timestamp: number, nowTs: number): string {
  const minutes = Math.floor((nowTs - timestamp) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(timestamp);
}

export function isOverdue(task: Pick<Task, 'completed' | 'dueAt'>, nowTs: number): boolean {
  return !task.completed && !!task.dueAt && task.dueAt < nowTs;
}

export function computeStreak(tasks: readonly Pick<Task, 'completedAt'>[], nowTs: number): number {
  const days = new Set(
    tasks.flatMap((task) => (task.completedAt ? [startOfDay(task.completedAt)] : []))
  );
  let cursor = startOfDay(nowTs);
  if (!days.has(cursor)) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function getReminderSignature(task: Task): string {
  return JSON.stringify([
    task.text,
    task.startAt,
    task.dueAt,
    task.preDueMinutes,
    task.completed,
  ]);
}

export function filterAndSortTasks(
  tasks: readonly Task[],
  filter: FilterType,
  query: string,
  sortMode: SortMode
): Task[] {
  const needle = query.trim().toLowerCase();
  const result = tasks.filter((task) => {
    if (filter === 'active' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (!needle) return true;
    const category = CATEGORIES.find((item) => item.id === task.category);
    return (
      task.text.toLowerCase().includes(needle) ||
      (category && category.label.toLowerCase().includes(needle))
    );
  });

  return [...result].sort((a, b) => {
    if (sortMode === 'alpha') return a.text.localeCompare(b.text);
    if (sortMode === 'oldest') return a.createdAt - b.createdAt;
    if (sortMode === 'priority') {
      const rankA = PRIORITIES.find((item) => item.id === a.priority)?.rank ?? 1;
      const rankB = PRIORITIES.find((item) => item.id === b.priority)?.rank ?? 1;
      return rankB - rankA || b.createdAt - a.createdAt;
    }
    if (sortMode === 'due') {
      if (!a.dueAt && !b.dueAt) return b.createdAt - a.createdAt;
      if (!a.dueAt) return 1;
      if (!b.dueAt) return -1;
      return a.dueAt - b.dueAt;
    }
    return b.createdAt - a.createdAt;
  });
}

export function getTaskStats(tasks: readonly Task[], nowTs: number): TaskStats {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  return {
    completed,
    total,
    active: total - completed,
    percent: total ? Math.round((completed / total) * 100) : 0,
    streak: computeStreak(tasks, nowTs),
    overdue: tasks.filter((task) => isOverdue(task, nowTs)).length,
    reminders: tasks.filter((task) => task.startAt || task.dueAt).length,
    doneToday: tasks.filter(
      (task) => task.completedAt && startOfDay(task.completedAt) === startOfDay(nowTs)
    ).length,
  };
}
