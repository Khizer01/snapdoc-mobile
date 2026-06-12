import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, StyleSheet, FlatList,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator, Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MessageBubble, TypingIndicator } from '../../../src/components/MessageBubble';
import { AnimatedButton } from '../../../src/components/AnimatedButton';
import { useTheme, spacing, typography, radius, shadows } from '../../../src/theme';
import { getScan, sendChatMessage } from '../../../src/services/api';
import { Message } from '../../../src/types';

function SummaryCard({
  docType,
  summaryText,
  keyPoints,
  flagList,
}: {
  docType: string;
  summaryText: string;
  keyPoints: string[];
  flagList: string[];
}) {
  const { colors } = useTheme();

  return (
    <View
      style={[styles.summaryCard, { backgroundColor: colors.surface, ...shadows.card }]}
    >
      <View style={[styles.typeBadge, { backgroundColor: colors.primary + '18' }]}>
        <Text style={[typography.caption, { color: colors.primary, textTransform: 'capitalize', fontFamily: 'Inter_600SemiBold' }]}>
          {docType || 'document'}
        </Text>
      </View>

      <Text style={[typography.body, { color: colors.textPrimary, marginTop: spacing.sm, lineHeight: 22 }]}>
        {summaryText}
      </Text>

      {keyPoints.length > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[typography.caption, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.5, marginBottom: spacing.xs }]}>
            KEY POINTS
          </Text>
          {keyPoints.map((point, i) => (
            <View key={i} style={styles.pointRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>{point}</Text>
            </View>
          ))}
        </>
      )}

      {flagList.length > 0 && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {flagList.map((flag, i) => (
            <View key={i} style={styles.flagRow}>
              <Ionicons name="warning-outline" size={14} color={colors.error} />
              <Text style={[typography.body, { color: colors.error, flex: 1, marginLeft: spacing.xs }]}>{flag}</Text>
            </View>
          ))}
        </>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
        Ask anything about this document below
      </Text>
    </View>
  );
}

