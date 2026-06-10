import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedButton } from './AnimatedButton';
import { useTheme, spacing, typography } from '../theme';

interface ScanActionsSheetProps {
  mode: 'active' | 'archived';
  onClose: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
}

export function ScanActionsSheet({ mode, onClose, onArchive, onUnarchive, onDelete }: ScanActionsSheetProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[StyleSheet.absoluteFill, styles.backdrop]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(320)}
        exiting={SlideOutDown.duration(220)}
        style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: insets.bottom + spacing.sm }]}
      >
        <View style={[styles.handle, { backgroundColor: colors.border }]} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Scan Options</Text>

        {mode === 'active' ? (
          <AnimatedButton
            onPress={() => { onClose(); onArchive(); }}
            style={[styles.option, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="archive-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>Archive</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </AnimatedButton>
        ) : (
          <AnimatedButton
            onPress={() => { onClose(); onUnarchive(); }}
            style={[styles.option, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + '18' }]}>
              <Ionicons name="arrow-undo-outline" size={20} color={colors.primary} />
            </View>
            <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>Unarchive</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </AnimatedButton>
        )}

        <AnimatedButton
          onPress={() => { onClose(); onDelete(); }}
          style={[styles.option, { borderBottomColor: colors.border }]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.error + '18' }]}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </View>
          <Text style={[typography.body, { color: colors.error, flex: 1 }]}>Delete</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedButton>

        <AnimatedButton onPress={onClose} style={styles.cancel}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </AnimatedButton>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    zIndex: 11,
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  title: { fontSize: 15, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cancel: { paddingVertical: spacing.md + 4, alignItems: 'center' },
  cancelText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
});
