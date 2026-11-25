import React, { memo, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { AppStyles } from '@/constants/theme';

interface CheckboxProps {
  checked: boolean;
  color: string;
  onPress: () => void;
  styles: AppStyles;
}

function Checkbox({ checked, color, onPress, styles }: CheckboxProps) {
  const [scale] = useState(() => new Animated.Value(1));
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.22,
        duration: 110,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.back(2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [checked, scale]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.checkboxContainer}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Animated.View
        style={[
          styles.checkbox,
          { borderColor: checked ? color : undefined, transform: [{ scale }] },
          checked && styles.checkboxChecked,
        ]}
      >
        {checked && <Ionicons name="checkmark" size={15} color="#FFFFFF" />}
      </Animated.View>
    </Pressable>
  );
}

export default memo(Checkbox);
