import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import type { ThemePalette } from '@/constants/theme';
import type { IconName } from '@/types/task';

type AccentKey = 'primary' | 'warning' | 'success';

interface OnboardingStep {
  icon: IconName;
  text: string;
}

interface OnboardingSlide {
  key: string;
  step: string;
  eyebrow: string;
  title: string;
  body: string;
  tag: string;
  accent: AccentKey;
  steps: OnboardingStep[];
}

const SLIDES: readonly OnboardingSlide[] = [
  {
    key: 'capture',
    step: '01',
    eyebrow: 'CAPTURE',
    title: 'Catch every task.',
    body: 'Start with one line. Tuuduu keeps the small stuff close so your head can stay clear.',
    tag: 'Type it. Sort it. Done.',
    accent: 'primary',
    steps: [
      { icon: 'add-outline', text: 'Type a task at the bottom and tap +.' },
      { icon: 'apps-outline', text: 'Pick a category chip first.' },
      { icon: 'checkmark-outline', text: 'Tap the circle when it is done.' },
    ],
  },
  {
    key: 'plan',
    step: '02',
    eyebrow: 'PLAN',
    title: 'Give it a time.',
    body: 'Turn a loose task into a simple plan with details, gentle nudges, and one focused block.',
    tag: 'Start → wrap-up → due',
    accent: 'warning',
    steps: [
      { icon: 'create-outline', text: 'Open a task for notes, steps, and priority.' },
      { icon: 'alarm-outline', text: 'Set Start and Due / end, then turn on reminders.' },
      { icon: 'timer-outline', text: 'Tap play on a task to focus for 25 minutes.' },
    ],
  },
  {
    key: 'track',
    step: '03',
    eyebrow: 'TRACK',
    title: 'Watch your day click.',
    body: 'Find what matters, see what you finished, and make the app feel like yours.',
    tag: 'Small wins add up.',
    accent: 'success',
    steps: [
      { icon: 'search-outline', text: 'Search, filter, and sort from the top.' },
      { icon: 'stats-chart-outline', text: 'Tap the percent for progress and streaks.' },
      { icon: 'settings-outline', text: 'Use Settings for themes and to replay this guide.' },
    ],
  },
];

function accentFor(theme: ThemePalette, key: AccentKey): string {
  if (key === 'warning') return theme.warning;
  if (key === 'success') return theme.success;
  return theme.primary;
}

interface OnboardingFlowProps {
  theme: ThemePalette;
  onFinish: () => void;
}

