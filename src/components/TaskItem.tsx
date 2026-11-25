import React, { memo, useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORIES, PRIORITIES } from '@/constants';
import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { Task } from '@/types/task';
import { formatDate, isOverdue, relativeTime } from '@/utils/taskUtils';
import Checkbox from './Checkbox';

interface TaskItemProps {
  task: Task;
  index: number;
  nowTs: number;
  styles: AppStyles;
  theme: ThemePalette;
  focusActive: boolean;
  onToggle: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onFocus: (task: Task) => void;
}

function TaskItem({
  task,
  index,
  nowTs,
  styles,
  theme,
  focusActive,
  onToggle,
  onEdit,
  onDelete,
  onFocus,
}: TaskItemProps) {
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(10));
  const category = CATEGORIES.find((item) => item.id === task.category) ?? CATEGORIES[0];
  const priority = PRIORITIES.find((item) => item.id === task.priority) ?? PRIORITIES[1];
  const overdue = isOverdue(task, nowTs);
  const doneSubtasks = task.subtasks.filter((item) => item.done).length;
  const delay = Math.min(index, 6) * 35;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, delay, useNativeDriver: true }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        delay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.taskCard,
        { opacity, transform: [{ translateY }] },
        task.completed && styles.taskCardDone,
        overdue && styles.taskCardOverdue,
      ]}
    >
      <View style={[styles.accentBar, { backgroundColor: category.color }]} />
      <View style={styles.taskBody}>
        <Checkbox
          checked={task.completed}
          color={theme.success}
          onPress={() => onToggle(task.id)}
          styles={styles}
        />
        <Pressable style={styles.taskTextWrapper} onPress={() => onEdit(task)}>
          <Text style={[styles.taskText, task.completed && styles.taskTextDone]} numberOfLines={3}>
            {task.text}
          </Text>
          <View style={styles.metaRow}>
            <View style={[styles.categoryTag, { backgroundColor: `${category.color}1F` }]}>
              <Ionicons name={category.icon} size={11} color={category.color} />
              <Text style={[styles.categoryTagText, { color: category.color }]}>
                {category.label}
              </Text>
            </View>
            {priority.id === 'high' && (
              <View style={[styles.priorityTag, { backgroundColor: `${priority.color}1F` }]}>
                <Ionicons name="flag" size={10} color={priority.color} />
              </View>
            )}
            {(task.startAt || task.dueAt) && (
              <Ionicons name="alarm-outline" size={12} color={theme.textMuted} />
            )}
            <Text style={styles.metaDot}>·</Text>
            <Text style={styles.timeText}>{relativeTime(task.createdAt, nowTs)}</Text>
          </View>
          <View style={styles.metaRowSecond}>
            {!!task.dueAt && (
              <View style={[styles.dueBadge, overdue && styles.dueBadgeOverdue]}>
                <Ionicons
                  name={overdue ? 'warning-outline' : 'calendar-outline'}
                  size={11}
                  color={overdue ? theme.danger : theme.textSub}
                />
                <Text style={[styles.dueBadgeText, overdue && { color: theme.danger }]}>
                  {overdue ? 'Overdue' : formatDate(task.dueAt)}
                </Text>
              </View>
            )}
            {task.subtasks.length > 0 && (
              <View style={styles.subtaskMeta}>
                <Ionicons name="list-outline" size={11} color={theme.textMuted} />
                <Text style={styles.subtaskMetaText}>
                  {doneSubtasks}/{task.subtasks.length}
                </Text>
                <View style={styles.subtaskTrack}>
                  <View
                    style={[
                      styles.subtaskFill,
                      {
                        width: `${(doneSubtasks / task.subtasks.length) * 100}%`,
                        backgroundColor: theme.success,
                      },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>
        </Pressable>
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, focusActive && styles.actionBtnActive]}
            onPress={() => onFocus(task)}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons
              name={focusActive ? 'pause-outline' : 'play-outline'}
              size={17}
              color={focusActive ? theme.primary : theme.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(task)}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="pencil-outline" size={17} color={theme.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(task.id)}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="trash-outline" size={17} color={theme.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

export default memo(TaskItem);
