import type { AppointmentStatus } from '@/api/types';

/**
 * Status marker for a calendar block. Mirrors the web's `statusIconName` /
 * `statusIconClassName` in `Components/Calendar/CalendarWeekGrid.jsx`: on the
 * calendar the block colour encodes the *employee*, so status is carried by
 * this corner icon — every status gets one, not just pending.
 */
export const STATUS_ICON: Record<AppointmentStatus, { name: 'check' | 'close' | 'schedule'; color: string }> = {
  confirmed: { name: 'check', color: '#16a34a' }, // text-green-600
  cancelled: { name: 'close', color: '#dc2626' }, // text-red-600
  pending: { name: 'schedule', color: '#64748b' }, // text-slate-500
};

export function statusIcon(status: AppointmentStatus) {
  return STATUS_ICON[status] ?? STATUS_ICON.pending;
}
