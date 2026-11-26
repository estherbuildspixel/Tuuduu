import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { FilterType, IconName } from '@/types/task';

interface EmptyStateProps {
  filter: FilterType;
  query: string;
  styles: AppStyles;
  theme: ThemePalette;
  onReset: () => void;
}

function EmptyState({ filter, query, styles, theme, onReset }: EmptyStateProps) {
  const searching = query.trim().length > 0;
  const icon: IconName = searching
    ? 'search-outline'
    : filter === 'completed'
      ? 'checkmark-done-circle-outline'
      : filter === 'active'
        ? 'sparkles-outline'
        : 'list-outline';
  const title = searching
    ? 'No matching tasks'
    : filter === 'completed'
      ? 'No completed tasks yet'
      : filter === 'active'
        ? 'All clear!'
        : 'Your day is wide open';
  const subtitle = searching
    ? 'Try a different search term.'
    : filter === 'completed'
      ? 'Check off a task to sort your day.'
      : 'Add a task below to get started.';

  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name={icon} size={28} color={theme.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptySubtitle}>{subtitle}</Text>
      {searching && (
        <TouchableOpacity style={styles.emptyBtn} onPress={onReset}>
          <Text style={styles.emptyBtnText}>Clear search</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default memo(EmptyState);
