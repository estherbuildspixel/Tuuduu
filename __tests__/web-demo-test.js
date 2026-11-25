import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  DEFAULT_SETTINGS,
  INITIAL_TASKS,
  STORAGE_KEYS,
  WEB_DEMO_STORAGE_KEYS,
} from '../src/constants';
import { APP_INITIAL_TASKS, APP_STORAGE_KEYS } from '../src/constants/appConfig.web';
import { useTasks } from '../src/hooks/useTasks';

jest.mock('@/constants/appConfig', () => ({
  APP_STORAGE_KEYS: {
    tasks: '@tuuduu_demo_tasks_v1',
    settings: '@tuuduu_demo_settings_v1',
    focus: '@tuuduu_demo_focus_v1',
    onboarding: '@tuuduu_demo_onboarding_v1',
  },
  APP_INITIAL_TASKS: [],
}));

jest.mock('react', () => {
  const effects = [];
  const stateValues = [];
  const setters = [];
  return {
    useCallback: (callback) => callback,
    useEffect: (effect) => effects.push(effect),
    useMemo: (factory) => factory(),
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => {
      const value = stateValues.length > 0 ? stateValues.shift() : initial;
      const setter = jest.fn();
      setters.push(setter);
      return [value, setter];
    },
    __effects: effects,
    __setStateValues: (values) => {
      stateValues.splice(0, stateValues.length, ...values);
    },
    __setters: setters,
    __reset: () => {
      effects.length = 0;
      stateValues.length = 0;
      setters.length = 0;
    },
  };
});

jest.mock('react-native', () => ({
  useColorScheme: () => 'light',
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
  setItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/hooks/useClock', () => ({
  useClock: () => 0,
}));

jest.mock('../src/services/haptics', () => ({
  taskCheckedHaptic: jest.fn(),
  taskDeletedHaptic: jest.fn(),
}));

jest.mock('../src/services/notifications', () => ({
  addNotificationResponseListener: jest.fn(() => ({ remove: jest.fn() })),
  cancelAllTaskReminders: jest.fn(() => Promise.resolve()),
  cancelTaskReminders: jest.fn(() => Promise.resolve()),
  configureNotifications: jest.fn(),
  ensureNotificationPermission: jest.fn(() => Promise.resolve(true)),
  notifyNow: jest.fn(() => Promise.resolve()),
  scheduleSnooze: jest.fn(() => Promise.resolve()),
  scheduleTaskReminders: jest.fn(() => Promise.resolve()),
}));

const freshState = () => [
  DEFAULT_SETTINGS,
  [],
  null,
  false,
  '',
  'general',
  'all',
  'newest',
  '',
  false,
  null,
  null,
  null,
  false,
  false,
  null,
  false,
  false,
];

const tasksSetter = () => React.__setters[1];
const showOnboardingSetter = () => React.__setters[16];
const firstLaunchSetter = () => React.__setters[17];

const mockStorage = (values = {}) => {
  AsyncStorage.getItem.mockImplementation((key) =>
    Promise.resolve(Object.prototype.hasOwnProperty.call(values, key) ? values[key] : null)
  );
};

const flushEffects = () => new Promise((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  jest.clearAllMocks();
  React.__reset();
  React.__setStateValues(freshState());
  mockStorage();
  AsyncStorage.setItem.mockResolvedValue(undefined);
  global.__DEV__ = true;
});

describe('web demo isolation', () => {
  test('uses isolated storage keys and an empty starter list', () => {
    expect(APP_STORAGE_KEYS).toEqual(WEB_DEMO_STORAGE_KEYS);
    expect(APP_STORAGE_KEYS).not.toEqual(STORAGE_KEYS);
    expect(APP_INITIAL_TASKS).toEqual([]);
    expect(INITIAL_TASKS.length).toBeGreaterThan(0);
  });

  test('ignores legacy personal tasks and starts with onboarding and no tasks', async () => {
    mockStorage({
      [STORAGE_KEYS.onboarding]: 'done',
      [STORAGE_KEYS.tasks]: JSON.stringify([
        { id: 'personal-task', text: 'Private test task', completed: true, createdAt: 1 },
      ]),
    });
    useTasks();

    React.__effects[1]();
    await flushEffects();

    expect(showOnboardingSetter()).toHaveBeenCalledWith(true);
    expect(firstLaunchSetter()).toHaveBeenCalledWith(true);
    expect(tasksSetter()).toHaveBeenCalledWith([]);
    expect(AsyncStorage.getItem).not.toHaveBeenCalledWith(STORAGE_KEYS.tasks);
    expect(AsyncStorage.getItem).not.toHaveBeenCalledWith(STORAGE_KEYS.onboarding);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith(APP_STORAGE_KEYS.tasks, '[]');
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(STORAGE_KEYS.tasks, expect.anything());
    expect(AsyncStorage.clear).not.toHaveBeenCalled();
  });

  test('loads demo-owned tasks from the isolated keys', async () => {
    mockStorage({
      [APP_STORAGE_KEYS.onboarding]: 'done',
      [APP_STORAGE_KEYS.tasks]: JSON.stringify([
        { id: 'demo-task', text: 'My demo task', completed: false, createdAt: 1 },
      ]),
    });
    useTasks();

    React.__effects[1]();
    await flushEffects();

    expect(showOnboardingSetter()).toHaveBeenCalledWith(false);
    expect(tasksSetter()).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'demo-task', text: 'My demo task' }),
    ]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(APP_STORAGE_KEYS.tasks, expect.anything());
  });

  test('finishing onboarding writes only the demo onboarding flag', async () => {
    React.__setStateValues([...freshState().slice(0, 17), true]);
    const { finishOnboarding } = useTasks();

    finishOnboarding();
    await flushEffects();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(APP_STORAGE_KEYS.onboarding, 'done');
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(
      STORAGE_KEYS.onboarding,
      expect.anything()
    );
  });

  test('resetting the demo clears tasks instead of restoring mobile samples', () => {
    const { resetData } = useTasks();

    resetData();

    expect(tasksSetter()).toHaveBeenCalledWith([]);
    expect(tasksSetter()).not.toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: 'welcome' })])
    );
  });
});
