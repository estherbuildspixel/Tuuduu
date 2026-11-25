import React, { memo, useEffect, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';

interface ProgressCardProps {
  completed: number;
  total: number;
  percent: number;
  streak: number;
  dateLabel: string;
  styles: AppStyles;
  theme: ThemePalette;
  onClear: () => void;
  onStats: () => void;
}

function ProgressCard({
  completed,
  total,
  percent,
  streak,
  dateLabel,
  styles,
  theme,
  onClear,
  onStats,
}: ProgressCardProps) {
  const [fill] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fill, {
      toValue: percent,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [fill, percent]);

  const width = fill.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });
  const remaining = total - completed;
  const hint =
    total === 0
      ? 'No tasks yet. Add one to sort your day.'
      : remaining === 0
        ? 'All caught up. Your day is sorted!'
        : `${remaining} task${remaining === 1 ? '' : 's'} left today`;

  return (
    <View style={styles.progressCard}>
      <View style={[styles.glow, styles.glowOne, { backgroundColor: `${theme.primary}14` }]} />
      <View style={[styles.glow, styles.glowTwo, { backgroundColor: `${theme.success}12` }]} />
      <View style={styles.progressContent}>
        <View style={styles.progressTop}>
          <View style={styles.progressHeading}>
            <Text style={styles.progressEyebrow}>{`Today · ${dateLabel}`}</Text>
            <Text style={styles.progressNumbers}>
              {completed}
              <Text style={styles.progressTotal}> / {total} done</Text>
            </Text>
          </View>
          <View style={styles.progressRight}>
            <TouchableOpacity style={styles.percentPill} onPress={onStats}>
              <Text style={styles.percentText}>{percent}%</Text>
            </TouchableOpacity>
            {streak > 0 && (
              <View style={styles.streakPill}>
                <Ionicons name="flame-outline" size={12} color={theme.warning} />
                <Text style={styles.streakText}>{streak}</Text>
              </View>
            )}
          </View>
        </View>
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width }]} />
        </View>
        <View style={styles.progressFooter}>
          <Text style={styles.progressHint}>{hint}</Text>
          {completed > 0 && (
            <TouchableOpacity
              style={styles.clearTextBtn}
              onPress={onClear}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Clear completed tasks"
            >
              <Text style={styles.clearText}>Clean done</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

export default memo(ProgressCard);
