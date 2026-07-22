import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useCallback } from 'react';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { getUnreadCount } from '@/api/notifications.api';
import { useAuthStore } from '@/store/authStore';
import { Radius, FontSize } from '@/constants/theme';

export const NOTIFICATIONS_UNREAD_KEY = 'notifications-unread';

interface NotificationBellProps {
  /** Matches the sizing of whatever it sits next to (e.g. the theme toggle). */
  size?: number;
}

/**
 * Bell with an unread badge, for the buyer and seller home headers.
 *
 * Notifications already reach both sides — a seller is told the moment a
 * payment lands — but there was nowhere to see them without opening a
 * transaction, so they went unnoticed.
 */
export const NotificationBell = ({ size = 18 }: NotificationBellProps) => {
  const { colors } = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const { data, refetch } = useQuery({
    queryKey: [NOTIFICATIONS_UNREAD_KEY],
    queryFn: getUnreadCount,
    // Guests have no notifications, and the endpoint needs a token.
    enabled: isAuthenticated,
  });

  // React Query doesn't refetch on focus in React Native, and these headers sit
  // on tab screens that stay mounted — so the count would otherwise go stale
  // the moment you read your notifications and come back.
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) refetch();
    }, [isAuthenticated, refetch])
  );

  if (!isAuthenticated) return null;

  const count = data?.count ?? 0;

  return (
    <TouchableOpacity
      onPress={() => router.push('/(buyer)/(screens)/notifications')}
      style={[styles.button, { backgroundColor: colors.secondary }]}
      accessibilityRole="button"
      accessibilityLabel={
        count > 0 ? `Notifications, ${count} unread` : 'Notifications'
      }
    >
      <Ionicons
        name="notifications-outline"
        size={size}
        color={colors.foreground}
      />
      {count > 0 && (
        <View
          style={[
            styles.badge,
            {
              backgroundColor: colors.destructive,
              borderColor: colors.background,
            },
          ]}
        >
          <Text style={styles.badgeText} numberOfLines={1}>
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
});
