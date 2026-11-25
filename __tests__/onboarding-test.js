import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../src/constants';
import { useTasks } from '../src/hooks/useTasks';

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

const showOnboardingSetter = () => React.__setters[16];
const firstLaunchSetter = () => React.__setters[17];
const showSettingsSetter = () => React.__setters[13];
const isLoadedSetter = () => React.__setters[3];

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

describe('onboarding persistence', () => {
  test('shows onboarding for a new user once storage has been read', async () => {
    useTasks();

    React.__effects[1]();
    await flushEffects();

    expect(showOnboardingSetter()).toHaveBeenCalledWith(true);
    expect(firstLaunchSetter()).toHaveBeenCalledWith(true);
    expect(isLoadedSetter()).toHaveBeenCalledWith(true);
  });

  test('skips onboarding for a returning user with a stored completion', async () => {
    mockStorage({ [STORAGE_KEYS.onboarding]: 'done' });
    useTasks();

    React.__effects[1]();
    await flushEffects();

    expect(showOnboardingSetter()).toHaveBeenCalledWith(false);
    expect(firstLaunchSetter()).toHaveBeenCalledWith(false);
  });

  test('regression: first launch gates the home screen while returning users skip it', async () => {
    useTasks();
    React.__effects[1]();
    await flushEffects();

    expect(showOnboardingSetter()).toHaveBeenCalledWith(true);
    expect(firstLaunchSetter()).toHaveBeenCalledWith(true);

    React.__reset();
    React.__setStateValues(freshState());
    jest.clearAllMocks();
    const savedTasks = JSON.stringify([
      { id: 'saved-task', text: 'Keep me', completed: false, createdAt: 1 },
    ]);
    mockStorage({ [STORAGE_KEYS.onboarding]: 'done', [STORAGE_KEYS.tasks]: savedTasks });
    useTasks();
    React.__effects[1]();
    await flushEffects();

    expect(showOnboardingSetter()).toHaveBeenCalledWith(false);
    expect(firstLaunchSetter()).toHaveBeenCalledWith(false);
    expect(React.__setters[1]).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'saved-task', text: 'Keep me' }),
    ]);
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(STORAGE_KEYS.tasks, expect.anything());
    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    expect(AsyncStorage.clear).not.toHaveBeenCalled();
  });

  test('persists completion before dismissing first-launch onboarding', async () => {
    React.__setStateValues([...freshState().slice(0, 17), true]);
    const { finishOnboarding } = useTasks();

    finishOnboarding();
    await flushEffects();

    expect(AsyncStorage.setItem).toHaveBeenCalledWith(STORAGE_KEYS.onboarding, 'done');
    expect(firstLaunchSetter()).toHaveBeenCalledWith(false);
    expect(showOnboardingSetter()).toHaveBeenCalledWith(false);
  });

  test('finishing the Settings guide does not persist onboarding completion', async () => {
    const { openOnboarding, finishOnboarding } = useTasks();

    openOnboarding();
    finishOnboarding();
    await flushEffects();

    expect(showOnboardingSetter()).toHaveBeenCalledWith(true);
    expect(firstLaunchSetter()).toHaveBeenCalledWith(false);
    expect(AsyncStorage.setItem).not.toHaveBeenCalledWith(STORAGE_KEYS.onboarding, 'done');
    expect(showOnboardingSetter()).toHaveBeenCalledWith(false);
  });

  test('does not block the loaded state on the unrelated initial task write', async () => {
    let releaseTaskWrite;
    AsyncStorage.setItem.mockImplementation(
      (key) =>
        key === STORAGE_KEYS.tasks
          ? new Promise((resolve) => {
              releaseTaskWrite = resolve;
            })
          : Promise.resolve()
    );
    useTasks();

    React.__effects[1]();
    let timer;
    const timeout = new Promise((resolve) => {
      timer = setTimeout(() => resolve(false), 50);
    });
    const settled = await Promise.race([flushEffects().then(() => true), timeout]);
    clearTimeout(timer);
    releaseTaskWrite?.();

    expect(settled).toBe(true);
    expect(isLoadedSetter()).toHaveBeenCalledWith(true);
  });

  test('dev reset clears only the onboarding flag and reopens onboarding', async () => {
    const { resetOnboardingForDev } = useTasks();

    resetOnboardingForDev();
    await flushEffects();

    expect(AsyncStorage.removeItem).toHaveBeenCalledWith(STORAGE_KEYS.onboarding);
    expect(AsyncStorage.removeItem).toHaveBeenCalledTimes(1);
    expect(AsyncStorage.clear).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
    expect(showSettingsSetter()).toHaveBeenCalledWith(false);
    expect(showOnboardingSetter()).toHaveBeenCalledWith(true);
    expect(firstLaunchSetter()).toHaveBeenCalledWith(true);
  });

  test('dev reset is unavailable in production builds', async () => {
    global.__DEV__ = false;
    const { resetOnboardingForDev } = useTasks();

    resetOnboardingForDev();
    await flushEffects();

    expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    expect(showOnboardingSetter()).not.toHaveBeenCalled();
    expect(firstLaunchSetter()).not.toHaveBeenCalled();
  });
});
