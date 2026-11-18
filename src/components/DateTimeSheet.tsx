import React, { memo, useState } from 'react';
import { Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
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

function DateTimeSheet({
  mode,
  value,
  onConfirm,
  onClose,
  theme,
  styles,
  scheme,
}: DateTimeSheetProps) {
  const [draft, setDraft] = useState(() => new Date(value || Date.now()));

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={styles.modalBackdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{mode === 'time' ? 'Pick a time' : 'Pick a date'}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-outline" size={22} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={styles.pickerWrap}>
            <DateTimePicker
              value={draft}
              mode={mode}
              presentation="inline"
              minimumDate={new Date()}
              accentColor={theme.primary}
              themeVariant={scheme}
              onValueChange={(_event, date) => setDraft(date)}
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
          <TouchableOpacity style={styles.primaryButton} onPress={() => onConfirm(draft.getTime())}>
            <Text style={styles.primaryButtonText}>Use this {mode}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default memo(DateTimeSheet);
