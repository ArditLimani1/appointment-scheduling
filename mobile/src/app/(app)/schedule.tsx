import { DateTime } from 'luxon';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useEmployeeSchedule, useSaveScheduleOverrides } from '@/api/queries';
import type { ScheduleDay } from '@/api/types';
import { useAuth } from '@/auth/store';
import { DateBar } from '@/components/DateBar';
import { Screen } from '@/components/Screen';
import { Button, ErrorView, LoadingView } from '@/components/ui';
import { DayEditor, isValidTime } from '@/features/schedule/DayEditor';
import { useT } from '@/i18n';
import { spacing } from '@/theme/tokens';

/** Week-specific overrides of the base weekly schedule. */
export default function ScheduleScreen() {
  const { t, locale } = useT();
  const me = useAuth((s) => s.me);
  const zone = me?.business?.timezone ?? 'UTC';

  const [weekStart, setWeekStart] = useState(() =>
    DateTime.now().setZone(zone).startOf('week').toISODate() ?? '',
  );
  const [days, setDays] = useState<ScheduleDay[] | null>(null);

  const query = useEmployeeSchedule(weekStart);
  const save = useSaveScheduleOverrides();

  useEffect(() => {
    if (query.data) setDays(query.data.days.map((d) => ({ ...d, breaks: [...d.breaks] })));
  }, [query.data]);

  if (query.isLoading || !days) {
    if (query.isError) {
      return (
        <Screen title={t('mobile.schedule.title')}>
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
      {
        days: days.map((d) => ({
          date: d.date,
          day_of_week: d.day_of_week,
          is_active: d.is_active,
          is_overridden: true,
          start_time: d.is_active ? d.start_time : null,
          end_time: d.is_active ? d.end_time : null,
          breaks: d.is_active ? d.breaks : [],
        })) as ScheduleDay[],
      },
      {
        onSuccess: () => Alert.alert('', t('mobile.schedule.saved')),
        onError: (e) => Alert.alert(t('mobile.common.error'), e.message),
      },
    );
  };

  return (
    <Screen title={t('mobile.schedule.title')}>
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <DateBar date={weekStart} zone={zone} unit="week" locale={locale} onChange={(next) => {
          const snapped = DateTime.fromISO(next, { zone }).startOf('week').toISODate();
          if (snapped) setWeekStart(snapped);
        }} />

        {days.map((day, index) => (
          <DayEditor
            key={day.date ?? index}
            label={
              day.date
                ? DateTime.fromISO(day.date, { zone }).setLocale(locale).toFormat('cccc d MMM')
                : String(day.day_of_week)
            }
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
