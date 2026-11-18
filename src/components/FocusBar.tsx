import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { FocusSession } from '@/types/task';

interface FocusBarProps {
  focus: FocusSession;
  remaining: number;
  styles: AppStyles;
  theme: ThemePalette;
  onPause: () => void;
  onStop: () => void;
}

function FocusBar({ focus, remaining, styles, theme, onPause, onStop }: FocusBarProps) {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');

  return (
    <View style={styles.focusBar}>
      <View style={styles.focusIcon}>
        <Ionicons name="timer-outline" size={18} color={theme.primary} />
      </View>
      <View style={styles.focusCopy}>
        <Text style={styles.focusLabel}>
          {focus.pausedRemaining !== null ? 'Paused' : 'Focusing'}
        </Text>
        <Text style={styles.focusTask} numberOfLines={1}>
          {focus.title}
        </Text>
      </View>
      <Text style={styles.focusTime}>{`${minutes}:${seconds}`}</Text>
      <TouchableOpacity style={styles.focusControl} onPress={onPause}>
        <Ionicons
          name={focus.pausedRemaining !== null ? 'play-outline' : 'pause-outline'}
          size={18}
          color={theme.primary}
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.focusControl} onPress={onStop}>
        <Ionicons name="stop-outline" size={18} color={theme.danger} />
      </TouchableOpacity>
    </View>
  );
}

export default memo(FocusBar);
