import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, typography } from '../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface TabItemProps {
  label: string;
  iconName: IoniconsName;
  iconNameActive: IoniconsName;
  active: boolean;
  onPress: () => void;
}

function TabItem({ label, iconName, iconNameActive, active, onPress }: TabItemProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      style={styles.tabItem}
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 15, stiffness: 150 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 150 }); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.tabItemInner, animStyle]}>
        <Ionicons
          name={active ? iconNameActive : iconName}
          size={22}
          color={active ? colors.primary : colors.textSecondary}
        />
        <Text style={[
          typography.caption,
          { color: active ? colors.primary : colors.textSecondary, marginTop: 2, fontFamily: 'Inter_500Medium' }
        ]}>
          {label}
        </Text>
        {active && (
          <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />
        )}
      </Animated.View>
    </Pressable>
  );
}

export function TabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const scanScale = useSharedValue(1);
  const scanAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: scanScale.value }] }));

  const currentRouteName = state.routes[state.index]?.name;
  const isHome = currentRouteName === 'index';
  const isProfile = currentRouteName === 'profile';

  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.surface, paddingBottom: insets.bottom, borderTopColor: colors.border }
    ]}>
      <TabItem
        label="Home"
        iconName="home-outline"
        iconNameActive="home"
        active={isHome}
        onPress={() => navigation.navigate('index')}
      />

      <Pressable
        style={styles.scanWrapper}
        onPressIn={() => { scanScale.value = withSpring(0.9, { damping: 15, stiffness: 150 }); }}
        onPressOut={() => { scanScale.value = withSpring(1, { damping: 15, stiffness: 150 }); }}
        onPress={() => router.push('/(app)/camera')}
      >
        <Animated.View style={[styles.scanButton, { backgroundColor: colors.primary }, scanAnimStyle]}>
          <Ionicons name="camera" size={26} color="#fff" />
        </Animated.View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4, fontFamily: 'Inter_500Medium' }]}>
          Scan
        </Text>
      </Pressable>

      <TabItem
        label="Profile"
        iconName="person-outline"
        iconNameActive="person"
        active={isProfile}
        onPress={() => navigation.navigate('profile')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
  },
  tabItem: { flex: 1 },
  tabItemInner: { alignItems: 'center', paddingVertical: spacing.xs },
  activeIndicator: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
  scanWrapper: { flex: 1, alignItems: 'center', marginTop: -20 },
  scanButton: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#5B6AF0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
});
