import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import React from 'react';
import { ScrollView, View } from 'react-native';
import { useAuth } from '@/auth/store';
import { Screen } from '@/components/Screen';
import { Card, ListRow } from '@/components/ui';
import { useT } from '@/i18n';
import { palette, spacing } from '@/theme/tokens';
import type { PermissionKey } from '@/api/types';

export default function ManageScreen() {
  const { t } = useT();
  const router = useRouter();
  const me = useAuth((s) => s.me);
  const hasPermission = useAuth((s) => s.hasPermission);

  const entries: { key: string; icon: keyof typeof Ionicons.glyphMap; href: Href; permission: PermissionKey; visible?: boolean }[] = [
    { key: 'employees', icon: 'people-outline', href: '/(app)/employees', permission: 'admin.employees' },
    { key: 'services', icon: 'cut-outline', href: '/(app)/services', permission: 'admin.services' },
    { key: 'roles', icon: 'key-outline', href: '/(app)/roles', permission: 'admin.roles' },
    {
      key: 'resources',
      icon: 'cube-outline',
      href: '/(app)/resources',
      permission: 'admin.shared_resources',
      visible: me?.business?.uses_shared_resources ?? false,
    },
    { key: 'analytics', icon: 'bar-chart-outline', href: '/(app)/analytics', permission: 'admin.analytics' },
    { key: 'settings', icon: 'settings-outline', href: '/(app)/settings', permission: 'admin.settings' },
  ];

  return (
    <Screen title={t('mobile.manage.title')}>
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {entries
            .filter((entry) => hasPermission(entry.permission) && (entry.visible ?? true))
            .map((entry) => (
              <ListRow
                key={entry.key}
                title={t(`mobile.manage.${entry.key}`)}
                onPress={() => router.push(entry.href)}
                right={
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <Ionicons name={entry.icon} size={20} color={palette.onSurfaceVariant} />
                    <Ionicons name="chevron-forward" size={16} color={palette.outline} />
                  </View>
                }
              />
            ))}
        </Card>
      </ScrollView>
    </Screen>
  );
}
