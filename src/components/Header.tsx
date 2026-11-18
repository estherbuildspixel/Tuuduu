import React, { memo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { ColorScheme } from '@/types/task';

interface HeaderProps {
  searchOpen: boolean;
  query: string;
  dateLabel: string;
  scheme: ColorScheme;
  completedCount: number;
  theme: ThemePalette;
  styles: AppStyles;
  onQueryChange: (value: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onClearCompleted: () => void;
  onOpenSettings: () => void;
  onToggleScheme: () => void;
}

function Header({
  searchOpen,
  query,
  dateLabel,
  scheme,
  completedCount,
  theme,
  styles,
  onQueryChange,
  onOpenSearch,
  onCloseSearch,
  onClearCompleted,
  onOpenSettings,
  onToggleScheme,
}: HeaderProps) {
  return (
    <View style={styles.header}>
      {searchOpen ? (
        <View style={styles.searchWrap}>
          <Ionicons name="search-outline" size={18} color={theme.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tasks..."
            placeholderTextColor={theme.textMuted}
            value={query}
            onChangeText={onQueryChange}
            autoFocus
            returnKeyType="search"
          />
          <TouchableOpacity onPress={onCloseSearch} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-outline" size={18} color={theme.textSub} />
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <Text style={styles.appTitle}>Tuuduu</Text>
          <Text style={styles.dateSubtitle}>Your day, sorted. 🤍 · {dateLabel}</Text>
        </View>
      )}

      <View style={styles.headerActions}>
        {!searchOpen && (
          <>
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenSearch}>
              <Ionicons name="search-outline" size={17} color={theme.textSub} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onClearCompleted}
              disabled={completedCount === 0}
              accessibilityRole="button"
              accessibilityLabel={`Clear ${completedCount} completed task${completedCount === 1 ? '' : 's'}`}
            >
              <Ionicons
                name="sparkles-outline"
                size={17}
                color={completedCount > 0 ? theme.primary : theme.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onOpenSettings}>
              <Ionicons name="settings-outline" size={17} color={theme.textSub} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={onToggleScheme}>
              <Ionicons
                name={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={17}
                color={theme.textSub}
              />
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

export default memo(Header);
