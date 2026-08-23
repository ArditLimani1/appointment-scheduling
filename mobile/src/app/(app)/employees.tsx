import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, Switch, Text, View, type TextStyle } from 'react-native';
import { ApiError } from '@/api/client';
import { useAdminEmployees, useDeleteEmployee, useSaveEmployee } from '@/api/queries';
import type { EmployeeSummary } from '@/api/types';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, ErrorView, ListRow, LoadingView, TextField } from '@/components/ui';
import { ChipPicker, FormSheet } from '@/features/manage/FormSheet';
import { useT } from '@/i18n';
import { palette, spacing, typography } from '@/theme/tokens';

interface EmployeeForm {
  id?: number;
  name: string;
  email: string;
  password: string;
  phone: string;
  title: string;
  business_role_id: number | null;
  service_ids: number[];
}

const emptyForm: EmployeeForm = {
  name: '',
  email: '',
  password: '',
  phone: '',
  title: '',
  business_role_id: null,
  service_ids: [],
};

export default function EmployeesScreen() {
  const { t } = useT();
  const query = useAdminEmployees();
  const save = useSaveEmployee();
  const remove = useDeleteEmployee();

  const [form, setForm] = useState<EmployeeForm | null>(null);
  const [deleteAppointments, setDeleteAppointments] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (query.isLoading) return <LoadingView />;
  if (query.isError) {
    return (
      <Screen title={t('mobile.employees.title')}>
        <ErrorView message={t('mobile.common.error')} onRetry={() => void query.refetch()} retryLabel={t('mobile.common.retry')} />
      </Screen>
    );
  }

  const data = query.data!;
  const services = (data.services ?? []) as { id: number; name: string }[];
  const allServices = services.length
    ? services
    : data.employees.flatMap((e) => e.services ?? []).filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i);

  const openEdit = (employee: EmployeeSummary) => {
    setFieldErrors({});
    setForm({
      id: employee.id,
      name: employee.name,
      email: employee.email ?? '',
      password: '',
      phone: employee.phone ?? '',
      title: employee.title ?? '',
      business_role_id: employee.business_role_id ?? null,
      service_ids: employee.services?.map((s) => s.id) ?? employee.service_ids ?? [],
    });
  };

  const submit = () => {
    if (!form) return;
    setFieldErrors({});
    const body: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      title: form.title || null,
      business_role_id: form.business_role_id,
      service_ids: form.service_ids,
    };
    if (form.password) body.password = form.password;
    if (!form.id) body.password = form.password;

    save.mutate(
      { id: form.id, ...body },
      {
        onSuccess: () => setForm(null),
        onError: (e) => {
          if (e instanceof ApiError && e.errors) setFieldErrors(e.errors);
          else Alert.alert(t('mobile.common.error'), e.message);
        },
      },
    );
  };

  const confirmDelete = (employee: EmployeeSummary) => {
    setDeleteAppointments(false);
    Alert.alert(t('mobile.common.confirm'), t('mobile.employees.delete_confirm'), [
      { text: t('mobile.common.cancel'), style: 'cancel' },
      {
        text: t('mobile.common.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(
            { id: employee.id, delete_appointments: false },
            { onError: (e) => Alert.alert(t('mobile.common.error'), e.message) },
          ),
      },
    ]);
  };

  return (
    <Screen
      title={t('mobile.employees.title')}
      right={<Button title="+" onPress={() => { setFieldErrors({}); setForm({ ...emptyForm }); }} style={{ minHeight: 40, paddingHorizontal: spacing.lg }} />}
    >
      <FlatList
        data={data.employees}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow
              title={item.name + (item.id === data.businessOwnerId ? ' ★' : '')}
              subtitle={[item.title, item.email].filter(Boolean).join(' · ')}
              onPress={() => openEdit(item)}
              right={
                item.id !== data.businessOwnerId ? (
                  <Button title={t('mobile.common.delete')} variant="ghost" onPress={() => confirmDelete(item)} />
                ) : undefined
              }
            />
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState title={t('mobile.appointments.empty')} />}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {form ? (
        <FormSheet
          title={form.id ? form.name : t('mobile.employees.add')}
          visible
          onClose={() => setForm(null)}
          onSubmit={submit}
          submitLabel={t('mobile.common.save')}
          submitting={save.isPending}
        >
          <TextField label={t('mobile.employees.name')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} error={fieldErrors.name?.[0]} />
          <TextField
            label={t('mobile.employees.email')}
            value={form.email}
            onChangeText={(v) => setForm({ ...form, email: v })}
            autoCapitalize="none"
            keyboardType="email-address"
            error={fieldErrors.email?.[0]}
          />
          <TextField
            label={t('mobile.employees.password')}
            value={form.password}
            onChangeText={(v) => setForm({ ...form, password: v })}
            secureTextEntry
            error={fieldErrors.password?.[0]}
          />
          {form.id ? (
            <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]}>
              {t('mobile.employees.password_hint')}
            </Text>
          ) : null}
          <TextField label={t('mobile.employees.phone')} value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
          <TextField label={t('mobile.employees.job_title')} value={form.title} onChangeText={(v) => setForm({ ...form, title: v })} />
          {data.businessRoles.length > 0 ? (
            <ChipPicker
              label={t('mobile.employees.role')}
              options={data.businessRoles.map((role) => ({ value: role.id, label: role.name }))}
              selected={form.business_role_id != null ? [form.business_role_id] : []}
              onToggle={(id) =>
                setForm({ ...form, business_role_id: form.business_role_id === id ? null : (id as number) })
              }
            />
          ) : null}
          {allServices.length > 0 ? (
            <ChipPicker
              label={t('mobile.employees.services')}
              options={allServices.map((service) => ({ value: service.id, label: service.name }))}
              selected={form.service_ids}
              onToggle={(id) =>
                setForm({
                  ...form,
                  service_ids: form.service_ids.includes(id as number)
                    ? form.service_ids.filter((s) => s !== id)
                    : [...form.service_ids, id as number],
                })
              }
            />
          ) : null}
        </FormSheet>
      ) : null}
    </Screen>
  );
}
