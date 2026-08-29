import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { ScrollView, Text, type TextStyle } from 'react-native';
import { useEmployeeScheduleConfig, useSaveScheduleConfig } from '@/api/queries';
import type { ScheduleDay } from '@/api/types';
import { useToast } from '@/components/Toast';
import { Screen } from '@/components/Screen';
import { Button, Card, ErrorView, LoadingView } from '@/components/ui';
import { DayEditor, isValidTime } from '@/features/schedule/DayEditor';
import { useT } from '@/i18n';
import { palette, spacing, typography } from '@/theme/tokens';
import { BASE_URL } from '@/api/client';

/** Base weekly schedule (applies from tomorrow; overrides win per-date). */
export default function ScheduleConfigScreen() {
  const { t, locale } = useT();
  const { showSuccess, showError } = useToast();
  const query = useEmployeeScheduleConfig();
  const save = useSaveScheduleConfig();

  const [days, setDays] = useState<ScheduleDay[] | null>(null);

  useEffect(() => {
    if (query.data && !days) {
      const byDow = new Map(query.data.schedules.map((s) => [s.day_of_week, s]));
      setDays(
        Array.from({ length: 7 }, (_, dow) => {
          const existing = byDow.get(dow);
          return {
            day_of_week: dow,
            is_active: existing?.is_active ?? false,
            start_time: existing?.start_time?.slice(0, 5) ?? '09:00',
            end_time: existing?.end_time?.slice(0, 5) ?? '17:00',
            breaks: (existing?.breaks ?? []).map((b) => ({
              start_time: b.start_time.slice(0, 5),
              end_time: b.end_time.slice(0, 5),
            })),
          };
        }),
      );
    }
  }, [query.data, days]);

  if (query.isLoading || !days) {
    if (query.isError) {
      return (
        <Screen title={t('mobile.schedule.base_config')}>
          <ErrorView message={t('mobile.common.error')} onRetry={() => void query.refetch()} retryLabel={t('mobile.common.retry')} />
        </Screen>
      );
    }
    return <LoadingView />;
  }

  const valid = days.every(
    (d) =>
      !d.is_active ||
      (isValidTime(d.start_time ?? '') &&
        isValidTime(d.end_time ?? '') &&
        d.breaks.every((b) => isValidTime(b.start_time) && isValidTime(b.end_time))),
  );

  const submit = () => {
    save.mutate(
      { schedules: days },
      {
        onSuccess: () => showSuccess(t('mobile.schedule.saved')),
        onError: (e) => showError(e.message),
      },
    );
  };

  const bookingUrl = query.data?.employee_booking_url ? `${BASE_URL}${query.data.employee_booking_url}` : null;

  // Localized weekday names, Monday-first (matches day_of_week 0 = Monday).
  const weekdayName = (dow: number) =>
    DateTime.fromObject({ weekday: ((dow % 7) + 1) as 1 | 2 | 3 | 4 | 5 | 6 | 7 }).setLocale(locale).toFormat('cccc');

  return (
    <Screen title={t('mobile.schedule.base_config')}>
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {bookingUrl ? (
          <Card style={{ gap: 4 }}>
            <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>
              {t('mobile.schedule.booking_url')}
            </Text>
            <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurface }]} numberOfLines={1}>
              {bookingUrl}
            </Text>
          </Card>
        ) : null}

        {days.map((day, index) => (
          <DayEditor
            key={day.day_of_week}
            label={weekdayName(day.day_of_week)}
            day={day}
            onChange={(next) => {
              const copy = [...days];
              copy[index] = next;
              setDays(copy);
            }}
          />
        ))}

        <Button title={t('mobile.schedule.save')} onPress={submit} disabled={!valid} loading={save.isPending} />
      </ScrollView>
    </Screen>
  );
}
