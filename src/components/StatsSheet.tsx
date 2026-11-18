import React, { memo } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORIES } from '@/constants';
import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { IconName, Task } from '@/types/task';
import { isOverdue, startOfDay } from '@/utils/taskUtils';
import Sheet from './Sheet';

interface StatsSheetProps {
  tasks: Task[];
  streak: number;
  nowTs: number;
  onClose: () => void;
  theme: ThemePalette;
  styles: AppStyles;
}

function StatsSheet({ tasks, streak, nowTs, onClose, theme, styles }: StatsSheetProps) {
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const rate = total ? Math.round((completed / total) * 100) : 0;
  const overdue = tasks.filter((task) => isOverdue(task, nowTs)).length;
  const reminders = tasks.filter((task) => task.startAt || task.dueAt).length;
  const doneToday = tasks.filter(
    (task) => task.completedAt && startOfDay(task.completedAt) === startOfDay(nowTs)
  ).length;

  const stats: { label: string; value: string | number; icon: IconName }[] = [
    { label: 'Completion', value: `${rate}%`, icon: 'pie-chart-outline' },
    { label: 'Done today', value: doneToday, icon: 'checkmark-circle-outline' },
    { label: 'Day streak', value: streak, icon: 'flame-outline' },
    { label: 'Overdue', value: overdue, icon: 'alert-circle-outline' },
    { label: 'Reminders', value: reminders, icon: 'alarm-outline' },
    { label: 'Total tasks', value: total, icon: 'list-outline' },
  ];

  const breakdown = CATEGORIES.map((category) => ({
    ...category,
    count: tasks.filter((task) => task.category === category.id).length,
  }));

  return (
    <Sheet title="Your day, in numbers" onClose={onClose} theme={theme} styles={styles}>
      {() => (
        <View style={styles.settingsBody}>
          <View style={styles.statGrid}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Ionicons name={stat.icon} size={18} color={theme.primary} />
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.fieldLabel, styles.spacedLabel]}>By category</Text>
          {breakdown.map((item) => {
            const width = total ? (item.count / total) * 100 : 0;
            return (
              <View key={item.id} style={styles.breakdownRow}>
                <View style={styles.breakdownTop}>
                  <Text style={styles.breakdownLabel}>{item.label}</Text>
                  <Text style={styles.breakdownCount}>{item.count}</Text>
                </View>
                <View style={styles.breakdownTrack}>
                  <View
                    style={[
                      styles.breakdownFill,
                      { width: `${width}%`, backgroundColor: item.color },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Sheet>
  );
}

export default memo(StatsSheet);
