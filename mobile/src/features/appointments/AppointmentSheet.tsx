import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';
import { api } from '@/api/client';
import { useDeleteAppointment, useRescheduleOwn, useUpdateStatus, fetchAdminSlots } from '@/api/queries';
import type { Appointment } from '@/api/types';
import { clientName, serviceName } from '@/components/AppointmentCard';
import { Button, StatusPill } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, radius, spacing, typography } from '@/theme/tokens';

/**
 * Bottom-sheet style modal with the appointment's details and the actions the
 * current area allows: status changes, reschedule (slot picker), delete.
 */
export function AppointmentSheet({
  appointment,
  area,
  zone,
  onClose,
}: {
  appointment: Appointment | null;
  area: 'employee' | 'admin';
  zone: string;
  onClose: () => void;
}) {
  const { t, locale } = useT();
  const updateStatus = useUpdateStatus(area);
  const reschedule = useRescheduleOwn();
  const deleteAppointment = useDeleteAppointment();

  const [mode, setMode] = useState<'view' | 'reschedule'>('view');
  const [slotDate, setSlotDate] = useState<string>('');
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setMode('view');
      setSlotDate(appointment.date.slice(0, 10));
      setSlots(null);
    }
  }, [appointment?.id]);

  useEffect(() => {
    if (mode !== 'reschedule' || !appointment) return;
    let cancelled = false;
    setSlotsLoading(true);
    (async () => {
      try {
        const response =
          area === 'employee'
            ? await api<{ slots: string[] }>(`/employee/appointments/${appointment.id}/slots`, {
                query: { date: slotDate },
              })
            : await fetchAdminSlots({
                employee_id: appointment.employee_id ?? 0,
                service_id: appointment.service_id ?? 0,
                date: slotDate,
                exclude_id: appointment.id,
              });
        if (!cancelled) setSlots(response.slots);
      } catch {
        if (!cancelled) setSlots([]);
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode, slotDate, appointment?.id]);

  if (!appointment) return null;

  const busy = updateStatus.isPending || reschedule.isPending || deleteAppointment.isPending;

  const setStatus = (status: 'confirmed' | 'cancelled') => {
    updateStatus.mutate(
      { id: appointment.id, status },
      { onSuccess: onClose, onError: (e) => Alert.alert(t('mobile.sheet.error'), e.message) },
    );
  };

  const doReschedule = (time: string) => {
    if (area === 'employee') {
      reschedule.mutate(
        { id: appointment.id, date: slotDate, start_time: time },
        { onSuccess: onClose, onError: (e) => Alert.alert(t('mobile.sheet.error'), e.message) },
      );
    } else {
      // Admin uses the full-edit endpoint with same service/employee, new time.
      void api(`/admin/appointments/${appointment.id}`, {
        method: 'PUT',
        body: {
          employee_id: appointment.employee_id,
          service_id: appointment.service_id,
          status: appointment.status,
          date: slotDate,
          start_time: time,
        },
      })
        .then(onClose)
        .catch((e: Error) => Alert.alert(t('mobile.sheet.error'), e.message));
    }
  };

  const confirmDelete = () => {
    Alert.alert(t('mobile.common.confirm'), t('mobile.sheet.delete_confirm'), [
      { text: t('mobile.common.cancel'), style: 'cancel' },
      {
        text: t('mobile.sheet.delete'),
        style: 'destructive',
        onPress: () =>
          deleteAppointment.mutate(
            { id: appointment.id },
            { onSuccess: onClose, onError: (e) => Alert.alert(t('mobile.sheet.error'), e.message) },
          ),
      },
    ]);
  };

  const shiftSlotDate = (delta: number) => {
    const next = DateTime.fromISO(slotDate, { zone }).plus({ days: delta }).toISODate();
    if (next) setSlotDate(next);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.grabber} />
        <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={[typography.headline as TextStyle, { color: palette.onSurface }]}>
                {clientName(appointment)}
              </Text>
              <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                {serviceName(appointment)}
              </Text>
            </View>
            <StatusPill status={appointment.status} label={t(`common.status.${appointment.status}`)} />
          </View>

          <View style={styles.detailRows}>
            <DetailRow
              label={t('mobile.sheet.date')}
              value={DateTime.fromISO(appointment.date.slice(0, 10), { zone })
                .setLocale(locale)
                .toFormat('cccc, d MMMM yyyy')}
            />
            <DetailRow label={t('mobile.sheet.time')} value={`${appointment.start_time} – ${appointment.end_time}`} />
            {appointment.employee_name ? (
              <DetailRow label={t('mobile.sheet.employee')} value={appointment.employee_name} />
            ) : null}
            {appointment.client_phone ? <DetailRow label={t('mobile.sheet.phone')} value={appointment.client_phone} /> : null}
            {appointment.client_email ? <DetailRow label={t('mobile.sheet.email')} value={appointment.client_email} /> : null}
            {appointment.client_notes ? <DetailRow label={t('mobile.sheet.notes')} value={appointment.client_notes} /> : null}
          </View>

          {mode === 'view' ? (
            <View style={{ gap: spacing.sm }}>
              {appointment.status !== 'confirmed' ? (
                <Button title={t('mobile.sheet.confirm')} onPress={() => setStatus('confirmed')} loading={busy} />
              ) : null}
              {appointment.status !== 'cancelled' ? (
                <Button
                  title={t('mobile.sheet.cancel_appointment')}
                  variant="danger"
                  onPress={() => setStatus('cancelled')}
                  loading={busy}
                />
              ) : null}
              {appointment.status !== 'cancelled' ? (
                <Button
                  title={t('mobile.sheet.reschedule')}
                  variant="secondary"
                  onPress={() => setMode('reschedule')}
                />
              ) : null}
              {area === 'admin' && appointment.status === 'cancelled' ? (
                <Button title={t('mobile.sheet.delete')} variant="danger" onPress={confirmDelete} loading={busy} />
              ) : null}
            </View>
          ) : (
            <View style={{ gap: spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                <Button title="‹" variant="secondary" onPress={() => shiftSlotDate(-1)} />
                <Text style={[typography.bodyStrong as TextStyle, { flex: 1, textAlign: 'center', color: palette.onSurface }]}>
                  {DateTime.fromISO(slotDate, { zone }).setLocale(locale).toFormat('ccc, d MMM')}
                </Text>
                <Button title="›" variant="secondary" onPress={() => shiftSlotDate(1)} />
              </View>

              {slotsLoading ? (
                <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>…</Text>
              ) : slots && slots.length > 0 ? (
                <View style={styles.slotGrid}>
                  {slots.map((slot) => (
                    <Pressable key={slot} style={styles.slot} onPress={() => doReschedule(slot)}>
                      <Text style={[typography.label as TextStyle, { color: palette.onSecondaryContainer }]}>
                        {slot}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : (
                <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                  {t('mobile.sheet.no_slots')}
                </Text>
              )}

              <Button title={t('mobile.sheet.back')} variant="ghost" onPress={() => setMode('view')} />
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant, width: 90 }]}>{label}</Text>
      <Text style={[typography.body as TextStyle, { color: palette.onSurface, flex: 1 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: palette.surfaceContainerLowest,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    padding: spacing.xl,
    maxHeight: '85%',
  },
  grabber: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: palette.outlineVariant,
    marginBottom: spacing.md,
  },
  detailRows: {
    gap: spacing.sm,
    backgroundColor: palette.surfaceContainerLow,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  detailRow: { flexDirection: 'row', gap: spacing.sm },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  slot: {
    backgroundColor: palette.secondaryContainer,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
