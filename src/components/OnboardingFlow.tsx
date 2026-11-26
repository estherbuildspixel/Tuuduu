import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { ThemePalette } from '@/constants/theme';

interface OnboardingFlowProps {
  theme: ThemePalette;
  onFinish: () => void;
}

export default function OnboardingFlow({ theme, onFinish }: OnboardingFlowProps) {
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(12));
  const [faceFloat] = useState(() => new Animated.Value(0));
  const viewStyles = useMemo(
    () => ({
      ...styles,
      scrollContent: {
        ...styles.scrollContent,
        paddingHorizontal: compact ? 24 : 28,
        paddingVertical: compact ? 16 : 24,
      },
      title: {
        ...styles.title,
        fontSize: compact ? 28 : 30,
        lineHeight: compact ? 34 : 36,
      },
    }) as ReturnType<typeof makeStyles>,
    [compact, styles]
  );

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(12);
    faceFloat.setValue(0);
    const entrance = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(faceFloat, {
          toValue: -3,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(faceFloat, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    entrance.start();
    breathe.start();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      onFinish();
    };
    const exitTimer = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start(finish);
    }, 720);
    return () => {
      finished = true;
      entrance.stop();
      breathe.stop();
      clearTimeout(exitTimer);
    };
  }, [faceFloat, onFinish, opacity, translateY]);

  return (
    <Modal visible animationType="fade" onRequestClose={onFinish}>
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={viewStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[styles.welcome, { opacity, transform: [{ translateY }] }]}
          >
            <Animated.View
              style={[styles.illustration, { transform: [{ translateY: faceFloat }] }]}
            >
              <View style={styles.face}>
                <View style={[styles.eye, styles.eyeLeft]} />
                <View style={[styles.eye, styles.eyeRight]} />
                <View style={styles.smile} />
              </View>
            </Animated.View>
            <Text style={viewStyles.title}>Welcome</Text>
            <Text style={styles.body}>
              Tuuduu keeps your tasks, time, and small wins together in one calm place.
            </Text>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function makeStyles(theme: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 28,
      paddingVertical: 24,
    },
    welcome: {
      width: '100%',
      maxWidth: 360,
      alignSelf: 'center',
      alignItems: 'center',
    },
    illustration: {
      alignItems: 'center',
      marginBottom: 30,
    },
    face: {
      width: 96,
      height: 96,
      borderRadius: 26,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.primarySoft,
    },
    eye: {
      position: 'absolute',
      top: 35,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: theme.text,
    },
    eyeLeft: {
      left: 30,
    },
    eyeRight: {
      right: 30,
    },
    smile: {
      position: 'absolute',
      left: 30,
      bottom: 27,
      width: 36,
      height: 18,
      borderBottomWidth: 3,
      borderBottomColor: theme.text,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
    },
    title: {
      fontSize: 30,
      lineHeight: 36,
      fontWeight: '700',
      color: theme.text,
      letterSpacing: -0.6,
      textAlign: 'center',
    },
    body: {
      fontSize: 15,
      lineHeight: 22,
      color: theme.textSub,
      textAlign: 'center',
      maxWidth: 300,
      marginTop: 10,
    },
  });
}
