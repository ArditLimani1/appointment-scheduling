import { DateTime } from 'luxon';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { elevation, palette, radius, spacing, typography } from '@/theme/tokens';

/**
 * Horizontal prev/next date navigator used by the calendar and dashboard.
 * All date math happens in the given IANA zone (the business timezone).
 */
export function DateBar({
  date,
  zone,
  unit,
  locale,
  onChange,
}: {
  date: string; // Y-m-d
  zone: string;
  unit: 'day' | 'week';
  locale: string;
  onChange: (next: string) => void;
}) {
  const dt = DateTime.fromISO(date, { zone });

  const label =
    unit === 'day'
      ? dt.setLocale(locale).toFormat('cccc, d MMMM')
      : `${dt.startOf('week').setLocale(locale).toFormat('d MMM')} – ${dt
          .endOf('week')
          .setLocale(locale)
          .toFormat('d MMM')}`;

  const shift = (delta: number) => {
    onChange(dt.plus(unit === 'day' ? { days: delta } : { weeks: delta }).toISODate() ?? date);
  };

  return (
    <View style={styles.row}>
      <Pressable style={styles.arrow} onPress={() => shift(-1)} hitSlop={8}>
        <Text style={styles.arrowText}>‹</Text>
      </Pressable>
      <Pressable style={{ flex: 1 }} onPress={() => onChange(DateTime.now().setZone(zone).toISODate() ?? date)}>
        <Text style={[typography.bodyStrong as TextStyle, styles.label]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
      <Pressable style={styles.arrow} onPress={() => shift(1)} hitSlop={8}>
        <Text style={styles.arrowText}>›</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  // The web's period chevrons: `rounded-xl border border-slate-200 bg-white`.
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.xl,
    backgroundColor: palette.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: palette.slate200,
    alignItems: 'center',
    justifyContent: 'center',
    ...elevation.sm,
  },
  arrowText: { fontSize: 22, color: palette.onSurface, marginTop: -2 },
  label: { textAlign: 'center', color: palette.onSurface, textTransform: 'capitalize' },
});
