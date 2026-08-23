import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, Switch, Text, View, type TextStyle } from 'react-native';
import { ApiError } from '@/api/client';
import { useAdminSettings, useSaveSettings } from '@/api/queries';
import { useAuth } from '@/auth/store';
import { Screen } from '@/components/Screen';
import { Button, Card, ErrorView, LoadingView, TextField } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, spacing, typography } from '@/theme/tokens';

interface SettingsForm {
  name: string;
  phone: string;
  location: string;
  auto_confirm_appointments: boolean;
  allow_employee_service_edit: boolean;
}

export default function SettingsScreen() {
  const { t } = useT();
  const refreshMe = useAuth((s) => s.refreshMe);
  const query = useAdminSettings();
  const save = useSaveSettings();

  const [form, setForm] = useState<SettingsForm | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const settings = query.data?.settings as
      | {
          name?: string;
          phone?: string | null;
          location?: string | null;
          auto_confirm_appointments?: boolean;
          allow_employee_service_edit?: boolean;
        }
      | undefined;
    if (settings && !form) {
      setForm({
        name: settings.name ?? '',
        phone: settings.phone ?? '',
        location: settings.location ?? '',
        auto_confirm_appointments: settings.auto_confirm_appointments ?? false,
        allow_employee_service_edit: settings.allow_employee_service_edit ?? true,
      });
    }
  }, [query.data, form]);

  if (query.isLoading || !form) {
    if (query.isError) {
      return (
        <Screen title={t('mobile.settings.title')}>
          <ErrorView message={t('mobile.common.error')} onRetry={() => void query.refetch()} retryLabel={t('mobile.common.retry')} />
        </Screen>
      );
    }
    return <LoadingView />;
  }

  const submit = () => {
    setFieldErrors({});
    save.mutate(
      {
        name: form.name,
        phone: form.phone || null,
        location: form.location || null,
        auto_confirm_appointments: form.auto_confirm_appointments,
        allow_employee_service_edit: form.allow_employee_service_edit,
      },
      {
        onSuccess: () => {
          void refreshMe();
          Alert.alert('', t('mobile.settings.saved'));
        },
        onError: (e) => {
          if (e instanceof ApiError && e.errors) setFieldErrors(e.errors);
          else Alert.alert(t('mobile.common.error'), e.message);
        },
      },
    );
  };

  return (
    <Screen title={t('mobile.settings.title')}>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <Card style={{ gap: spacing.md }}>
          <TextField
            label={t('mobile.settings.business_name')}
            value={form.name}
            onChangeText={(v) => setForm({ ...form, name: v })}
            error={fieldErrors.name?.[0]}
          />
          <TextField
            label={t('mobile.settings.phone')}
            value={form.phone}
            onChangeText={(v) => setForm({ ...form, phone: v })}
            keyboardType="phone-pad"
            error={fieldErrors.phone?.[0]}
          />
          <TextField
            label={t('mobile.settings.location')}
            value={form.location}
            onChangeText={(v) => setForm({ ...form, location: v })}
            error={fieldErrors.location?.[0]}
          />
        </Card>

        <Card style={{ gap: spacing.md }}>
          <ToggleRow
            label={t('admin.settings.auto_confirm.label')}
            value={form.auto_confirm_appointments}
            onChange={(v) => setForm({ ...form, auto_confirm_appointments: v })}
          />
          <ToggleRow
            label={t('admin.settings.allow_employee_service_edit.label')}
            value={form.allow_employee_service_edit}
            onChange={(v) => setForm({ ...form, allow_employee_service_edit: v })}
          />
        </Card>

        <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]}>
          {t('mobile.settings.web_note')}
        </Text>

        <Button title={t('mobile.settings.save')} onPress={submit} loading={save.isPending} />
      </ScrollView>
    </Screen>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
      <Text style={[typography.body as TextStyle, { color: palette.onSurface, flex: 1 }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
