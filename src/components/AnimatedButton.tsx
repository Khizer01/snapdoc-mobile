import React, { useEffect } from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { animation } from '../theme';

interface AnimatedButtonProps {
  onPress: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  disabled?: boolean;
}

export function AnimatedButton({ onPress, onLongPress, children, style, disabled }: AnimatedButtonProps) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(disabled ? 0.5 : 1);

  useEffect(() => {
    opacity.value = disabled ? 0.5 : 1;
  }, [disabled]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Pressable
      onPressIn={() => {
        if (!disabled) scale.value = withSpring(animation.pressScale, animation.spring);
      }}
      onPressOut={() => {
        if (!disabled) scale.value = withSpring(1, animation.spring);
      }}
      onPress={disabled ? undefined : onPress}
      onLongPress={disabled ? undefined : onLongPress}
    >
      <Animated.View style={[style, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
