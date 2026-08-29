import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { SHEET_SLIDE_MS, SheetBackdrop } from '@/components/SheetBackdrop';
import { ApiError, api } from '@/api/client';
import {
  fetchAdminSlots,
  useAdminCreateData,
  useDeleteAppointment,
  useEditAppointment,
  useEmployeeCreateData,
  useUpdateStatus,
} from '@/api/queries';
import type { Appointment, AppointmentStatus } from '@/api/types';
import { useAuth } from '@/auth/store';
import { clientName, employeeName, serviceName } from '@/components/AppointmentCard';
import { ToastHost, useToast } from '@/components/Toast';
import { Button, Segmented, StatusPill, TextField } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, radius, spacing, typography } from '@/theme/tokens';
import { toIsoDate, toHm } from '@/utils/datetime';

const STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'cancelled'];

interface EditForm {
  employee_id: number | null;
  service_id: number | null;
  status: AppointmentStatus;
  date: string;
  start_time: string;
  client_first_name: string;
  client_last_name: string;
  client_phone: string;
  client_email: string;
  client_notes: string;
}

/**
 * Bottom-sheet modal for one appointment: details, quick status actions, and a
 * full edit form. The editable field set mirrors the web exactly — an admin may
 * change everything (`Admin\UpdateAppointmentRequest`), while an employee gets
 * status, date and time, plus the service when the business allows it
 * (`Employee\UpdateEmployeeAppointmentRequest`).
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
  const me = useAuth((s) => s.me);
  const updateStatus = useUpdateStatus(area);
  const edit = useEditAppointment(area);
  const deleteAppointment = useDeleteAppointment();
  const { showError } = useToast();

  const isAdmin = area === 'admin';
  const canEditService = isAdmin || (me?.business?.allow_employee_service_edit ?? true);

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  // The admin form is long; split it the way the create flow reads — what is
  // being booked, then who it is for. Employees only get the first half.
  const [editTab, setEditTab] = useState<'booking' | 'client'>('booking');
  const [form, setForm] = useState<EditForm | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Pickers only need their lists once the form is open.
  const adminLists = useAdminCreateData(isAdmin && mode === 'edit');
  const employeeLists = useEmployeeCreateData(!isAdmin && mode === 'edit');
  const lists = isAdmin ? adminLists.data : employeeLists.data;

  const services = lists?.services ?? [];
  const employees = lists?.employees ?? [];

  useEffect(() => {
    setMode('view');
    setEditTab('booking');
    setForm(null);
    setSlots(null);
    setFieldErrors({});
  }, [appointment?.id]);

  const openEdit = () => {
    if (!appointment) return;
    setFieldErrors({});
    setEditTab('booking');
    setForm({
      employee_id: appointment.employee_id,
      service_id: appointment.service_id,
      status: appointment.status,
      date: toIsoDate(appointment.date),
      start_time: toHm(appointment.start_time),
      client_first_name: appointment.client_first_name ?? '',
      client_last_name: appointment.client_last_name ?? '',
      client_phone: appointment.client_phone ?? '',
      client_email: appointment.client_email ?? '',
      client_notes: appointment.client_notes ?? '',
    });
    setMode('edit');
  };

  // Free times depend on who, what and when — reload whenever any of those move.
  const slotKey = form ? `${form.employee_id}|${form.service_id}|${form.date}` : '';
  useEffect(() => {
    if (mode !== 'edit' || !appointment || !form) return;
    let cancelled = false;
    setSlotsLoading(true);
    (async () => {
      try {
        const response = isAdmin
          ? await fetchAdminSlots({
              employee_id: form.employee_id ?? 0,
              service_id: form.service_id ?? 0,
              date: form.date,
              exclude_id: appointment.id,
            })
          : await api<{ slots: string[] }>(`/employee/appointments/${appointment.id}/slots`, {
              query: { date: form.date, service_id: form.service_id ?? undefined },
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
  }, [mode, slotKey, appointment?.id, isAdmin]);

  // An employee only offers the services they are assigned to.
  const selectableServices = useMemo(() => {
    if (!isAdmin || !form?.employee_id) return services;
    const employee = employees.find((e) => e.id === form.employee_id);
    const offered = employee?.services?.map((s) => s.id) ?? employee?.service_ids;
    return offered ? services.filter((s) => offered.includes(s.id)) : services;
  }, [isAdmin, form?.employee_id, services, employees]);

  if (!appointment) return null;

  const busy = updateStatus.isPending || edit.isPending || deleteAppointment.isPending;

  const setStatus = (status: 'confirmed' | 'cancelled') => {
    updateStatus.mutate(
      { id: appointment.id, status },
      { onSuccess: onClose, onError: (e) => showError(e.message) },
    );
  };

  const submitEdit = () => {
    if (!form) return;
    setFieldErrors({});
    edit.mutate(
      {
        id: appointment.id,
        ...(isAdmin
          ? {
              employee_id: form.employee_id,
              service_id: form.service_id,
              status: form.status,
              date: form.date,
              start_time: form.start_time,
              client_first_name: form.client_first_name,
              client_last_name: form.client_last_name,
              client_phone: form.client_phone || null,
              client_email: form.client_email || null,
              client_notes: form.client_notes || null,
            }
          : {
              service_id: form.service_id,
              status: form.status,
              date: form.date,
              start_time: form.start_time,
            }),
      },
      {
        onSuccess: onClose,
        onError: (e) => {
          if (e instanceof ApiError && e.errors) setFieldErrors(e.errors);
          else showError(e.message);
        },
      },
    );
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
            { onSuccess: onClose, onError: (e) => showError(e.message) },
          ),
      },
    ]);
  };

  const shiftDate = (delta: number) => {
    if (!form) return;
    const next = DateTime.fromISO(form.date, { zone }).plus({ days: delta }).toISODate();
    if (next) setForm({ ...form, date: next });
  };

  return (
    <Modal
      visible
      transparent
      // `slide` would animate the whole window, dragging the backdrop up with
      // the sheet. Show the backdrop separately and slide only the sheet.
      animationType="none"
      onRequestClose={onClose}
      // Android 15 is edge-to-edge: without these the modal window stops short of
      // the system bars and the tab bar shows through below the sheet.
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SheetBackdrop onPress={onClose} />
      <ToastHost />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={SlideInDown.duration(SHEET_SLIDE_MS)} style={styles.sheet}>
          <View style={styles.grabber} />
          <ScrollView
            contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}
            keyboardShouldPersistTaps="handled"
          >
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

            {mode === 'view' ? (
              <>
                <View style={styles.detailRows}>
                  <DetailRow
                    label={t('mobile.sheet.date')}
                    value={DateTime.fromISO(toIsoDate(appointment.date), { zone })
                      .setLocale(locale)
                      .toFormat('cccc, d MMMM yyyy')}
                  />
                  <DetailRow
                    label={t('mobile.sheet.time')}
                    value={`${toHm(appointment.start_time)} – ${toHm(appointment.end_time)}`}
                  />
                  {employeeName(appointment) ? (
                    <DetailRow label={t('mobile.sheet.employee')} value={employeeName(appointment) as string} />
                  ) : null}
                  {appointment.client_phone ? (
                    <DetailRow label={t('mobile.sheet.phone')} value={appointment.client_phone} />
                  ) : null}
                  {appointment.client_email ? (
                    <DetailRow label={t('mobile.sheet.email')} value={appointment.client_email} />
                  ) : null}
                  {appointment.client_notes ? (
                    <DetailRow label={t('mobile.sheet.notes')} value={appointment.client_notes} />
                  ) : null}
                </View>

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
                  <Button title={t('mobile.sheet.edit')} variant="secondary" onPress={openEdit} />
                  {isAdmin && appointment.status === 'cancelled' ? (
                    <Button title={t('mobile.sheet.delete')} variant="danger" onPress={confirmDelete} loading={busy} />
                  ) : null}
                </View>
              </>
            ) : form ? (
              <View style={{ gap: spacing.lg }}>
                {isAdmin ? (
                  <Segmented
                    options={[
                      { value: 'booking' as const, label: t('mobile.sheet.tab_booking') },
                      { value: 'client' as const, label: t('mobile.sheet.tab_client') },
                    ]}
                    value={editTab}
                    onChange={setEditTab}
                  />
                ) : null}

                {editTab === 'booking' ? (
                <>
                <ChipGroup
                  label={t('mobile.sheet.status')}
                  options={STATUSES.map((s) => ({ value: s, label: t(`common.status.${s}`) }))}
                  selected={form.status}
                  onSelect={(status) => setForm({ ...form, status })}
                />

                {isAdmin && employees.length > 0 ? (
                  <ChipGroup
                    label={t('mobile.create.employee')}
                    options={employees.map((e) => ({ value: e.id, label: e.name }))}
                    selected={form.employee_id}
                    onSelect={(employee_id) => setForm({ ...form, employee_id, start_time: '' })}
                    error={fieldErrors.employee_id?.[0]}
                  />
                ) : null}

                {canEditService && selectableServices.length > 0 ? (
                  <ChipGroup
                    label={t('mobile.create.service')}
                    options={selectableServices.map((s) => ({ value: s.id, label: s.name }))}
                    selected={form.service_id}
                    onSelect={(service_id) => setForm({ ...form, service_id, start_time: '' })}
                    error={fieldErrors.service_id?.[0]}
                  />
                ) : null}

                <View style={{ gap: spacing.sm }}>
                  <Text style={styles.groupLabel}>{t('mobile.create.date')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    <Button title="‹" variant="secondary" onPress={() => shiftDate(-1)} />
                    <Text
                      style={[
                        typography.bodyStrong as TextStyle,
                        { flex: 1, textAlign: 'center', color: palette.onSurface, textTransform: 'capitalize' },
                      ]}
                    >
                      {DateTime.fromISO(form.date, { zone }).setLocale(locale).toFormat('ccc, d MMM')}
                    </Text>
                    <Button title="›" variant="secondary" onPress={() => shiftDate(1)} />
                  </View>
                </View>

                <View style={{ gap: spacing.sm }}>
                  <Text style={styles.groupLabel}>{t('mobile.create.slot')}</Text>
                  {slotsLoading ? (
                    <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>…</Text>
                  ) : slots && slots.length > 0 ? (
                    <View style={styles.chipWrap}>
                      {slots.map((slot) => (
                        <Chip
                          key={slot}
                          label={slot}
                          active={form.start_time === slot}
                          onPress={() => setForm({ ...form, start_time: slot })}
                        />
                      ))}
                    </View>
                  ) : (
                    <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                      {t('mobile.sheet.no_slots')}
                    </Text>
                  )}
                  {fieldErrors.start_time ? (
                    <Text style={styles.error}>{fieldErrors.start_time[0]}</Text>
                  ) : null}
                </View>

                </>
                ) : null}

                {isAdmin && editTab === 'client' ? (
                  <View style={{ gap: spacing.md }}>
                    <TextField
                      label={t('mobile.create.first_name')}
                      value={form.client_first_name}
                      onChangeText={(v) => setForm({ ...form, client_first_name: v })}
                      error={fieldErrors.client_first_name?.[0]}
                    />
                    <TextField
                      label={t('mobile.create.last_name')}
                      value={form.client_last_name}
                      onChangeText={(v) => setForm({ ...form, client_last_name: v })}
                      error={fieldErrors.client_last_name?.[0]}
                    />
                    <TextField
                      label={t('mobile.sheet.phone')}
                      value={form.client_phone}
                      onChangeText={(v) => setForm({ ...form, client_phone: v })}
                      keyboardType="phone-pad"
                      error={fieldErrors.client_phone?.[0]}
                    />
                    <TextField
                      label={t('mobile.sheet.email')}
                      value={form.client_email}
                      onChangeText={(v) => setForm({ ...form, client_email: v })}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      error={fieldErrors.client_email?.[0]}
                    />
                    <TextField
                      label={t('mobile.sheet.notes')}
                      value={form.client_notes}
                      onChangeText={(v) => setForm({ ...form, client_notes: v })}
                      multiline
                      style={{ minHeight: 70 }}
                      error={fieldErrors.client_notes?.[0]}
                    />
                  </View>
                ) : null}

                <View style={{ gap: spacing.sm }}>
                  <Button
                    title={t('mobile.sheet.save')}
                    onPress={submitEdit}
                    disabled={!form.start_time}
                    loading={edit.isPending}
                  />
                  <Button title={t('mobile.sheet.back')} variant="ghost" onPress={() => setMode('view')} />
                </View>
              </View>
            ) : null}
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ChipGroup<T extends string | number>({
  label,
  options,
  selected,
  onSelect,
  error,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T | null;
  onSelect: (value: T) => void;
  error?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.groupLabel}>{label}</Text>
      <View style={styles.chipWrap}>
        {options.map((option) => (
          <Chip
            key={String(option.value)}
            label={option.label}
            active={selected === option.value}
            onPress={() => onSelect(option.value)}
          />
        ))}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text
        style={[typography.labelStrong as TextStyle, { color: active ? palette.surface : palette.onSurface }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
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
  sheet: {
    backgroundColor: palette.surfaceContainerLowest,
    borderTopLeftRadius: radius['3xl'],
    borderTopRightRadius: radius['3xl'],
    padding: spacing.xl,
    maxHeight: '88%',
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
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  detailRow: { flexDirection: 'row', gap: spacing.sm },
  groupLabel: { ...(typography.overline as TextStyle), color: palette.outline },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    backgroundColor: palette.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: palette.slate200,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipActive: { backgroundColor: palette.onSurface, borderColor: palette.onSurface },
  error: { ...(typography.caption as TextStyle), color: palette.error },
});
