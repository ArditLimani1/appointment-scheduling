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
import { palette, radius, spacing, statusColors, typography } from '@/theme/tokens';
import type { AppointmentStatus } from '@/api/types';

/* --------------------------------- Button ---------------------------------- */

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
      ? palette.primary
      : variant === 'danger'
        ? palette.error
        : variant === 'secondary'
          ? palette.secondaryContainer
          : 'transparent';
  const fg =
    variant === 'primary' || variant === 'danger'
      ? palette.onPrimary
      : variant === 'secondary'
        ? palette.onSecondaryContainer
        : palette.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: bg, opacity: disabled || loading ? 0.5 : pressed ? 0.85 : 1 },
        variant === 'ghost' && { paddingHorizontal: spacing.sm },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[typography.bodyStrong as TextStyle, { color: fg }]}>{title}</Text>
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

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/* -------------------------------- StatusPill -------------------------------- */

export function StatusPill({ status, label }: { status: AppointmentStatus; label?: string }) {
  const colors = statusColors[status] ?? statusColors.pending;
  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: colors.dot }]} />
      <Text style={[typography.caption as TextStyle, { color: colors.fg }]}>{label ?? status}</Text>
    </View>
  );
}

/* -------------------------------- MetricCard -------------------------------- */

export function MetricCard({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <Card style={styles.metric}>
      <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
        {label}
      </Text>
      <Text style={[typography.headline as TextStyle, { color: accent ?? palette.onSurface }]} numberOfLines={1}>
        {value}
      </Text>
    </Card>
  );
}

/* ------------------------------ SegmentedControl ----------------------------- */

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
                typography.label as TextStyle,
                { color: active ? palette.onPrimary : palette.onSurfaceVariant },
              ]}
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
      <ActivityIndicator size="large" color={palette.primary} />
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
      style={({ pressed }) => [styles.listRow, pressed && { backgroundColor: palette.surfaceContainer }]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurface }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]} numberOfLines={2}>
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
    minHeight: 46,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fieldLabel: { ...(typography.label as TextStyle), color: palette.onSurfaceVariant },
  fieldError: { ...(typography.caption as TextStyle), color: palette.error },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: palette.outlineVariant,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    backgroundColor: palette.surfaceContainerLowest,
    color: palette.onSurface,
    fontSize: 15,
  },
  card: {
    backgroundColor: palette.surfaceContainerLowest,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: palette.outlineVariant,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  metric: { flex: 1, gap: spacing.xs, padding: spacing.md },
  segmented: {
    flexDirection: 'row',
    backgroundColor: palette.surfaceContainer,
    borderRadius: radius.full,
    padding: 3,
  },
  segment: {
    flex: 1,
    borderRadius: radius.full,
    paddingVertical: 7,
    alignItems: 'center',
  },
  segmentActive: { backgroundColor: palette.primary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