export default function OnboardingFlow({ theme, onFinish }: OnboardingFlowProps) {
  const [page, setPage] = useState(0);
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(20));
  const [float] = useState(() => new Animated.Value(0));
  const [pulse] = useState(() => new Animated.Value(1));
  const slide = SLIDES[page];
  const accent = accentFor(theme, slide.accent);
  const isLast = page === SLIDES.length - 1;
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { width, height } = useWindowDimensions();
  const compact = width < 360 || height < 700;
  const viewStyles = useMemo(
    () => ({
      ...styles,
      scrollContent: {
        ...styles.scrollContent,
        paddingHorizontal: compact ? 14 : 20,
        paddingVertical: compact ? 8 : 12,
      },
      card: {
        ...styles.card,
        paddingHorizontal: compact ? 16 : 22,
        paddingVertical: compact ? 16 : 24,
      },
      scene: {
        ...styles.scene,
        height: compact ? 150 : 188,
        marginBottom: compact ? 10 : 18,
      },
      sceneOrb: {
        ...styles.sceneOrb,
        width: compact ? 150 : 180,
        height: compact ? 150 : 180,
      },
      sceneOrbWide: {
        ...styles.sceneOrbWide,
        width: compact ? 174 : 210,
        height: compact ? 130 : 160,
      },
      floatStack: { ...styles.floatStack, width: compact ? '86%' : '82%' },
      timeline: { ...styles.timeline, width: compact ? '84%' : '78%' },
      progressOrb: {
        ...styles.progressOrb,
        width: compact ? 122 : 142,
        height: compact ? 122 : 142,
        borderWidth: compact ? 7 : 9,
      },
      focusBubble: {
        ...styles.focusBubble,
        width: compact ? 78 : 92,
        height: compact ? 78 : 92,
        borderRadius: compact ? 39 : 46,
      },
      title: {
        ...styles.title,
        fontSize: compact ? 23 : 26,
        lineHeight: compact ? 28 : 31,
      },
      footer: { ...styles.footer, paddingHorizontal: compact ? 14 : 20 },
    }) as ReturnType<typeof makeStyles>,
    [compact, styles]
  );

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(20);
    const transition = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]);
    transition.start();
    return () => transition.stop();
  }, [opacity, page, translateY]);

  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: -6,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 6,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.06,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();
    pulseLoop.start();
    return () => {
      floatLoop.stop();
      pulseLoop.stop();
    };
  }, [float, pulse]);

  const goNext = () => {
    if (isLast) onFinish();
    else setPage((current) => current + 1);
  };

  const goBack = () => setPage((current) => Math.max(0, current - 1));

  return (
    <Modal visible animationType="fade" onRequestClose={onFinish}>
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: accent }]}>
              <Ionicons name="heart" size={16} color={theme.onPrimary} />
            </View>
            <Text style={styles.brandName}>Tuuduu</Text>
          </View>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onFinish}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={viewStyles.scroll}
          contentContainerStyle={viewStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[viewStyles.card, { opacity, transform: [{ translateY }] }]}>
            <View style={styles.cardTop}>
              <View style={[styles.stepPill, { backgroundColor: `${accent}1F` }]}>
                <Text style={[styles.stepPillText, { color: accent }]}>STEP {slide.step}</Text>
              </View>
              <Text style={styles.eyebrow}>{slide.eyebrow}</Text>
            </View>

            <HeroScene
              page={page}
              theme={theme}
              styles={viewStyles}
              accent={accent}
              float={float}
              pulse={pulse}
            />

            <Text style={viewStyles.title}>{slide.title}</Text>
            <Text style={styles.body}>{slide.body}</Text>

            <View style={styles.steps}>
              {slide.steps.map((step) => (
                <View key={step.text} style={styles.stepRow}>
                  <View style={[styles.stepIcon, { backgroundColor: `${accent}1F` }]}>
                    <Ionicons name={step.icon} size={15} color={accent} />
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.tagRow, { backgroundColor: `${accent}12` }]}>
              <Ionicons name="sparkles-outline" size={14} color={accent} />
              <Text style={[styles.tagText, { color: accent }]}>{slide.tag}</Text>
            </View>
          </Animated.View>
        </ScrollView>

        <View style={viewStyles.footer}>
          <View style={styles.progressCopy}>
            <Text style={styles.progressLabel}>STEP {page + 1} OF {SLIDES.length}</Text>
            <Text style={styles.progressDots}>
              {'●'.repeat(page + 1)}{'○'.repeat(SLIDES.length - page - 1)}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((page + 1) / SLIDES.length) * 100}%`,
                  backgroundColor: accent,
                },
              ]}
            />
          </View>
          <View style={styles.buttonRow}>
            {page > 0 && (
              <TouchableOpacity style={styles.backButton} onPress={goBack}>
                <Ionicons name="chevron-back" size={18} color={theme.textSub} />
                <Text style={styles.backText}>Back</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: accent }]}
              onPress={goNext}
            >
              <Text style={[styles.nextText, { color: theme.onPrimary }]}>
                {isLast ? 'Get started' : 'Next'}
              </Text>
              <Ionicons
                name={isLast ? 'checkmark-outline' : 'chevron-forward'}
                size={18}
                color={theme.onPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

interface HeroSceneProps {
  page: number;
  theme: ThemePalette;
  styles: ReturnType<typeof makeStyles>;
  accent: string;
  float: Animated.Value;
  pulse: Animated.Value;
}

function HeroScene({ page, theme, styles, accent, float, pulse }: HeroSceneProps) {
  if (page === 0) {
    return (
      <View style={styles.scene}>
        <Animated.View
          style={[styles.sceneOrb, { backgroundColor: `${accent}18`, transform: [{ scale: pulse }] }]}
        />
        <Animated.View style={[styles.floatStack, { transform: [{ translateY: float }] }]}>
          <View style={[styles.mockCard, styles.mockCardBack]} />
          <View style={[styles.mockCard, styles.mockCardMid]} />
          <View style={[styles.mockCard, styles.mockCardFront, { borderColor: accent }]}>
            <View style={[styles.mockCheck, { borderColor: accent, backgroundColor: `${accent}1F` }]}>
              <Ionicons name="checkmark" size={13} color={accent} />
            </View>
            <View style={styles.mockLines}>
              <View style={styles.mockLine} />
              <View style={[styles.mockLine, styles.mockLineShort]} />
            </View>
            <View style={[styles.mockTag, { backgroundColor: `${accent}1F` }]}>
              <Text style={[styles.mockTagText, { color: accent }]}>WORK</Text>
            </View>
          </View>
        </Animated.View>
        <View style={[styles.floatingChip, styles.categoryChipTop, { borderColor: accent }]}>
          <View style={[styles.chipDot, { backgroundColor: theme.success }]} />
          <Text style={styles.floatingChipText}>Personal</Text>
        </View>
        <View style={[styles.addOrb, { backgroundColor: accent }]}>
          <Ionicons name="add" size={24} color={theme.onPrimary} />
        </View>
      </View>
    );
  }

  if (page === 1) {
    const moments: { icon: IconName; label: string; time: string; color: string }[] = [
      { icon: 'play-circle-outline', label: 'Start', time: '09:00', color: theme.success },
      { icon: 'notifications-outline', label: 'Wrap-up', time: '09:20', color: accent },
      { icon: 'flag-outline', label: 'Due', time: '09:30', color: theme.danger },
    ];
    return (
      <View style={styles.scene}>
        <Animated.View
          style={[styles.sceneOrb, { backgroundColor: `${accent}18`, transform: [{ scale: pulse }] }]}
        />
        <View style={styles.timeline}>
          <View style={[styles.timelineLine, { backgroundColor: theme.border }]} />
          {moments.map((moment) => (
            <View key={moment.label} style={styles.timelineRow}>
              <View
                style={[
                  styles.timelineNode,
                  { borderColor: moment.color, backgroundColor: theme.surface },
                ]}
              >
                <Ionicons name={moment.icon} size={17} color={moment.color} />
              </View>
              <View style={styles.timelineCopy}>
                <Text style={styles.timelineLabel}>{moment.label}</Text>
                <Text style={styles.timelineTime}>{moment.time}</Text>
              </View>
            </View>
          ))}
        </View>
        <Animated.View
          style={[
            styles.focusBubble,
            {
              borderColor: accent,
              backgroundColor: theme.surface,
              transform: [{ scale: pulse }],
            },
          ]}
        >
          <Text style={[styles.focusTime, { color: accent }]}>25:00</Text>
          <Ionicons name="timer-outline" size={15} color={theme.textMuted} />
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.scene}>
      <Animated.View
        style={[styles.sceneOrbWide, { backgroundColor: `${accent}18`, transform: [{ scale: pulse }] }]}
      />
      <Animated.View
        style={[
          styles.progressOrb,
          { borderColor: accent, transform: [{ translateY: float }] },
        ]}
      >
        <View style={[styles.progressOrbInner, { backgroundColor: theme.surface }]}>
          <Text style={[styles.progressValue, { color: accent }]}>78%</Text>
          <Text style={styles.progressCaption}>day done</Text>
        </View>
      </Animated.View>
      <View
        style={[styles.floatingChip, styles.streakChip, { borderColor: `${theme.warning}66` }]}
      >
        <Ionicons name="flame-outline" size={14} color={theme.warning} />
        <Text style={styles.floatingChipText}>5 day streak</Text>
      </View>
      <View style={[styles.floatingChip, styles.searchChip, { borderColor: theme.primary }]}>
        <Ionicons name="search-outline" size={14} color={theme.primary} />
        <Text style={styles.floatingChipText}>Find anything</Text>
      </View>
      <View style={styles.miniBars}>
        {[38, 64, 48, 82, 58].map((height, index) => (
          <View
            key={height}
            style={[
              styles.miniBar,
              { height, backgroundColor: index === 3 ? accent : theme.border },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function makeStyles(theme: ThemePalette) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.bg,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 10,
      paddingBottom: 6,
    },
    brand: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    brandMark: {
      width: 30,
      height: 30,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    brandName: {
      fontSize: 16,
      fontWeight: '800',
      color: theme.text,
    },
    skipButton: {
      minWidth: 44,
      minHeight: 44,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    skipText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textMuted,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    card: {
      backgroundColor: theme.surface,
      borderRadius: 28,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: 22,
      paddingVertical: 24,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.14,
      shadowRadius: 24,
      elevation: 5,
    },
    cardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    stepPill: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
    },
    stepPillText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.8,
    },
    eyebrow: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.textMuted,
      letterSpacing: 1.4,
    },
    scene: {
      height: 188,
      marginTop: 10,
      marginBottom: 18,
      position: 'relative',
      justifyContent: 'center',
      alignItems: 'center',
    },
    sceneOrb: {
      position: 'absolute',
      width: 180,
      height: 180,
      borderRadius: 90,
      top: 2,
      right: 8,
    },
    sceneOrbWide: {
      position: 'absolute',
      width: 210,
      height: 160,
      borderRadius: 80,
      top: 14,
      left: 12,
    },
    floatStack: {
      width: '82%',
      height: 140,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mockCard: {
      position: 'absolute',
      width: '88%',
      minHeight: 58,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    mockCardBack: {
      top: 8,
      opacity: 0.4,
      transform: [{ rotate: '-6deg' }],
    },
    mockCardMid: {
      top: 28,
      opacity: 0.7,
      transform: [{ rotate: '5deg' }],
    },
    mockCardFront: {
      top: 52,
      zIndex: 2,
    },
    mockCheck: {
      width: 25,
      height: 25,
      borderRadius: 8,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mockLines: {
      flex: 1,
      gap: 6,
    },
    mockLine: {
      width: '82%',
      height: 6,
      borderRadius: 3,
      backgroundColor: theme.textMuted,
      opacity: 0.35,
    },
    mockLineShort: {
      width: '52%',
    },
    mockTag: {
      paddingHorizontal: 7,
      paddingVertical: 4,
      borderRadius: 7,
    },
    mockTagText: {
      fontSize: 8,
      fontWeight: '800',
    },
    floatingChip: {
      position: 'absolute',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 12,
      borderWidth: 1,
      backgroundColor: theme.surface,
      zIndex: 4,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 2,
    },
    categoryChipTop: {
      top: 14,
      right: 14,
    },
    chipDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    floatingChipText: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textSub,
    },
    addOrb: {
      position: 'absolute',
      right: 18,
      bottom: 18,
      width: 48,
      height: 48,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 5,
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 4,
    },
    timeline: {
      width: '78%',
      gap: 18,
    },
    timelineLine: {
      position: 'absolute',
      left: 17,
      top: 26,
      bottom: 26,
      width: 2,
      borderRadius: 1,
    },
    timelineRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    timelineNode: {
      width: 36,
      height: 36,
      borderRadius: 12,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2,
    },
    timelineCopy: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    timelineLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: theme.text,
    },
    timelineTime: {
      fontSize: 11,
      fontWeight: '800',
      color: theme.textMuted,
    },
    focusBubble: {
      position: 'absolute',
      right: 6,
      bottom: 6,
      width: 92,
      height: 92,
      borderRadius: 46,
      borderWidth: 2,
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 3,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.14,
      shadowRadius: 12,
      elevation: 4,
    },
    focusTime: {
      fontSize: 19,
      fontWeight: '800',
    },
    progressOrb: {
      width: 142,
      height: 142,
      borderRadius: 71,
      borderWidth: 9,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 5,
    },
    progressOrbInner: {
      width: '100%',
      height: '100%',
      borderRadius: 62,
      justifyContent: 'center',
      alignItems: 'center',
    },
    progressValue: {
      fontSize: 34,
      fontWeight: '800',
    },
    progressCaption: {
      fontSize: 10,
      fontWeight: '700',
      color: theme.textMuted,
      marginTop: 2,
    },
    streakChip: {
      top: 18,
      right: 12,
    },
    searchChip: {
      bottom: 22,
      left: 10,
    },
    miniBars: {
      position: 'absolute',
      right: 16,
      bottom: 18,
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 5,
      height: 82,
    },
    miniBar: {
      width: 8,
      borderRadius: 4,
    },
    title: {
      fontSize: 26,
      lineHeight: 31,
      fontWeight: '800',
      color: theme.text,
      letterSpacing: -0.6,
    },
    body: {
      fontSize: 14,
      lineHeight: 21,
      color: theme.textSub,
      marginTop: 9,
    },
    steps: {
      marginTop: 20,
      gap: 10,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    stepIcon: {
      width: 29,
      height: 29,
      borderRadius: 10,
      justifyContent: 'center',
      alignItems: 'center',
    },
    stepText: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      color: theme.textSub,
    },
    tagRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 11,
      marginTop: 18,
    },
    tagText: {
      flexShrink: 1,
      fontSize: 11,
      fontWeight: '800',
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 14,
    },
    progressCopy: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 7,
    },
    progressLabel: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.textMuted,
      letterSpacing: 1,
    },
    progressDots: {
      fontSize: 10,
      fontWeight: '800',
      color: theme.primary,
      letterSpacing: 2,
    },
    progressTrack: {
      height: 5,
      borderRadius: 3,
      backgroundColor: theme.surfaceMuted,
      overflow: 'hidden',
      marginBottom: 16,
    },
    progressFill: {
      height: '100%',
      borderRadius: 3,
    },
    buttonRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      minHeight: 48,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 13,
      backgroundColor: theme.surfaceMuted,
    },
    backText: {
      fontSize: 13,
      fontWeight: '700',
      color: theme.textSub,
    },
    nextButton: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 7,
      minHeight: 48,
      paddingVertical: 14,
      borderRadius: 13,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    nextText: {
      fontSize: 14,
      fontWeight: '800',
    },
  });
}
