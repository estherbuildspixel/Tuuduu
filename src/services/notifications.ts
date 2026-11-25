import { Platform } from 'react-native';
import {
  addNotificationResponseReceivedListener,
  AndroidImportance,
  cancelScheduledNotificationAsync,
  getAllScheduledNotificationsAsync,
  getExactAlarmPermissionsAsync,
  getPermissionsAsync,
  requestExactAlarmPermissionsAsync,
  requestPermissionsAsync,
  scheduleNotificationAsync,
  SchedulableTriggerInputTypes,
  setNotificationCategoryAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
  type DateTriggerInput,
  type NotificationResponse,
} from 'expo-notifications';

import type { Task } from '@/types/task';

const CHANNEL_ID = 'tuuduu-reminders';
const CATEGORY_ID = 'tuuduu_task';
const REGULAR_REMINDER_KINDS = ['start', 'preDue', 'due'] as const;

const identifierFor = (taskId: string, kind: string): string => `tuuduu-${taskId}-${kind}`;

export function configureNotifications(): void {
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === 'android') {
    void setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Task reminders',
      description: 'Start, wrap-up, and due reminders for your tasks',
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366F1',
    }).catch(() => {});
  }

  if (Platform.OS === 'ios') {
    void setNotificationCategoryAsync(CATEGORY_ID, [
      {
        identifier: 'done',
        buttonTitle: 'Done',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'snooze',
        buttonTitle: 'Snooze 10m',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'start',
        buttonTitle: 'Start focus',
        options: { opensAppToForeground: true },
      },
    ]).catch(() => {});
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    const current = await getPermissionsAsync();
    if (current.granted) return true;
    const next = await requestPermissionsAsync();
    return next.granted;
  } catch {
    return false;
  }
}

export async function canScheduleExactAlarms(): Promise<boolean> {
  if (Platform.OS !== 'android') return false;
  try {
    const result = await getExactAlarmPermissionsAsync();
    return Boolean(result.granted);
  } catch {
    return false;
  }
}

export function addNotificationResponseListener(
  handler: (response: NotificationResponse) => void
) {
  return addNotificationResponseReceivedListener(handler);
}

export async function requestExactAlarms(): Promise<void> {
  if (Platform.OS !== 'android') return;
  try {
    await requestExactAlarmPermissionsAsync();
  } catch {
    return;
  }
}

async function scheduledSnoozeIdentifiers(taskId: string): Promise<string[]> {
  try {
    const scheduled = await getAllScheduledNotificationsAsync();
    const snoozePrefix = `${identifierFor(taskId, 'snooze')}-`;
    return scheduled
      .filter(({ identifier, content }) => {
        const data = content.data;
        return (
          (data?.taskId === taskId && data?.kind === 'snooze') ||
          identifier.startsWith(snoozePrefix)
        );
      })
      .map(({ identifier }) => identifier);
  } catch {
    return [];
  }
}

export async function cancelTaskReminders(task: Pick<Task, 'id'>): Promise<void> {
  const snoozeIdentifiers = await scheduledSnoozeIdentifiers(task.id);
  const identifiers = [
    ...REGULAR_REMINDER_KINDS.map((kind) => identifierFor(task.id, kind)),
    ...snoozeIdentifiers,
  ];
  await Promise.all(
    [...new Set(identifiers)].map((identifier) =>
      cancelScheduledNotificationAsync(identifier).catch(() => {})
    )
  );
}

export async function cancelAllTaskReminders(tasks: readonly Pick<Task, 'id'>[]): Promise<void> {
  await Promise.all(tasks.map((task) => cancelTaskReminders(task)));
}

async function buildTrigger(at: number, exact: boolean): Promise<DateTriggerInput> {
  const trigger: DateTriggerInput = {
    type: SchedulableTriggerInputTypes.DATE,
    date: at,
  };
  if (Platform.OS === 'android') {
    trigger.channelId = CHANNEL_ID;
    trigger.delivery = exact ? 'alarmClock' : 'bestEffort';
  }
  return trigger;
}

export async function scheduleTaskReminders(task: Task): Promise<void> {
  await cancelTaskReminders(task);
  const exact = await canScheduleExactAlarms();

  const add = async (kind: string, at: number | null, title: string, body: string) => {
    if (!at || at <= Date.now()) return;
    await scheduleNotificationAsync({
      identifier: identifierFor(task.id, kind),
      content: {
        title,
        body,
        data: { taskId: task.id, kind },
        categoryIdentifier: CATEGORY_ID,
      },
      trigger: await buildTrigger(at, exact),
    });
  };

  await add('start', task.startAt, 'Time to start', task.text);
  if (task.dueAt) {
    await add(
      'preDue',
      task.dueAt - (task.preDueMinutes || 10) * 60000,
      'Almost there',
      `${task.text} is due soon`
    );
  }
  await add('due', task.dueAt, 'Task due', task.text);
}

export async function scheduleSnooze(task: Task, minutes = 10): Promise<void> {
  const at = Date.now() + minutes * 60000;
  const exact = await canScheduleExactAlarms();
  await scheduleNotificationAsync({
    identifier: `${identifierFor(task.id, 'snooze')}-${at}`,
    content: {
      title: 'Snoozed reminder',
      body: task.text,
      data: { taskId: task.id, kind: 'snooze' },
      categoryIdentifier: CATEGORY_ID,
    },
    trigger: await buildTrigger(at, exact),
  });
}

export async function notifyNow(
  title: string,
  body: string,
  data: Record<string, string> = {}
): Promise<void> {
  await scheduleNotificationAsync({
    content: { title, body, data },
    trigger: null,
  });
}
