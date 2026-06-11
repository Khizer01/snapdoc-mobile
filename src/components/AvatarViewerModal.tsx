import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Pressable, BackHandler } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface AvatarViewerModalProps {
  uri: string;
  onClose: () => void;
}

export function AvatarViewerModal({ uri, onClose }: AvatarViewerModalProps) {
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onClose();
      return true;
    });
    return () => sub.remove();
  }, [onClose]);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={[StyleSheet.absoluteFill, styles.backdrop]}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.imageWrap} pointerEvents="none">
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  imageWrap: {
    width: '90%',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
});
