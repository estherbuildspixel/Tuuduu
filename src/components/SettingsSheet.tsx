import React, { memo, useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FOCUS_OPTIONS, PRE_DUE_OPTIONS } from '@/constants';
import type { AppStyles, ThemePalette } from '@/constants/theme';
import {
  canScheduleExactAlarms,
  requestExactAlarms,
} from '@/services/notifications';
import type { AppSettings } from '@/types/task';
import { OptionSelector, ToggleButton } from './SettingsControls';
import Sheet from './Sheet';

interface SettingsSheetProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  onEnableReminders: () => void;
  onOpenOnboarding: () => void;
  onResetData: () => void;
  onClose: () => void;
  theme: ThemePalette;
  styles: AppStyles;
}

function SettingsSheet({
  settings,
  setSettings,
  onEnableReminders,
  onOpenOnboarding,
  onResetData,
  onClose,
  theme,
  styles,
}: SettingsSheetProps) {
  const [exactAllowed, setExactAllowed] = useState(false);

  useEffect(() => {
    void canScheduleExactAlarms().then(setExactAllowed);
  }, []);

  const refreshExactAlarms = async () => {
    await requestExactAlarms();
    setExactAllowed(await canScheduleExactAlarms());
  };

  return (
    <Sheet title="Settings" onClose={onClose} theme={theme} styles={styles}>
      {() => (
        <View style={styles.settingsBody}>
          <View style={styles.settingRow}>
            <View style={styles.settingIcon}>
              <Ionicons name="notifications-outline" size={19} color={theme.primary} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Task reminders</Text>
              <Text style={styles.settingSubtitle}>Start, wrap-up, and due alerts</Text>
            </View>
            <ToggleButton
              value={settings.remindersEnabled}
              onPress={onEnableReminders}
              theme={theme}
              styles={styles}
            />
          </View>

          {Platform.OS === 'android' && settings.remindersEnabled && !exactAllowed && (
            <TouchableOpacity style={styles.infoRow} onPress={() => void refreshExactAlarms()}>
              <Ionicons name="information-circle-outline" size={17} color={theme.warning} />
              <Text style={styles.infoText}>Enable exact alarms for precise timing</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.warning} />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.settingRow} onPress={onOpenOnboarding}>
            <View style={styles.settingIcon}>
              <Ionicons name="book-outline" size={19} color={theme.primary} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>How to use Tuuduu</Text>
              <Text style={styles.settingSubtitle}>Replay the quick guide</Text>
            </View>
            <Ionicons name="chevron-forward" size={17} color={theme.textMuted} />
          </TouchableOpacity>

          <OptionSelector
            label="Default wrap-up nudge"
            value={settings.preDueMinutes}
            options={PRE_DUE_OPTIONS.map((value) => ({ id: value, label: `${value}m` }))}
            onChange={(preDueMinutes) =>
              setSettings((prev) => ({ ...prev, preDueMinutes }))
            }
            theme={theme}
            styles={styles}
          />

          <OptionSelector
            label="Focus session length"
            value={settings.focusMinutes}
            options={FOCUS_OPTIONS.map((value) => ({ id: value, label: `${value}m` }))}
            onChange={(focusMinutes) =>
              setSettings((prev) => ({ ...prev, focusMinutes }))
            }
            theme={theme}
            styles={styles}
          />

          <OptionSelector
            label="Appearance"
            value={settings.themePref}
            options={[
              { id: 'system', label: 'System' },
              { id: 'light', label: 'Light' },
              { id: 'dark', label: 'Dark' },
            ]}
            onChange={(themePref) => setSettings((prev) => ({ ...prev, themePref }))}
            theme={theme}
            styles={styles}
          />

          <View style={styles.sectionDivider} />
          <TouchableOpacity style={styles.settingRow} onPress={onResetData}>
            <View style={[styles.settingIcon, { backgroundColor: `${theme.danger}1F` }]}>
              <Ionicons name="refresh-outline" size={19} color={theme.danger} />
            </View>
            <View style={styles.settingCopy}>
              <Text style={[styles.settingTitle, { color: theme.danger }]}>Reset sample data</Text>
              <Text style={styles.settingSubtitle}>Replace all tasks with the starter list</Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.aboutText}>Tuuduu — Your day, sorted. 🤍</Text>
        </View>
      )}
    </Sheet>
  );
}

export default memo(SettingsSheet);
