import type { Appointment } from '@/api/types';

// The web grid gives an hour 130px; matching it is what stops blocks from
// looking squeezed and lets a slot label breathe.
export const HOUR_HEIGHT = 120;
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

/* ------------------------------ slot segments ------------------------------ */

/** Same clamp the web grid applies to `businesses.slot_duration`. */
export const DEFAULT_SLOT_MINUTES = 30;

export function clampSlotMinutes(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_SLOT_MINUTES;
  return Math.min(120, Math.max(5, Math.round(n)));
}

export interface Segment {
  startMin: number;
  endMin: number;
}

/**
 * Split the visible day into `slotMinutes` rows, mirroring `buildTimeSegments`
 * in the web's CalendarWeekGrid. Rows carry no availability of their own — a
 * slot is only free *relative to* the appointment being dragged, and the server
 * decides that (service length, working hours, breaks, shared resources), so
 * the drag layer colours them from the slots API instead.
 */
export function buildSegments(rangeStart: string, rangeEnd: string, slotMinutes: number): Segment[] {
  const startMin = timeToMinutes(rangeStart);
  const endMin = timeToMinutes(rangeEnd);
  const step = clampSlotMinutes(slotMinutes);

  const segments: Segment[] = [];
  for (let t = startMin; t < endMin; t += step) {
    segments.push({ startMin: t, endMin: Math.min(t + step, endMin) });
  }
  return segments;
}

/**
 * Web parity (`dragSnapMinutes`): snap to the finer cadence between the grid
 * step and the service length, which is how the backend steps slots too.
 */
export function dragSnapMinutes(slotMinutes: number, serviceDurationMinutes: number): number {
  const grid = clampSlotMinutes(slotMinutes);
  if (!Number.isFinite(serviceDurationMinutes) || serviceDurationMinutes < 1) return grid;
  return Math.min(grid, clampSlotMinutes(serviceDurationMinutes));
}

/**
 * Web parity (`snapPreviewToNearestAllowedSlot`): a drop lands on the nearest
 * start the server allows, so an invalid target pulls to a valid one instead of
 * being submitted and rejected. Returns null when nothing is allowed that day.
 */
export function snapToNearestAllowed(targetMin: number, allowed: Set<string>): number | null {
  let nearest: number | null = null;
  let best = Infinity;
  for (const time of allowed) {
    const m = timeToMinutes(time);
    const dist = Math.abs(m - targetMin);
    if (dist < best) {
      best = dist;
      nearest = m;
    }
  }
  return nearest;
}
