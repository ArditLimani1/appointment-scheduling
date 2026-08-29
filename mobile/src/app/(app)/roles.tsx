import React, { useState } from 'react';
import { FlatList, RefreshControl, View } from 'react-native';
import { ApiError } from '@/api/client';
import { useAdminRoles, useDeleteRole, useSaveRole } from '@/api/queries';
import { useToast } from '@/components/Toast';
import { useConfirm } from '@/components/ConfirmDialog';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, ErrorView, ListRow, LoadingView, TextField } from '@/components/ui';
import { ChipPicker, FormSheet } from '@/features/manage/FormSheet';
import { useT } from '@/i18n';
import { spacing } from '@/theme/tokens';

interface RoleForm {
  id?: number;
  name: string;
  permissions: string[];
}

export default function RolesScreen() {
  const { t } = useT();
  const { showError } = useToast();
  const query = useAdminRoles();
  const save = useSaveRole();
  const remove = useDeleteRole();
  const { ask, dialog } = useConfirm();

  const [form, setForm] = useState<RoleForm | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  if (query.isLoading) return <LoadingView />;
  if (query.isError) {
    return (
      <Screen title={t('mobile.roles.title')}>
        <ErrorView message={t('mobile.common.error')} onRetry={() => void query.refetch()} retryLabel={t('mobile.common.retry')} />
      </Screen>
    );
  }

  const { roles, permissionGroups } = query.data!;
  const allPermissions = Object.values(permissionGroups).flat();

  const submit = () => {
    if (!form) return;
    setFieldErrors({});
    save.mutate(
      { id: form.id, name: form.name, permissions: form.permissions },
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
    ask({
      title: t('mobile.common.confirm'),
      message: t('mobile.roles.delete_confirm'),
      confirmLabel: t('mobile.common.delete'),
      destructive: true,
      onConfirm: () => remove.mutate({ id }, { onError: (e) => showError(e.message) }),
    });
  };

  return (
    <Screen
      title={t('mobile.roles.title')}
      right={
        <Button
          title="+"
          onPress={() => {
            setFieldErrors({});
            setForm({ name: '', permissions: [] });
          }}
          style={{ minHeight: 40, paddingHorizontal: spacing.lg }}
        />
      }
    >
      <FlatList
        data={roles}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <ListRow
              title={item.name}
              subtitle={`${item.permissions.length} ${t('mobile.roles.permissions').toLowerCase()}`}
              onPress={() => {
                setFieldErrors({});
                setForm({ id: item.id, name: item.name, permissions: [...item.permissions] });
              }}
              right={<Button title={t('mobile.common.delete')} variant="ghost" onPress={() => confirmDelete(item.id)} />}
            />
          </Card>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        ListEmptyComponent={<EmptyState title={t('mobile.roles.empty')} />}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />

      {form ? (
        <FormSheet
          title={form.id ? form.name : t('mobile.roles.add')}
          visible
          onClose={() => setForm(null)}
          onSubmit={submit}
          submitLabel={t('mobile.common.save')}
          submitting={save.isPending}
        >
          <TextField label={t('mobile.roles.name')} value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} error={fieldErrors.name?.[0]} />
          <ChipPicker
            label={t('mobile.roles.permissions')}
            options={allPermissions.map((p) => ({ value: p.value, label: p.label }))}
            selected={form.permissions}
            onToggle={(value) =>
              setForm({
                ...form,
                permissions: form.permissions.includes(value as string)
                  ? form.permissions.filter((p) => p !== value)
                  : [...form.permissions, value as string],
              })
            }
          />
        </FormSheet>
      ) : null}
      {dialog}
    </Screen>
  );
}
