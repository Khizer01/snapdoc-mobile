import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { useTheme, spacing, typography, radius } from '../theme';
import { Message } from '../types';

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export function MessageBubble({ message, index }: MessageBubbleProps) {
  const { colors } = useTheme();
  const isUser = message.role === 'user';

  return (
    <Animated.View
      entering={FadeInDown.duration(250).delay(Math.min(index * 40, 200))}
      style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}
    >
      <View style={[
        styles.bubble,
        isUser
          ? { backgroundColor: colors.primary }
          : { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
      ]}>
        <Text style={[typography.body, { color: isUser ? '#fff' : colors.textPrimary }]}>
          {message.content}
        </Text>
      </View>
    </Animated.View>
  );
}

function Dot({ delay }: { delay: number }) {
  const { colors } = useTheme();
  const y = useSharedValue(0);

  useEffect(() => {
    y.value = withDelay(delay, withRepeat(
      withTiming(-5, { duration: 400, easing: Easing.inOut(Easing.ease) }),
      -1, true
    ));
  }, []);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));

  return (
    <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.textSecondary, marginHorizontal: 2 }, style]} />
  );
}

export function TypingIndicator() {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeInDown.duration(200)} style={[styles.row, styles.rowLeft]}>
      <View style={[styles.bubble, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
        <View style={styles.dotsRow}>
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { marginBottom: spacing.sm, paddingHorizontal: spacing.md },
  rowLeft: { alignItems: 'flex-start' },
  rowRight: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4, paddingHorizontal: 2 },
});
