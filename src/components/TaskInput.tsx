import React, { memo } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORIES } from '@/constants';
import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { CategoryType } from '@/types/task';

interface TaskInputProps {
  value: string;
  selectedCategory: CategoryType;
  styles: AppStyles;
  theme: ThemePalette;
  onValueChange: (value: string) => void;
  onCategoryChange: (category: CategoryType) => void;
  onAdd: () => void;
  onSchedule: () => void;
}

function TaskInput({
  value,
  selectedCategory,
  styles,
  theme,
  onValueChange,
  onCategoryChange,
  onAdd,
  onSchedule,
}: TaskInputProps) {
  const canAdd = value.trim().length > 0;

  return (
    <View style={styles.inputSection}>
      <View style={styles.categoryPickerRow}>
        {CATEGORIES.map((category) => {
          const active = selectedCategory === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryChip,
                active && { borderColor: category.color, backgroundColor: `${category.color}1F` },
              ]}
              onPress={() => onCategoryChange(category.id)}
            >
              <View style={[styles.categoryChipDot, { backgroundColor: category.color }]} />
              <Text
                style={[
                  styles.categoryChipLabel,
                  active && { color: category.color, fontWeight: '700' },
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.textInput}
          placeholder="Add a task to sort your day..."
          placeholderTextColor={theme.textMuted}
          value={value}
          onChangeText={onValueChange}
          onSubmitEditing={onAdd}
          returnKeyType="done"
        />
        <TouchableOpacity style={styles.scheduleBtn} onPress={onSchedule}>
          <Ionicons name="calendar-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
          onPress={onAdd}
          disabled={!canAdd}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={25} color={canAdd ? theme.onPrimary : theme.textSub} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default memo(TaskInput);
