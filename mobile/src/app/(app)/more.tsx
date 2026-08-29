import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, Text, View, type TextStyle } from 'react-native';
import { api, setApiLocale } from '@/api/client';
import { useAuth } from '@/auth/store';
import { Screen } from '@/components/Screen';
import { Button, Card, ListRow, Segmented } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, spacing, typography } from '@/theme/tokens';

export default function MoreScreen() {
  const { t, locale, setLocale } = useT();
  const router = useRouter();
  const me = useAuth((s) => s.me);
  const signOut = useAuth((s) => s.signOut);
  const refreshMe = useAuth((s) => s.refreshMe);
  const hasPermission = useAuth((s) => s.hasPermission);

  const isAdminArea = me?.features.admin_panel ?? false;
  const showEmployeeSection = !isAdminArea || (me?.user.also_works_as_staff ?? false);
  const showSchedule = showEmployeeSection && hasPermission('employee.schedule');
  const showAnalytics = showEmployeeSection && !isAdminArea && hasPermission('employee.analytics');

  const changeLocale = (next: string) => {
    setLocale(next);
    setApiLocale(next);
    void api('/me/locale', { method: 'PUT', body: { locale: next } })
      .then(() => refreshMe())
      .catch(() => {});
  };

  const confirmLogout = () => {
    Alert.alert(t('mobile.more.logout'), t('mobile.more.logout_confirm'), [
      { text: t('mobile.common.cancel'), style: 'cancel' },
      { text: t('mobile.more.logout'), style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  return (
    <Screen title={t('mobile.more.title')}>
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <Card style={{ gap: 2 }}>
          <Text style={[typography.title as TextStyle, { color: palette.onSurface }]}>{me?.user.name}</Text>
          <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>{me?.user.email}</Text>
          {me?.business ? (
            <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>{me.business.name}</Text>
          ) : null}
        </Card>

        {/* Notifications are not listed here: the bell in the header of every
            screen is the single entry point, as on the web. */}
        {showSchedule || showAnalytics ? (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            {showSchedule ? (
              <>
                <ListRow
                  title={t('mobile.more.schedule')}
                  onPress={() => router.push('/(app)/schedule')}
                  right={<Ionicons name="time-outline" size={20} color={palette.onSurfaceVariant} />}
                />
                <ListRow
                  title={t('mobile.more.schedule_config')}
                  onPress={() => router.push('/(app)/schedule-config')}
                  right={<Ionicons name="construct-outline" size={20} color={palette.onSurfaceVariant} />}
                />
              </>
            ) : null}
            {showAnalytics ? (
              <ListRow
                title={t('mobile.more.analytics')}
                onPress={() => router.push('/(app)/analytics')}
                right={<Ionicons name="bar-chart-outline" size={20} color={palette.onSurfaceVariant} />}
              />
            ) : null}
          </Card>
        ) : null}

        <Card style={{ gap: spacing.sm }}>
          <Text style={[typography.label as TextStyle, { color: palette.onSurfaceVariant }]}>
            {t('mobile.more.language')}
          </Text>
          <Segmented
            options={[
              { value: 'sq', label: 'Shqip' },
              { value: 'en', label: 'English' },
            ]}
            value={locale}
            onChange={changeLocale}
          />
        </Card>

        <Button title={t('mobile.more.logout')} variant="danger" onPress={confirmLogout} />
      </ScrollView>
    </Screen>
  );
}
