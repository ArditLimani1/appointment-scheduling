import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useAdminAnalytics, useEmployeeAnalytics } from '@/api/queries';
import { useAuth } from '@/auth/store';
import { DateBar } from '@/components/DateBar';
import { Screen } from '@/components/Screen';
import { Card, EmptyState, ErrorView, LoadingView, MetricCard } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, radius, spacing, typography } from '@/theme/tokens';

interface StatRow {
  name?: string;
  service_name?: string;
  employee_name?: string;
  count?: number;
  appointments?: number;
  total?: number | string;
  revenue?: number | string;
  [key: string]: unknown;
}

export default function AnalyticsScreen() {
  const { t, locale } = useT();
  const me = useAuth((s) => s.me);
  const zone = me?.business?.timezone ?? 'UTC';
  const currency = me?.business?.currency_symbol ?? '';
  const isAdminArea = me?.features.admin_panel ?? false;

  const [anchor, setAnchor] = useState(() => DateTime.now().setZone(zone).toISODate() ?? '');
  const monthStart = DateTime.fromISO(anchor, { zone }).startOf('month').toISODate() ?? undefined;
  const monthEnd = DateTime.fromISO(anchor, { zone }).endOf('month').toISODate() ?? undefined;

  const adminQuery = useAdminAnalytics({ date_from: monthStart, date_to: monthEnd });
  const employeeQuery = useEmployeeAnalytics({ date_from: monthStart, date_to: monthEnd });
  const query = isAdminArea ? adminQuery : employeeQuery;

  if (query.isLoading) return <LoadingView />;
  if (query.isError) {
    return (
      <Screen title={t('mobile.analytics.title')}>
        <ErrorView message={t('mobile.common.error')} onRetry={() => void query.refetch()} retryLabel={t('mobile.common.retry')} />
      </Screen>
    );
  }

  const data = query.data as {
    summary?: Record<string, number | string>;
    service_stats?: StatRow[] | { data?: StatRow[] };
    employee_stats?: StatRow[] | { data?: StatRow[] };
  };

  const serviceStats = normalizeRows(data.service_stats);
  const employeeStats = normalizeRows(data.employee_stats);
  const summary = data.summary ?? {};

  const summaryEntries = Object.entries(summary).filter(([, value]) => typeof value !== 'object');

  return (
    <Screen title={t('mobile.analytics.title')}>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <DateBar date={anchor} zone={zone} unit="week" locale={locale} onChange={setAnchor} />

        {summaryEntries.length > 0 ? (
          <View style={styles.metricGrid}>
            {summaryEntries.slice(0, 4).map(([key, value]) => (
              <MetricCard key={key} label={humanize(key)} value={String(value)} />
            ))}
          </View>
        ) : null}

        {serviceStats.length > 0 ? (
          <StatTable
            title={t('mobile.analytics.by_service')}
            rows={serviceStats}
            nameKeys={['service_name', 'name']}
            currency={currency}
          />
        ) : null}

        {isAdminArea && employeeStats.length > 0 ? (
          <StatTable
            title={t('mobile.analytics.by_employee')}
            rows={employeeStats}
            nameKeys={['employee_name', 'name']}
            currency={currency}
          />
        ) : null}

        {serviceStats.length === 0 && employeeStats.length === 0 && summaryEntries.length === 0 ? (
          <EmptyState title={t('mobile.dashboard.empty')} />
        ) : null}
      </ScrollView>
    </Screen>
  );
}

function normalizeRows(input: StatRow[] | { data?: StatRow[] } | undefined): StatRow[] {
  if (!input) return [];
  if (Array.isArray(input)) return input;
  return input.data ?? [];
}

function humanize(key: string): string {
  return key.replaceAll('_', ' ').replace(/^./, (c) => c.toUpperCase());
}

function StatTable({
  title,
  rows,
  nameKeys,
  currency,
}: {
  title: string;
  rows: StatRow[];
  nameKeys: string[];
  currency: string;
}) {
  const maxCount = Math.max(...rows.map((row) => Number(row.count ?? row.appointments ?? 0)), 1);

  return (
    <Card style={{ gap: spacing.md }}>
      <Text style={[typography.title as TextStyle, { color: palette.onSurface }]}>{title}</Text>
      {rows.map((row, index) => {
        const name = nameKeys.map((key) => row[key]).find((v) => typeof v === 'string') as string | undefined;
        const count = Number(row.count ?? row.appointments ?? 0);
        const revenue = row.revenue ?? row.total;
        return (
          <View key={index} style={{ gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text style={[typography.body as TextStyle, { color: palette.onSurface, flex: 1 }]} numberOfLines={1}>
                {name ?? '—'}
              </Text>
              <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurfaceVariant }]}>
                {count}
                {revenue != null ? ` · ${revenue} ${currency}` : ''}
              </Text>
            </View>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${(count / maxCount) * 100}%` }]} />
            </View>
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  barTrack: {
    height: 6,
    borderRadius: radius.full,
    backgroundColor: palette.surfaceContainer,
    overflow: 'hidden',
  },
  barFill: { height: 6, borderRadius: radius.full, backgroundColor: palette.primary },
});
