import React from 'react';

import { DEFAULT_SETTINGS } from '../src/constants';
import { useTasks } from '../src/hooks/useTasks';
import { normalizeTask } from '../src/utils/taskUtils';

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

const draft = normalizeTask({ id: 'task-1', text: 'Test task' });

const stateWithPicker = (datePicker, editorDraft = draft, editingId = 'task-1') => [
  DEFAULT_SETTINGS,
  [],
  null,
  true,
  '',
  'general',
  'all',
  'newest',
  '',
  false,
  editorDraft,
  editingId,
  datePicker,
  false,
  false,
  null,
  false,
  false,
];

beforeEach(() => {
  jest.clearAllMocks();
  React.__reset();
});

describe('date/time editor flow', () => {
  test('applies a picked date to Start time', () => {
    React.__setStateValues(stateWithPicker({ field: 'startAt', value: null, mode: 'date' }));
    const { openDateTime, confirmDateTime } = useTasks();
    const timestamp = new Date(2026, 10, 25, 9, 30).getTime();

    openDateTime('startAt', null, 'date');
    expect(React.__setters[12]).toHaveBeenCalledWith({ field: 'startAt', value: null, mode: 'date' });

    confirmDateTime(timestamp);
    const pickerUpdater = React.__setters[12].mock.calls[1][0];
    pickerUpdater({ field: 'startAt', value: null, mode: 'date' });
    const updateDraft = React.__setters[10].mock.calls[0][0];
    expect(updateDraft(draft)).toMatchObject({ startAt: timestamp, dueAt: draft.dueAt });
  });

  test('applies a picked time to Due / end for a new task', () => {
    const newDraft = normalizeTask({ id: 'new-task', text: '' });
    React.__setStateValues(
      stateWithPicker({ field: 'dueAt', value: null, mode: 'time' }, newDraft, null)
    );
    const { confirmDateTime } = useTasks();
    const timestamp = new Date(2026, 10, 25, 17, 45).getTime();

    confirmDateTime(timestamp);

    const pickerUpdater = React.__setters[12].mock.calls[0][0];
    pickerUpdater({ field: 'dueAt', value: null, mode: 'time' });
    const updateDraft = React.__setters[10].mock.calls[0][0];
    expect(updateDraft(newDraft)).toMatchObject({ dueAt: timestamp, startAt: null });
  });

  test('saves both picked timestamps with the edited task', () => {
    const startAt = new Date(2026, 10, 25, 9, 0).getTime();
    const dueAt = new Date(2026, 10, 25, 17, 0).getTime();
    React.__setStateValues(
      stateWithPicker(null, { ...draft, startAt, dueAt }, 'task-1')
    );
    const { saveEditor } = useTasks();

    saveEditor();

    const updateTasks = React.__setters[1].mock.calls[0][0];
    expect(updateTasks([draft])).toEqual([expect.objectContaining({ id: 'task-1', startAt, dueAt })]);
  });
});
