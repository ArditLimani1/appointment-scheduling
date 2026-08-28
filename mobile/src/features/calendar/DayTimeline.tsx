import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { palette, radius, statusColors, typography } from '@/theme/tokens';
import type { Appointment } from '@/api/types';
import type { BreakInterval } from './layout';
import {
  HOUR_HEIGHT,
  SNAP_MINUTES,
  breakBounds,
  hoursRange,
  layoutDay,
  minutesToTime,
  snapMinutes,
  timeToMinutes,
} from './layout';

const AXIS_WIDTH = 48;

interface Props {
  appointments: Appointment[];
  hours: { start: string; end: string };
  breaks?: BreakInterval[];
  isDayOff?: boolean;
  dayOffLabel?: string;
  onPressAppointment: (appointment: Appointment) => void;
  /** When provided, blocks can be long-pressed and dragged to a new start time. */
  onMoveAppointment?: (appointment: Appointment, newStartTime: string) => void;
  canMove?: (appointment: Appointment) => boolean;
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
}: Props) {
  const dayStart = timeToMinutes(hours.start);
  const hourMarks = hoursRange(hours.start, hours.end);
  const contentHeight = (hourMarks.length - 1) * HOUR_HEIGHT + 24;

  const blocks = useMemo(() => layoutDay(appointments, dayStart), [appointments, dayStart]);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
      <View style={{ height: contentHeight, flexDirection: 'row' }}>
        {/* hour axis */}
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

        {/* grid */}
        <View style={{ flex: 1 }}>
          {hourMarks.map((h, i) => (
            <View key={h} style={[styles.gridLine, { top: i * HOUR_HEIGHT }]} />
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

          {blocks.map((block) => (
            <DraggableBlock
              key={block.appointment.id}
              block={block}
              draggable={Boolean(onMoveAppointment) && (canMove?.(block.appointment) ?? true)}
              dayStart={dayStart}
              onPress={() => onPressAppointment(block.appointment)}
              onDrop={(minutesDelta) => {
                const startMin = timeToMinutes(block.appointment.start_time);
                const next = snapMinutes(startMin + minutesDelta);
                if (next !== startMin) {
                  onMoveAppointment?.(block.appointment, minutesToTime(next));
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
  draggable,
  dayStart,
  onPress,
  onDrop,
}: {
  block: ReturnType<typeof layoutDay>[number];
  draggable: boolean;
  dayStart: number;
  onPress: () => void;
  onDrop: (minutesDelta: number) => void;
}) {
  const translateY = useSharedValue(0);
  const dragging = useSharedValue(false);

  const appointment = block.appointment;
  const colors = statusColors[appointment.status] ?? statusColors.pending;

  const pan = Gesture.Pan()
    .enabled(draggable)
    .activateAfterLongPress(350)
    .onStart(() => {
      dragging.value = true;
    })
    .onUpdate((event) => {
      translateY.value = event.translationY;
    })
    .onEnd((event) => {
      const minutesDelta = (event.translationY / HOUR_HEIGHT) * 60;
      dragging.value = false;
      translateY.value = withTiming(0, { duration: 120 });
      runOnJS(onDrop)(minutesDelta);
    })
    .onFinalize(() => {
      dragging.value = false;
    });

  const tap = Gesture.Tap().onEnd((_e, success) => {
    if (success) runOnJS(onPress)();
  });

  const gesture = Gesture.Exclusive(pan, tap);

  const animatedStyle = useAnimatedStyle(() => {
    // Snap the visual position to 15-minute increments while dragging.
    const snapPx = (SNAP_MINUTES / 60) * HOUR_HEIGHT;
    const snapped = Math.round(translateY.value / snapPx) * snapPx;
    return {
      transform: [{ translateY: dragging.value ? snapped : translateY.value }],
      zIndex: dragging.value ? 10 : 1,
      // iOS lifts via shadowOpacity; Android stacks siblings by elevation, so
      // both have to move or the dragged block renders under its neighbours.
      shadowOpacity: dragging.value ? 0.25 : 0,
      elevation: dragging.value ? 12 : 2,
      opacity: dragging.value ? 0.92 : 1,
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
            borderLeftColor: colors.dot,
          },
          animatedStyle,
        ]}
      >
        <Text style={[typography.caption as TextStyle, { color: colors.fg, fontWeight: '700' }]} numberOfLines={1}>
          {appointment.start_time} {[appointment.client_first_name, appointment.client_last_name].filter(Boolean).join(' ')}
        </Text>
        {block.height > 40 ? (
          <Text style={[typography.caption as TextStyle, { color: colors.fg }]} numberOfLines={1}>
            {appointment.service?.name ?? appointment.service_name ?? ''}
          </Text>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: palette.outlineVariant,
  },
  block: {
    position: 'absolute',
    borderRadius: radius.md,
    borderLeftWidth: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 2,
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
