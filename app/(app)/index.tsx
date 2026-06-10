import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, Pressable, Image } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SwipeableCard } from '../../src/components/SwipeableCard';
import { ScanActionsSheet } from '../../src/components/ScanActionsSheet';
import { AlertModal, AlertConfig } from '../../src/components/AlertModal';
import { StatsRow } from '../../src/components/StatsRow';
import { Logo } from '../../src/components/Logo';
import { AnimatedButton } from '../../src/components/AnimatedButton';
import { useAuth } from '../../src/hooks/useAuth';
import { useProfileStore } from '../../src/store/useProfileStore';
import { useScans } from '../../src/hooks/useScans';
import { useTheme, spacing, typography } from '../../src/theme';
import { deleteScan, archiveScan } from '../../src/services/api';

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { scans, loading, refresh, removeScan } = useScans();
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const [selectedScan, setSelectedScan] = useState<string | null>(null);
  const [alertConfig, setAlertConfig] = useState<AlertConfig | null>(null);

  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const onPullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    await refresh();
    setPullRefreshing(false);
  }, [refresh]);

  const storeInitials = useProfileStore(state => state.initials);
  const storeAvatarUrl = useProfileStore(state => state.avatarUrl);
  const initFromUser = useProfileStore(state => state.initFromUser);

  useEffect(() => {
    if (!user) return;
    const fn = (user.user_metadata?.first_name as string) ?? '';
    const ln = (user.user_metadata?.last_name as string) ?? '';
    const dn = [fn, ln].filter(Boolean).join(' ') || 'Your Name';
    const av = (user.user_metadata?.avatar_url as string) ?? undefined;
    const ini = [fn[0] ?? '', ln[0] ?? ''].join('').toUpperCase() || '?';
    initFromUser({ displayName: dn, avatarUrl: av, initials: ini });
  }, [user, initFromUser]);

  const initials = storeInitials;
  const avatarUrl = storeAvatarUrl;

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

  async function handleArchive(scanId: string) {
    setSelectedScan(null);
    removeScan(scanId);
    try {
      await archiveScan(scanId, true);
    } catch (err: any) {
      refresh();
      setAlertConfig({ type: 'error', title: 'Archive failed', message: err.message ?? 'Could not archive scan.' });
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <Animated.View
        entering={FadeInDown.duration(300)}
        style={[styles.header, { paddingTop: insets.top + spacing.md, backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <View style={styles.headerLeft}>
          <Logo size={28} color={colors.primary} />
          <Text style={[typography.subheading, { color: colors.textPrimary, fontFamily: 'Inter_700Bold' }]}>
            SnapDoc AI
          </Text>
        </View>
        <View style={styles.headerRight}>
          <AnimatedButton onPress={() => router.push('/(app)/archived')} style={styles.headerBtn}>
            <Ionicons name="archive-outline" size={22} color={colors.textSecondary} />
          </AnimatedButton>
          <Pressable
            onPress={() => router.push('/(app)/profile')}
            style={[styles.avatar, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={[typography.label, { color: colors.primary, fontFamily: 'Inter_700Bold' }]}>
                {initials}
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>

      <FlatList
        data={scans}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeIn.duration(300).delay(index * 60)}>
            <SwipeableCard
              scan={item}
              mode="active"
              onArchive={() => handleArchive(item.id)}
              onUnarchive={() => {}}
              onDelete={() => promptDelete(item.id)}
              onLongPress={() => setSelectedScan(item.id)}
            />
          </Animated.View>
        )}
        ListHeaderComponent={scans.length > 0 ? <StatsRow scans={scans} /> : null}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: insets.bottom + 100 }}
        refreshControl={<RefreshControl refreshing={pullRefreshing} onRefresh={onPullRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          !loading ? (
            <Animated.View entering={FadeInDown.duration(400)} style={styles.emptyState}>
              <Logo size={64} color={colors.textSecondary} />
              <Text style={[typography.subheading, { color: colors.textPrimary, marginTop: spacing.md, textAlign: 'center' }]}>
                No scans yet
              </Text>
              <Text style={[typography.body, { color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'center' }]}>
                Tap Scan below to scan your first document
              </Text>
            </Animated.View>
          ) : null
        }
      />

      {!!selectedScan && (
        <ScanActionsSheet
          mode="active"
          onClose={() => setSelectedScan(null)}
          onArchive={() => selectedScan && handleArchive(selectedScan)}
          onUnarchive={() => {}}
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
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  headerBtn: { padding: spacing.xs },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, overflow: 'hidden',
  },
  avatarImage: { width: 36, height: 36, borderRadius: 18 },
  emptyState: { alignItems: 'center', paddingTop: spacing.xxl * 2 },
});
