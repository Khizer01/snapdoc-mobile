import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Image, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  FadeIn, useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from '../../src/components/AnimatedButton';
import { CropOverlay } from '../../src/components/CropOverlay';
import { Logo } from '../../src/components/Logo';
import { useTheme, spacing, typography, radius } from '../../src/theme';
import { explainDocument } from '../../src/services/api';

const LOGO_SIZE = 100;
const LOGO_H = LOGO_SIZE * 1.2;
const DOC_W = LOGO_SIZE * 0.72;
const DOC_H_INNER = LOGO_H * 0.78;
const DOC_X = (LOGO_SIZE - DOC_W) / 2;
const DOC_Y = (LOGO_H - DOC_H_INNER) / 2;

function ScanningOverlay() {
  const scanY = useSharedValue(DOC_Y);
  const [dots, setDots] = useState('');

  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(DOC_Y + DOC_H_INNER, { duration: 1800, easing: Easing.inOut(Easing.cubic) }),
        withTiming(DOC_Y, { duration: 0 }),
      ),
      -1,
      false,
    );
    const id = setInterval(() => setDots(d => (d.length >= 3 ? '' : d + '.')), 500);
    return () => clearInterval(id);
  }, []);

  const scanStyle = useAnimatedStyle(() => ({ top: scanY.value }));

  return (
    <Modal transparent visible statusBarTranslucent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={{ width: LOGO_SIZE, height: LOGO_H }}>
            <Logo size={LOGO_SIZE} color="rgba(160,185,255,0.92)" />
            <Animated.View style={[styles.scanLine, { left: DOC_X, width: DOC_W }, scanStyle]} />
          </View>
          <Text style={styles.statusText}>Analysing{dots}</Text>
        </View>
      </View>
    </Modal>
  );
}

