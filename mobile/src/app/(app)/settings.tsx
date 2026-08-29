import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, Switch, Text, View, type TextStyle } from 'react-native';
import { ApiError, BASE_URL } from '@/api/client';
import { useAdminSettings, useSaveNotificationPreferences, useSaveSettings, useUploadLogo } from '@/api/queries';
import type { BusinessSettings } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Screen } from '@/components/Screen';
import { useToast } from '@/components/Toast';
import { Button, Card, ErrorView, LoadingView, Segmented, TextField } from '@/components/ui';
import { useT } from '@/i18n';
import { toHm } from '@/utils/datetime';
import { palette, radius, spacing, typography } from '@/theme/tokens';

/**
 * Full parity with the web's `Pages/Admin/Settings/Index.jsx`: the same two
 * sections (identity / booking rules), the same fields, and the same
 * confirm-before-save step. Labels reuse the `admin.settings.*` lang group so
 * the copy never drifts between the two apps.
 */
interface IdentityForm {
  name: string;
  phone: string;
  location: string;
  slug: string;
}

interface RulesForm {
  slot_duration: string;
  min_booking_notice: string;
  max_booking_window: string;
  client_identifier_type: 'phone' | 'email';
  allow_employee_service_edit: boolean;
  uses_shared_resources: boolean;
  auto_confirm_appointments: boolean;
  reminders_enabled: boolean;
  reminder_time: string;
  owner_also_works_as_staff: boolean;
}

