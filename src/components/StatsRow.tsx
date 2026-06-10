import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Scan } from '../types';
import { useTheme, spacing, typography, radius, shadows } from '../theme';

interface StatsRowProps {
  scans: Scan[];
}

interface StatTileProps {
  label: string;
  value: number;
  delay: number;
}

function StatTile({ label, value, delay }: StatTileProps) {
  const { colors } = useTheme();
  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(delay)}
      style={[styles.tile, { backgroundColor: colors.surface, ...shadows.card }]}
    >
      <Text style={[styles.value, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
        {value}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
        {label}
      </Text>
    </Animated.View>
  );
}

export function StatsRow({ scans }: StatsRowProps) {
  const totalScans = scans.length;
  const flagged = scans.filter(s => (s.flags?.length ?? 0) > 0).length;
  const chats = scans.filter(s => (s.message_count ?? 0) > 0).length;

  return (
    <View style={styles.row}>
      <StatTile label="Total Scans" value={totalScans} delay={0} />
      <StatTile label="Flagged" value={flagged} delay={60} />
      <StatTile label="Chats" value={chats} delay={120} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  tile: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
  },
  value: { fontSize: 28, lineHeight: 34 },
});
