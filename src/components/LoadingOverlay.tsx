import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withTiming, withDelay, Easing, FadeIn,
} from 'react-native-reanimated';
import { Logo } from './Logo';
import { useTheme, spacing, typography, shadows } from '../theme';

function PulsingDot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(withTiming(-6, { duration: 400, easing: Easing.inOut(Easing.ease) }), -1, true)
    );
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));

  return (
    <Animated.View
      style={[{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginHorizontal: 3 }, style]}
    />
  );
}

interface LoadingOverlayProps {
  label?: string;
}

export function LoadingOverlay({ label }: LoadingOverlayProps) {
  const { colors } = useTheme();
  const [dots, setDots] = useState('');

  useEffect(() => {
    const id = setInterval(() => setDots(d => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, []);

  return (
    <Animated.View entering={FadeIn.duration(200)} style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: colors.surface, ...shadows.card }]}>
        <Logo size={44} color={colors.primary} />

        <View style={styles.dotsRow}>
          <PulsingDot delay={0} />
          <PulsingDot delay={150} />
          <PulsingDot delay={300} />
        </View>

        {label && (
          <Text style={[typography.label, { color: colors.textPrimary, textAlign: 'center' }]}>
            {label}{dots}
          </Text>
        )}
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
          Powered by Gemini AI
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  card: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 36,
    borderRadius: 24,
    width: 220,
  },
  dotsRow: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 12,
  },
});
