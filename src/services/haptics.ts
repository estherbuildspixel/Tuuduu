import * as Haptics from 'expo-haptics';

export function taskCheckedHaptic(): void {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export function taskDeletedHaptic(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
}
