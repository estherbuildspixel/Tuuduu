import {
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
} from 'expo-notifications';
import {
  cancelAllTaskReminders,
  cancelTaskReminders,
} from '../src/services/notifications';

jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 'high' },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  addNotificationResponseReceivedListener: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  getExactAlarmPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  getPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  requestExactAlarmPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ granted: false })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('id')),
  setNotificationCategoryAsync: jest.fn(() => Promise.resolve()),
  setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
  setNotificationHandler: jest.fn(),
}));

const scheduled = (identifier, data) => ({
  identifier,
  content: { data },
});

const cancelledIds = () =>
  cancelScheduledNotificationAsync.mock.calls.map(([identifier]) => identifier).sort();

beforeEach(() => {
  jest.clearAllMocks();
  cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  getAllScheduledNotificationsAsync.mockResolvedValue([]);
});

describe('notification cancellation', () => {
  test('cancels regular reminders and every snoozed reminder for the task', async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduled('tuuduu-task-1-snooze-1000', { taskId: 'task-1', kind: 'snooze' }),
      scheduled('tuuduu-task-1-snooze-1000', { taskId: 'task-1', kind: 'snooze' }),
      scheduled('tuuduu-task-1-snooze-2000', { taskId: 'task-1', kind: 'snooze' }),
      scheduled('tuuduu-task-2-snooze-3000', { taskId: 'task-2', kind: 'snooze' }),
    ]);

    await cancelTaskReminders({ id: 'task-1' });

    expect(cancelledIds()).toEqual(
      [
        'tuuduu-task-1-start',
        'tuuduu-task-1-preDue',
        'tuuduu-task-1-due',
        'tuuduu-task-1-snooze-1000',
        'tuuduu-task-1-snooze-2000',
      ].sort()
    );
    expect(cancelledIds()).not.toContain('tuuduu-task-2-snooze-3000');
  });

  test('recognizes task snoozes by identifier when notification data is missing', async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduled('tuuduu-task-1-snooze-4000'),
      scheduled('tuuduu-task-1-other-5000'),
      scheduled('tuuduu-task-10-snooze-6000'),
    ]);

    await cancelTaskReminders({ id: 'task-1' });

    expect(cancelledIds()).toEqual(
      [
        'tuuduu-task-1-start',
        'tuuduu-task-1-preDue',
        'tuuduu-task-1-due',
        'tuuduu-task-1-snooze-4000',
      ].sort()
    );
  });

  test('still cancels regular reminders when the scheduled list cannot be read', async () => {
    getAllScheduledNotificationsAsync.mockRejectedValue(new Error('native unavailable'));

    await expect(cancelTaskReminders({ id: 'task-1' })).resolves.toBeUndefined();

    expect(cancelledIds()).toEqual(
      ['tuuduu-task-1-start', 'tuuduu-task-1-preDue', 'tuuduu-task-1-due'].sort()
    );
  });

  test('cancels all regular and snoozed reminders across tasks when reminders are disabled', async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      scheduled('tuuduu-task-1-snooze-1000', { taskId: 'task-1', kind: 'snooze' }),
      scheduled('tuuduu-task-2-snooze-2000', { taskId: 'task-2', kind: 'snooze' }),
    ]);

    await cancelAllTaskReminders([{ id: 'task-1' }, { id: 'task-2' }]);

    expect(cancelledIds()).toEqual(
      [
        'tuuduu-task-1-start',
        'tuuduu-task-1-preDue',
        'tuuduu-task-1-due',
        'tuuduu-task-1-snooze-1000',
        'tuuduu-task-2-start',
        'tuuduu-task-2-preDue',
        'tuuduu-task-2-due',
        'tuuduu-task-2-snooze-2000',
      ].sort()
    );
  });
});
