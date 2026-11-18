import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { FilterType, SortOption, TaskStats } from '@/types/task';

interface FilterTabsProps {
  filter: FilterType;
  stats: TaskStats;
  activeSort: SortOption;
  styles: AppStyles;
  theme: ThemePalette;
  onFilterChange: (filter: FilterType) => void;
  onCycleSort: () => void;
}

const TABS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'completed', label: 'Done' },
];

function FilterTabs({
  filter,
  stats,
  activeSort,
  styles,
  theme,
  onFilterChange,
  onCycleSort,
}: FilterTabsProps) {
  const countFor = (key: FilterType) =>
    key === 'active' ? stats.active : key === 'completed' ? stats.completed : stats.total;

  return (
    <View style={styles.filterRow}>
      <View style={styles.filterTabs}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.filterTab, filter === tab.key && styles.filterTabActive]}
            onPress={() => onFilterChange(tab.key)}
          >
            <Text style={[styles.filterTabText, filter === tab.key && styles.filterTabTextActive]}>
              {tab.label} {countFor(tab.key)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={styles.sortBtn} onPress={onCycleSort}>
        <Ionicons name={activeSort.icon} size={14} color={theme.primary} />
        <Text style={styles.sortBtnText}>{activeSort.label}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default memo(FilterTabs);
