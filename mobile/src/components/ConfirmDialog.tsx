import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { fonts, palette, radius, spacing, typography } from '@/theme/tokens';

/**
 * The app's confirm dialog, replacing `Alert.alert`. The system alert renders in
 * Roboto with the platform accent, which reads as a different product next to
 * our panels — this is the web's card instead: `rounded-2xl` over
 * `surfaceContainerLowest` with a `slate200` ring, Manrope title, and the same
 * button pair as every form (near-black confirm, or the soft red-50/red-200 one
 * when the action destroys something).
 *
 * It is a `<Modal>` of its own, so it stacks correctly over a sheet — unlike a
 * root-mounted host, which a sheet's window would cover.
 */
const OPEN_MS = 160;
const CLOSE_MS = 130;

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Paints the confirm button red. */
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Returns an `ask()` to open the dialog and the element to render. Keep the
 * element in the same subtree as the screen it belongs to:
 *
 *     const { ask, dialog } = useConfirm();
 *     ...
 *     <Button onPress={() => ask({ title, message, destructive: true, onConfirm })} />
 *     {dialog}
 */
export function useConfirm() {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);

  const ask = useCallback((next: ConfirmOptions) => setOptions(next), []);
  const close = useCallback(() => setOptions(null), []);

  const dialog = (
    <ConfirmDialog
      options={options}
      onClose={close}
      onConfirm={() => {
        const run = options?.onConfirm;
        setOptions(null);
        run?.();
      }}
    />
  );

  return { ask, dialog };
}

function ConfirmDialog({
  options,
  onClose,
  onConfirm,
}: {
  options: ConfirmOptions | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { t } = useT();

  // `entering`/`exiting` layout animations flash a frame at their final values
  // on Android, and an `exiting` never plays here because the modal window is
  // torn down in the same commit. Drive both directions by hand instead, and
  // keep the window mounted with the last options until the close finishes.
  const progress = useSharedValue(0);
  const [shown, setShown] = useState<ConfirmOptions | null>(null);
  const isOpen = useRef(false);

  useEffect(() => {
    if (options) {
      isOpen.current = true;
      setShown(options);
      progress.value = withTiming(1, { duration: OPEN_MS });
      return;
    }
    if (!isOpen.current) return;
    isOpen.current = false;
    progress.value = withTiming(0, { duration: CLOSE_MS }, (finished) => {
      if (finished) runOnJS(setShown)(null);
    });
  }, [options, progress]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
  // Android draws an `elevation` shadow outside the view and does not apply the
  // view's opacity to it, so a fading card leaves its shadow behind as a hard
  // ghost rectangle. Fade the shadow itself along with everything else.
  const cardStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ scale: 0.94 + progress.value * 0.06 }],
    elevation: progress.value * 4,
    shadowOpacity: progress.value * 0.1,
  }));

  if (!shown) return null;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      // Android 15+ is edge-to-edge: without both of these the modal window
      // stops short of the system bars, so the tab bar stays undimmed and the
      // screen below re-lays out for a frame as the dialog opens and closes.
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.layer}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.dim, dimStyle]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <Animated.View style={[styles.card, cardStyle]}>
          <View style={{ gap: spacing.xs }}>
            <Text style={styles.title}>{shown.title}</Text>
            {shown.message ? (
              <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                {shown.message}
              </Text>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button
              title={shown.cancelLabel ?? t('mobile.common.cancel')}
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1 }}
            />
            <Button
              title={shown.confirmLabel ?? t('mobile.common.confirm')}
              variant={shown.destructive ? 'danger' : 'primary'}
              onPress={onConfirm}
              style={{ flex: 1 }}
            />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dim: { backgroundColor: 'rgba(0,0,0,0.35)' },
  card: {
    width: '100%',
    maxWidth: 380,
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius['2xl'],
    backgroundColor: palette.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.slate200,
    // `elevation` and `shadowOpacity` are animated in `cardStyle`.
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  title: { fontFamily: fonts.headlineBold, fontSize: 18, lineHeight: 24, color: palette.onSurface },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
