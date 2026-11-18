import React, { memo, useEffect, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { Task } from '@/types/task';

interface UndoSnackbarProps {
  task: Task;
  styles: AppStyles;
  theme: ThemePalette;
  onUndo: () => void;
  onClose: () => void;
}

function UndoSnackbar({ task, styles, theme, onUndo, onClose }: UndoSnackbarProps) {
  const [translateY] = useState(() => new Animated.Value(70));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY]);

  return (
    <Animated.View style={[styles.snackbar, { opacity, transform: [{ translateY }] }]}>
      <View style={[styles.snackbarIcon, { backgroundColor: theme.danger }]}>
        <Ionicons name="trash-outline" size={15} color="#FFFFFF" />
      </View>
      <Text style={styles.snackbarText} numberOfLines={1}>{`Deleted ${task.text}`}</Text>
      <TouchableOpacity onPress={onUndo} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.snackbarAction}>UNDO</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close-outline" size={16} color={theme.textMuted} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default memo(UndoSnackbar);
