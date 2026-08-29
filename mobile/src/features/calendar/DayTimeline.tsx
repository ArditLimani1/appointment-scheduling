import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
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
import { toHm } from '@/utils/datetime';
import { getEmployeeSlotStyles, type EmployeeColorMap } from './employeeColors';
import { statusIcon } from './statusIcon';
import type { BreakInterval } from './layout';
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

const AXIS_WIDTH = 48;

/** Grid step for one block: the finer of the slot grid and its own duration. */
function blockSnapMinutes(appointment: Appointment, slotMinutes?: number): number {
  const duration = timeToMinutes(appointment.end_time) - timeToMinutes(appointment.start_time);
  return dragSnapMinutes(slotMinutes ?? 30, duration);
}

interface Props {
  appointments: Appointment[];
  hours: { start: string; end: string };
  breaks?: BreakInterval[];
  isDayOff?: boolean;
  dayOffLabel?: string;
  onPressAppointment: (appointment: Appointment) => void;
  /** When provided, blocks can be long-pressed and dragged to a new start time. */
  onMoveAppointment?: (appointment: Appointment, date: string, newStartTime: string) => void;
  canMove?: (appointment: Appointment) => boolean;
  /** Per-employee block colours, as on the web calendar. */
  employeeColors?: EmployeeColorMap;
  /** `businesses.slot_duration`; the grid rows follow it, as the web's does. */
  slotMinutes?: number;
  /** The day being shown; a day-view drop never leaves it. */
  date: string;
  /** Raised when a block is picked up / released, so the parent can load the
   *  allowed start times for that appointment from the slots API. */
  onDragStart?: (appointment: Appointment) => void;
  onDragEnd?: () => void;
  /** Allowed `HH:MM` starts for the appointment being dragged; null while loading. */
  allowedStarts?: Set<string> | null;
  draggingId?: number | null;
}

