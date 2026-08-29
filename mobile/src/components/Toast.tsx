import { MaterialIcons } from '@expo/vector-icons';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useT } from '@/i18n';
import { fonts, palette, radius, spacing, typography } from '@/theme/tokens';

/**
 * Toasts, matching the web's `SuccessToastProvider`: a small dark pill pinned
 * under the header on the right, with a leading status icon, the message, and a
 * dismiss button. Auto-dismisses after 4.5s like the web.
 *
 * Modals render in their own window on both platforms, so a host mounted at the
 * root cannot paint over an open sheet — mount an extra `<ToastHost />` inside
 * any `<Modal>` that can raise a toast while it stays open.
 */
const AUTO_DISMISS_MS = 4500;

export type ToastVariant = 'success' | 'error';

interface ToastState {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: ToastState | null;
  show: (message: string, variant?: ToastVariant) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  dismiss: () => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const show = useCallback((message: string, variant: ToastVariant = 'success') => {
    if (message == null || message === '') return;
    nextId.current += 1;
    setToast({ id: nextId.current, message: String(message), variant });
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      show,
      showSuccess: (message: string) => show(message, 'success'),
      showError: (message: string) => show(message, 'error'),
      dismiss: () => setToast(null),
    }),
    [toast, show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastHost />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

/**
 * The visible surface. Rendered once by `ToastProvider`; render it again inside
 * a `<Modal>` so toasts raised from a sheet are not trapped behind it.
 */
export function ToastHost() {
  const ctx = useContext(ToastContext);
  const insets = useSafeAreaInsets();
  const { t } = useT();
  const toast = ctx?.toast ?? null;

  const progress = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState<ToastState | null>(null);

  useEffect(() => {
    if (toast) setRendered(toast);
  }, [toast]);

  useEffect(() => {
    if (!ctx) return;
    if (toast) {
      Animated.timing(progress, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(ctx.dismiss, AUTO_DISMISS_MS);
      return () => clearTimeout(timer);
    }
    Animated.timing(progress, {
      toValue: 0,
      duration: 140,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setRendered(null);
    });
    return undefined;
  }, [toast?.id, toast, ctx, progress]);

  if (!ctx || !rendered) return null;

  const isError = rendered.variant === 'error';

  return (
    // `box-none` so the untouched area under the toast stays interactive.
    <View pointerEvents="box-none" style={[styles.layer, { paddingTop: insets.top + HEADER_OFFSET }]}>
      <Animated.View
        accessibilityLiveRegion="polite"
        style={[
          styles.toast,
          isError && { backgroundColor: palette.error },
          {
            opacity: progress,
            transform: [
              {
                translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [-14, 0] }),
              },
            ],
          },
        ]}
      >
        <MaterialIcons
          name={isError ? 'error' : 'check-circle'}
          size={16}
          color={isError ? palette.onError : palette.surface}
        />
        <Text
          style={[
            typography.label as TextStyle,
            { color: isError ? palette.onError : palette.surface, flexShrink: 1, fontFamily: fonts.bodySemibold },
          ]}
          numberOfLines={3}
        >
          {rendered.message}
        </Text>
        <Pressable
          onPress={ctx.dismiss}
          accessibilityLabel={t('components.toast.dismiss')}
          hitSlop={8}
          style={({ pressed }) => [styles.close, pressed && { opacity: 0.6 }]}
        >
          <MaterialIcons name="close" size={16} color={isError ? palette.onError : palette.surface} />
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** Clears the `Screen` title row, the way the web clears its 73px sticky bar. */
const HEADER_OFFSET = 56;

const styles = StyleSheet.create({
  layer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    zIndex: 100,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: '100%',
    backgroundColor: palette.onSurface,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 8,
  },
  close: {
    height: 26,
    width: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.lg,
  },
});
