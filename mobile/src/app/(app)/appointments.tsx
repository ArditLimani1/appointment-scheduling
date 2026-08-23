import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAdminAppointments, useEmployeeAppointments } from '@/api/queries';
import type { Appointment } from '@/api/types';
import { useAuth } from '@/auth/store';
import { AppointmentCard } from '@/components/AppointmentCard';
import { Screen } from '@/components/Screen';
import { Button, EmptyState, ErrorView, LoadingView, Segmented, TextField } from '@/components/ui';
import { AppointmentSheet } from '@/features/appointments/AppointmentSheet';
import { useT } from '@/i18n';
import { spacing } from '@/theme/tokens';

export default function AppointmentsScreen() {
  const { t } = useT();
  const router = useRouter();
  const me = useAuth((s) => s.me);

  const isAdminArea = me?.features.admin_panel ?? false;
  const zone = me?.business?.timezone ?? 'UTC';
  const currency = me?.business?.currency_symbol;

  const [scope, setScope] = useState<'upcoming' | 'all'>('upcoming');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const filters = { scope, search: search || undefined, page };
  const adminQuery = useAdminAppointments(filters);
  const employeeQuery = useEmployeeAppointments(filters);
  const query = isAdminArea ? adminQuery : employeeQuery;

  const paginator = query.data?.appointments;
  const lastPage = paginator?.last_page ?? paginator?.meta?.last_page ?? 1;

  // Accumulate pages for infinite scroll; reset when filters change.
  const [rows, setRows] = useState<Appointment[]>([]);
  useEffect(() => {
    const pageRows = paginator?.data ?? [];
    setRows((prev) => (page === 1 ? pageRows : [...prev, ...pageRows.filter((r) => !prev.some((p) => p.id === r.id))]));
  }, [paginator?.data, page]);

  return (
    <Screen
      title={t('mobile.appointments.title')}
      right={<Button title="+" onPress={() => router.push('/(app)/create')} style={{ minHeight: 40, paddingHorizontal: spacing.lg }} />}
    >
      <View style={{ gap: spacing.md, flex: 1 }}>
        <Segmented
          options={[
            { value: 'upcoming' as const, label: t('mobile.appointments.scope_upcoming') },
            { value: 'all' as const, label: t('mobile.appointments.scope_all') },
          ]}
          value={scope}
          onChange={(next) => {
            setScope(next);
            setPage(1);
          }}
        />
        <TextField
          placeholder={t('mobile.appointments.search')}
          value={search}
          onChangeText={(next) => {
            setSearch(next);
            setPage(1);
          }}
          autoCapitalize="none"
        />

        {query.isLoading ? (
          <LoadingView />
        ) : query.isError ? (
          <ErrorView
            message={t('mobile.common.error')}
            onRetry={() => void query.refetch()}
            retryLabel={t('mobile.common.retry')}
          />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <AppointmentCard
                appointment={item}
                currencySymbol={currency}
                showEmployee={isAdminArea}
                onPress={() => setSelected(item)}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={<EmptyState title={t('mobile.appointments.empty')} />}
            refreshControl={
              <RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />
            }
            onEndReachedThreshold={0.4}
            onEndReached={() => {
              if (page < lastPage && !query.isFetching) setPage((p) => p + 1);
            }}
            contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
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
