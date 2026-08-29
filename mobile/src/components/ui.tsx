import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { elevation, hairline, palette, radius, spacing, statusColors, typography } from '@/theme/tokens';
import type { AppointmentStatus } from '@/api/types';

/* --------------------------------- Button ---------------------------------- */

/**
 * Mirrors the web's action buttons. The primary action is near-black
 * (`bg-on-surface text-surface`), the secondary is a grey container, and the
 * destructive one is the soft red-50/red-200 pair — not a solid red fill.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const bg =
    variant === 'primary'
      ? palette.onSurface
      : variant === 'danger'
        ? palette.red50
        : variant === 'secondary'
          ? palette.surfaceContainerHigh
          : 'transparent';
  const fg =
    variant === 'primary'
      ? palette.surface
      : variant === 'danger'
        ? palette.red950
        : palette.onSurface;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg },
        variant === 'primary' && elevation.sm,
        variant === 'danger' && { borderWidth: 1, borderColor: palette.red200 },
        variant === 'ghost' && { paddingHorizontal: spacing.sm },
        // The web pairs `hover:opacity-90` with `active:scale-95`.
        { opacity: disabled || loading ? 0.4 : pressed ? 0.9 : 1 },
        pressed && !disabled && !loading && { transform: [{ scale: 0.97 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[typography.labelStrong as TextStyle, { color: fg, fontSize: 14 }]} numberOfLines={1}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

/* -------------------------------- TextField --------------------------------- */

export function TextField({
  label,
  error,
  style,
  ...props
}: TextInputProps & { label?: string; error?: string | null }) {
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={styles.fieldLabel}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={palette.outline}
        style={[styles.input, error ? { borderColor: palette.error } : null, style]}
        {...props}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

/* ---------------------------------- Card ------------------------------------ */

/** The web's panel: `rounded-2xl ring-1 ring-slate-100 shadow-sm`. */
export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* -------------------------------- StatusPill -------------------------------- */

export function StatusPill({ status, label }: { status: AppointmentStatus; label?: string }) {
  const colors = statusColors[status] ?? statusColors.pending;
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg, borderColor: colors.ring }]}>
      <View style={[styles.pillDot, { backgroundColor: colors.dot }]} />
      <Text style={[typography.overline as TextStyle, { color: colors.fg }]}>{label ?? status}</Text>
    </View>
  );
}

/* -------------------------------- MetricCard -------------------------------- */

export function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card style={styles.metric}>
      <Text style={[typography.overline as TextStyle, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[typography.headline as TextStyle, { color: accent ?? palette.onSurface }]} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}

/* ------------------------------ SegmentedControl ----------------------------- */

/**
 * The web's segmented switch: a grey track with a white, ringed, slightly
 * raised pill for the active option — not a filled primary-colour segment.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active && styles.segmentActive]}
          >
            <Text
              style={[
                typography.labelStrong as TextStyle,
                { color: active ? palette.onSurface : palette.onSurfaceVariant },
              ]}
              numberOfLines={1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ------------------------------- state screens ------------------------------- */

export function LoadingView() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color={palette.onSurface} />
    </View>
  );
}

export function ErrorView({ message, onRetry, retryLabel }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <View style={[styles.center, { gap: spacing.lg, padding: spacing.xl }]}>
      <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>
        {message}
      </Text>
      {onRetry ? <Button title={retryLabel ?? 'Retry'} onPress={onRetry} variant="secondary" /> : null}
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={[styles.center, { gap: spacing.sm, padding: spacing.xxl }]}>
      <Text style={[typography.title as TextStyle, { color: palette.onSurface, textAlign: 'center' }]}>{title}</Text>
      {subtitle ? (
        <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant, textAlign: 'center' }]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

/* --------------------------------- ListRow ----------------------------------- */

export function ListRow({
  title,
  subtitle,
  right,
  onPress,
}: {
  title: string;
  subtitle?: string | null;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: palette.slate50 }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.title as TextStyle, { color: palette.onSurface, fontSize: 15 }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fieldLabel: { ...(typography.overline as TextStyle), color: palette.outline },
  fieldError: { ...(typography.caption as TextStyle), color: palette.error },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceContainerLowest,
    color: palette.onSurface,
    ...(typography.body as TextStyle),
  },
  card: {
    backgroundColor: palette.surfaceContainerLowest,
    borderRadius: radius['2xl'],
    padding: spacing.lg,
    // `ring-1 ring-slate-100` — a full-width ring, not a hairline border.
    borderWidth: 1,
    borderColor: palette.slate100,
    ...elevation.sm,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  metric: { flex: 1, gap: spacing.xs, padding: spacing.md },
  segmented: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceContainerHigh,
    borderRadius: radius.xl,
    padding: 4,
    gap: 4,
  },
  segment: {
    flex: 1,
    borderRadius: radius.lg,
    paddingVertical: 8,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: {
    backgroundColor: palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: palette.slate200,
    ...elevation.sm,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: hairline.faint,
  },
});