export default function SettingsScreen() {
  const { t } = useT();
  const { showSuccess, showError } = useToast();
  const refreshMe = useAuth((s) => s.refreshMe);
  const whatsappEnabled = useAuth((s) => s.me?.features.whatsapp ?? false);

  const query = useAdminSettings();
  const save = useSaveSettings();
  const saveNotifications = useSaveNotificationPreferences();
  const uploadLogo = useUploadLogo();

  const [tab, setTab] = useState<'identity' | 'rules' | 'notifications'>('identity');
  const [notifyOthers, setNotifyOthers] = useState(false);
  const [identity, setIdentity] = useState<IdentityForm | null>(null);
  const [rules, setRules] = useState<RulesForm | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const payload = query.data;
  const settings: BusinessSettings | undefined = payload?.settings;
  const showOwnerStaffToggle = payload?.show_owner_staff_toggle ?? false;
  // The notification preference is gated on `admin.appointments`; a role may hold
  // that without `admin.settings`, in which case only this tab is usable.
  const canManageAppointments = payload?.can_manage_appointments ?? false;
  const canManageSettings = payload?.can_manage_settings ?? true;

  useEffect(() => {
    if (!settings || identity) return;
    setIdentity({
      name: settings.name ?? '',
      phone: settings.phone ?? '',
      location: settings.location ?? '',
      slug: settings.slug ?? '',
    });
    setRules({
      slot_duration: String(settings.slot_duration ?? 30),
      min_booking_notice: String(settings.min_booking_notice ?? 120),
      max_booking_window: String(settings.max_booking_window ?? 30),
      // The backend forces `email` when WhatsApp is off; mirror that here so the
      // stored value cannot resurrect a hidden `phone` choice.
      client_identifier_type: whatsappEnabled ? (settings.client_identifier_type ?? 'phone') : 'email',
      allow_employee_service_edit: settings.allow_employee_service_edit ?? true,
      uses_shared_resources: settings.uses_shared_resources ?? false,
      auto_confirm_appointments: settings.auto_confirm_appointments ?? false,
      reminders_enabled: settings.reminders_enabled ?? false,
      // The column is a TIME, so it comes back as H:i:s — the editor and the
      // backend's `date_format:H:i` rule both want H:i.
      reminder_time: toHm(settings.reminder_time) || '08:00',
      owner_also_works_as_staff: payload?.owner_also_works_as_staff ?? false,
    });
    setNotifyOthers(payload?.notify_others_appointments ?? false);
  }, [settings, identity, payload, whatsappEnabled]);

  if (query.isError) {
    return (
      <Screen title={t('mobile.settings.title')}>
        <ErrorView
          message={t('mobile.common.error')}
          onRetry={() => void query.refetch()}
          retryLabel={t('mobile.common.retry')}
        />
      </Screen>
    );
  }

  if (query.isLoading || !identity || !rules) return <LoadingView />;

  const submit = (section: 'identity' | 'rules') => {
    const body: Record<string, unknown> =
      section === 'identity'
        ? {
            name: identity.name,
            phone: identity.phone || null,
            location: identity.location || null,
            slug: identity.slug,
          }
        : {
            slot_duration: Number(rules.slot_duration),
            min_booking_notice: Number(rules.min_booking_notice),
            max_booking_window: Number(rules.max_booking_window),
            client_identifier_type: rules.client_identifier_type,
            allow_employee_service_edit: rules.allow_employee_service_edit,
            uses_shared_resources: rules.uses_shared_resources,
            auto_confirm_appointments: rules.auto_confirm_appointments,
            reminders_enabled: rules.reminders_enabled,
            // Always a real time: the column is NOT NULL with an 08:00 default,
            // and the web posts the field whether or not reminders are on.
            reminder_time: /^\d{2}:\d{2}$/.test(rules.reminder_time) ? rules.reminder_time : '08:00',
            ...(showOwnerStaffToggle ? { owner_also_works_as_staff: rules.owner_also_works_as_staff } : {}),
          };

    setFieldErrors({});
    save.mutate(body, {
      onSuccess: () => {
        void refreshMe();
        showSuccess(t('mobile.settings.saved'));
      },
      onError: (e) => {
        if (e instanceof ApiError && e.errors) {
          setFieldErrors(e.errors);
          // Surface the section that actually failed, as the web does.
          setTab(Object.keys(e.errors).some((k) => k in identity) ? 'identity' : 'rules');
        } else {
          showError(e.message);
        }
      },
    });
  };

  /** Web confirms each section before saving; keep that guard here. */
  const confirmSave = (section: 'identity' | 'rules') => {
    Alert.alert(
      t(section === 'identity' ? 'admin.settings.confirm.identity_title' : 'admin.settings.confirm.rules_title'),
      t(section === 'identity' ? 'admin.settings.confirm.identity_body' : 'admin.settings.confirm.rules_body'),
      [
        { text: t('admin.settings.confirm.cancel'), style: 'cancel' },
        { text: t('admin.settings.confirm.yes_save'), onPress: () => submit(section) },
      ],
    );
  };

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError(t('mobile.settings.logo_permission'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    const asset = result.assets[0];
    uploadLogo.mutate(
      {
        uri: asset.uri,
        name: asset.fileName ?? 'logo.jpg',
        type: asset.mimeType ?? 'image/jpeg',
      },
      {
        onSuccess: () => {
          void refreshMe();
          showSuccess(t('mobile.settings.logo_uploaded'));
        },
        onError: (e) => showError(e instanceof ApiError ? (e.firstFieldError() ?? e.message) : e.message),
      },
    );
  };

  const logoUrl = settings?.logo ? `${BASE_URL}/storage/${settings.logo}` : null;
  const saving = save.isPending;

  return (
    <Screen title={t('mobile.settings.title')}>
      <View style={{ flex: 1, gap: spacing.md }}>
        <Segmented
          options={[
            ...(canManageSettings
              ? [
                  { value: 'identity' as const, label: t('admin.settings.tabs.identity') },
                  { value: 'rules' as const, label: t('admin.settings.tabs.rules') },
                ]
              : []),
            ...(canManageAppointments
              ? [{ value: 'notifications' as const, label: t('admin.settings.tabs.notifications') }]
              : []),
          ]}
          value={tab}
          onChange={setTab}
        />

        <ScrollView
          contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {tab === 'notifications' ? (
            <Card style={{ gap: spacing.lg }}>
              <SectionTitle title={t('admin.settings.notify_others_title')} />
              <ToggleRow
                title={t('admin.settings.notify_others_label')}
                help={t('admin.settings.notify_others_help')}
                value={notifyOthers}
                onChange={setNotifyOthers}
              />
              <Button
                title={saveNotifications.isPending ? t('admin.settings.saving') : t('admin.settings.save_configuration')}
                onPress={() =>
                  saveNotifications.mutate(
                    { notify_others_appointments: notifyOthers },
                    {
                      onSuccess: () => showSuccess(t('admin.settings.saved_success')),
                      onError: (e) => showError(e.message),
                    },
                  )
                }
                loading={saveNotifications.isPending}
              />
            </Card>
          ) : tab === 'identity' ? (
            <>
              <Card style={{ gap: spacing.md }}>
                <SectionTitle title={t('admin.settings.identity_section')} />

                <View style={{ gap: spacing.sm }}>
                  <Text style={styles.fieldLabel}>{t('admin.settings.label_logo')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
                    {logoUrl ? (
                      <Image source={{ uri: logoUrl }} style={styles.logo} resizeMode="cover" />
                    ) : (
                      <View style={[styles.logo, styles.logoEmpty]} />
                    )}
                    <View style={{ flex: 1, gap: spacing.xs }}>
                      <Text style={[typography.label as TextStyle, { color: palette.onSurface }]}>
                        {logoUrl ? t('admin.settings.logo_status_current') : t('admin.settings.logo_status_none')}
                      </Text>
                      <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]}>
                        {t('admin.settings.logo_help')}
                      </Text>
                    </View>
                  </View>
                  <Button
                    title={t('admin.settings.choose_logo')}
                    variant="secondary"
                    onPress={() => void pickLogo()}
                    loading={uploadLogo.isPending}
                  />
                </View>
              </Card>

              <Card style={{ gap: spacing.md }}>
                <TextField
                  label={t('admin.settings.label_business_name')}
                  value={identity.name}
                  onChangeText={(v) => setIdentity({ ...identity, name: v })}
                  error={fieldErrors.name?.[0]}
                />
                <View style={{ gap: spacing.xs }}>
                  <Text style={styles.fieldLabel}>{t('admin.settings.label_account_email')}</Text>
                  <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                    {payload?.owner_email ?? '—'}
                  </Text>
                </View>
                <TextField
                  label={t('admin.settings.label_phone')}
                  value={identity.phone}
                  onChangeText={(v) => setIdentity({ ...identity, phone: v })}
                  keyboardType="phone-pad"
                  error={fieldErrors.phone?.[0]}
                />
                <TextField
                  label={t('admin.settings.label_location')}
                  value={identity.location}
                  onChangeText={(v) => setIdentity({ ...identity, location: v })}
                  error={fieldErrors.location?.[0]}
                />
                <View style={{ gap: spacing.xs }}>
                  <Text style={styles.fieldLabel}>{t('admin.settings.label_booking_url')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>
                      {t('admin.settings.booking_path_prefix')}
                    </Text>
                    <TextField
                      value={identity.slug}
                      onChangeText={(v) => setIdentity({ ...identity, slug: v })}
                      autoCapitalize="none"
                      autoCorrect={false}
                      error={fieldErrors.slug?.[0]}
                      style={{ flex: 1 }}
                    />
                  </View>
                </View>
              </Card>

              <Button
                title={saving ? t('admin.settings.saving') : t('admin.settings.save_configuration')}
                onPress={() => confirmSave('identity')}
                loading={saving}
              />
            </>
          ) : (
            <>
              <Card style={{ gap: spacing.lg }}>
                <SectionTitle title={t('admin.settings.rules_section')} />

                <NumberRow
                  title={t('admin.settings.slot_duration_title')}
                  help={t('admin.settings.slot_duration_help')}
                  unit={t('admin.settings.unit_min')}
                  value={rules.slot_duration}
                  onChange={(v) => setRules({ ...rules, slot_duration: v })}
                  error={fieldErrors.slot_duration?.[0]}
                />
                <NumberRow
                  title={t('admin.settings.min_notice_title')}
                  help={t('admin.settings.min_notice_help')}
                  unit={t('admin.settings.unit_min')}
                  value={rules.min_booking_notice}
                  onChange={(v) => setRules({ ...rules, min_booking_notice: v })}
                  error={fieldErrors.min_booking_notice?.[0]}
                />
                <NumberRow
                  title={t('admin.settings.booking_window_title')}
                  help={t('admin.settings.booking_window_help')}
                  unit={t('admin.settings.unit_days')}
                  value={rules.max_booking_window}
                  onChange={(v) => setRules({ ...rules, max_booking_window: v })}
                  error={fieldErrors.max_booking_window?.[0]}
                />
              </Card>

              {/* Only offered when WhatsApp is on — otherwise the backend pins it to email. */}
              {whatsappEnabled ? (
                <Card style={{ gap: spacing.sm }}>
                  <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurface }]}>
                    {t('admin.settings.client_id_title')}
                  </Text>
                  <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]}>
                    {t('admin.settings.client_id_help')}
                  </Text>
                  <Segmented
                    options={[
                      { value: 'phone' as const, label: t('admin.settings.client_id_phone') },
                      { value: 'email' as const, label: t('admin.settings.client_id_email') },
                    ]}
                    value={rules.client_identifier_type}
                    onChange={(v) => setRules({ ...rules, client_identifier_type: v })}
                  />
                </Card>
              ) : null}

              <Card style={{ gap: spacing.lg }}>
                <ToggleRow
                  title={t('admin.settings.allow_service_edit_title')}
                  help={t('admin.settings.allow_service_edit_help')}
                  value={rules.allow_employee_service_edit}
                  onChange={(v) => setRules({ ...rules, allow_employee_service_edit: v })}
                />
                <ToggleRow
                  title={t('admin.settings.auto_confirm_title')}
                  help={t('admin.settings.auto_confirm_help')}
                  value={rules.auto_confirm_appointments}
                  onChange={(v) => setRules({ ...rules, auto_confirm_appointments: v })}
                />
                <View style={{ gap: spacing.md }}>
                  <ToggleRow
                    title={t(
                      rules.client_identifier_type === 'phone'
                        ? 'admin.settings.reminders_title_phone'
                        : 'admin.settings.reminders_title_email',
                    )}
                    help={t(
                      rules.client_identifier_type === 'phone'
                        ? 'admin.settings.reminders_help_phone'
                        : 'admin.settings.reminders_help_email',
                    )}
                    value={rules.reminders_enabled}
                    onChange={(v) => setRules({ ...rules, reminders_enabled: v })}
                  />
                  {rules.reminders_enabled ? (
                    <TextField
                      label={t('admin.settings.reminder_time_label')}
                      value={rules.reminder_time}
                      onChangeText={(v) => setRules({ ...rules, reminder_time: v })}
                      placeholder="08:00"
                      keyboardType="numbers-and-punctuation"
                      error={fieldErrors.reminder_time?.[0]}
                    />
                  ) : null}
                </View>
                <ToggleRow
                  title={t('admin.settings.uses_shared_resources_title')}
                  help={t('admin.settings.uses_shared_resources_help')}
                  value={rules.uses_shared_resources}
                  onChange={(v) => setRules({ ...rules, uses_shared_resources: v })}
                />
                {showOwnerStaffToggle ? (
                  <ToggleRow
                    title={t('admin.settings.owner_staff_title')}
                    help={t('admin.settings.owner_staff_help')}
                    value={rules.owner_also_works_as_staff}
                    onChange={(v) => setRules({ ...rules, owner_also_works_as_staff: v })}
                  />
                ) : null}
              </Card>

              <Button
                title={saving ? t('admin.settings.saving') : t('admin.settings.save_configuration')}
                onPress={() => confirmSave('rules')}
                loading={saving}
              />
            </>
          )}
        </ScrollView>
      </View>
    </Screen>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={[typography.title as TextStyle, { color: palette.onSurface }]}>{title}</Text>;
}

function ToggleRow({
  title,
  help,
  value,
  onChange,
}: {
  title: string;
  help?: string;
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurface }]}>{title}</Text>
        {help ? (
          <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]}>{help}</Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}

function NumberRow({
  title,
  help,
  unit,
  value,
  onChange,
  error,
}: {
  title: string;
  help?: string;
  unit: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ gap: 2 }}>
        <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurface }]}>{title}</Text>
        {help ? (
          <Text style={[typography.caption as TextStyle, { color: palette.onSurfaceVariant }]}>{help}</Text>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <TextField
          value={value}
          onChangeText={(v) => onChange(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          error={error}
          style={{ flex: 1 }}
        />
        <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant, textTransform: 'uppercase' }]}>
          {unit}
        </Text>
      </View>
    </View>
  );
}

const styles = {
  fieldLabel: { ...(typography.label as TextStyle), color: palette.onSurfaceVariant },
  logo: { height: 56, width: 56, borderRadius: radius.lg, backgroundColor: palette.surfaceContainer },
  logoEmpty: { borderWidth: 1, borderColor: palette.outlineVariant },
} as const;
