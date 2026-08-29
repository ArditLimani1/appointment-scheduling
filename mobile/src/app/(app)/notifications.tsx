import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from '@/api/queries';
import type { NotificationItem } from '@/api/types';
import { Screen } from '@/components/Screen';
import { Button, Card, EmptyState, LoadingView, Segmented } from '@/components/ui';
import { useT } from '@/i18n';
import { toIsoDate, toHm } from '@/utils/datetime';
import { palette, spacing, typography } from '@/theme/tokens';
import { DateTime } from 'luxon';

export default function NotificationsScreen() {
  const { t, locale } = useT();
  const [scope, setScope] = useState<'unread' | 'all'>('unread');

  const query = useNotifications(scope);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const rows = query.data?.data ?? [];

  return (
    <Screen
      hideBell
      title={t('mobile.notifications.title')}
      right={
        rows.length > 0 && scope === 'unread' ? (
          <Button
            title={t('mobile.notifications.mark_all')}
            variant="ghost"
            onPress={() => markAll.mutate(undefined as never)}
          />
        ) : undefined
      }
    >
      <View style={{ gap: spacing.md, flex: 1 }}>
        <Segmented
          options={[
            { value: 'unread' as const, label: t('mobile.notifications.unread') },
            { value: 'all' as const, label: t('mobile.notifications.all') },
          ]}
          value={scope}
          onChange={setScope}
        />

        {query.isLoading ? (
          <LoadingView />
        ) : (
          <FlatList
            data={rows}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationCard
                item={item}
                locale={locale}
                onPress={() => {
                  if (!item.read_at) markRead.mutate({ id: item.id });
                }}
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
            ListEmptyComponent={<EmptyState title={t('mobile.notifications.empty')} />}
            refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
            contentContainerStyle={{ paddingBottom: spacing.xxl, flexGrow: 1 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </Screen>
  );
}

function NotificationCard({
  item,
  locale,
  onPress,
}: {
  item: NotificationItem;
  locale: string;
  onPress: () => void;
}) {
  const { t } = useT();
  const services = (item.data.services ?? []).map((s) => s.name).filter(Boolean).join(', ');
  const when = DateTime.fromISO(item.created_at).setLocale(locale).toRelative() ?? '';
  // Watchers need to know whose appointment it is; your own reads better plain.
  const watchedEmployee = item.data.for_other_staff ? (item.data.employee_name ?? '') : '';
  const title = watchedEmployee
    ? t('employee.notifications.new_booking_for_title', { employee: watchedEmployee })
    : t('employee.notifications.new_booking_title');

  return (
    <Card style={[styles.card, !item.read_at && styles.unread]}>
      <View style={{ flex: 1, gap: 2 }} onTouchEnd={onPress}>
        <Text style={[typography.overline as TextStyle, { color: palette.onSurfaceVariant }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[typography.bodyStrong as TextStyle, { color: palette.onSurface }]} numberOfLines={1}>
          {item.data.client_name ?? item.data.business_name ?? '—'}
        </Text>
        <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]} numberOfLines={2}>
          {[services, toIsoDate(item.data.date), toHm(item.data.start_time)].filter(Boolean).join(' · ')}
        </Text>
        <Text style={[typography.caption as TextStyle, { color: palette.outline }]}>{when}</Text>
      </View>
      {!item.read_at ? <View style={styles.dot} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  unread: { borderColor: palette.primaryFixedDim },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.onPrimaryFixedVariant },
});
