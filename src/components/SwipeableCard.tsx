import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { Ionicons } from '@expo/vector-icons';
import { ScanCard } from './ScanCard';
import { Scan } from '../types';
import { spacing } from '../theme';

interface SwipeableCardProps {
  scan: Scan;
  mode: 'active' | 'archived';
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
  onLongPress: () => void;
}

export function SwipeableCard({
  scan, mode, onArchive, onUnarchive, onDelete, onLongPress,
}: SwipeableCardProps) {
  const swipeRef = useRef<any>(null);

  function close() { swipeRef.current?.close(); }

  function handlePrimary() {
    close();
    setTimeout(() => mode === 'active' ? onArchive() : onUnarchive(), 150);
  }

  function handleDelete() {
    close();
    setTimeout(onDelete, 150);
  }

  const renderRightActions = () => (
    <View style={styles.actions}>
      <TouchableOpacity style={[styles.action, styles.primaryAction]} onPress={handlePrimary} activeOpacity={0.85}>
        <Ionicons name={mode === 'active' ? 'archive-outline' : 'arrow-undo-outline'} size={20} color="#fff" />
        <Text style={styles.actionLabel}>{mode === 'active' ? 'Archive' : 'Unarchive'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.action, styles.deleteAction]} onPress={handleDelete} activeOpacity={0.85}>
        <Ionicons name="trash-outline" size={20} color="#fff" />
        <Text style={styles.actionLabel}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      friction={2}
      rightThreshold={40}
      overshootRight={false}
    >
      <ScanCard scan={scan} onLongPress={onLongPress} from={mode === 'archived' ? 'archived' : 'home'} />
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  action: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  primaryAction: { backgroundColor: '#5B6AF0' },
  deleteAction: {
    backgroundColor: '#E74C3C',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
});
