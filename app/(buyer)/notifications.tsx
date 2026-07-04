import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/api/notifications.api';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import type { Notification } from '@/types/notification.types';

const NOTIFICATIONS_KEY = 'notifications';

const CATEGORY_ICONS: Record<string, string> = {
  MESSAGING: 'chatbubble-outline',
  PURCHASE_REQUEST: 'document-text-outline',
  LISTING: 'cube-outline',
  TRANSACTION: 'swap-horizontal-outline',
};

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: getNotifications,
  });

const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });

const { mutate: markAllRead } = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] }),
  });

  const notifications: Notification[] = data?.content ?? [];
const unreadCount = notifications.filter((n: Notification) => n.status === 'UNREAD').length;

  const renderItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => markRead(item.id)}
      style={[
        styles.notifItem,
        {
          backgroundColor:
            item.status === 'UNREAD' ? colors.secondary : colors.background,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: colors.card },
        ]}
      >
        <Ionicons
          name={(CATEGORY_ICONS[item.category] ?? 'notifications-outline') as any}
          size={20}
          color={colors.primary}
        />
      </View>
      <View style={styles.notifContent}>
        <Text style={[styles.notifTitle, { color: colors.foreground }]}>
          {item.title}
        </Text>
        <Text
          style={[styles.notifBody, { color: colors.mutedForeground }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
          {new Date(item.createdAt).toLocaleDateString('en-GH', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
      {item.status === 'UNREAD' && (
        <View
          style={[styles.unreadDot, { backgroundColor: colors.primary }]}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Notifications"
        rightElement={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={() => markAllRead()}>
              <Text style={[styles.markAll, { color: colors.primary }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : undefined
        }
      />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !isLoading ? (
            <EmptyState
              icon="notifications-outline"
              title="No notifications"
              subtitle="You are all caught up"
            />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.base,
    borderBottomWidth: 0.5,
    gap: Spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: { flex: 1 },
  notifTitle: {
    fontSize: FontSize.base,
    fontWeight: '600',
    marginBottom: 2,
  },
  notifBody: {
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  notifTime: { fontSize: FontSize.xs },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  markAll: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});