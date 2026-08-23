import { DateTime } from 'luxon';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';
import { ApiError } from '@/api/client';
import {
  fetchInternalSlots,
  useAdminCreateData,
  useCreateAppointment,
  useEmployeeCreateData,
} from '@/api/queries';
import type { EmployeeSummary, ServiceSummary } from '@/api/types';
import { useAuth } from '@/auth/store';
import { Screen } from '@/components/Screen';
import { Button, Card, ErrorView, LoadingView, TextField } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, radius, spacing, typography } from '@/theme/tokens';

export default function CreateAppointmentScreen() {
  const { t, locale } = useT();
  const router = useRouter();
  const me = useAuth((s) => s.me);

  const isAdminArea = me?.features.admin_panel ?? false;
  const area = isAdminArea ? ('admin' as const) : ('employee' as const);
  const zone = me?.business?.timezone ?? 'UTC';

  const adminData = useAdminCreateData(isAdminArea);
  const employeeData = useEmployeeCreateData(!isAdminArea);
  const bootstrap = isAdminArea ? adminData : employeeData;

  const create = useCreateAppointment(area);

  const [serviceIds, setServiceIds] = useState<number[]>([]);
  const [employeeId, setEmployeeId] = useState<number | null>(null);
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (bootstrap.data && !date) setDate(bootstrap.data.booking_today);
  }, [bootstrap.data, date]);

  const employees: EmployeeSummary[] = bootstrap.data?.employees ?? [];
  const services: ServiceSummary[] = useMemo(() => {
    const all = bootstrap.data?.services ?? [];
    if (!isAdminArea || employeeId == null) return all;
    const employee = employees.find((e) => e.id === employeeId);
    const offered = employee?.services?.map((s) => s.id);
    return offered ? all.filter((s) => offered.includes(s.id)) : all;
  }, [bootstrap.data?.services, employees, employeeId, isAdminArea]);

  // Load slots whenever service/date/employee selection is complete.
  useEffect(() => {
    setSlot(null);
    if (serviceIds.length === 0 || !date || (isAdminArea && employeeId == null)) {
      setSlots(null);
      return;
    }
    let cancelled = false;
    setSlotsLoading(true);
    fetchInternalSlots(area, {
      employee_id: isAdminArea ? (employeeId ?? undefined) : undefined,
      service_ids: serviceIds,
      date,
    })
      .then((response) => {
        if (!cancelled) setSlots(response.slots);
      })
      .catch(() => {
        if (!cancelled) setSlots([]);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [area, isAdminArea, employeeId, serviceIds.join(','), date]);

  if (bootstrap.isLoading) return <LoadingView />;
  if (bootstrap.isError) {
    return (
      <Screen title={t('mobile.create.title')}>
        <ErrorView
          message={t('mobile.common.error')}
          onRetry={() => void bootstrap.refetch()}
          retryLabel={t('mobile.common.retry')}
        />
      </Screen>
    );
  }

  const toggleService = (id: number) => {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const shiftDate = (delta: number) => {
    const next = DateTime.fromISO(date, { zone }).plus({ days: delta }).toISODate();
    if (next) setDate(next);
  };

  const submit = () => {
    setFieldErrors({});
    create.mutate(
      {
        service_ids: serviceIds,
        ...(isAdminArea ? { employee_id: employeeId } : {}),
        date,
        start_time: slot,
        client_first_name: firstName,
        client_last_name: lastName,
        client_phone: phone,
        client_email: email || null,
        client_notes: notes || null,
      },
      {
        onSuccess: () => {
          Alert.alert('', t('mobile.create.created'));
          router.back();
        },
        onError: (e) => {
          if (e instanceof ApiError && e.errors) {
            setFieldErrors(e.errors);
          } else {
            Alert.alert(t('mobile.common.error'), e.message);
          }
        },
      },
    );
  };

  const canSubmit = serviceIds.length > 0 && !!slot && !!firstName && (!isAdminArea || employeeId != null);

  return (
    <Screen title={t('mobile.create.title')}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }} keyboardShouldPersistTaps="handled">
          {isAdminArea ? (
            <Card style={{ gap: spacing.sm }}>
              <Text style={styles.sectionTitle}>{t('mobile.create.employee')}</Text>
              <View style={styles.chipWrap}>
                {employees.map((employee) => (
                  <Chip
                    key={employee.id}
                    label={employee.name}
                    active={employeeId === employee.id}
                    onPress={() => setEmployeeId(employee.id)}
                  />
                ))}
              </View>
            </Card>
          ) : null}

          <Card style={{ gap: spacing.sm }}>
            <Text style={styles.sectionTitle}>{t('mobile.create.service')}</Text>
            <View style={styles.chipWrap}>
              {services.map((service) => (
                <Chip
                  key={service.id}
                  label={`${service.name}${service.duration ? ` · ${service.duration}′` : ''}`}
                  active={serviceIds.includes(service.id)}
                  onPress={() => toggleService(service.id)}
                />
              ))}
            </View>
            {fieldErrors.service_ids ? <Text style={styles.error}>{fieldErrors.service_ids[0]}</Text> : null}
          </Card>

          <Card style={{ gap: spacing.md }}>
            <Text style={styles.sectionTitle}>{t('mobile.create.date')}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <Button title="‹" variant="secondary" onPress={() => shiftDate(-1)} />
              <Text style={[typography.bodyStrong as TextStyle, { flex: 1, textAlign: 'center', color: palette.onSurface, textTransform: 'capitalize' }]}>
                {date ? DateTime.fromISO(date, { zone }).setLocale(locale).toFormat('ccc, d MMMM') : ''}
              </Text>
              <Button title="›" variant="secondary" onPress={() => shiftDate(1)} />
            </View>

            <Text style={styles.sectionTitle}>{t('mobile.create.slot')}</Text>
            {serviceIds.length === 0 ? (
              <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                {t('mobile.create.pick_service_first')}
              </Text>
            ) : slotsLoading ? (
              <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>…</Text>
            ) : slots && slots.length > 0 ? (
              <View style={styles.chipWrap}>
                {slots.map((time) => (
                  <Chip key={time} label={time} active={slot === time} onPress={() => setSlot(time)} />
                ))}
              </View>
            ) : (
              <Text style={[typography.body as TextStyle, { color: palette.onSurfaceVariant }]}>
                {t('mobile.sheet.no_slots')}
              </Text>
            )}
            {fieldErrors.start_time ? <Text style={styles.error}>{fieldErrors.start_time[0]}</Text> : null}
          </Card>

          <Card style={{ gap: spacing.md }}>
            <TextField
              label={t('mobile.create.first_name')}
              value={firstName}
              onChangeText={setFirstName}
              error={fieldErrors.client_first_name?.[0]}
            />
            <TextField
              label={t('mobile.create.last_name')}
              value={lastName}
              onChangeText={setLastName}
              error={fieldErrors.client_last_name?.[0]}
            />
            <TextField
              label={t('mobile.create.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              error={fieldErrors.client_phone?.[0]}
            />
            <TextField
              label={t('mobile.create.email')}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              error={fieldErrors.client_email?.[0]}
            />
            <TextField
              label={t('mobile.create.notes')}
              value={notes}
              onChangeText={setNotes}
              multiline
              style={{ minHeight: 70 }}
              error={fieldErrors.client_notes?.[0]}
            />
          </Card>

          <Button
            title={t('mobile.create.submit')}
            onPress={submit}
            disabled={!canSubmit}
            loading={create.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text
        style={[typography.label as TextStyle, { color: active ? palette.onPrimary : palette.onSurfaceVariant }]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { ...(typography.label as TextStyle), color: palette.onSurfaceVariant },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    backgroundColor: palette.surfaceContainer,
  },
  chipActive: { backgroundColor: palette.primary },
  error: { ...(typography.caption as TextStyle), color: palette.error },
});
