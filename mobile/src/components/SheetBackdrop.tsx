import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

/** How long the sheet takes to slide up. */
export const SHEET_SLIDE_MS = 240;

/** The dim runs 200ms → 300ms, so it lands just before the slide settles. */
const BACKDROP_DELAY_MS = 200;
const BACKDROP_FADE_MS = 100;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Dim layer behind a bottom sheet. It stays clear while the sheet slides and
 * darkens near the end, so the slide reads on its own rather than competing
 * with the dim.
 */
export function SheetBackdrop({ onPress }: { onPress: () => void }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(BACKDROP_DELAY_MS, withTiming(1, { duration: BACKDROP_FADE_MS }));
  }, [opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return <AnimatedPressable style={[styles.backdrop, style]} onPress={onPress} />;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
});