export default function CameraScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<'camera' | 'gallery' | null>(null);
  const [showCrop, setShowCrop] = useState(false);

  if (!permission) return <View style={{ flex: 1, backgroundColor: colors.background }} />;

  if (!permission.granted) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[typography.subheading, { color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.lg }]}>
          Camera access is needed to scan documents
        </Text>
        <AnimatedButton
          onPress={requestPermission}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[typography.label, { color: '#fff' }]}>Grant Permission</Text>
        </AnimatedButton>
      </View>
    );
  }

  async function processAndNavigate(uri: string) {
    setProcessing(true);
    try {
      const compressed = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      if (!compressed.base64 || compressed.base64.length < 100) {
        throw new Error('Image could not be processed. Please try a different photo.');
      }
      const result = await explainDocument(compressed.base64);
      const params = new URLSearchParams({
        title: result.title ?? '',
        summary: result.summary,
        document_type: result.document_type,
        key_points: JSON.stringify(result.key_points),
        flags: JSON.stringify(result.flags),
      });
      router.replace(`/(app)/result/${result.scan_id}?${params.toString()}`);
      setProcessing(false);
    } catch (err: any) {
      Alert.alert('Error', err.message ?? 'Failed to process document');
      setProcessing(false);
      // previewUri/previewSource intentionally retained so the user returns to the
      // preview overlay (Retake/Crop/Analyze) to retry instead of losing the image.
    }
  }

  async function normalizeOrientation(uri: string) {
    try {
      const { width } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        Image.getSize(uri, (w, h) => resolve({ width: w, height: h }), reject);
      });
      const targetWidth = Math.min(width, 2000);
      const normalized = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: targetWidth } }], {
        compress: 1,
        format: ImageManipulator.SaveFormat.JPEG,
      });
      return normalized.uri;
    } catch {
      return uri;
    }
  }

  async function takePicture() {
    if (!cameraRef.current || processing) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (!photo) throw new Error('Camera capture failed');
    setPreviewUri(await normalizeOrientation(photo.uri));
    setPreviewSource('camera');
  }

  async function pickFromGallery() {
    if (processing) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access to upload a document.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images',
      quality: 0.8,
      base64: false,
    });
    if (result.canceled || !result.assets[0]) return;
    setPreviewUri(await normalizeOrientation(result.assets[0].uri));
    setPreviewSource('gallery');
  }

  return (
    <View style={styles.flex}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <AnimatedButton onPress={() => router.back()} style={styles.topButton}>
          <Ionicons name="close" size={18} color="#fff" />
          <Text style={[typography.label, { color: '#fff', marginLeft: 4 }]}>Cancel</Text>
        </AnimatedButton>
        <AnimatedButton onPress={pickFromGallery} style={styles.topButton} disabled={processing}>
          <Ionicons name="image-outline" size={18} color="#fff" />
          <Text style={[typography.label, { color: '#fff', marginLeft: 4 }]}>Upload</Text>
        </AnimatedButton>
      </View>

      <View style={styles.tipContainer}>
        <Animated.View entering={FadeIn} style={[styles.tip, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <Text style={[typography.caption, { color: '#fff', textAlign: 'center' }]}>
            Ensure good lighting · Hold steady · Keep document flat
          </Text>
        </Animated.View>
      </View>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.lg }]}>
        <AnimatedButton onPress={takePicture} disabled={processing} style={styles.captureButton}>
          <View style={[styles.captureInner, { borderColor: colors.primary }]} />
        </AnimatedButton>
      </View>

      {/* Capture/pick preview */}
      {previewUri && !processing && (
        <View style={styles.previewOverlay}>
          <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
          <View style={[styles.previewActions, { paddingBottom: insets.bottom + spacing.lg }]}>
            <AnimatedButton
              onPress={() => {
                setPreviewUri(null);
                setPreviewSource(null);
                if (previewSource === 'gallery') {
                  pickFromGallery();
                }
              }}
              style={[styles.previewBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            >
              <Ionicons name={previewSource === 'gallery' ? 'images-outline' : 'refresh-outline'} size={18} color="#fff" />
              <Text style={[typography.label, { color: '#fff', marginLeft: 6 }]}>
                {previewSource === 'gallery' ? 'Choose Different' : 'Retake'}
              </Text>
            </AnimatedButton>
            <AnimatedButton
              onPress={() => setShowCrop(true)}
              style={[styles.previewBtn, { backgroundColor: 'rgba(0,0,0,0.6)' }]}
            >
              <Ionicons name="crop-outline" size={18} color="#fff" />
              <Text style={[typography.label, { color: '#fff', marginLeft: 6 }]}>Crop</Text>
            </AnimatedButton>
            <AnimatedButton
              onPress={() => processAndNavigate(previewUri)}
              style={[styles.previewBtn, { backgroundColor: colors.primary }]}
            >
              <Ionicons name="scan-outline" size={18} color="#fff" />
              <Text style={[typography.label, { color: '#fff', marginLeft: 6 }]}>Analyze</Text>
            </AnimatedButton>
          </View>
        </View>
      )}

      {/* Crop overlay */}
      {showCrop && previewUri && (
        <CropOverlay
          uri={previewUri}
          onCancel={() => setShowCrop(false)}
          onConfirm={(croppedUri) => {
            setPreviewUri(croppedUri);
            setShowCrop(false);
          }}
        />
      )}

      {/* Scanning animation overlay */}
      {processing && <ScanningOverlay />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  topBar: { paddingHorizontal: spacing.md, flexDirection: 'row', justifyContent: 'space-between' },
  topButton: { padding: spacing.sm, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: radius.md, flexDirection: 'row', alignItems: 'center' },
  tipContainer: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: spacing.lg },
  tip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, maxWidth: 280 },
  bottomBar: { alignItems: 'center' },
  captureButton: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center', justifyContent: 'center',
  },
  captureInner: { width: 58, height: 58, borderRadius: 29, borderWidth: 3 },
  button: { paddingVertical: spacing.sm + 4, paddingHorizontal: spacing.xl, borderRadius: radius.full, alignItems: 'center' },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    justifyContent: 'space-between',
  },
  previewImage: { flex: 1 },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },

  // Scanning overlay
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(6,7,22,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 260,
    backgroundColor: '#13143A',
    borderRadius: 24,
    paddingHorizontal: 32,
    paddingVertical: 36,
    alignItems: 'center',
    gap: 24,
    borderWidth: 1,
    borderColor: 'rgba(130,160,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 20,
  },
  scanLine: {
    position: 'absolute',
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(160,185,255,0.95)',
    shadowColor: 'rgba(160,185,255,1)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});
