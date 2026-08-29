import React from 'react';
import { StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotificationBell } from '@/components/NotificationBell';
import { palette, spacing, typography } from '@/theme/tokens';

/**
 * Standard screen chrome: safe area, surface background, optional title row.
 * The notification bell sits in that row on every titled screen — the web keeps
 * its bell in the layout, so putting it here rather than per-screen matches.
 */
export function Screen({
  title,
  right,
  children,
  style,
  noPadding,
  hideBell,
}: {
  title?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  noPadding?: boolean;
  /** Set on the notifications screen itself, and anywhere the bell is noise. */
  hideBell?: boolean;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {title ? (
        <View style={styles.header}>
          <Text style={[typography.displaySmall as TextStyle, { color: palette.onSurface, flex: 1 }]} numberOfLines={1}>
            {title}
          </Text>
          {right}
          {!hideBell ? <NotificationBell /> : null}
        </View>
      ) : null}
      <View style={[{ flex: 1 }, !noPadding && styles.body, style]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: palette.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  body: { paddingHorizontal: spacing.lg },
});
