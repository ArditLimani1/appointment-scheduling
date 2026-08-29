import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View, type TextStyle } from 'react-native';
import { useUnreadNotificationCount } from '@/api/queries';
import { palette, radius, typography } from '@/theme/tokens';

/**
 * Header bell with an unread badge — the mobile counterpart of the web's
 * `EmployeeNotificationBell`. Same badge treatment: error fill, `9+` past nine.
 */
export function NotificationBell() {
  const router = useRouter();
  const { data } = useUnreadNotificationCount();
  const unread = data?.meta?.total ?? 0;

  return (
    <Pressable
      onPress={() => router.push('/(app)/notifications')}
      hitSlop={8}
      style={({ pressed }) => [styles.button, pressed && { opacity: 0.6 }]}
      accessibilityRole="button"
      accessibilityLabel={String(unread)}
    >
      <Ionicons name="notifications-outline" size={22} color={palette.onSurface} />
      {unread > 0 ? (
        <View style={styles.badge}>
          <Text style={[typography.overline as TextStyle, styles.badgeText]} numberOfLines={1}>
            {unread > 9 ? '9+' : unread}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 18,
    height: 18,
    borderRadius: radius.full,
    paddingHorizontal: 4,
    backgroundColor: palette.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: palette.onError, fontSize: 10, lineHeight: 12 },
});
