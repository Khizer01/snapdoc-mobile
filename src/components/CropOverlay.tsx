import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image, Modal, Text, LayoutChangeEvent, Alert } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { AnimatedButton } from './AnimatedButton';
import { useTheme, spacing, typography, radius } from '../theme';

interface CropOverlayProps {
  uri: string;
  onCancel: () => void;
  onConfirm: (croppedUri: string) => void;
}

const HANDLE_SIZE = 28;
const MIN_CROP_SIZE = 60;

export function CropOverlay({ uri, onCancel, onConfirm }: CropOverlayProps) {
  const { colors } = useTheme();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [bounds, setBounds] = useState({ width: 0, height: 0, offsetX: 0, offsetY: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [processing, setProcessing] = useState(false);

  const cropX = useSharedValue(0);
  const cropY = useSharedValue(0);
  const cropW = useSharedValue(0);
  const cropH = useSharedValue(0);

  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const startW = useSharedValue(0);
  const startH = useSharedValue(0);

  const boundsX = useSharedValue(0);
  const boundsY = useSharedValue(0);
  const boundsWidth = useSharedValue(0);
  const boundsHeight = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    Image.getSize(uri, (width, height) => {
      if (mounted) setNaturalSize({ width, height });
    }, () => {});
    return () => { mounted = false; };
  }, [uri]);

  function onContainerLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    setContainerSize({ width, height });
  }

  useEffect(() => {
    if (!containerSize.width || !containerSize.height || !naturalSize.width || !naturalSize.height) return;

    const containerRatio = containerSize.width / containerSize.height;
    const imageRatio = naturalSize.width / naturalSize.height;
    let displayWidth: number;
    let displayHeight: number;
    if (imageRatio > containerRatio) {
      displayWidth = containerSize.width;
      displayHeight = containerSize.width / imageRatio;
    } else {
      displayHeight = containerSize.height;
      displayWidth = containerSize.height * imageRatio;
    }
    const offsetX = (containerSize.width - displayWidth) / 2;
    const offsetY = (containerSize.height - displayHeight) / 2;
    setBounds({ width: displayWidth, height: displayHeight, offsetX, offsetY });
    boundsX.value = offsetX;
    boundsY.value = offsetY;
    boundsWidth.value = displayWidth;
    boundsHeight.value = displayHeight;

    const w = displayWidth * 0.8;
    const h = displayHeight * 0.8;
    cropX.value = offsetX + (displayWidth - w) / 2;
    cropY.value = offsetY + (displayHeight - h) / 2;
    cropW.value = w;
    cropH.value = h;
  }, [containerSize, naturalSize]);

  const moveGesture = Gesture.Pan()
    .onStart(() => {
      'worklet';
      startX.value = cropX.value;
      startY.value = cropY.value;
    })
    .onUpdate((e) => {
      'worklet';
      const minX = boundsX.value;
      const minY = boundsY.value;
      const maxX = boundsX.value + boundsWidth.value - cropW.value;
      const maxY = boundsY.value + boundsHeight.value - cropH.value;
      cropX.value = Math.min(Math.max(startX.value + e.translationX, minX), Math.max(maxX, minX));
      cropY.value = Math.min(Math.max(startY.value + e.translationY, minY), Math.max(maxY, minY));
    });

  function makeCornerGesture(corner: 'tl' | 'tr' | 'bl' | 'br') {
    return Gesture.Pan()
      .onStart(() => {
        'worklet';
        startX.value = cropX.value;
        startY.value = cropY.value;
        startW.value = cropW.value;
        startH.value = cropH.value;
      })
      .onUpdate((e) => {
        'worklet';
        const minX = boundsX.value;
        const minY = boundsY.value;
        const maxRight = boundsX.value + boundsWidth.value;
        const maxBottom = boundsY.value + boundsHeight.value;

        if (corner === 'tl') {
          const newX = Math.min(Math.max(startX.value + e.translationX, minX), startX.value + startW.value - MIN_CROP_SIZE);
          const newY = Math.min(Math.max(startY.value + e.translationY, minY), startY.value + startH.value - MIN_CROP_SIZE);
          cropW.value = startW.value + (startX.value - newX);
          cropH.value = startH.value + (startY.value - newY);
          cropX.value = newX;
          cropY.value = newY;
        } else if (corner === 'tr') {
          const newY = Math.min(Math.max(startY.value + e.translationY, minY), startY.value + startH.value - MIN_CROP_SIZE);
          const newW = Math.min(Math.max(startW.value + e.translationX, MIN_CROP_SIZE), maxRight - startX.value);
          cropH.value = startH.value + (startY.value - newY);
          cropY.value = newY;
          cropW.value = newW;
        } else if (corner === 'bl') {
          const newX = Math.min(Math.max(startX.value + e.translationX, minX), startX.value + startW.value - MIN_CROP_SIZE);
          const newH = Math.min(Math.max(startH.value + e.translationY, MIN_CROP_SIZE), maxBottom - startY.value);
          cropW.value = startW.value + (startX.value - newX);
          cropX.value = newX;
          cropH.value = newH;
        } else {
          cropW.value = Math.min(Math.max(startW.value + e.translationX, MIN_CROP_SIZE), maxRight - startX.value);
          cropH.value = Math.min(Math.max(startH.value + e.translationY, MIN_CROP_SIZE), maxBottom - startY.value);
        }
      });
  }

  const tlGesture = makeCornerGesture('tl');
  const trGesture = makeCornerGesture('tr');
  const blGesture = makeCornerGesture('bl');
  const brGesture = makeCornerGesture('br');

  const cropStyle = useAnimatedStyle(() => ({
    left: cropX.value,
    top: cropY.value,
    width: cropW.value,
    height: cropH.value,
  }));

  const tlHandleStyle = useAnimatedStyle(() => ({ left: cropX.value - HANDLE_SIZE / 2, top: cropY.value - HANDLE_SIZE / 2 }));
  const trHandleStyle = useAnimatedStyle(() => ({ left: cropX.value + cropW.value - HANDLE_SIZE / 2, top: cropY.value - HANDLE_SIZE / 2 }));
  const blHandleStyle = useAnimatedStyle(() => ({ left: cropX.value - HANDLE_SIZE / 2, top: cropY.value + cropH.value - HANDLE_SIZE / 2 }));
  const brHandleStyle = useAnimatedStyle(() => ({ left: cropX.value + cropW.value - HANDLE_SIZE / 2, top: cropY.value + cropH.value - HANDLE_SIZE / 2 }));

  async function handleConfirm() {
    if (!bounds.width || !naturalSize.width) return;
    setProcessing(true);
    try {
      const scale = naturalSize.width / bounds.width;
      const originX = Math.round((cropX.value - bounds.offsetX) * scale);
      const originY = Math.round((cropY.value - bounds.offsetY) * scale);
      const width = Math.round(cropW.value * scale);
      const height = Math.round(cropH.value * scale);

      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ crop: { originX, originY, width, height } }],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG },
      );
      onConfirm(result.uri);
    } catch {
      Alert.alert('Error', 'Could not crop image. Please try again.');
      onCancel();
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Modal visible statusBarTranslucent animationType="fade">
      <View style={styles.container}>
        <View style={styles.imageArea} onLayout={onContainerLayout}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="contain" />
          {bounds.width > 0 && (
            <>
              <GestureDetector gesture={moveGesture}>
                <Animated.View style={[styles.cropRect, { borderColor: colors.primary }, cropStyle]} />
              </GestureDetector>
              <GestureDetector gesture={tlGesture}>
                <Animated.View style={[styles.handle, { backgroundColor: colors.primary }, tlHandleStyle]} />
              </GestureDetector>
              <GestureDetector gesture={trGesture}>
                <Animated.View style={[styles.handle, { backgroundColor: colors.primary }, trHandleStyle]} />
              </GestureDetector>
              <GestureDetector gesture={blGesture}>
                <Animated.View style={[styles.handle, { backgroundColor: colors.primary }, blHandleStyle]} />
              </GestureDetector>
              <GestureDetector gesture={brGesture}>
                <Animated.View style={[styles.handle, { backgroundColor: colors.primary }, brHandleStyle]} />
              </GestureDetector>
            </>
          )}
        </View>

        <View style={styles.actions}>
          <AnimatedButton onPress={onCancel} disabled={processing} style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
            <Ionicons name="close" size={18} color="#fff" />
            <Text style={[typography.label, { color: '#fff', marginLeft: 6 }]}>Cancel</Text>
          </AnimatedButton>
          <AnimatedButton onPress={handleConfirm} disabled={processing} style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={18} color="#fff" />
            <Text style={[typography.label, { color: '#fff', marginLeft: 6 }]}>{processing ? 'Cropping...' : 'Done'}</Text>
          </AnimatedButton>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  imageArea: { flex: 1 },
  cropRect: {
    position: 'absolute',
    borderWidth: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  handle: {
    position: 'absolute',
    width: HANDLE_SIZE,
    height: HANDLE_SIZE,
    borderRadius: HANDLE_SIZE / 2,
    borderWidth: 2,
    borderColor: '#fff',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
  },
});
