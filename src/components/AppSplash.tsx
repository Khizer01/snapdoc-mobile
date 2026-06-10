import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  FadeIn, FadeInDown,
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, withDelay, Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Logo } from './Logo';

const SIZE = 160;
const H = SIZE * 1.2;
const DOC_W = SIZE * 0.72;
const DOC_H = H * 0.78;
const DOC_X = (SIZE - DOC_W) / 2;
const DOC_Y = (H - DOC_H) / 2;

export function AppSplash() {
  const scanY = useSharedValue(DOC_Y);
  const glowScale = useSharedValue(1);
  const d1 = useSharedValue(0.25);
  const d2 = useSharedValue(0.25);
  const d3 = useSharedValue(0.25);

  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(DOC_Y + DOC_H - 3, { duration: 2400, easing: Easing.inOut(Easing.cubic) }),
        withDelay(500, withTiming(DOC_Y, { duration: 2400, easing: Easing.inOut(Easing.cubic) })),
        withDelay(500, withTiming(DOC_Y, { duration: 0 })),
      ),
      -1,
      false,
    );

    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );

    const dotDuration = 380;
    const dotDelay = 200;
    const dotCycle = (delay: number) =>
      withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: dotDuration }),
            withTiming(0.25, { duration: dotDuration }),
            withDelay(dotDuration * 2, withTiming(0.25, { duration: 0 })),
          ),
          -1,
          false,
        ),
      );

    d1.value = dotCycle(0);
    d2.value = dotCycle(dotDelay);
    d3.value = dotCycle(dotDelay * 2);
  }, []);

  const scanStyle = useAnimatedStyle(() => ({ top: scanY.value }));
  const glowStyle = useAnimatedStyle(() => ({ transform: [{ scale: glowScale.value }] }));
  const dot1Style = useAnimatedStyle(() => ({ opacity: d1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: d2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: d3.value }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0a0a14', '#0f0f1e', '#0a0a14']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Radial glow behind logo */}
      <Animated.View style={[styles.glowWrap, glowStyle]}>
        <LinearGradient
          colors={['rgba(91,106,240,0.22)', 'rgba(124,58,237,0.12)', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={styles.glow}
        />
      </Animated.View>

      <Animated.View entering={FadeIn.duration(600)} style={styles.logoWrap}>
        <View style={{ width: SIZE, height: H }}>
          <Logo size={SIZE} color="#FFFFFF" />
          <Animated.View style={[styles.scanLine, scanStyle]} />
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(550).delay(250)} style={styles.appName}>
        SnapDoc AI
      </Animated.Text>

      <Animated.Text entering={FadeInDown.duration(550).delay(450)} style={styles.tagline}>
        Scan · Summarise · Ask anything
      </Animated.Text>

      <Animated.View entering={FadeIn.duration(600).delay(700)} style={styles.dots}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a14',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowWrap: {
    position: 'absolute',
    width: 380,
    height: 380,
    alignSelf: 'center',
    top: '50%',
    marginTop: -220,
  },
  glow: {
    width: '100%',
    height: '100%',
    borderRadius: 190,
  },
  logoWrap: {
    marginBottom: 32,
  },
  scanLine: {
    position: 'absolute',
    left: DOC_X,
    width: DOC_W,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.95)',
    shadowColor: '#5B6AF0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  appName: {
    fontSize: 38,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.55)',
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    marginBottom: 56,
  },
  dots: {
    flexDirection: 'row',
    gap: 9,
    position: 'absolute',
    bottom: 72,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#5B6AF0',
  },
});