export function DayTimeline({
  appointments,
  hours,
  breaks = [],
  isDayOff,
  dayOffLabel,
  onPressAppointment,
  onMoveAppointment,
  canMove,
  employeeColors,
  slotMinutes,
  date,
  onDragStart,
  onDragEnd,
  allowedStarts,
  draggingId,
}: Props) {
  const dayStart = timeToMinutes(hours.start);
  const dayEnd = timeToMinutes(hours.end);
  const contentHeight = ((dayEnd - dayStart) / 60) * HOUR_HEIGHT + 24;

  const blocks = useMemo(() => layoutDay(appointments, dayStart), [appointments, dayStart]);

  // Owned here rather than inside the block, so the drop preview can follow the
  // same value the card is moving by.
  const dragY = useSharedValue(0);
  const dragActive = useSharedValue(false);

  const draggingBlock = draggingId == null ? null : blocks.find((b) => b.appointment.id === draggingId) ?? null;
  const dragStep = draggingBlock ? blockSnapMinutes(draggingBlock.appointment, slotMinutes) : 30;

  const previewStyle = useAnimatedStyle(() => {
    if (!draggingBlock) return { opacity: 0 };
    const snapPx = (dragStep / 60) * HOUR_HEIGHT;
    const snapped = Math.round(dragY.value / snapPx) * snapPx;
    return {
      opacity: dragActive.value ? 1 : 0,
      transform: [{ translateY: snapped }],
    };
  });

  // Rows follow the booking slot length. They stay plain until something is
  // being dragged, because a slot is only free relative to that appointment.
  const segments = useMemo(
    () => buildSegments(hours.start, hours.end, slotMinutes ?? 30),
    [hours.start, hours.end, slotMinutes],
  );

  // Consecutive unavailable slots read as one region on the web, not as a
  // stack of striped rows — merge them before drawing.
  const blockedBands = useMemo(() => {
    if (draggingId == null || !allowedStarts) return [] as { startMin: number; endMin: number }[];
    const bands: { startMin: number; endMin: number }[] = [];
    for (const seg of segments) {
      if (allowedStarts.has(minutesToTime(seg.startMin))) continue;
      const last = bands[bands.length - 1];
      if (last && last.endMin === seg.startMin) last.endMin = seg.endMin;
      else bands.push({ startMin: seg.startMin, endMin: seg.endMin });
    }
    return bands;
  }, [segments, allowedStarts, draggingId]);


  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={{ height: contentHeight, flexDirection: 'row' }}>
        {/* hour axis */}
        <View style={[styles.axis, { height: contentHeight }]}>
          {segments.map((seg) => (
            <Text
              key={seg.startMin}
              style={[
                typography.caption as TextStyle,
                styles.axisLabel,
                // The web seats the label at the top of its own row rather than
                // centring it on the line, so the first one is never half-clipped.
                { top: ((seg.startMin - dayStart) / 60) * HOUR_HEIGHT + 2 },
              ]}
            >
              {minutesToTime(seg.startMin)}
            </Text>
          ))}
        </View>

        {/* grid */}
        <View style={{ flex: 1 }}>
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

          {blockedBands.map((band) => (
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
          {isDayOff ? (
            <View style={styles.dayOff}>
              <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>
                {dayOffLabel ?? '—'}
              </Text>
            </View>
          ) : null}

          {breaks.map((raw, i) => {
            const b = breakBounds(raw);
            const top = ((timeToMinutes(b.start) - dayStart) / 60) * HOUR_HEIGHT;
            const height = ((timeToMinutes(b.end) - timeToMinutes(b.start)) / 60) * HOUR_HEIGHT;
            return <View key={`${b.start}-${i}`} style={[styles.breakBlock, { top, height }]} />;
          })}

          {/* Where the card came from stays marked, as the web leaves the
              original block faded in place while its copy follows the finger. */}
          {draggingBlock ? (
            <View
              pointerEvents="none"
              style={[
                styles.dragOrigin,
                {
                  top: draggingBlock.top,
                  height: draggingBlock.height,
                  borderColor: getEmployeeSlotStyles(employeeColors, draggingBlock.appointment.employee_id).border,
                  backgroundColor: getEmployeeSlotStyles(employeeColors, draggingBlock.appointment.employee_id).bg,
                },
              ]}
            />
          ) : null}

          {draggingBlock ? (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.dropPreview,
                { top: draggingBlock.top, height: draggingBlock.height },
                previewStyle,
              ]}
            />
          ) : null}

          {blocks.map((block) => (
            <DraggableBlock
              key={block.appointment.id}
              block={block}
              colors={getEmployeeSlotStyles(employeeColors, block.appointment.employee_id)}
              draggable={Boolean(onMoveAppointment) && (canMove?.(block.appointment) ?? true)}
              dayStart={dayStart}
              onPress={() => onPressAppointment(block.appointment)}
              onPickUp={() => onDragStart?.(block.appointment)}
              onRelease={() => onDragEnd?.()}
              snapMinutes={blockSnapMinutes(block.appointment, slotMinutes)}
              dragY={dragY}
              dragActive={dragActive}
              onDrop={(minutesDelta) => {
                const startMin = timeToMinutes(block.appointment.start_time);
                const step = blockSnapMinutes(block.appointment, slotMinutes);
                const raw = Math.round((startMin + minutesDelta) / step) * step;
                // The server owns which starts exist; land on the nearest one so
                // an off-grid drop corrects itself instead of being rejected.
                const next = allowedStarts ? snapToNearestAllowed(raw, allowedStarts) : raw;
                if (next != null && next !== startMin) {
                  onMoveAppointment?.(block.appointment, date, minutesToTime(next));
                }
              }}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function DraggableBlock({
  block,
  colors,
  draggable,
  dayStart,
  snapMinutes,
  dragY,
  dragActive,
  onPress,
  onPickUp,
  onRelease,
  onDrop,
}: {
  block: ReturnType<typeof layoutDay>[number];
  colors: { bg: string; border: string; text: string };
  draggable: boolean;
  dayStart: number;
  snapMinutes: number;
  dragY: SharedValue<number>;
  dragActive: SharedValue<boolean>;
  onPress: () => void;
  onPickUp: () => void;
  onRelease: () => void;
  onDrop: (minutesDelta: number) => void;
}) {

  const appointment = block.appointment;
  const icon = statusIcon(appointment.status);

  const pan = Gesture.Pan()
    .enabled(draggable)
    .activateAfterLongPress(350)
    .onStart(() => {
      dragActive.value = true;
      runOnJS(onPickUp)();
    })
    .onUpdate((event) => {
      dragY.value = event.translationY;
    })
    .onEnd((event) => {
      const minutesDelta = (event.translationY / HOUR_HEIGHT) * 60;
      dragActive.value = false;
      dragY.value = withTiming(0, { duration: 120 });
      runOnJS(onDrop)(minutesDelta);
    })
    .onFinalize(() => {
      dragActive.value = false;
      runOnJS(onRelease)();
    });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success) runOnJS(onPress)();
  });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => {
    // Preview follows the same cadence the drop will use.
    const snapPx = (snapMinutes / 60) * HOUR_HEIGHT;
    const snapped = Math.round(dragY.value / snapPx) * snapPx;
    return {
      transform: [{ translateY: dragActive.value ? snapped : dragY.value }],
      zIndex: dragActive.value ? 10 : 1,
      // iOS lifts via shadowOpacity; Android stacks siblings by elevation, so
      // both have to move or the dragged block renders under its neighbours.
      shadowOpacity: dragActive.value ? 0.25 : 0,
      // At rest the card is flat: Android paints `elevation` as a grey halo on
      // every side, which reads as grime around the block rather than depth.
      elevation: dragActive.value ? 12 : 0,
      opacity: dragActive.value ? 0.92 : 1,
    };
  });

  const laneWidth = 100 / block.lanes;

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
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
          animatedStyle,
        ]}
      >
        <View style={styles.blockHeader}>
          <Text
            style={[typography.caption as TextStyle, { color: colors.text, fontFamily: fonts.bodyBold, flex: 1 }]}
            numberOfLines={1}
          >
            {[appointment.client_first_name, appointment.client_last_name].filter(Boolean).join(' ') ||
              employeeName(appointment) ||
              '—'}
          </Text>
          <MaterialIcons name={icon.name} size={13} color={icon.color} />
        </View>
        {block.height > 40 ? (
          <Text style={[typography.caption as TextStyle, { color: colors.text }]} numberOfLines={1}>
            {[appointment.service?.name ?? appointment.service_name, toHm(appointment.start_time)]
              .filter(Boolean)
              .join(' - ')}
          </Text>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  // One row per booking slot; the bottom edge is the slot divider.
  // Every row is the shaded default; a bookable one is punched out in white, so
  // open time reads as a gap rather than as another tint on a tinted surface.
  // Plain rows; the slot divider is the only thing they draw at rest.
  segment: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: palette.surfaceContainerLowest,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.slate200,
  },
  // The vacated slot: a quiet dashed outline in the employee's colour.
  dragOrigin: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    opacity: 0.35,
  },
  // The web's drop preview: a dashed sky outline over a light fill, sitting
  // exactly where the card would land once snapped.
  dropPreview: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(14, 165, 233, 0.85)',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  // Web's busy/invalid region: one rounded red band per run of blocked slots.
  blockedBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.55)',
    backgroundColor: 'rgba(248, 113, 113, 0.20)',
  },
  // The web's axis strip: tinted, divided from the grid, one quiet label weight.
  axis: {
    width: AXIS_WIDTH,
    backgroundColor: palette.slate50,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: palette.slate100,
  },
  axisLabel: { position: 'absolute', right: 6, color: palette.outline },
  blockHeader: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  block: {
    position: 'absolute',
    borderRadius: radius.lg,
    borderLeftWidth: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    // iOS-only until the drag raises shadowOpacity; Android uses the animated
    // elevation above and stays flat at rest.
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
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
    alignItems: 'center',
    paddingTop: 48,
  },
});
