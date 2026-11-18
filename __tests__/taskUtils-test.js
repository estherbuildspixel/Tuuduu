import {
  advanceRecurrence,
  computeStreak,
  filterAndSortTasks,
  getReminderSignature,
  getTaskStats,
  isOverdue,
  makeDraft,
  normalizeTask,
  relativeTime,
  startOfDay,
} from '../src/utils/taskUtils';

describe('task utilities', () => {
  test('normalizeTask fills defaults and preserves values', () => {
    const task = normalizeTask({
      id: 'task-1',
      text: 'Ship app',
      completed: true,
      subtasks: [{ id: 'step-1', text: 'Export', done: true }],
    });

    expect(task.id).toBe('task-1');
    expect(task.text).toBe('Ship app');
    expect(task.completed).toBe(true);
    expect(task.category).toBe('general');
    expect(task.priority).toBe('medium');
    expect(task.preDueMinutes).toBe(10);
    expect(task.repeat).toBe('none');
    expect(task.subtasks).toHaveLength(1);
    expect(typeof task.createdAt).toBe('number');
  });

  test('makeDraft starts a clean draft and copies tasks', () => {
    const draft = makeDraft(null);
    expect(draft.text).toBe('');
    expect(draft.category).toBe('general');
    expect(draft.subtasks).toEqual([]);

    const copied = makeDraft({ id: 'copy', text: 'Original' });
    expect(copied.id).toBe('copy');
    expect(copied.text).toBe('Original');
  });

  test('startOfDay and recurrence keep calendar behavior', () => {
    const noon = new Date(2026, 0, 15, 12, 30).getTime();
    expect(new Date(startOfDay(noon)).getHours()).toBe(0);
    expect(new Date(advanceRecurrence(noon, 'daily')).getDate()).toBe(16);
    expect(new Date(advanceRecurrence(noon, 'weekly')).getDate()).toBe(22);
    expect(new Date(advanceRecurrence(noon, 'monthly')).getMonth()).toBe(1);
    expect(advanceRecurrence(noon, 'none')).toBeNull();
    expect(advanceRecurrence(null, 'daily')).toBeNull();
  });

  test('relativeTime uses readable buckets', () => {
    const now = new Date(2026, 0, 15, 12, 0).getTime();
    expect(relativeTime(now, now)).toBe('Just now');
    expect(relativeTime(now - 5 * 60000, now)).toBe('5m ago');
    expect(relativeTime(now - 3 * 3600000, now)).toBe('3h ago');
    expect(relativeTime(now - 2 * 86400000, now)).toBe('2d ago');
  });

  test('isOverdue excludes completed and undated tasks', () => {
    const now = 1000;
    expect(isOverdue({ completed: false, dueAt: 999 }, now)).toBe(true);
    expect(isOverdue({ completed: false, dueAt: 1001 }, now)).toBe(false);
    expect(isOverdue({ completed: true, dueAt: 1 }, now)).toBe(false);
    expect(isOverdue({ completed: false, dueAt: null }, now)).toBe(false);
  });

  test('computeStreak counts consecutive completion days', () => {
    const today = new Date(2026, 0, 15, 9, 0).getTime();
    const yesterday = new Date(2026, 0, 14, 18, 0).getTime();
    const twoDaysAgo = new Date(2026, 0, 13, 8, 0).getTime();
    const old = new Date(2026, 0, 1, 8, 0).getTime();
    const tasks = [
      { completedAt: today },
      { completedAt: yesterday },
      { completedAt: twoDaysAgo },
      { completedAt: old },
    ];

    expect(computeStreak(tasks, today)).toBe(3);
    expect(computeStreak(tasks.filter((task) => task.completedAt !== today), today)).toBe(2);
    expect(computeStreak([{ completedAt: old }], today)).toBe(0);
  });

  test('filterAndSortTasks filters by status and search and sorts by due date', () => {
    const tasks = [
      normalizeTask({ id: 'a', text: 'Write report', category: 'work', createdAt: 1, dueAt: 300 }),
      normalizeTask({ id: 'b', text: 'Call mom', category: 'personal', createdAt: 2 }),
      normalizeTask({ id: 'c', text: 'Fix bug', category: 'urgent', createdAt: 3, dueAt: 100 }),
      normalizeTask({ id: 'd', text: 'Done item', createdAt: 4, completed: true }),
    ];

    expect(filterAndSortTasks(tasks, 'active', '', 'due').map((task) => task.id)).toEqual(['c', 'a', 'b']);
    expect(filterAndSortTasks(tasks, 'completed', '', 'newest').map((task) => task.id)).toEqual(['d']);
    expect(filterAndSortTasks(tasks, 'all', 'work', 'newest').map((task) => task.id)).toEqual(['a']);
    expect(filterAndSortTasks(tasks, 'all', 'REPORT', 'newest').map((task) => task.id)).toEqual(['a']);
  });

  test('getTaskStats returns dashboard values', () => {
    const now = new Date(2026, 0, 15, 12, 0).getTime();
    const tasks = [
      normalizeTask({ id: 'a', completed: true, completedAt: now, dueAt: now + 1000, startAt: now }),
      normalizeTask({ id: 'b', dueAt: now - 1000 }),
      normalizeTask({ id: 'c', createdAt: now }),
    ];

    expect(getTaskStats(tasks, now)).toEqual({
      completed: 1,
      total: 3,
      active: 2,
      percent: 33,
      streak: 1,
      overdue: 1,
      reminders: 2,
      doneToday: 1,
    });
  });

  test('reminder signature tracks only scheduling inputs', () => {
    const task = normalizeTask({
      id: 'a',
      text: 'Task',
      startAt: 100,
      dueAt: 200,
      preDueMinutes: 10,
      completed: false,
      notes: 'old',
    });

    const signature = getReminderSignature(task);
    expect(getReminderSignature({ ...task, notes: 'new' })).toBe(signature);
    expect(getReminderSignature({ ...task, dueAt: 300 })).not.toBe(signature);
    expect(getReminderSignature({ ...task, completed: true })).not.toBe(signature);
  });
});
