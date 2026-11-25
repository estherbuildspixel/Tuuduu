import React, { memo, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DateTimePicker } from '@expo/ui/community/datetime-picker';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { ColorScheme, DateTimeMode } from '@/types/task';
import { addDays } from '@/utils/taskUtils';

interface DateTimeSheetProps {
  mode: DateTimeMode;
  value: number | null;
  onConfirm: (timestamp: number) => void;
  onClose: () => void;
  theme: ThemePalette;
  styles: AppStyles;
  scheme: ColorScheme;
}

function isValidDate(value: unknown): value is Date {
  return value instanceof Date && !Number.isNaN(value.getTime());
}

function DateTimeSheet({
  mode,
  value,
  onConfirm,
  onClose,
  theme,
  styles,
  scheme,
}: DateTimeSheetProps) {
  const [draft, setDraft] = useState(() => {
    const initial = new Date(value ?? Date.now());
    return isValidDate(initial) ? initial : new Date();
  });
  const minimumDate = useMemo(() => new Date(), []);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{mode === 'time' ? 'Pick a time' : 'Pick a date'}</Text>
            <TouchableOpacity
              style={styles.sheetCloseBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
            >
              <Ionicons name="close-outline" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <ScrollView
            style={styles.dateSheetScroll}
            contentContainerStyle={[
              styles.dateSheetBody,
              { paddingBottom: Math.max(styles.dateSheetBody.paddingBottom ?? 20, insets.bottom + 12) },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.pickerWrap}>
              <DateTimePicker
                value={draft}
                mode={mode}
                presentation="inline"
                minimumDate={minimumDate}
                accentColor={theme.primary}
                themeVariant={scheme}
                style={styles.dateTimePicker}
                onValueChange={(_event, date) => {
                  if (isValidDate(date)) setDraft(date);
                }}
              />
            </View>
            {mode === 'date' && (
              <View style={styles.quickRow}>
                {[
                  { label: 'Today', offset: 0 },
                  { label: 'Tomorrow', offset: 1 },
                  { label: 'Next week', offset: 7 },
                ].map((item) => (
                  <TouchableOpacity
                    key={item.label}
                    style={styles.quickChip}
                    onPress={() => setDraft(new Date(addDays(Date.now(), item.offset)))}
                  >
                    <Text style={styles.quickChipText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (isValidDate(draft)) onConfirm(draft.getTime());
              }}
            >
              <Text style={styles.primaryButtonText}>Use this {mode}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default memo(DateTimeSheet);
