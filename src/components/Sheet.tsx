import React, { memo, useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles, ThemePalette } from '@/constants/theme';

interface SheetProps {
  title: string;
  onClose?: () => void;
  theme: ThemePalette;
  styles: AppStyles;
  children: ReactNode | ((close: () => void) => ReactNode);
}

function Sheet({ title, onClose, theme, styles, children }: SheetProps) {
  const [overlay] = useState(() => new Animated.Value(0));
  const [slide] = useState(() => new Animated.Value(60));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(overlay, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.spring(slide, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 260,
      }),
    ]).start();
  }, [overlay, slide]);

  const close = useCallback(() => {
    Animated.parallel([
      Animated.timing(overlay, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 50, duration: 150, useNativeDriver: true }),
    ]).start(() => onClose?.());
  }, [onClose, overlay, slide]);

  return (
    <Modal visible transparent animationType="none" onRequestClose={close}>
      <Animated.View style={[styles.modalOverlay, { opacity: overlay }]}>
        <Pressable
          style={styles.modalBackdrop}
          onPress={close}
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
        />
        <Animated.View
          style={[styles.sheet, { transform: [{ translateY: slide }] }]}
          accessible
          accessibilityLabel={title}
          accessibilityViewIsModal
        >
          <SafeAreaView style={styles.sheetSafeArea} edges={['bottom']}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <TouchableOpacity
                style={styles.sheetCloseBtn}
                onPress={close}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Close sheet"
              >
                <Ionicons name="close-outline" size={22} color={theme.textMuted} />
              </TouchableOpacity>
            </View>
            <KeyboardAvoidingView style={styles.sheetKeyboard} behavior="padding">
              <ScrollView
                style={styles.sheetScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {typeof children === 'function' ? children(close) : children}
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

export default memo(Sheet);
