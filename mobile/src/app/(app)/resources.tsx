import React, { useState } from 'react';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAdminResources, useDeleteResource, useSaveResource } from '@/api/queries';
import { useToast } from '@/components/Toast';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, ErrorView, ListRow, LoadingView, TextField } from '@/components/ui';
import { FormSheet } from '@/features/manage/FormSheet';
import { useT } from '@/i18n';
import { spacing } from '@/theme/tokens';

interface ResourceForm {
  id?: number;
  name: string;
  quantity: string;
}

export default function ResourcesScreen() {
  const { t } = useT();
  const { showError } = useToast();
  const query = useAdminResources();
  const save = useSaveResource();
  const remove = useDeleteResource();

  const [form, setForm] = useState<ResourceForm | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (query.isLoading) return <LoadingView />;
  if (query.isError) {
    return (
      <Screen title={t('mobile.resources.title')}>
        <ErrorView message={t('mobile.common.error')} onRetry={() => void query.refetch()} retryLabel={t('mobile.common.retry')} />
      </Screen>
    );
  }

  const submit = () => {
    if (!form) return;
    setFieldErrors({});
    save.mutate(
      { id: form.id, name: form.name, quantity: parseInt(form.quantity, 10) || 1 },
      {
        onSuccess: () => setForm(null),
        onError: (e) => {
          if (e instanceof ApiError && e.errors) setFieldErrors(e.errors);
          else showError(e.message);
        },
      },
    );
  };

  const confirmDelete = (id: number) => {
    Alert.alert(t('mobile.common.confirm'), t('mobile.resources.delete_confirm'), [
      { text: t('mobile.common.cancel'), style: 'cancel' },
      {
        text: t('mobile.common.delete'),
        style: 'destructive',
        onPress: () => remove.mutate({ id }, { onError: (e) => showError(e.message) }),
      },
    ]);
  };

  return (
    <Screen
      title={t('mobile.resources.title')}
      right={
        <Button
          title="+"
          onPress={() => {
            setFieldErrors({});
            setForm({ name: '', quantity: '1' });
          }}
          style={{ minHeight: 40, paddingHorizontal: spacing.lg }}
        />
      }
    >
      <FlatList
        data={query.data!.resources}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow
              title={item.name}
              subtitle={`${t('mobile.resources.quantity')}: ${item.quantity}`}
              onPress={() => {
                setFieldErrors({});
                setForm({ id: item.id, name: item.name, quantity: String(item.quantity) });
              }}
              right={<Button title={t('mobile.common.delete')} variant="ghost" onPress={() => confirmDelete(item.id)} />}
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
          title={form.id ? form.name : t('mobile.resources.add')}
          visible
          onClose={() => setForm(null)}
          onSubmit={submit}
          submitLabel={t('mobile.common.save')}
          submitting={save.isPending}
        >
          <TextField label={t('mobile.resources.name')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} error={fieldErrors.name?.[0]} />
          <TextField
            label={t('mobile.resources.quantity')}
            value={form.quantity}
            onChangeText={(v) => setForm({ ...form, quantity: v })}
            keyboardType="number-pad"
            error={fieldErrors.quantity?.[0]}
          />
        </FormSheet>
      ) : null}
    </Screen>
  );
}
