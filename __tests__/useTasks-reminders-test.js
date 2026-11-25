import * as React from 'react';

import { useTasks } from '../src/hooks/useTasks';
import {
  cancelAllTaskReminders,
  ensureNotificationPermission,
} from '../src/services/notifications';
import { normalizeTask } from '../src/utils/taskUtils';

jest.mock('react', () => {
  const stateValues = [];
  return {
    useCallback: (callback) => callback,
    useEffect: () => {},
    useMemo: (factory) => factory(),
    useRef: (initial) => ({ current: initial }),
    useState: () => [stateValues.shift(), jest.fn()],
    __setStateValues: (values) => {
      stateValues.splice(0, stateValues.length, ...values);
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

describe('disabling reminders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cancels every task reminder before turning the setting off', async () => {
    const tasks = [
      normalizeTask({ id: 'task-1', text: 'First' }),
      normalizeTask({ id: 'task-2', text: 'Second' }),
    ];
    const settings = {
      remindersEnabled: true,
      preDueMinutes: 10,
      focusMinutes: 25,
      themePref: 'system',
    };

    React.__setStateValues([
      settings,
      tasks,
      null,
      true,
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
    ]);

    const { enableReminders, setSettings } = useTasks();

    await enableReminders();

    expect(cancelAllTaskReminders).toHaveBeenCalledWith(tasks);
    expect(ensureNotificationPermission).not.toHaveBeenCalled();
    expect(setSettings).toHaveBeenCalledTimes(1);
    expect(setSettings.mock.calls[0][0]({ remindersEnabled: true })).toEqual({
      remindersEnabled: false,
    });
  });
});
