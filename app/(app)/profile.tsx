import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, Alert, ScrollView, Pressable, Image, Platform, ActivityIndicator, Keyboard,
} from 'react-native';
import Animated, {
  FadeInDown, FadeIn, FadeOut, SlideInDown, SlideOutDown,
} from 'react-native-reanimated';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { AnimatedButton } from '../../src/components/AnimatedButton';
import { AvatarViewerModal } from '../../src/components/AvatarViewerModal';
import { useTheme, spacing, typography, radius, shadows } from '../../src/theme';
import { updateProfile } from '../../src/services/api';
import { supabase } from '../../src/services/supabase';
import { useProfileStore } from '../../src/store/useProfileStore';

interface PhotoSheetProps {
  hasPhoto: boolean;
  onUpload: () => void;
  onRemove: () => void;
  onDismiss: () => void;
  insetBottom: number;
  colors: ReturnType<typeof useTheme>['colors'];
}

function PhotoPickerSheet({ hasPhoto, onUpload, onRemove, onDismiss, insetBottom, colors }: PhotoSheetProps) {
  return (
    <>
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10 }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />
      </Animated.View>

      <Animated.View
        entering={SlideInDown.duration(320)}
        exiting={SlideOutDown.duration(220)}
        style={[
          styles.sheet,
          { backgroundColor: colors.surface, paddingBottom: insetBottom + spacing.sm, zIndex: 11 },
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
        <Text style={[styles.sheetTitle, { color: colors.textPrimary }]}>Profile Photo</Text>

        <AnimatedButton
          onPress={onUpload}
          style={[styles.sheetOption, { borderBottomColor: colors.border }]}
        >
          <View style={[styles.sheetIconWrap, { backgroundColor: colors.primary + '18' }]}>
            <Ionicons name="image-outline" size={20} color={colors.primary} />
          </View>
          <Text style={[typography.body, { color: colors.textPrimary, flex: 1 }]}>Upload New Photo</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </AnimatedButton>

        {hasPhoto && (
          <AnimatedButton
            onPress={onRemove}
            style={[styles.sheetOption, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.sheetIconWrap, { backgroundColor: colors.error + '18' }]}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
            </View>
            <Text style={[typography.body, { color: colors.error, flex: 1 }]}>Remove Current Photo</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
          </AnimatedButton>
        )}

        <AnimatedButton onPress={onDismiss} style={styles.sheetCancel}>
          <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
        </AnimatedButton>
      </Animated.View>
    </>
  );
}

function getInitials(firstName: string, lastName: string): string {
  return [firstName[0] ?? '', lastName[0] ?? ''].join('').toUpperCase() || '?';
}

function getDisplayName(firstName: string, lastName: string): string {
  return [firstName, lastName].filter(Boolean).join(' ') || 'Your Name';
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const initFromUser = useProfileStore(state => state.initFromUser);
  const setProfile = useProfileStore(state => state.setProfile);
  const resetProfile = useProfileStore(state => state.reset);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUri, setAvatarUri] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [firstNameFocused, setFirstNameFocused] = useState(false);
  const [lastNameFocused, setLastNameFocused] = useState(false);
  const [displayName, setDisplayName] = useState('Your Name');
  const [saved, setSaved] = useState(false);
  const initialized = useRef(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!user || initialized.current) return;
    initialized.current = true;
    const fn = (user.user_metadata?.first_name as string) ?? '';
    const ln = (user.user_metadata?.last_name as string) ?? '';
    const dn = getDisplayName(fn, ln);
    const av = (user.user_metadata?.avatar_url as string) ?? undefined;
    const ini = getInitials(fn, ln);
    setFirstName(fn);
    setLastName(ln);
    setDisplayName(dn);
    setAvatarUri(av);
    initFromUser({ displayName: dn, avatarUrl: av, initials: ini });
  }, [user]);

  const initials = getInitials(firstName, lastName);
  const email = user?.email ?? '';

  async function handleUploadPhoto() {
    setShowPhotoSheet(false);
    if (!user) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to upload an avatar.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      allowsEditing: Platform.OS === 'ios',
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingAvatar(true);
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!compressed.base64) throw new Error('Compression failed');

      const filePath = `${user.id}/avatar.jpg`;
      const byteArray = Uint8Array.from(atob(compressed.base64), c => c.charCodeAt(0));

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, byteArray, { contentType: 'image/jpeg', upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await updateProfile({ first_name: firstName, last_name: lastName, avatar_url: publicUrl });
      setAvatarUri(publicUrl);
      setProfile({ avatarUrl: publicUrl });
      await supabase.auth.refreshSession();
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Could not upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRemovePhoto() {
    setShowPhotoSheet(false);
    if (!user || !avatarUri) return;
    setUploadingAvatar(true);
    try {
      const filePath = `${user.id}/avatar.jpg`;
      const { error: removeError } = await supabase.storage.from('avatars').remove([filePath]);
      if (removeError) throw removeError;
      await updateProfile({ first_name: firstName, last_name: lastName, avatar_url: undefined });
      setAvatarUri(undefined);
      setProfile({ avatarUrl: undefined });
      await supabase.auth.refreshSession();
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not remove photo');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    Keyboard.dismiss();
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Error', 'First and last name are required');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        avatar_url: avatarUri,
      });
      await supabase.auth.refreshSession();
      const newDisplayName = getDisplayName(firstName.trim(), lastName.trim());
      const newInitials = getInitials(firstName.trim(), lastName.trim());
      setDisplayName(newDisplayName);
      setProfile({ displayName: newDisplayName, initials: newInitials });
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Could not save profile');
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    Keyboard.dismiss();
    setSigningOut(true);
    try {
      await signOut();
      resetProfile();
    } catch (err: any) {
      setSigningOut(false);
      Alert.alert('Error', err.message ?? 'Could not sign out');
    }
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + spacing.xl, paddingHorizontal: spacing.lg, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.avatarSection}>
          <Pressable
            onPress={() => !uploadingAvatar && !saving && setShowPhotoSheet(true)}
            onLongPress={() => avatarUri && setShowAvatarViewer(true)}
            style={[styles.avatarRing, { borderColor: colors.primary + '40' }]}
          >
            <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '18' }]}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.initials, { color: colors.primary }]}>{initials}</Text>
              )}
            </View>
            <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              {uploadingAvatar
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="camera" size={13} color="#fff" />}
            </View>
          </Pressable>

          <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[typography.body, { color: colors.textSecondary, marginTop: 2 }]}>{email}</Text>
        </Animated.View>

        {/* Inputs */}
        <Animated.View entering={FadeInDown.duration(350).delay(80)}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                borderColor: firstNameFocused ? colors.primary : colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
            placeholder="First Name"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => setFirstNameFocused(true)}
            onBlur={() => setFirstNameFocused(false)}
          />

          <TextInput
            style={[
              styles.input,
              {
                marginTop: spacing.md,
                backgroundColor: colors.surface,
                borderColor: lastNameFocused ? colors.primary : colors.border,
                color: colors.textPrimary,
              },
            ]}
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
            placeholder="Last Name"
            placeholderTextColor={colors.textSecondary}
            onFocus={() => setLastNameFocused(true)}
            onBlur={() => setLastNameFocused(false)}
          />
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInDown.duration(350).delay(160)} style={{ marginTop: spacing.xl }}>
          <AnimatedButton
            onPress={handleSave}
            disabled={saving || uploadingAvatar}
            style={[styles.saveButton, { backgroundColor: saved ? '#22C55E' : colors.primary }]}
          >
            <Text style={styles.saveText}>
              {saving ? 'Saving...' : saved ? 'Saved ✓' : 'Save Changes'}
            </Text>
          </AnimatedButton>

          <AnimatedButton
            onPress={handleSignOut}
            disabled={signingOut}
            style={[styles.signOutButton, { borderColor: colors.border }]}
          >
            {signingOut ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Text style={[styles.signOutText, { color: colors.error }]}>Sign Out</Text>
                <Ionicons name="exit-outline" size={18} color={colors.error} style={{ marginLeft: spacing.xs }} />
              </>
            )}
          </AnimatedButton>
        </Animated.View>

      </ScrollView>

      {/* Fixed credit footer */}
      <View style={[styles.creditFooter, { borderTopColor: colors.border, paddingBottom: insets.bottom + spacing.xs }]}>
        <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center' }]}>
          SnapDoc AI · v1.0 · © 2026
        </Text>
      </View>

      {showPhotoSheet && (
        <PhotoPickerSheet
          hasPhoto={!!avatarUri}
          onUpload={handleUploadPhoto}
          onRemove={handleRemovePhoto}
          onDismiss={() => setShowPhotoSheet(false)}
          insetBottom={insets.bottom}
          colors={colors}
        />
      )}

      {showAvatarViewer && avatarUri && (
        <AvatarViewerModal uri={avatarUri} onClose={() => setShowAvatarViewer(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },

  avatarSection: { alignItems: 'center', marginBottom: spacing.xl },
  avatarRing: { padding: 4, borderRadius: 62, borderWidth: 2 },
  avatarCircle: {
    width: 108, height: 108, borderRadius: 54,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 108, height: 108, borderRadius: 54 },
  initials: { fontSize: 38, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  displayName: { fontSize: 22, fontWeight: '700', fontFamily: 'Inter_700Bold', marginTop: spacing.md },

  input: {
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 16,
    paddingHorizontal: spacing.md,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
  },

  saveButton: {
    paddingVertical: 17,
    borderRadius: radius.full,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: '#5B6AF0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  saveText: { fontSize: 17, fontWeight: '600', fontFamily: 'Inter_600SemiBold', color: '#fff' },
  signOutButton: {
    paddingVertical: 16,
    borderRadius: radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  signOutText: { fontSize: 17, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },

  creditFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },

  sheet: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: spacing.md },
  sheetOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  sheetIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  sheetCancel: {
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  cancelText: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
