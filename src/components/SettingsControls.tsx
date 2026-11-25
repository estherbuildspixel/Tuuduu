import React, { memo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { IconName } from '@/types/task';

interface Option<T extends string | number> {
  id: T;
  label: string;
}

interface ToggleButtonProps {
  value: boolean;
  onPress: () => void;
  theme: ThemePalette;
  styles: AppStyles;
}

function Toggle({ value, onPress, theme, styles }: ToggleButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.switchTrack, value && { backgroundColor: theme.primary }]}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      accessibilityLabel="Toggle setting"
    >
      <View style={[styles.switchKnob, value && styles.switchKnobOn]} />
    </TouchableOpacity>
  );
}

interface OptionSelectorProps<T extends string | number> {
  label: string;
  value: T;
  options: readonly Option<T>[];
  onChange: (value: T) => void;
  theme: ThemePalette;
  styles: AppStyles;
}

function OptionRow<T extends string | number>({
  label,
  value,
  options,
  onChange,
  theme,
  styles,
}: OptionSelectorProps<T>) {
  return (
    <View style={styles.optionBlock}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.optionRow}>
        {options.map((option) => {
          const active = value === option.id;
          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionChip,
                active && {
                  backgroundColor: theme.primarySoft,
                  borderColor: theme.primary,
                },
              ]}
              onPress={() => onChange(option.id)}
            >
              <Text
                style={[
                  styles.optionChipText,
                  active && { color: theme.primary, fontWeight: '700' },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export const ToggleButton = memo(Toggle);
export const OptionSelector = memo(OptionRow) as typeof OptionRow;

export type { IconName, Option };
