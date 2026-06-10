import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, radius } from '../theme';

export type AlertType = 'error' | 'success' | 'info' | 'warning';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'primary' | 'cancel' | 'destructive';
}

export interface AlertConfig {
  type?: AlertType;
  title: string;
  message: string;
  buttons?: AlertButton[];
}

const ICONS: Record<AlertType, { name: string; color: string }> = {
  error:   { name: 'close-circle',       color: '#E74C3C' },
  success: { name: 'checkmark-circle',   color: '#2ECC71' },
  info:    { name: 'information-circle', color: '#5B6AF0' },
  warning: { name: 'warning',            color: '#F39C12' },
};

interface Props {
  config: AlertConfig | null;
  onDismiss: () => void;
}

export function AlertModal({ config, onDismiss }: Props) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);
  const [snapshot, setSnapshot] = useState<AlertConfig | null>(null);

  const scale   = useSharedValue(0.88);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (config) {
      setSnapshot(config);
      setVisible(true);
      scale.value   = withSpring(1, { damping: 18, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 180 });
    }
  }, [config]);

  function dismiss() {
    scale.value   = withTiming(0.88, { duration: 140, easing: Easing.in(Easing.ease) });
    opacity.value = withTiming(0,    { duration: 140 });
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 145);
  }

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!visible || !snapshot) return null;

  const type    = snapshot.type ?? 'info';
  const icon    = ICONS[type];
  const buttons = snapshot.buttons ?? [{ text: 'OK', style: 'primary' as const }];

  return (
    <Modal transparent visible animationType="none" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        {/* Tappable backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />

        <Animated.View style={[styles.card, { backgroundColor: colors.surface }, cardStyle]}>
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: icon.color + '1A' }]}>
            <Ionicons name={icon.name as any} size={40} color={icon.color} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{snapshot.title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>{snapshot.message}</Text>

          {/* Buttons */}
          <View style={[styles.btnRow, buttons.length === 1 && styles.btnRowCenter]}>
            {buttons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              return (
                <Pressable
                  key={i}
                  onPress={() => { dismiss(); btn.onPress?.(); }}
                  style={({ pressed }) => [
                    styles.btn,
                    buttons.length > 1 && styles.btnFlex,
                    isCancel
                      ? { backgroundColor: colors.border }
                      : btn.style === 'destructive'
                        ? { backgroundColor: colors.error }
                        : { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text style={[styles.btnText, { color: isCancel ? colors.textSecondary : '#fff' }]}>
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  card: {
    width: '100%',
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 20,
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  btnRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    width: '100%',
  },
  btnRowCenter: {
    justifyContent: 'center',
  },
  btnFlex: { flex: 1 },
  btn: {
    paddingVertical: 14,
    borderRadius: radius.full,
    alignItems: 'center',
    minWidth: 120,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
