import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from './AnimatedButton';
import { useTheme, spacing, typography, radius, shadows } from '../theme';
import { Scan } from '../types';

interface ScanCardProps {
  scan: Scan;
  onLongPress?: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function toTitleCase(s: string | null): string {
  if (!s) return 'Document';
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function accentColor(documentType: string | null): string {
  const t = (documentType ?? '').toLowerCase();
  if (t.includes('contract')) return '#5B6AF0';
  if (t.includes('bill') || t.includes('invoice')) return '#F59E0B';
  if (t.includes('form')) return '#4ECDC4';
  if (t.includes('receipt')) return '#10B981';
  if (t.includes('medical')) return '#EF4444';
  if (t.includes('legal')) return '#8B5CF6';
  return '#5B6AF0';
}

export function ScanCard({ scan, onLongPress }: ScanCardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const cardTitle = toTitleCase(scan.document_type);

  const params = new URLSearchParams({
    title: cardTitle,
    summary: scan.ai_summary ?? '',
    document_type: scan.document_type ?? '',
    key_points: JSON.stringify(scan.key_points ?? []),
    flags: JSON.stringify(scan.flags ?? []),
  });

  const flagCount = scan.flags?.length ?? 0;
  const messageCount = scan.message_count ?? 0;
  const accent = accentColor(scan.document_type);

  return (
    <AnimatedButton
      onPress={() => router.push(`/(app)/result/${scan.id}?${params.toString()}`)}
      onLongPress={onLongPress}
      style={[styles.card, { backgroundColor: colors.surface, ...shadows.card }]}
    >
      <View style={styles.top}>
        <View style={[styles.typeBadge, { backgroundColor: accent + '18' }]}>
          <Text style={[typography.caption, { color: accent, textTransform: 'capitalize', fontFamily: 'Inter_600SemiBold' }]}>
            {scan.document_type ?? 'document'}
          </Text>
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {formatDate(scan.created_at)}
        </Text>
      </View>

      <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.textPrimary }]}>
        {cardTitle}
      </Text>

      <Text numberOfLines={2} style={[typography.caption, { color: colors.textSecondary, marginTop: 2, lineHeight: 18 }]}>
        {scan.ai_summary ?? 'No summary available'}
      </Text>

      {(flagCount > 0 || messageCount > 0) && (
        <View style={styles.footer}>
          {flagCount > 0 && (
            <View style={styles.chip}>
              <Ionicons name="warning-outline" size={12} color={colors.error} />
              <Text style={[typography.caption, { color: colors.error, marginLeft: 3 }]}>
                {flagCount} flag{flagCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
          {messageCount > 0 && (
            <View style={[styles.chip, flagCount > 0 && { marginLeft: spacing.sm }]}>
              <Ionicons name="chatbubble-outline" size={12} color={colors.textSecondary} />
              <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: 3 }]}>
                {messageCount} message{messageCount !== 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>
      )}
    </AnimatedButton>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginTop: spacing.xs,
  },
  typeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  chip: { flexDirection: 'row', alignItems: 'center' },
});
