import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, Switch, Text, View, type TextStyle } from 'react-native';
import { ApiError } from '@/api/client';
import { useAdminServices, useDeleteService, useSaveService } from '@/api/queries';
import type { ServiceSummary } from '@/api/types';
import { useAuth } from '@/auth/store';
import { useToast } from '@/components/Toast';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, ErrorView, ListRow, LoadingView, TextField } from '@/components/ui';
import { FormSheet } from '@/features/manage/FormSheet';
import { useT } from '@/i18n';
import { palette, spacing, typography } from '@/theme/tokens';

interface ServiceForm {
  id?: number;
  name: string;
  description: string;
  duration: string;
  price: string;
  is_active: boolean;
}

export default function ServicesScreen() {
  const { t } = useT();
  const { showError } = useToast();
  const me = useAuth((s) => s.me);
  const currency = me?.business?.currency_symbol ?? '';

  const query = useAdminServices();
  const save = useSaveService();
  const remove = useDeleteService();

  const [form, setForm] = useState<ServiceForm | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (query.isLoading) return <LoadingView />;
  if (query.isError) {
    return (
      <Screen title={t('mobile.services.title')}>
        <ErrorView message={t('mobile.common.error')} onRetry={() => void query.refetch()} retryLabel={t('mobile.common.retry')} />
      </Screen>
    );
  }

  const services = query.data!.services;

  const openEdit = (service: ServiceSummary) => {
    setFieldErrors({});
    setForm({
      id: service.id,
      name: service.name,
      description: service.description ?? '',
      duration: String(service.duration ?? 30),
      price: String(service.price ?? 0),
      is_active: service.is_active ?? true,
    });
  };

  const submit = () => {
    if (!form) return;
    setFieldErrors({});
    save.mutate(
      {
        id: form.id,
        name: form.name,
        description: form.description || null,
        duration: parseInt(form.duration, 10) || 0,
        price: parseFloat(form.price) || 0,
        is_active: form.is_active,
      },
      {
        onSuccess: () => setForm(null),
        onError: (e) => {
          if (e instanceof ApiError && e.errors) setFieldErrors(e.errors);
          else showError(e.message);
        },
      },
    );
  };

  const confirmDelete = (service: ServiceSummary) => {
    Alert.alert(t('mobile.common.confirm'), t('mobile.services.delete_confirm'), [
      { text: t('mobile.common.cancel'), style: 'cancel' },
      {
        text: t('mobile.common.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate({ id: service.id }, { onError: (e) => showError(e.message) }),
      },
    ]);
  };

  return (
    <Screen
      title={t('mobile.services.title')}
      right={
        <Button
          title="+"
          onPress={() => {
            setFieldErrors({});
            setForm({ name: '', description: '', duration: '30', price: '0', is_active: true });
          }}
          style={{ minHeight: 40, paddingHorizontal: spacing.lg }}
        />
      }
    >
      <FlatList
        data={services}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={{ padding: 0, overflow: 'hidden', opacity: item.is_active === false ? 0.6 : 1 }}>
            <ListRow
              title={item.name}
              subtitle={`${item.duration ?? '—'}′ · ${item.price ?? '—'} ${currency}`}
              onPress={() => openEdit(item)}
              right={<Button title={t('mobile.common.delete')} variant="ghost" onPress={() => confirmDelete(item)} />}
            />
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState title={t('mobile.services.empty')} />}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {form ? (
        <FormSheet
          title={form.id ? form.name : t('mobile.services.add')}
          visible
          onClose={() => setForm(null)}
          onSubmit={submit}
          submitLabel={t('mobile.common.save')}
          submitting={save.isPending}
        >
          <TextField label={t('mobile.services.name')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} error={fieldErrors.name?.[0]} />
          <TextField
            label={t('mobile.services.description')}
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v })}
            multiline
            style={{ minHeight: 60 }}
          />
          <TextField
            label={t('mobile.services.duration')}
            value={form.duration}
            onChangeText={(v) => setForm({ ...form, duration: v })}
            keyboardType="number-pad"
            error={fieldErrors.duration?.[0]}
          />
          <TextField
            label={`${t('mobile.services.price')}${currency ? ` (${currency})` : ''}`}
            value={form.price}
            onChangeText={(v) => setForm({ ...form, price: v })}
            keyboardType="decimal-pad"
            error={fieldErrors.price?.[0]}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.body as TextStyle, { color: palette.onSurface }]}>
              {t('mobile.services.active')}
            </Text>
            <Switch value={form.is_active} onValueChange={(v) => setForm({ ...form, is_active: v })} />
          </View>
        </FormSheet>
      ) : null}
    </Screen>
  );
}
