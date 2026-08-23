import type { Appointment } from '@/api/types';

export const HOUR_HEIGHT = 64;
export const SNAP_MINUTES = 15;

export function timeToMinutes(time: string | null | undefined): number {
  if (!time) return 0;
  const [h, m] = time.split(':').map((v) => parseInt(v, 10));
  return (h || 0) * 60 + (m || 0);
}

/**
 * The API returns break intervals as {start, end} (ScheduleService), while the
 * schedule editor uses {start_time, end_time}. Accept either.
 */
export interface BreakInterval {
  start?: string;
  end?: string;
  start_time?: string;
  end_time?: string;
}

export function breakBounds(b: BreakInterval): { start: string; end: string } {
  return { start: b.start ?? b.start_time ?? '00:00', end: b.end ?? b.end_time ?? '00:00' };
}

export function minutesToTime(minutes: number): string {
  const clamped = Math.max(0, Math.min(24 * 60 - SNAP_MINUTES, minutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export interface PositionedAppointment {
  appointment: Appointment;
  top: number;
  height: number;
  /** column-splitting for overlapping appointments */
  lane: number;
  lanes: number;
}

/**
 * Compute vertical position + overlap lanes for a day's appointments.
 * `dayStartMinutes` anchors the top of the visible grid.
 */
export function layoutDay(appointments: Appointment[], dayStartMinutes: number): PositionedAppointment[] {
  const sorted = [...appointments].sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time) || a.id - b.id,
  );

  interface Working extends PositionedAppointment {
    startMin: number;
    endMin: number;
  }

  const placed: Working[] = [];

  for (const appointment of sorted) {
    const startMin = timeToMinutes(appointment.start_time);
    const endMin = Math.max(startMin + SNAP_MINUTES, timeToMinutes(appointment.end_time));

    const overlapping = placed.filter((p) => p.startMin < endMin && p.endMin > startMin);
    const usedLanes = new Set(overlapping.map((p) => p.lane));
    let lane = 0;
    while (usedLanes.has(lane)) lane += 1;

    placed.push({
      appointment,
      startMin,
      endMin,
      top: ((startMin - dayStartMinutes) / 60) * HOUR_HEIGHT,
      height: Math.max(28, ((endMin - startMin) / 60) * HOUR_HEIGHT),
      lane,
      lanes: 1,
    });
  }

  // Second pass: each block's lane count = max concurrent lanes in its overlap cluster.
  for (const block of placed) {
    const cluster = placed.filter((p) => p.startMin < block.endMin && p.endMin > block.startMin);
    const laneCount = Math.max(...cluster.map((p) => p.lane)) + 1;
    for (const member of cluster) {
      member.lanes = Math.max(member.lanes, laneCount);
    }
  }

  return placed;
}

export function hoursRange(start: string, end: string): number[] {
  const startHour = Math.floor(timeToMinutes(start) / 60);
  const endHour = Math.ceil(timeToMinutes(end) / 60);
  const hours: number[] = [];
  for (let h = startHour; h <= endHour; h += 1) hours.push(h);
  return hours;
}
