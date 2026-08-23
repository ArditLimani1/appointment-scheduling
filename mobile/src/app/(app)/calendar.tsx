import { DateTime } from 'luxon';
import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Pressable, StyleSheet, Text, View, useWindowDimensions, type TextStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminCalendar, useEmployeeCalendar, useRescheduleOwn } from '@/api/queries';
import type { Appointment, EmployeeSummary } from '@/api/types';
import { useAuth } from '@/auth/store';
import { DateBar } from '@/components/DateBar';
import { Screen } from '@/components/Screen';
import { Button, ErrorView, LoadingView, Segmented } from '@/components/ui';
import { AppointmentSheet } from '@/features/appointments/AppointmentSheet';
import { DayTimeline } from '@/features/calendar/DayTimeline';
import { WeekGrid } from '@/features/calendar/WeekGrid';
import type { BreakInterval } from '@/features/calendar/layout';
import { useT } from '@/i18n';
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

  const data = query.data;

  const appointments = useMemo(() => {
    const raw = data?.appointments;
    if (!raw) return [] as Appointment[];
    return Array.isArray(raw) ? raw : Object.values(raw).flat();
  }, [data?.appointments]);

  const dayAppointments = useMemo(
    () => appointments.filter((a) => a.date.slice(0, 10) === date),
    [appointments, date],
  );

  const hours = (data?.calendar_hours as { start: string; end: string } | undefined) ?? DEFAULT_HOURS;
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

  const onMove = !isAdminArea
    ? (appointment: Appointment, newTime: string) => {
        Alert.alert(
          t('mobile.calendar.move_confirm_title'),
          t('mobile.calendar.move_confirm', {
            client: [appointment.client_first_name, appointment.client_last_name].filter(Boolean).join(' '),
            time: newTime,
          }),
          [
            { text: t('mobile.common.cancel'), style: 'cancel' },
            {
              text: t('mobile.common.confirm'),
              onPress: () =>
                reschedule.mutate(
                  { id: appointment.id, date: appointment.date.slice(0, 10), start_time: newTime },
                  { onError: (e) => Alert.alert(t('mobile.common.error'), e.message) },
                ),
            },
          ],
        );
      }
    : undefined;

  const employees = (data?.employees ?? []) as EmployeeSummary[];

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
            onMoveAppointment={onMove}
            canMove={(a) => a.status !== 'cancelled'}
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

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text
        style={[
          typography.label as TextStyle,
          { color: active ? palette.onPrimary : palette.onSurfaceVariant },
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
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: palette.surfaceContainer,
  },
  chipActive: { backgroundColor: palette.primary },
});
