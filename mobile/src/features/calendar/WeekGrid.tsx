import { MaterialIcons } from '@expo/vector-icons';
import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { fonts, palette, radius, typography } from '@/theme/tokens';
import type { Appointment } from '@/api/types';
import { employeeName } from '@/components/AppointmentCard';
import { toIsoDate, toHm } from '@/utils/datetime';
import { getEmployeeSlotStyles, type EmployeeColorMap } from './employeeColors';
import { statusIcon } from './statusIcon';
import {
  HOUR_HEIGHT,
  breakBounds,
  buildSegments,
  dragSnapMinutes,
  hoursRange,
  layoutDay,
  minutesToTime,
  snapToNearestAllowed,
  timeToMinutes,
} from './layout';
import type { BreakInterval } from './layout';

const AXIS_WIDTH = 48;
const MIN_COLUMN_WIDTH = 120;

/**
 * Seven-column week grid for wide screens (iPad / landscape). Tap a block to
 * open it, long-press to carry it to another time — or another day, since a
 * horizontal move here changes the column.
 */
export function WeekGrid({
  columnDates,
  appointments,
  hours,
  zone,
  locale,
  dayBreaksByDate = {},
  dayOffs = [],
  employeeColors,
  slotMinutes,
  allowedByDate,
  draggingId,
  onDragStart,
  onDragEnd,
  onMoveAppointment,
  canMove,
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
  /** Per-employee block colours, as on the web calendar. */
  employeeColors?: EmployeeColorMap;
  /** `businesses.slot_duration`; rows follow it, matching the day view and web. */
  slotMinutes?: number;
  /** Allowed `HH:MM` starts per visible date for the appointment being dragged. */
  allowedByDate?: Record<string, Set<string>> | null;
  draggingId?: number | null;
  onDragStart?: (appointment: Appointment) => void;
  onDragEnd?: () => void;
  /** A week drop can change the day, so the date travels with the time. */
  onMoveAppointment?: (appointment: Appointment, date: string, newStartTime: string) => void;
  canMove?: (appointment: Appointment) => boolean;
  onPressAppointment: (appointment: Appointment) => void;
  onPressDay?: (date: string) => void;
}) {
  const dayStart = timeToMinutes(hours.start);
  const hourMarks = hoursRange(hours.start, hours.end);
  const contentHeight = (hourMarks.length - 1) * HOUR_HEIGHT + 24;

  const byDate = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const appointment of appointments) {
      const key = toIsoDate(appointment.date);
      (map[key] ??= []).push(appointment);
    }
    return map;
  }, [appointments]);

  const today = DateTime.now().setZone(zone).toISODate();

  // Both axes matter here: vertical moves the time, horizontal moves the day.
  const dragX = useSharedValue(0);
  const dragY = useSharedValue(0);
  const dragActive = useSharedValue(false);
  // Both ScrollViews must yield while a card is being carried, or the nested
  // pair claims the gesture and the grid scrolls under the finger instead.
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const draggingInfo = useMemo(() => {
    if (draggingId == null) return null;
    for (let col = 0; col < columnDates.length; col += 1) {
      const date = columnDates[col];
      const found = layoutDay(byDate[date] ?? [], dayStart).find((b) => b.appointment.id === draggingId);
      if (found) return { block: found, col, date };
    }
    return null;
  }, [draggingId, columnDates, byDate, dayStart]);

  const dragStep = draggingInfo
    ? dragSnapMinutes(
        slotMinutes ?? 30,
        timeToMinutes(draggingInfo.block.appointment.end_time) -
          timeToMinutes(draggingInfo.block.appointment.start_time),
      )
    : 30;

  /** Column and start minute the current offsets point at, clamped to the week. */
  const resolveTarget = (offsetX: number, offsetY: number) => {
    if (!draggingInfo) return null;
    const col = Math.min(
      columnDates.length - 1,
      Math.max(0, draggingInfo.col + Math.round(offsetX / MIN_COLUMN_WIDTH)),
    );
    const startMin = timeToMinutes(draggingInfo.block.appointment.start_time);
    const raw = Math.round((startMin + (offsetY / HOUR_HEIGHT) * 60) / dragStep) * dragStep;
    return { date: columnDates[col], col, startMin: raw };
  };

  const previewStyle = useAnimatedStyle(() => {
    if (!draggingInfo) return { opacity: 0 };
    const snapPx = (dragStep / 60) * HOUR_HEIGHT;
    const snappedY = Math.round(dragY.value / snapPx) * snapPx;
    const snappedX = Math.round(dragX.value / MIN_COLUMN_WIDTH) * MIN_COLUMN_WIDTH;
    return {
      opacity: dragActive.value ? 1 : 0,
      transform: [{ translateX: snappedX }, { translateY: snappedY }],
    };
  });

  return (
    <ScrollView showsVerticalScrollIndicator={false} scrollEnabled={scrollEnabled}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} scrollEnabled={scrollEnabled}>
        <View>
          {/* header row */}
          <View style={{ flexDirection: 'row', marginLeft: AXIS_WIDTH }}>
            {columnDates.map((date, colIndex) => {
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
                      { color: isToday ? palette.surface : palette.onSurfaceVariant, textTransform: 'capitalize' },
                    ]}
                  >
                    {dt.toFormat('ccc')}
                  </Text>
                  <Text
                    style={[
                      typography.bodyStrong as TextStyle,
                      { color: isToday ? palette.surface : palette.onSurface },
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

            {columnDates.map((date, colIndex) => {
              const dayAppointments = byDate[date] ?? [];
              const blocks = layoutDay(dayAppointments, dayStart);
              const isOff = dayOffs.includes(date);
              const segments = buildSegments(hours.start, hours.end, slotMinutes ?? 30);
              return (
                <View key={date} style={styles.column}>
                  {segments.map((seg) => (
                    <View
                      key={seg.startMin}
                      style={[
                        styles.segment,
                        {
                          top: ((seg.startMin - dayStart) / 60) * HOUR_HEIGHT,
                          height: ((seg.endMin - seg.startMin) / 60) * HOUR_HEIGHT,
                        },
                      ]}
                    />
                  ))}
                  {hourMarks.map((h, i) => (
                    <View key={h} style={[styles.gridLine, { top: i * HOUR_HEIGHT }]} />
                  ))}
                  {isOff ? <View style={styles.dayOff} /> : null}

                  {/* Unavailable runs merge into one band, as on the web. */}
                  {(draggingId != null && allowedByDate?.[date]
                    ? mergeBlocked(segments, allowedByDate[date])
                    : []
                  ).map((band) => (
                    <View
                      key={band.startMin}
                      pointerEvents="none"
                      style={[
                        styles.blockedBand,
                        {
                          top: ((band.startMin - dayStart) / 60) * HOUR_HEIGHT,
                          height: ((band.endMin - band.startMin) / 60) * HOUR_HEIGHT,
                        },
                      ]}
                    />
                  ))}

                  {draggingInfo && draggingInfo.date === date ? (
                    <View
                      pointerEvents="none"
                      style={[
                        styles.dragOrigin,
                        {
                          top: draggingInfo.block.top,
                          height: draggingInfo.block.height,
                          borderColor: getEmployeeSlotStyles(
                            employeeColors,
                            draggingInfo.block.appointment.employee_id,
                          ).border,
                          backgroundColor: getEmployeeSlotStyles(
                            employeeColors,
                            draggingInfo.block.appointment.employee_id,
                          ).bg,
                        },
                      ]}
                    />
                  ) : null}

                  {draggingInfo && draggingInfo.col === colIndex ? (
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.dropPreview,
                        { top: draggingInfo.block.top, height: draggingInfo.block.height },
                        previewStyle,
                      ]}
                    />
                  ) : null}
                  {(dayBreaksByDate[date] ?? []).map((raw, i) => {
                    const b = breakBounds(raw);
                    const top = ((timeToMinutes(b.start) - dayStart) / 60) * HOUR_HEIGHT;
                    const height = ((timeToMinutes(b.end) - timeToMinutes(b.start)) / 60) * HOUR_HEIGHT;
                    return <View key={`${b.start}-${i}`} style={[styles.breakBlock, { top, height }]} />;
                  })}
                  {blocks.map((block) => {
                    const colors = getEmployeeSlotStyles(employeeColors, block.appointment.employee_id);
                    const icon = statusIcon(block.appointment.status);
                    const laneWidth = 100 / block.lanes;
                    const draggable =
                      Boolean(onMoveAppointment) && (canMove?.(block.appointment) ?? true);
                    return (
                      <WeekBlock
                        key={block.appointment.id}
                        draggable={draggable}
                        dragX={dragX}
                        dragY={dragY}
                        dragActive={dragActive}
                        snapMinutes={dragStep}
                        onPress={() => onPressAppointment(block.appointment)}
                        onPickUp={() => {
                          setScrollEnabled(false);
                          onDragStart?.(block.appointment);
                        }}
                        onRelease={() => {
                          setScrollEnabled(true);
                          onDragEnd?.();
                        }}
                        onDrop={(offsetX, offsetY) => {
                          const target = resolveTarget(offsetX, offsetY);
                          if (!target) return;
                          const allowed = allowedByDate?.[target.date];
                          const next = allowed ? snapToNearestAllowed(target.startMin, allowed) : target.startMin;
                          if (next == null) return;
                          const sameSpot =
                            target.date === toIsoDate(block.appointment.date) &&
                            next === timeToMinutes(block.appointment.start_time);
                          if (!sameSpot) {
                            onMoveAppointment?.(block.appointment, target.date, minutesToTime(next));
                          }
                        }}
                        style={[
                          styles.block,
                          {
                            top: block.top,
                            height: block.height,
                            left: `${block.lane * laneWidth}%`,
                            width: `${laneWidth}%`,
                            backgroundColor: colors.bg,
                            borderLeftColor: colors.border,
                          },
                        ]}
                      >
                        <View style={styles.blockHeader}>
                          <Text
                            style={[
                              typography.caption as TextStyle,
                              { color: colors.text, fontFamily: fonts.bodyBold, flex: 1 },
                            ]}
                            numberOfLines={1}
                          >
                            {[block.appointment.client_first_name, block.appointment.client_last_name]
                              .filter(Boolean)
                              .join(' ') ||
                              employeeName(block.appointment) ||
                              '—'}
                          </Text>
                          <MaterialIcons name={icon.name} size={12} color={icon.color} />
                        </View>
                        {block.height > 36 ? (
                          <Text style={[typography.caption as TextStyle, { color: colors.text }]} numberOfLines={2}>
                            {[
                              block.appointment.service?.name ?? block.appointment.service_name,
                              toHm(block.appointment.start_time),
                            ]
                              .filter(Boolean)
                              .join(' - ')}
                          </Text>
                        ) : null}
                      </WeekBlock>
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

/** Consecutive unavailable slots collapse into one region, as the web draws them. */
function mergeBlocked(segments: { startMin: number; endMin: number }[], allowed: Set<string>) {
  const bands: { startMin: number; endMin: number }[] = [];
  for (const seg of segments) {
    if (allowed.has(minutesToTime(seg.startMin))) continue;
    const last = bands[bands.length - 1];
    if (last && last.endMin === seg.startMin) last.endMin = seg.endMin;
    else bands.push({ startMin: seg.startMin, endMin: seg.endMin });
  }
  return bands;
}

/** A week-grid card that can be carried across days and times. */
function WeekBlock({
  draggable,
  dragX,
  dragY,
  dragActive,
  snapMinutes,
  style,
  onPress,
  onPickUp,
  onRelease,
  onDrop,
  children,
}: {
  draggable: boolean;
  dragX: SharedValue<number>;
  dragY: SharedValue<number>;
  dragActive: SharedValue<boolean>;
  snapMinutes: number;
  style: StyleProp<ViewStyle>;
  onPress: () => void;
  onPickUp: () => void;
  onRelease: () => void;
  onDrop: (offsetX: number, offsetY: number) => void;
  children: React.ReactNode;
}) {
  const mine = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(draggable)
    // Long-press first, so a plain swipe still scrolls the week horizontally.
    .activateAfterLongPress(350)
    .onStart(() => {
      mine.value = true;
      dragActive.value = true;
      runOnJS(onPickUp)();
    })
    .onUpdate((event) => {
      if (!mine.value) return;
      dragX.value = event.translationX;
      dragY.value = event.translationY;
    })
    .onEnd((event) => {
      if (!mine.value) return;
      runOnJS(onDrop)(event.translationX, event.translationY);
    })
    .onFinalize(() => {
      if (!mine.value) return;
      mine.value = false;
      dragActive.value = false;
      dragX.value = withTiming(0, { duration: 120 });
      dragY.value = withTiming(0, { duration: 120 });
      runOnJS(onRelease)();
    });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success) runOnJS(onPress)();
  });

  const animatedStyle = useAnimatedStyle(() => {
    if (!mine.value) return {};
    const snapPx = (snapMinutes / 60) * HOUR_HEIGHT;
    return {
      transform: [
        { translateX: Math.round(dragX.value / MIN_COLUMN_WIDTH) * MIN_COLUMN_WIDTH },
        { translateY: Math.round(dragY.value / snapPx) * snapPx },
      ],
      zIndex: 20,
      opacity: 0.92,
    };
  });

  return (
    <GestureDetector gesture={Gesture.Exclusive(pan, tap)}>
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  dayHeader: {
    width: MIN_COLUMN_WIDTH,
    alignItems: 'center',
    paddingVertical: 6,
    gap: 1,
    borderRadius: radius.lg,
  },
  dayHeaderToday: { backgroundColor: palette.onSurface },
  column: {
    width: MIN_COLUMN_WIDTH,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: palette.outlineVariant,
  },
  // Every row is the shaded default; a bookable one is punched out in white, so
  // open time reads as a gap rather than as another tint on a tinted surface.
  segment: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: palette.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.slate100,
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.outlineVariant,
  },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  block: {
    position: 'absolute',
    borderRadius: radius.DEFAULT,
    borderLeftWidth: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  blockedBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.55)',
    backgroundColor: 'rgba(248, 113, 113, 0.20)',
  },
  dragOrigin: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    opacity: 0.35,
  },
  dropPreview: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(14, 165, 233, 0.85)',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    zIndex: 15,
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
