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
  theme: ThemePalette;
  styles: AppStyles;
  onQueryChange: (value: string) => void;
  onOpenSearch: () => void;
  onCloseSearch: () => void;
  onOpenSettings: () => void;
  onToggleScheme: () => void;
}

function Header({
  searchOpen,
  query,
  dateLabel,
  scheme,
  theme,
  styles,
  onQueryChange,
  onOpenSearch,
  onCloseSearch,
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
          <TouchableOpacity
            style={styles.searchCloseBtn}
            onPress={onCloseSearch}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close search"
          >
            <Ionicons name="close-outline" size={19} color={theme.textSub} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.headerTitleGroup}>
          <Text style={styles.appTitle} numberOfLines={1}>
            Tuuduu
          </Text>
          <Text style={styles.dateSubtitle} numberOfLines={1}>
            Your day, sorted. 🤍 · {dateLabel}
          </Text>
        </View>
      )}

      <View style={styles.headerActions}>
        {!searchOpen && (
          <>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onOpenSearch}
              accessibilityRole="button"
              accessibilityLabel="Search tasks"
            >
              <Ionicons name="search-outline" size={19} color={theme.textSub} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onOpenSettings}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
            >
              <Ionicons name="settings-outline" size={19} color={theme.textSub} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onToggleScheme}
              accessibilityRole="button"
              accessibilityLabel={scheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <Ionicons
                name={scheme === 'dark' ? 'sunny-outline' : 'moon-outline'}
                size={19}
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
