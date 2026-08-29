import React from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import { Card, StatusPill } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, spacing, typography } from '@/theme/tokens';
import { toIsoDate, toTimeRange } from '@/utils/datetime';
import type { Appointment } from '@/api/types';

export function clientName(a: Appointment): string {
  return [a.client_first_name, a.client_last_name].filter(Boolean).join(' ') || '—';
}

export function serviceName(a: Appointment): string {
  return a.service?.name ?? a.service_name ?? '—';
}

/**
 * Mirrors `Appointment::resolvedEmployeeName()` and the web pages: the live
 * relation first, and `employee_name` only as the snapshot it is — that column
 * is written when the employee row is deleted, so it is null for active staff.
 */
export function employeeName(a: Appointment): string | null {
  return a.employee?.name || a.employee_name || null;
}

export function AppointmentCard({
  appointment,
  onPress,
  showEmployee,
  currencySymbol,
}: {
  appointment: Appointment;
  onPress?: () => void;
  showEmployee?: boolean;
  currencySymbol?: string | null;
}) {
  const { t } = useT();

  return (
    <Card style={styles.card}>
      <View style={styles.header} onTouchEnd={onPress}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurface }]} numberOfLines={1}>
            {clientName(appointment)}
          </Text>
          <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
            {serviceName(appointment)}
            {showEmployee && employeeName(appointment) ? ` · ${employeeName(appointment)}` : ''}
          </Text>
        </View>
        <StatusPill
          status={appointment.status}
          label={t(`common.status.${appointment.status}`)}
        />
      </View>
      <View style={styles.footer}>
        <Text style={[typography.label as TextStyle, { color: palette.onSurface }]}>
          {toIsoDate(appointment.date)} · {toTimeRange(appointment.start_time, appointment.end_time)}
        </Text>
        {appointment.price != null && appointment.price !== '' ? (
          <Text style={[typography.numeric as TextStyle, { color: palette.onSurface }]}>
            {String(appointment.price)}
            {currencySymbol ? ` ${currencySymbol}` : ''}
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.outlineVariant,
    paddingTop: spacing.sm,
  },
});
