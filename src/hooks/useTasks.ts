import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_SETTINGS,
  INITIAL_TASKS,
  SORT_MODES,
  STORAGE_KEYS,
} from '@/constants';
import { useClock } from '@/hooks/useClock';
import { taskCheckedHaptic, taskDeletedHaptic } from '@/services/haptics';
import {
  addNotificationResponseListener,
  cancelTaskReminders,
  configureNotifications,
  ensureNotificationPermission,
  notifyNow,
  scheduleSnooze,
  scheduleTaskReminders,
} from '@/services/notifications';
import type {
  AppSettings,
  CategoryType,
  ColorScheme,
  DatePickerState,
  DateTimeField,
  FilterType,
  FocusSession,
  SortMode,
  Task,
  TaskStats,
  UndoState,
} from '@/types/task';
import {
  advanceRecurrence,
  filterAndSortTasks,
  getReminderSignature,
  getTaskStats,
  makeDraft,
  newId,
  normalizeTask,
} from '@/utils/taskUtils';

const APP_CLOCK_MS = 15000;
const FOCUS_CLOCK_MS = 1000;

function parseTasks(value: string | null): Task[] | null {
  if (value === null) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    return parsed.flatMap((item) =>
      item && typeof item === 'object' ? [normalizeTask(item as Partial<Task>)] : []
    );
  } catch {
    return null;
  }
}

function parseSettings(value: string | null): AppSettings {
  if (!value) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(value) as Partial<AppSettings>;
    return {
      remindersEnabled: Boolean(parsed.remindersEnabled),
      preDueMinutes: typeof parsed.preDueMinutes === 'number' ? parsed.preDueMinutes : 10,
      focusMinutes: typeof parsed.focusMinutes === 'number' ? parsed.focusMinutes : 25,
      themePref:
        parsed.themePref === 'system' ||
        parsed.themePref === 'light' ||
        parsed.themePref === 'dark'
          ? parsed.themePref
          : 'system',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function parseFocus(value: string | null): FocusSession | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<FocusSession>;
    if (typeof parsed.taskId !== 'string' || typeof parsed.title !== 'string') return null;
    return {
      taskId: parsed.taskId,
      title: parsed.title,
      endsAt: typeof parsed.endsAt === 'number' ? parsed.endsAt : null,
      pausedRemaining:
        typeof parsed.pausedRemaining === 'number' ? parsed.pausedRemaining : null,
    };
  } catch {
    return null;
  }
}

export interface UseTasksResult {
  tasks: Task[];
  visibleTasks: Task[];
  stats: TaskStats;
  nowTs: number;
  isLoaded: boolean;
  scheme: ColorScheme;
  dateLabel: string;
  activeSort: (typeof SORT_MODES)[number];
  filter: FilterType;
  query: string;
  searchOpen: boolean;
  sortMode: SortMode;
  selectedCategory: CategoryType;
  inputText: string;
  editorDraft: Task | null;
  editingId: string | null;
  datePicker: DatePickerState | null;
  undo: UndoState | null;
  focus: FocusSession | null;
  focusRemaining: number;
  settings: AppSettings;
  showSettings: boolean;
  showStats: boolean;
  showOnboarding: boolean;
  setQuery: Dispatch<SetStateAction<string>>;
  setEditorDraft: Dispatch<SetStateAction<Task | null>>;
  setSettings: Dispatch<SetStateAction<AppSettings>>;
  setShowSettings: Dispatch<SetStateAction<boolean>>;
  setShowStats: Dispatch<SetStateAction<boolean>>;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
  setFilter: Dispatch<SetStateAction<FilterType>>;
  setSelectedCategory: Dispatch<SetStateAction<CategoryType>>;
  setInputText: Dispatch<SetStateAction<string>>;
  setDatePicker: Dispatch<SetStateAction<DatePickerState | null>>;
  addTask: () => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  undoDelete: () => void;
  dismissUndo: () => void;
  clearCompleted: () => void;
  openEditor: (task: Task) => void;
  openQuickEditor: () => void;
  closeEditor: () => void;
  saveEditor: () => void;
  deleteEditor: () => void;
  openDateTime: (field: DateTimeField, value: number | null, mode: 'date' | 'time') => void;
  confirmDateTime: (timestamp: number) => void;
  clearDateTime: (field: DateTimeField) => void;
  enableReminders: () => Promise<void>;
  resetData: () => void;
  finishOnboarding: () => void;
  openOnboarding: () => void;
  startFocus: (task: Task) => void;
  toggleFocusPause: () => void;
  stopFocus: () => void;
  cycleSort: () => void;
  toggleScheme: () => void;
  closeSearch: () => void;
}

