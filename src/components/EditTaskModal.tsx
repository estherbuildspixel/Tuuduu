import React, { memo, useState, type Dispatch, type SetStateAction } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CATEGORIES, PRIORITIES, PRE_DUE_OPTIONS, REPEAT_OPTIONS } from '@/constants';
import type { AppStyles, ThemePalette } from '@/constants/theme';
import type { DateTimeField, Task } from '@/types/task';
import { formatDateTime, newId } from '@/utils/taskUtils';
import { OptionSelector } from './SettingsControls';
import Sheet from './Sheet';

interface EditTaskModalProps {
  draft: Task;
  setDraft: Dispatch<SetStateAction<Task | null>>;
  onSave: () => void;
  onDelete: () => void;
  onPickDateTime: (field: DateTimeField, value: number | null, mode: 'date' | 'time') => void;
  onClearDateTime: (field: DateTimeField) => void;
  onClose: () => void;
  isNew: boolean;
  theme: ThemePalette;
  styles: AppStyles;
}

function EditTaskModal({
  draft,
  setDraft,
  onSave,
  onDelete,
  onPickDateTime,
  onClearDateTime,
  onClose,
  isNew,
  theme,
  styles,
}: EditTaskModalProps) {
  const [subtaskInput, setSubtaskInput] = useState('');

  const updateDraft = (updater: (task: Task) => Task) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  };

  const addSubtask = () => {
    const text = subtaskInput.trim();
    if (!text) return;
    updateDraft((prev) => ({
      ...prev,
      subtasks: [...prev.subtasks, { id: newId(), text, done: false }],
    }));
    setSubtaskInput('');
  };

  return (
    <Sheet title={isNew ? 'New task' : 'Edit task'} onClose={onClose} theme={theme} styles={styles}>
      {(close) => (
        <View style={styles.editorBody}>
          <Text style={styles.fieldLabel}>Task</Text>
          <TextInput
            style={styles.fieldInput}
            value={draft.text}
            onChangeText={(text) => updateDraft((prev) => ({ ...prev, text }))}
            placeholder="What needs sorting?"
            placeholderTextColor={theme.textMuted}
            autoFocus
          />
          <Text style={[styles.fieldLabel, styles.spacedLabel]}>Notes</Text>
          <TextInput
            style={[styles.fieldInput, styles.notesInput]}
            value={draft.notes}
            onChangeText={(notes) => updateDraft((prev) => ({ ...prev, notes }))}
            placeholder="Add details..."
            placeholderTextColor={theme.textMuted}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.fieldLabel, styles.spacedLabel]}>Category</Text>
          <View style={styles.optionRow}>
            {CATEGORIES.map((item) => {
              const active = draft.category === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionChip,
                    active && {
                      backgroundColor: `${item.color}1F`,
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => updateDraft((prev) => ({ ...prev, category: item.id }))}
                >
                  <Ionicons
                    name={item.icon}
                    size={13}
                    color={active ? item.color : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.optionChipText,
                      active && { color: item.color, fontWeight: '700' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={[styles.fieldLabel, styles.spacedLabel]}>Priority</Text>
          <View style={styles.optionRow}>
            {PRIORITIES.map((item) => {
              const active = draft.priority === item.id;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.optionChip,
                    active && {
                      backgroundColor: `${item.color}1F`,
                      borderColor: item.color,
                    },
                  ]}
                  onPress={() => updateDraft((prev) => ({ ...prev, priority: item.id }))}
                >
                  <Ionicons
                    name="flag-outline"
                    size={13}
                    color={active ? item.color : theme.textMuted}
                  />
                  <Text
                    style={[
                      styles.optionChipText,
                      active && { color: item.color, fontWeight: '700' },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.sectionDivider} />
          <View style={styles.sectionHeading}>
            <Ionicons name="alarm-outline" size={17} color={theme.primary} />
            <Text style={styles.sectionHeadingText}>Reminders</Text>
          </View>

          <View style={styles.dateField}>
            <TouchableOpacity
              style={styles.dateFieldMain}
              onPress={() => onPickDateTime('startAt', draft.startAt, 'date')}
            >
              <Ionicons name="play-circle-outline" size={18} color={theme.success} />
              <View>
                <Text style={styles.dateFieldLabel}>Start</Text>
                <Text style={[styles.dateFieldValue, !draft.startAt && styles.dateFieldEmpty]}>
                  {draft.startAt ? formatDateTime(draft.startAt) : 'Set a start time'}
                </Text>
              </View>
            </TouchableOpacity>
            {!!draft.startAt && (
              <TouchableOpacity onPress={() => onClearDateTime('startAt')}>
                <Ionicons name="close-circle-outline" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {!!draft.startAt && (
            <TouchableOpacity
              style={styles.timeLink}
              onPress={() => onPickDateTime('startAt', draft.startAt, 'time')}
            >
              <Text style={styles.timeLinkText}>Change time</Text>
            </TouchableOpacity>
          )}

          <View style={styles.dateField}>
            <TouchableOpacity
              style={styles.dateFieldMain}
              onPress={() => onPickDateTime('dueAt', draft.dueAt, 'date')}
            >
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              <View>
                <Text style={styles.dateFieldLabel}>Due / end</Text>
                <Text style={[styles.dateFieldValue, !draft.dueAt && styles.dateFieldEmpty]}>
                  {draft.dueAt ? formatDateTime(draft.dueAt) : 'Set a deadline'}
                </Text>
              </View>
            </TouchableOpacity>
            {!!draft.dueAt && (
              <TouchableOpacity onPress={() => onClearDateTime('dueAt')}>
                <Ionicons name="close-circle-outline" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
          {!!draft.dueAt && (
            <>
              <TouchableOpacity
                style={styles.timeLink}
                onPress={() => onPickDateTime('dueAt', draft.dueAt, 'time')}
              >
                <Text style={styles.timeLinkText}>Change time</Text>
              </TouchableOpacity>
              <Text style={[styles.fieldLabel, styles.spacedLabel]}>Wrap-up nudge before due</Text>
              <View style={styles.optionRow}>
                {PRE_DUE_OPTIONS.map((minutes) => (
                  <TouchableOpacity
                    key={minutes}
                    style={[
                      styles.optionChip,
                      draft.preDueMinutes === minutes && {
                        backgroundColor: theme.primarySoft,
                        borderColor: theme.primary,
                      },
                    ]}
                    onPress={() => updateDraft((prev) => ({ ...prev, preDueMinutes: minutes }))}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        draft.preDueMinutes === minutes && {
                          color: theme.primary,
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {minutes}m
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          <OptionSelector
            label="Repeat"
            value={draft.repeat}
            options={REPEAT_OPTIONS}
            onChange={(repeat) => updateDraft((prev) => ({ ...prev, repeat }))}
            theme={theme}
            styles={styles}
          />

          <View style={styles.sectionDivider} />
          <Text style={[styles.fieldLabel, styles.spacedLabel]}>Subtasks</Text>
          {draft.subtasks.map((subtask) => (
            <View key={subtask.id} style={styles.subtaskRow}>
              <TouchableOpacity
                onPress={() =>
                  updateDraft((prev) => ({
                    ...prev,
                    subtasks: prev.subtasks.map((item) =>
                      item.id === subtask.id ? { ...item, done: !item.done } : item
                    ),
                  }))
                }
              >
                <Ionicons
                  name={subtask.done ? 'checkmark-circle' : 'ellipse-outline'}
                  size={19}
                  color={subtask.done ? theme.success : theme.textMuted}
                />
              </TouchableOpacity>
              <Text style={[styles.subtaskText, subtask.done && styles.subtaskTextDone]}>
                {subtask.text}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  updateDraft((prev) => ({
                    ...prev,
                    subtasks: prev.subtasks.filter((item) => item.id !== subtask.id),
                  }))
                }
              >
                <Ionicons name="close-outline" size={17} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.subtaskAddRow}>
            <TextInput
              style={[styles.fieldInput, styles.subtaskInput]}
              value={subtaskInput}
              onChangeText={setSubtaskInput}
              onSubmitEditing={addSubtask}
              placeholder="Add a subtask"
              placeholderTextColor={theme.textMuted}
            />
            <TouchableOpacity style={styles.smallAddButton} onPress={addSubtask}>
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalButtonRow}>
            {!isNew && (
              <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
                <Ionicons name="trash-outline" size={17} color={theme.danger} />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.secondaryButton} onPress={close}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryButtonPill, !draft.text.trim() && styles.primaryButtonDisabled]}
              onPress={onSave}
              disabled={!draft.text.trim()}
            >
              <Text style={styles.primaryButtonText}>{isNew ? 'Add task' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </Sheet>
  );
}

export default memo(EditTaskModal);
