import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableCard } from '../../src/components/SwipeableCard';
import { ScanActionsSheet } from '../../src/components/ScanActionsSheet';
import { AlertModal, AlertConfig } from '../../src/components/AlertModal';
import { AnimatedButton } from '../../src/components/AnimatedButton';
import { useArchivedScans } from '../../src/hooks/useArchivedScans';
import { useTheme, spacing, typography } from '../../src/theme';
import { deleteScan, archiveScan } from '../../src/services/api';

export default function ArchivedScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scans, loading, refresh, removeScan } = useArchivedScans();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    await refresh();
    setPullRefreshing(false);
  }, [refresh]);

  function promptDelete(scanId: string) {
    setSelectedScan(null);
    setAlertConfig({
      type: 'warning',
      title: 'Delete scan?',
      message: 'This will permanently delete the scan and all chat history. This cannot be undone.',
      buttons: [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => confirmDelete(scanId) },
      ],
    });
  }

  async function confirmDelete(scanId: string) {
    removeScan(scanId);
    try {
      await deleteScan(scanId);
    } catch (err: any) {
      refresh();
      setAlertConfig({ type: 'error', title: 'Delete failed', message: err.message ?? 'Could not delete scan.' });
    }
  }

  async function handleUnarchive(scanId: string) {
    setSelectedScan(null);
    removeScan(scanId);
    try {
      await archiveScan(scanId, false);
    } catch (err: any) {
      refresh();
      setAlertConfig({ type: 'error', title: 'Unarchive failed', message: err.message ?? 'Could not unarchive scan.' });
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeIn.duration(250)}
        style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <AnimatedButton onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </AnimatedButton>
        <Text style={[typography.subheading, { color: colors.textPrimary, fontFamily: 'Inter_700Bold' }]}>
          Archived
        </Text>
        <View style={{ width: 38 }} />
      </Animated.View>

      <FlatList
        data={scans}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeIn.duration(300).delay(index * 60)}>
            <SwipeableCard
              scan={item}
              mode="archived"
              onArchive={() => {}}
              onUnarchive={() => handleUnarchive(item.id)}
              onDelete={() => promptDelete(item.id)}
              onLongPress={() => setSelectedScan(item.id)}
            />
          </Animated.View>
        )}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + spacing.xl }}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onPullRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
              <Ionicons name="archive-outline" size={64} color={colors.textSecondary} />
              <Text style={[typography.subheading, { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }]}>
                No archived scans
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
                Archive a scan from the home screen to see it here
              </Text>
            </Animated.View>
          ) : null
        }
      />

      {!!selectedScan && (
        <ScanActionsSheet
          mode="archived"
          onClose={() => setSelectedScan(null)}
          onArchive={() => {}}
          onUnarchive={() => selectedScan && handleUnarchive(selectedScan)}
          onDelete={() => selectedScan && promptDelete(selectedScan)}
        />
      )}

      <AlertModal config={alertConfig} onDismiss={() => setAlertConfig(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  emptyState: { alignItems: 'center', paddingTop: 80 },
});