export function useTasks(): UseTasksResult {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focus, setFocus] = useState<FocusSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [inputText, setInputText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType>('general');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [editorDraft, setEditorDraft] = useState<Task | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [datePicker, setDatePicker] = useState<DatePickerState | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reminderSignatures = useRef<Record<string, string>>({});

  const nowTs = useClock(APP_CLOCK_MS);
  const focusActive = Boolean(focus && focus.pausedRemaining === null);
  const focusNowTs = useClock(FOCUS_CLOCK_MS, focusActive);
  const scheme: ColorScheme =
    settings.themePref === 'system' ? systemScheme || 'light' : settings.themePref;

  useEffect(() => {
    configureNotifications();
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [storedTasks, storedSettings, storedFocus, storedOnboarding] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.tasks),
          AsyncStorage.getItem(STORAGE_KEYS.settings),
          AsyncStorage.getItem(STORAGE_KEYS.focus),
          AsyncStorage.getItem(STORAGE_KEYS.onboarding),
        ]);
        const loadedTasks = parseTasks(storedTasks) ?? INITIAL_TASKS.map(normalizeTask);
        if (!active) return;
        setTasks(loadedTasks);
        setSettings(parseSettings(storedSettings));
        setFocus(parseFocus(storedFocus));
        setShowOnboarding(storedOnboarding !== 'done');
        if (storedTasks === null) {
          await AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(loadedTasks));
        }
      } catch {
        if (!active) return;
        setTasks(INITIAL_TASKS.map(normalizeTask));
        setSettings(DEFAULT_SETTINGS);
        setShowOnboarding(true);
      } finally {
        if (active) setIsLoaded(true);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void AsyncStorage.setItem(STORAGE_KEYS.tasks, JSON.stringify(tasks)).catch(() => {});
  }, [isLoaded, tasks]);

  useEffect(() => {
    if (!isLoaded) return;
    void AsyncStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings)).catch(() => {});
  }, [isLoaded, settings]);

  useEffect(() => {
    if (!isLoaded) return;
    if (focus) {
      void AsyncStorage.setItem(STORAGE_KEYS.focus, JSON.stringify(focus)).catch(() => {});
    } else {
      void AsyncStorage.removeItem(STORAGE_KEYS.focus).catch(() => {});
    }
  }, [focus, isLoaded]);

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    []
  );

  const startFocus = useCallback(
    (task: Task) => {
      setFocus((current) => {
        if (current && current.taskId === task.id) {
          if (current.pausedRemaining !== null) {
            return {
              ...current,
              endsAt: Date.now() + current.pausedRemaining * 1000,
              pausedRemaining: null,
            };
          }
          const remaining = Math.max(0, Math.ceil(((current.endsAt ?? Date.now()) - Date.now()) / 1000));
          return { ...current, pausedRemaining: remaining, endsAt: null };
        }
        return {
          taskId: task.id,
          title: task.text,
          endsAt: Date.now() + settings.focusMinutes * 60000,
          pausedRemaining: null,
        };
      });
    },
    [settings.focusMinutes]
  );

  useEffect(() => {
    if (!isLoaded || !settings.remindersEnabled) return;
    tasks.forEach((task) => {
      const signature = getReminderSignature(task);
      if (reminderSignatures.current[task.id] === signature) return;
      reminderSignatures.current[task.id] = signature;
      if (task.completed) {
        void cancelTaskReminders(task).catch(() => {});
        return;
      }
      void scheduleTaskReminders(task).catch(() => {});
    });
  }, [isLoaded, settings.remindersEnabled, tasks]);

  useEffect(() => {
    if (!settings.remindersEnabled) return undefined;
    const subscription = addNotificationResponseListener((response) => {
      const taskId = response.notification.request.content.data?.taskId;
      if (typeof taskId !== 'string') return;
      const task = tasks.find((item) => item.id === taskId);
      if (!task) return;
      if (response.actionIdentifier === 'done') {
        setTasks((prev) =>
          prev.map((item) =>
            item.id === taskId ? { ...item, completed: true, completedAt: Date.now() } : item
          )
        );
      } else if (response.actionIdentifier === 'start') {
        startFocus(task);
      } else if (response.actionIdentifier === 'snooze') {
        void scheduleSnooze(task).catch(() => {});
      }
    });
    return () => subscription.remove();
  }, [settings.remindersEnabled, startFocus, tasks]);

  useEffect(() => {
    if (!focus || focus.pausedRemaining !== null || focus.endsAt === null) return undefined;
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      const task = tasks.find((item) => item.id === focus.taskId);
      void notifyNow(
        'Focus complete',
        task ? `${task.text} — nice work!` : 'Take a breather.'
      ).catch(() => {});
      setFocus(null);
    }, Math.max(0, focus.endsAt - Date.now()));
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [focus, tasks]);

  const stats = useMemo(() => getTaskStats(tasks, nowTs), [nowTs, tasks]);
  const focusRemaining = focus
    ? focus.pausedRemaining !== null
      ? focus.pausedRemaining
      : Math.max(0, Math.ceil(((focus.endsAt ?? focusNowTs) - focusNowTs) / 1000))
    : 0;
  const dateLabel = useMemo(
    () =>
      new Date(nowTs).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [nowTs]
  );
  const visibleTasks = useMemo(
    () => filterAndSortTasks(tasks, filter, query, sortMode),
    [filter, query, sortMode, tasks]
  );
  const activeSort = SORT_MODES.find((mode) => mode.key === sortMode) ?? SORT_MODES[0];

  const openEditor = useCallback((task: Task) => {
    setEditingId(task.id);
    setEditorDraft(makeDraft(task));
  }, []);

  const openQuickEditor = useCallback(() => {
    setEditingId(null);
    setEditorDraft({
      ...makeDraft(null),
      text: inputText.trim(),
      category: selectedCategory,
      dueAt: Date.now() + 86400000,
      preDueMinutes: settings.preDueMinutes,
    });
  }, [inputText, selectedCategory, settings.preDueMinutes]);

  const closeEditor = useCallback(() => {
    setEditorDraft(null);
    setEditingId(null);
  }, []);

  const openDateTime = useCallback(
    (field: DateTimeField, value: number | null, mode: 'date' | 'time') => {
      setDatePicker({ field, value, mode });
    },
    []
  );

  const confirmDateTime = useCallback((timestamp: number) => {
    setDatePicker((current) => {
      if (current) {
        setEditorDraft((prev) => (prev ? { ...prev, [current.field]: timestamp } : prev));
      }
      return null;
    });
  }, []);

  const clearDateTime = useCallback((field: DateTimeField) => {
    setEditorDraft((prev) => (prev ? { ...prev, [field]: null } : prev));
  }, []);

  const addTask = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    const task = normalizeTask({
      text: trimmed,
      category: selectedCategory,
      preDueMinutes: settings.preDueMinutes,
    });
    setTasks((prev) => [task, ...prev]);
    setInputText('');
  }, [inputText, selectedCategory, settings.preDueMinutes]);

  const saveEditor = useCallback(() => {
    if (!editorDraft || !editorDraft.text.trim()) return;
    const task = normalizeTask({ ...editorDraft, text: editorDraft.text.trim() });
    if (editingId) {
      setTasks((prev) => prev.map((item) => (item.id === editingId ? task : item)));
      reminderSignatures.current[editingId] = '';
    } else {
      setTasks((prev) => [task, ...prev]);
    }
    setInputText('');
    closeEditor();
  }, [closeEditor, editorDraft, editingId]);

  const deleteEditor = useCallback(() => {
    if (!editingId) return;
    const task = tasks.find((item) => item.id === editingId);
    if (task) void cancelTaskReminders(task).catch(() => {});
    delete reminderSignatures.current[editingId];
    setTasks((prev) => prev.filter((item) => item.id !== editingId));
    taskDeletedHaptic();
    closeEditor();
  }, [closeEditor, editingId, tasks]);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => {
      const target = prev.find((task) => task.id === id);
      if (!target) return prev;
      if (target.completed) {
        return prev.map((task) =>
          task.id === id ? { ...task, completed: false, completedAt: null } : task
        );
      }
      taskCheckedHaptic();
      const updated = { ...target, completed: true, completedAt: Date.now() };
      if (target.repeat !== 'none') {
        const next = normalizeTask({
          ...target,
          id: newId(),
          completed: false,
          completedAt: null,
          createdAt: Date.now(),
          startAt: advanceRecurrence(target.startAt, target.repeat),
          dueAt: advanceRecurrence(target.dueAt, target.repeat),
          subtasks: target.subtasks.map((item) => ({ ...item, id: newId(), done: false })),
        });
        return [next, ...prev.map((task) => (task.id === id ? updated : task))];
      }
      return prev.map((task) => (task.id === id ? updated : task));
    });
  }, []);

  const deleteTask = useCallback((id: string) => {
    const task = tasks.find((item) => item.id === id);
    if (!task) return;
    const index = tasks.findIndex((item) => item.id === id);
    void cancelTaskReminders(task).catch(() => {});
    delete reminderSignatures.current[id];
    setTasks((prev) => prev.filter((item) => item.id !== id));
    setUndo({ task, index });
    taskDeletedHaptic();
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 4500);
  }, [tasks]);

  const undoDelete = useCallback(() => {
    if (!undo) return;
    delete reminderSignatures.current[undo.task.id];
    setTasks((prev) => {
      if (prev.some((task) => task.id === undo.task.id)) return prev;
      const next = [...prev];
      next.splice(Math.min(undo.index, next.length), 0, undo.task);
      return next;
    });
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, [undo]);

  const dismissUndo = useCallback(() => {
    setUndo(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  }, []);

  const clearCompleted = useCallback(() => {
    const completed = tasks.filter((task) => task.completed);
    if (completed.length === 0) return;
    completed.forEach((task) => {
      void cancelTaskReminders(task).catch(() => {});
      delete reminderSignatures.current[task.id];
    });
    setTasks((prev) => prev.filter((task) => !task.completed));
    taskDeletedHaptic();
  }, [tasks]);

  const enableReminders = useCallback(async () => {
    if (settings.remindersEnabled) {
      setSettings((prev) => ({ ...prev, remindersEnabled: false }));
      return;
    }
    const granted = await ensureNotificationPermission();
    if (!granted) return;
    reminderSignatures.current = {};
    setSettings((prev) => ({ ...prev, remindersEnabled: true }));
  }, [settings.remindersEnabled]);

  const resetData = useCallback(() => {
    tasks.forEach((task) => {
      void cancelTaskReminders(task).catch(() => {});
    });
    reminderSignatures.current = {};
    setTasks(INITIAL_TASKS.map(normalizeTask));
    setShowSettings(false);
  }, [tasks]);

  const finishOnboarding = useCallback(() => {
    setShowOnboarding(false);
    void AsyncStorage.setItem(STORAGE_KEYS.onboarding, 'done').catch(() => {});
  }, []);

  const openOnboarding = useCallback(() => {
    setShowSettings(false);
    setShowOnboarding(true);
  }, []);

  const toggleFocusPause = useCallback(() => {
    if (!focus) return;
    const task = tasks.find((item) => item.id === focus.taskId);
    if (task) startFocus(task);
  }, [focus, startFocus, tasks]);

  const stopFocus = useCallback(() => setFocus(null), []);

  const cycleSort = useCallback(() => {
    setSortMode((prev) => {
      const index = SORT_MODES.findIndex((mode) => mode.key === prev);
      return SORT_MODES[(index + 1) % SORT_MODES.length].key;
    });
  }, []);

  const toggleScheme = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      themePref: scheme === 'dark' ? 'light' : 'dark',
    }));
  }, [scheme]);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
  }, []);

  return {
    tasks,
    visibleTasks,
    stats,
    nowTs,
    isLoaded,
    scheme,
    dateLabel,
    activeSort,
    filter,
    query,
    searchOpen,
    sortMode,
    selectedCategory,
    inputText,
    editorDraft,
    editingId,
    datePicker,
    undo,
    focus,
    focusRemaining,
    settings,
    showSettings,
    showStats,
    showOnboarding,
    setQuery,
    setEditorDraft,
    setSettings,
    setShowSettings,
    setShowStats,
    setSearchOpen,
    setFilter,
    setSelectedCategory,
    setInputText,
    setDatePicker,
    addTask,
    toggleTask,
    deleteTask,
    undoDelete,
    dismissUndo,
    clearCompleted,
    openEditor,
    openQuickEditor,
    closeEditor,
    saveEditor,
    deleteEditor,
    openDateTime,
    confirmDateTime,
    clearDateTime,
    enableReminders,
    resetData,
    finishOnboarding,
    openOnboarding,
    startFocus,
    toggleFocusPause,
    stopFocus,
    cycleSort,
    toggleScheme,
    closeSearch,
  };
}
