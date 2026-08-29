import React, { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated';
import { Button } from '@/components/ui';
import { useT } from '@/i18n';
import { elevation, fonts, palette, radius, spacing, typography } from '@/theme/tokens';

/**
 * The app's confirm dialog, replacing `Alert.alert`. The system alert renders in
 * Roboto with the platform accent, which reads as a different product next to
 * our panels — this is the web's card instead: `rounded-2xl` over
 * `surfaceContainerLowest` with a `slate100` ring, Manrope title, and the same
 * button pair as every form (near-black confirm, or the soft red-50/red-200 one
 * when the action destroys something).
 *
 * It is a `<Modal>` of its own, so it stacks correctly over a sheet — unlike a
 * root-mounted host, which a sheet's window would cover.
 */
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

  return (
    <Modal
      visible={options != null}
      transparent
      animationType="none"
      // Android 15+ is edge-to-edge: without both of these the modal window
      // stops short of the system bars, so the tab bar stays undimmed and the
      // screen below re-lays out for a frame as the dialog opens and closes.
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {options ? (
        <Animated.View entering={FadeIn.duration(140)} exiting={FadeOut.duration(120)} style={styles.layer}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          {/* The width lives on the animated wrapper: the card's `100%` would
              otherwise resolve against an auto-width parent and shrink to text. */}
          <Animated.View
            style={styles.wrapper}
            entering={ZoomIn.duration(170).withInitialValues({ transform: [{ scale: 0.94 }] })}
          >
            <View style={styles.card}>
              <View style={{ gap: spacing.xs }}>
                <Text style={styles.title}>{options.title}</Text>
                {options.message ? (
                  <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                    {options.message}
                  </Text>
                ) : null}
              </View>

              <View style={styles.actions}>
                <Button
                  title={options.cancelLabel ?? t('mobile.common.cancel')}
                  variant="secondary"
                  onPress={onClose}
                  style={{ flex: 1 }}
                />
                <Button
                  title={options.confirmLabel ?? t('mobile.common.confirm')}
                  variant={options.destructive ? 'danger' : 'primary'}
                  onPress={onConfirm}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  layer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  wrapper: { width: '100%', maxWidth: 380 },
  card: {
    gap: spacing.lg,
    padding: spacing.xl,
    borderRadius: radius['2xl'],
    backgroundColor: palette.surfaceContainerLowest,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.slate200,
    ...elevation.md,
  },
  title: { fontFamily: fonts.headlineBold, fontSize: 18, lineHeight: 24, color: palette.onSurface },
  actions: { flexDirection: 'row', gap: spacing.sm },
});