export default function ResultScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { scanId, title, summary, document_type, key_points, flags } = useLocalSearchParams<{
    scanId: string;
    title: string;
    summary: string;
    document_type: string;
    key_points: string;
    flags: string;
  }>();

  const keyPoints: string[] = (() => { try { return JSON.parse(key_points ?? '[]'); } catch { return []; } })();
  const flagList: string[] = (() => { try { return JSON.parse(flags ?? '[]'); } catch { return []; } })();
  const docType = document_type ?? '';
  const summaryText = summary ?? '';

  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const listRef = useRef<FlatList>(null);
  const seenMessageIds = useRef(new Set<string>());

  // Scroll position tracking
  const layoutHeightRef = useRef(0);
  const contentHeightRef = useRef(0);
  const scrollYRef = useRef(0);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Animated scroll-to-bottom button
  const btnOpacity = useSharedValue(0);
  const btnScale = useSharedValue(0.75);

  useEffect(() => {
    btnOpacity.value = withTiming(isAtBottom ? 0 : 1, { duration: 220 });
    btnScale.value = withSpring(isAtBottom ? 0.75 : 1, { damping: 14, stiffness: 220 });
  }, [isAtBottom]);

  const scrollBtnStyle = useAnimatedStyle(() => ({
    opacity: btnOpacity.value,
    transform: [{ scale: btnScale.value }],
  }));

  function checkAtBottom(offsetY: number) {
    const dist = contentHeightRef.current - offsetY - layoutHeightRef.current;
    setIsAtBottom(dist < 64);
  }

  function scrollToBottom(animated = true) {
    listRef.current?.scrollToEnd({ animated });
  }

  // Load messages whenever the scan changes, resetting stale state first
  useEffect(() => {
    if (!scanId) return;
    setMessages([]);
    seenMessageIds.current = new Set();
    setLoadingMessages(true);
    getScan(scanId)
      .then(({ messages: msgs }) => {
        setMessages(msgs);
        // After messages set, scroll to bottom on next frame
        setTimeout(() => scrollToBottom(false), 80);
      })
      .catch(console.error)
      .finally(() => setLoadingMessages(false));
  }, [scanId]);

  // Scroll to bottom whenever the screen comes back into focus
  useFocusEffect(useCallback(() => {
    const t = setTimeout(() => scrollToBottom(true), 120);
    return () => clearTimeout(t);
  }, []));

  async function handleSend() {
    if (!input.trim() || sending || !scanId) return;
    const userMessage = input.trim();
    setInput('');
    setSending(true);
    Keyboard.dismiss();

    const optimisticMsg: Message = {
      id: Date.now().toString(),
      scan_id: scanId,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => scrollToBottom(true), 50);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const { reply } = await sendChatMessage(scanId, userMessage, history);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        scan_id: scanId,
        role: 'assistant',
        content: reply,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
      setTimeout(() => scrollToBottom(true), 80);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
    } finally {
      setSending(false);
    }
  }

  const docLabel = docType
    ? docType.charAt(0).toUpperCase() + docType.slice(1)
    : 'Document';

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[styles.header, { paddingTop: insets.top + spacing.sm, backgroundColor: colors.surface, borderBottomColor: colors.border }]}
      >
        <AnimatedButton onPress={() => (router.canGoBack() ? router.back() : router.push('/(app)'))} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </AnimatedButton>
        <Text style={[typography.subheading, { color: colors.textPrimary, fontFamily: 'Inter_700Bold', flex: 1 }]} numberOfLines={1}>
          {title || `${docLabel} Analysis`}
        </Text>
      </View>

      {/* Chat list */}
      <View style={styles.flex}>
        {loadingMessages ? (
          <View style={[styles.flex, styles.center]}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <>
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => {
                const animate = !seenMessageIds.current.has(item.id);
                seenMessageIds.current.add(item.id);
                return <MessageBubble message={item} index={index} animate={animate} />;
              }}
              ListHeaderComponent={
                <SummaryCard
                  docType={docType}
                  summaryText={summaryText}
                  keyPoints={keyPoints}
                  flagList={flagList}
                />
              }
              ListFooterComponent={sending ? <TypingIndicator /> : null}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
              onLayout={e => { layoutHeightRef.current = e.nativeEvent.layout.height; }}
              onContentSizeChange={(_, h) => {
                contentHeightRef.current = h;
                checkAtBottom(scrollYRef.current);
              }}
              onScroll={e => {
                scrollYRef.current = e.nativeEvent.contentOffset.y;
                checkAtBottom(scrollYRef.current);
              }}
            />

            {/* Scroll-to-bottom button */}
            <Animated.View
              style={[
                styles.scrollBtn,
                { bottom: spacing.sm },
                scrollBtnStyle,
              ]}
              pointerEvents={isAtBottom ? 'none' : 'auto'}
            >
              <AnimatedButton
                onPress={() => scrollToBottom(true)}
                style={[styles.scrollBtnInner, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <Ionicons name="chevron-down" size={20} color={colors.textPrimary} />
              </AnimatedButton>
            </Animated.View>
          </>
        )}
      </View>

      {/* Input bar */}
      <View style={[styles.inputBar, {
        paddingBottom: insets.bottom + spacing.sm,
        borderTopColor: colors.border,
        backgroundColor: colors.surface,
      }]}>
        <TextInput
          style={[styles.input, {
            backgroundColor: colors.background,
            borderColor: inputFocused ? colors.primary : colors.border,
            color: colors.textPrimary,
          }]}
          placeholder="Ask about this document..."
          placeholderTextColor={colors.textSecondary}
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
          multiline
          onFocus={() => setInputFocused(true)}
          onBlur={() => setInputFocused(false)}
        />
        <AnimatedButton
          onPress={handleSend}
          disabled={!input.trim() || sending}
          style={[styles.sendBtn, { backgroundColor: input.trim() && !sending ? colors.primary : colors.border }]}
        >
          <Ionicons name="send" size={16} color="#fff" />
        </AnimatedButton>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  summaryCard: {
    margin: spacing.md,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
  pointRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: 3.5, marginTop: 8, flexShrink: 0 },
  flagRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm, gap: spacing.xs },

  scrollBtn: {
    position: 'absolute',
    right: spacing.md,
  },
  scrollBtnInner: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    maxHeight: 120,
    fontFamily: 'Inter_400Regular',
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
