import { DateTime } from 'luxon';
import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Pressable, StyleSheet, Text, View, useWindowDimensions, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { fetchAdminSlots, useAdminCalendar, useEditAppointment, useEmployeeCalendar, useRescheduleOwn } from '@/api/queries';
import { api } from '@/api/client';
import type { Appointment, EmployeeSummary } from '@/api/types';
import { useAuth } from '@/auth/store';
import { DateBar } from '@/components/DateBar';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Button, ErrorView, LoadingView, Segmented } from '@/components/ui';
import { AppointmentSheet } from '@/features/appointments/AppointmentSheet';
import { DayTimeline } from '@/features/calendar/DayTimeline';
import { WeekGrid } from '@/features/calendar/WeekGrid';
import { buildEmployeeColorMap, getEmployeeSlotStyles } from '@/features/calendar/employeeColors';
import type { BreakInterval } from '@/features/calendar/layout';
import { useT } from '@/i18n';
import { toIsoDate } from '@/utils/datetime';
import { palette, radius, spacing, typography } from '@/theme/tokens';

const DEFAULT_HOURS = { start: '08:00', end: '20:00' };

export default function CalendarScreen() {
  const { t, locale } = useT();
  const router = useRouter();
  const me = useAuth((s) => s.me);
  const { width } = useWindowDimensions();

  const isAdminArea = me?.features.admin_panel ?? false;
  const zone = me?.business?.timezone ?? 'UTC';
  const wide = width >= 700; // iPad / landscape gets the week grid

  const [view, setView] = useState<'day' | 'week'>(wide ? 'week' : 'day');
  const [date, setDate] = useState(() => DateTime.now().setZone(zone).toISODate() ?? '');
  const [employeeFilter, setEmployeeFilter] = useState<number | undefined>(undefined);
  const [selected, setSelected] = useState<Appointment | null>(null);

  // Only the query for the current area runs; the other stays idle.
  const employeeQuery = useEmployeeCalendar(view, date, !isAdminArea);
  const adminQuery = useAdminCalendar(view, date, employeeFilter, isAdminArea);
  const query = isAdminArea ? adminQuery : employeeQuery;
  const reschedule = useRescheduleOwn();
  const editAppointment = useEditAppointment('admin');
  const { showError } = useToast();

  const data = query.data;

  const appointments = useMemo(() => {
    const raw = data?.appointments;
    if (!raw) return [] as Appointment[];
    return Array.isArray(raw) ? raw : Object.values(raw).flat();
  }, [data?.appointments]);

  const dayAppointments = useMemo(
    () => appointments.filter((a) => toIsoDate(a.date) === date),
    [appointments, date],
  );

  const hours = (data?.calendar_hours as { start: string; end: string } | undefined) ?? DEFAULT_HOURS;
  // `getCalendarView` already clamps this server-side; the grid rows follow it.
  const slotMinutes = (data?.slot_duration as number | undefined) ?? 30;

  // Drop targets are per-appointment, so the allowed starts come from the same
  // slots API the web drag uses — the server knows about service length,
  // working hours, breaks and shared resources; we must not guess locally.
  const [dragging, setDragging] = useState<Appointment | null>(null);
  const [allowedStarts, setAllowedStarts] = useState<Set<string> | null>(null);

  useEffect(() => {
    if (!dragging) {
      setAllowedStarts(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const response = isAdminArea
          ? await fetchAdminSlots({
              employee_id: dragging.employee_id ?? 0,
              service_id: dragging.service_id ?? 0,
              date,
              exclude_id: dragging.id,
            })
          : await api<{ slots: string[] }>(`/employee/appointments/${dragging.id}/slots`, {
              query: { date },
            });
        if (!cancelled) setAllowedStarts(new Set(response.slots));
      } catch {
        // Leaving it null keeps every row plain rather than colouring a guess.
        if (!cancelled) setAllowedStarts(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dragging?.id, date, isAdminArea]);
  const columnDates = (data?.column_dates as string[] | undefined) ?? [date];

  const employeeBreaks = !isAdminArea
    ? (data?.calendar_day_breaks as Record<string, BreakInterval[]> | undefined)
    : undefined;
  const dayOffs = !isAdminArea ? ((data?.calendar_day_offs as string[] | undefined) ?? []) : [];

  const adminEmployeeBreaks =
    isAdminArea && employeeFilter
      ? ((data?.calendar_employee_day_breaks as Record<string, Record<string, BreakInterval[]>> | undefined)?.[
          String(employeeFilter)
        ] ?? {})
      : {};
  const adminDayOffs =
    isAdminArea && employeeFilter
      ? ((data?.calendar_employee_day_offs as Record<string, string[]> | undefined)?.[String(employeeFilter)] ?? [])
      : [];

  // Both areas may drag; only the endpoint differs. An employee reschedules
  // their own appointment; an admin goes through the full-edit endpoint, which
  // is what the web calendar does for them too.
  const onMove = (appointment: Appointment, newTime: string) => {
    const day = toIsoDate(appointment.date);

    const apply = () => {
      if (isAdminArea) {
        editAppointment.mutate(
          {
            id: appointment.id,
            employee_id: appointment.employee_id,
            service_id: appointment.service_id,
            status: appointment.status,
            date: day,
            start_time: newTime,
            client_first_name: appointment.client_first_name,
            client_last_name: appointment.client_last_name,
            client_phone: appointment.client_phone || null,
            client_email: appointment.client_email || null,
            client_notes: appointment.client_notes || null,
          },
          { onError: (e) => showError(e.message) },
        );
        return;
      }

      reschedule.mutate(
        { id: appointment.id, date: day, start_time: newTime },
        { onError: (e) => showError(e.message) },
      );
    };

    Alert.alert(
      t('mobile.calendar.move_confirm_title'),
      t('mobile.calendar.move_confirm', {
        client: [appointment.client_first_name, appointment.client_last_name].filter(Boolean).join(' '),
        time: newTime,
      }),
      [
        { text: t('mobile.common.cancel'), style: 'cancel' },
        { text: t('mobile.common.confirm'), onPress: apply },
      ],
    );
  };

  const employees = (data?.employees ?? []) as EmployeeSummary[];
  // Same roster-order colour assignment as the web calendar, so a staff member
  // is the same colour in both apps.
  const employeeColors = useMemo(() => buildEmployeeColorMap(employees), [employees]);

  return (
    <Screen title={t('mobile.calendar.title')} noPadding>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Segmented
              options={[
                { value: 'day' as const, label: t('mobile.calendar.view_day') },
                { value: 'week' as const, label: t('mobile.calendar.view_week') },
              ]}
              value={view}
              onChange={setView}
            />
          </View>
          <Button title="+" onPress={() => router.push('/(app)/create')} style={{ minHeight: 40, paddingHorizontal: spacing.lg }} />
        </View>

        <DateBar date={date} zone={zone} unit={view} locale={locale} onChange={setDate} />

        {isAdminArea && employees.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
            <FilterChip
              label={t('mobile.calendar.all_employees')}
              active={employeeFilter === undefined}
              onPress={() => setEmployeeFilter(undefined)}
            />
            {employees.map((employee) => (
              <FilterChip
                key={employee.id}
                label={employee.name}
                swatch={getEmployeeSlotStyles(employeeColors, employee.id).swatch}
                active={employeeFilter === employee.id}
                onPress={() => setEmployeeFilter(employee.id)}
              />
            ))}
          </ScrollView>
        ) : null}
      </View>

      <View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
        {query.isLoading ? (
          <LoadingView />
        ) : query.isError ? (
          <ErrorView
            message={t('mobile.common.error')}
            onRetry={() => void query.refetch()}
            retryLabel={t('mobile.common.retry')}
          />
        ) : view === 'day' ? (
          <DayTimeline
            appointments={dayAppointments}
            hours={hours}
            breaks={
              isAdminArea
                ? (adminEmployeeBreaks[date] ?? (data?.calendar_day_breaks as Record<string, BreakInterval[]> | undefined)?.[date] ?? [])
                : (employeeBreaks?.[date] ?? [])
            }
            isDayOff={(isAdminArea ? adminDayOffs : dayOffs).includes(date)}
            dayOffLabel={t('mobile.calendar.day_off')}
            onPressAppointment={setSelected}
            slotMinutes={slotMinutes}
            onDragStart={setDragging}
            onDragEnd={() => setDragging(null)}
            allowedStarts={allowedStarts}
            draggingId={dragging?.id ?? null}
            onMoveAppointment={onMove}
            canMove={(a) => a.status !== 'cancelled'}
            employeeColors={employeeColors}
          />
        ) : (
          <WeekGrid
            columnDates={columnDates}
            appointments={appointments}
            hours={hours}
            zone={zone}
            locale={locale}
            dayBreaksByDate={isAdminArea ? adminEmployeeBreaks : (employeeBreaks ?? {})}
            dayOffs={isAdminArea ? adminDayOffs : dayOffs}
            employeeColors={employeeColors}
            onPressAppointment={setSelected}
            onPressDay={(day) => {
              setDate(day);
              setView('day');
            }}
          />
        )}
      </View>

      {selected ? (
        <AppointmentSheet
          appointment={selected}
          area={isAdminArea ? 'admin' : 'employee'}
          zone={zone}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </Screen>
  );
}

function FilterChip({
  label,
  active,
  swatch,
  onPress,
}: {
  label: string;
  active: boolean;
  swatch?: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      {swatch ? <View style={[styles.chipSwatch, { backgroundColor: swatch }]} /> : null}
      <Text
        style={[
          typography.label as TextStyle,
          { color: active ? palette.surface : palette.onSurfaceVariant },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: palette.slate200,
  },
  chipActive: { backgroundColor: palette.onSurface, borderColor: palette.onSurface },
  chipSwatch: {
    height: 10,
    width: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0, 0, 0, 0.15)',
  },
});
