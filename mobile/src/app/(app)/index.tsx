import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useAdminDashboard, useEmployeeDashboard } from '@/api/queries';
import type { Appointment } from '@/api/types';
import { useAuth } from '@/auth/store';
import { AppointmentCard } from '@/components/AppointmentCard';
import { DateBar } from '@/components/DateBar';
import { Screen } from '@/components/Screen';
import { EmptyState, ErrorView, LoadingView, MetricCard } from '@/components/ui';
import { AppointmentSheet } from '@/features/appointments/AppointmentSheet';
import { useT } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function DashboardScreen() {
  const me = useAuth((s) => s.me);
  const isAdminArea = me?.features.admin_panel ?? false;

  return isAdminArea ? <AdminDashboard /> : <EmployeeDashboard />;
}

function EmployeeDashboard() {
  const { t, locale } = useT();
  const me = useAuth((s) => s.me);
  const zone = me?.business?.timezone ?? 'UTC';
  const currency = me?.business?.currency_symbol;

  const [date, setDate] = useState(() => DateTime.now().setZone(zone).toISODate() ?? '');
  const [selected, setSelected] = useState<Appointment | null>(null);

  const query = useEmployeeDashboard({ date_from: date, date_to: date });

  if (query.isLoading) return <LoadingView />;
  if (query.isError) {
    return (
      <Screen title={t('mobile.dashboard.today')}>
        <ErrorView
          message={t('mobile.common.error')}
          onRetry={() => void query.refetch()}
          retryLabel={t('mobile.common.retry')}
        />
      </Screen>
    );
  }

  const data = query.data!;

  return (
    <Screen title={t('mobile.dashboard.today')}>
      <View style={{ gap: spacing.md, flex: 1 }}>
        <DateBar date={date} zone={zone} unit="day" locale={locale} onChange={setDate} />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <MetricCard label={t('mobile.dashboard.appointments')} value={data.appointments_count} />
          <MetricCard
            label={t('mobile.dashboard.confirmed')}
            value={data.confirmed_appointments}
          />
          <MetricCard
            label={t('mobile.dashboard.revenue')}
            value={`${data.daily_revenue}${currency ? ` ${currency}` : ''}`}
          />
        </View>

        <FlatList
          data={data.appointments}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppointmentCard appointment={item} currencySymbol={currency} onPress={() => setSelected(item)} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={<EmptyState title={t('mobile.dashboard.empty')} />}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {selected ? (
        <AppointmentSheet appointment={selected} area="employee" zone={zone} onClose={() => setSelected(null)} />
      ) : null}
    </Screen>
  );
}

function AdminDashboard() {
  const { t } = useT();
  const me = useAuth((s) => s.me);
  const currency = me?.business?.currency_symbol;

  const query = useAdminDashboard();

  if (query.isLoading) return <LoadingView />;
  if (query.isError) {
    return (
      <Screen title={me?.business?.name ?? ''}>
        <ErrorView
          message={t('mobile.common.error')}
          onRetry={() => void query.refetch()}
          retryLabel={t('mobile.common.retry')}
        />
      </Screen>
    );
  }

  const data = query.data as {
    active_employees?: number;
    active_services?: number;
    upcoming_appointments?: number;
    total_revenue?: number | string;
    recent_appointments?: {
      id: number;
      client_name: string;
      service_name: string;
      service_price: number | string | null;
      employee_name: string | null;
      date: string;
      start_time: string;
      end_time: string;
      status: Appointment['status'];
    }[];
  };

  // Normalize the admin dashboard rows into the shared Appointment card shape.
  const list: Appointment[] = (data.recent_appointments ?? []).map((row) => ({
    id: row.id,
    date: row.date,
    start_time: row.start_time,
    end_time: row.end_time,
    status: row.status,
    service_id: null,
    service_name: row.service_name,
    employee_id: null,
    employee_name: row.employee_name,
    client_first_name: row.client_name,
    client_last_name: '',
    price: row.service_price,
  }));

  return (
    <Screen title={me?.business?.name ?? t('mobile.tabs.dashboard')}>
      <View style={{ gap: spacing.md, flex: 1 }}>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <MetricCard label={t('mobile.dashboard.appointments')} value={data.upcoming_appointments ?? 0} />
          <MetricCard
            label={t('mobile.manage.employees')}
            value={data.active_employees ?? 0}
          />
          <MetricCard
            label={t('mobile.dashboard.revenue')}
            value={`${data.total_revenue ?? 0}${currency ? ` ${currency}` : ''}`}
          />
        </View>

        <FlatList
          data={list}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <AppointmentCard
              appointment={item}
              currencySymbol={currency}
              showEmployee
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
          ListEmptyComponent={<EmptyState title={t('mobile.dashboard.empty')} />}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
          contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

    </Screen>
  );
}
