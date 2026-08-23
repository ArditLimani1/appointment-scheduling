import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { useAuth } from '@/auth/store';
import { useT } from '@/i18n';
import { usePushRegistration } from '@/push/usePushRegistration';
import { palette } from '@/theme/tokens';

export default function AppLayout() {
  const { t } = useT();
  const me = useAuth((s) => s.me);
  const hasPermission = useAuth((s) => s.hasPermission);

  usePushRegistration();

  const isAdminArea = me?.features.admin_panel ?? false;
  const canSeeAppointments = isAdminArea
    ? hasPermission('admin.appointments')
    : hasPermission('employee.appointments') || hasPermission('employee.dashboard');
  const canManage =
    isAdminArea &&
    (hasPermission('admin.employees') ||
      hasPermission('admin.services') ||
      hasPermission('admin.roles') ||
      hasPermission('admin.settings') ||
      hasPermission('admin.shared_resources') ||
      hasPermission('admin.analytics'));

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.onSurfaceVariant,
        tabBarStyle: { backgroundColor: palette.surfaceContainerLowest },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('mobile.tabs.dashboard'),
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: t('mobile.tabs.calendar'),
          href: canSeeAppointments ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: t('mobile.tabs.appointments'),
          href: canSeeAppointments ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: t('mobile.tabs.manage'),
          href: canManage ? undefined : null,
          tabBarIcon: ({ color, size }) => <Ionicons name="briefcase-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t('mobile.tabs.more'),
          tabBarIcon: ({ color, size }) => <Ionicons name="menu-outline" color={color} size={size} />,
        }}
      />

      {/* stack-only screens hidden from the tab bar */}
      <Tabs.Screen name="create" options={{ href: null }} />
      <Tabs.Screen name="employees" options={{ href: null }} />
      <Tabs.Screen name="services" options={{ href: null }} />
      <Tabs.Screen name="roles" options={{ href: null }} />
      <Tabs.Screen name="resources" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="analytics" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="schedule-config" options={{ href: null }} />
    </Tabs>
  );
}
