import { DateTime } from 'luxon';
import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { palette, radius, statusColors, typography } from '@/theme/tokens';
import type { Appointment } from '@/api/types';
import { HOUR_HEIGHT, breakBounds, hoursRange, layoutDay, timeToMinutes } from './layout';
import type { BreakInterval } from './layout';

const AXIS_WIDTH = 48;
const MIN_COLUMN_WIDTH = 120;

/**
 * Seven-column week grid for wide screens (iPad / landscape). Tap a block to
 * open it; drag-to-reschedule stays in the day view where precision is better.
 */
export function WeekGrid({
  columnDates,
  appointments,
  hours,
  zone,
  locale,
  dayBreaksByDate = {},
  dayOffs = [],
  onPressAppointment,
  onPressDay,
}: {
  columnDates: string[];
  appointments: Appointment[];
  hours: { start: string; end: string };
  zone: string;
  locale: string;
  dayBreaksByDate?: Record<string, BreakInterval[]>;
  dayOffs?: string[];
  onPressAppointment: (appointment: Appointment) => void;
  onPressDay?: (date: string) => void;
}) {
  const dayStart = timeToMinutes(hours.start);
  const hourMarks = hoursRange(hours.start, hours.end);
  const contentHeight = (hourMarks.length - 1) * HOUR_HEIGHT + 24;

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const appointment of appointments) {
      const key = appointment.date.slice(0, 10);
      (map[key] ??= []).push(appointment);
    }
    return map;
  }, [appointments]);

  const today = DateTime.now().setZone(zone).toISODate();

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* header row */}
          <View style={{ flexDirection: 'row', marginLeft: AXIS_WIDTH }}>
            {columnDates.map((date) => {
              const dt = DateTime.fromISO(date, { zone }).setLocale(locale);
              const isToday = date === today;
              return (
                <Pressable
                  key={date}
                  style={[styles.dayHeader, isToday && styles.dayHeaderToday]}
                  onPress={() => onPressDay?.(date)}
                >
                  <Text
                    style={[
                      typography.caption as TextStyle,
                      { color: isToday ? palette.onPrimary : palette.onSurfaceVariant, textTransform: 'capitalize' },
                    ]}
                  >
                    {dt.toFormat('ccc')}
                  </Text>
                  <Text
                    style={[
                      typography.bodyStrong as TextStyle,
                      { color: isToday ? palette.onPrimary : palette.onSurface },
                    ]}
                  >
                    {dt.toFormat('d')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* grid */}
          <View style={{ flexDirection: 'row', height: contentHeight }}>
            <View style={{ width: AXIS_WIDTH }}>
              {hourMarks.map((h, i) => (
                <Text
                  key={h}
                  style={[
                    typography.caption as TextStyle,
                    { position: 'absolute', top: i * HOUR_HEIGHT - 7, right: 8, color: palette.onSurfaceVariant },
                  ]}
                >
                  {String(h).padStart(2, '0')}:00
                </Text>
              ))}
            </View>

            {columnDates.map((date) => {
              const blocks = layoutDay(byDate[date] ?? [], dayStart);
              const isOff = dayOffs.includes(date);
              return (
                <View key={date} style={styles.column}>
                  {hourMarks.map((h, i) => (
                    <View key={h} style={[styles.gridLine, { top: i * HOUR_HEIGHT }]} />
                  ))}
                  {isOff ? <View style={styles.dayOff} /> : null}
                  {(dayBreaksByDate[date] ?? []).map((raw, i) => {
                    const b = breakBounds(raw);
                    const top = ((timeToMinutes(b.start) - dayStart) / 60) * HOUR_HEIGHT;
                    const height = ((timeToMinutes(b.end) - timeToMinutes(b.start)) / 60) * HOUR_HEIGHT;
                    return <View key={`${b.start}-${i}`} style={[styles.breakBlock, { top, height }]} />;
                  })}
                  {blocks.map((block) => {
                    const colors = statusColors[block.appointment.status] ?? statusColors.pending;
                    const laneWidth = 100 / block.lanes;
                    return (
                      <Pressable
                        key={block.appointment.id}
                        onPress={() => onPressAppointment(block.appointment)}
                        style={[
                          styles.block,
                          {
                            top: block.top,
                            height: block.height,
                            left: `${block.lane * laneWidth}%`,
                            width: `${laneWidth}%`,
                            backgroundColor: colors.bg,
                            borderLeftColor: colors.dot,
                          },
                        ]}
                      >
                        <Text
                          style={[typography.caption as TextStyle, { color: colors.fg, fontWeight: '700' }]}
                          numberOfLines={1}
                        >
                          {block.appointment.start_time}
                        </Text>
                        {block.height > 36 ? (
                          <Text style={[typography.caption as TextStyle, { color: colors.fg }]} numberOfLines={2}>
                            {[block.appointment.client_first_name, block.appointment.client_last_name]
                              .filter(Boolean)
                              .join(' ')}
                          </Text>
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  dayHeader: {
    width: MIN_COLUMN_WIDTH,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 1,
    borderRadius: radius.md,
  },
  dayHeaderToday: { backgroundColor: palette.primary },
  column: {
    width: MIN_COLUMN_WIDTH,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: palette.outlineVariant,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.outlineVariant,
  },
  block: {
    position: 'absolute',
    borderRadius: radius.sm,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  breakBlock: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: palette.surfaceContainerHigh,
    opacity: 0.7,
  },
  dayOff: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: palette.surfaceContainer,
    opacity: 0.85,
  },
});
