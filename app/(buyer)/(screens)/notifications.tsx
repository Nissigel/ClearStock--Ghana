import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRef } from 'react';
import { useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { NOTIFICATIONS_UNREAD_KEY } from '@/components/ui/NotificationBell';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNotifications,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
} from '@/api/notifications.api';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import type {
  Notification,
  NotificationListResponse,
} from '@/types/notification.types';
import { useModeStore } from '@/store/modeStore';
import { USER_MODE } from '@/constants/app';

const NOTIFICATIONS_KEY = 'notifications';

// Where a notification should take you when tapped, from the reference the
// backend attaches to it. Returns null when there is nothing specific to open
// (for example account notices), in which case tapping only marks it read.
function targetFor(item: Notification, isSeller: boolean): Href | null {
  const id = item.referenceId ?? undefined;
  switch (item.referenceType) {
    case 'transaction':
      if (!id) return null;
      // Buyer and seller each have their own order screen; the buyer's is where
      // "Pay now" lives, which is exactly where an "accepted — please pay"
      // notification should land.
      return isSeller
        ? { pathname: '/(seller)/(screens)/transaction-detail/[id]', params: { id } }
        : { pathname: '/(buyer)/(screens)/transaction-detail/[id]', params: { id } };
    case 'listing':
      return id ? { pathname: '/(buyer)/(tabs)/listing/[id]', params: { id } } : null;
    case 'conversation':
      return id ? { pathname: '/(buyer)/(screens)/conversation/[id]', params: { id } } : null;
    case 'purchase_request':
      // Sellers act on incoming requests from their Requests tab; a buyer's
      // request notification points at the request itself.
      return isSeller
        ? '/(seller)/(tabs)/requests'
        : id
          ? { pathname: '/(buyer)/(screens)/purchase-requests/[id]', params: { id } }
          : null;
    default:
      return null;
  }
}

const CATEGORY_ICONS: Record<string, string> = {
  MESSAGING: 'chatbubble-outline',
  PURCHASE_REQUEST: 'document-text-outline',
  LISTING: 'cube-outline',
  TRANSACTION: 'swap-horizontal-outline',
  ACCOUNT: 'shield-checkmark-outline',
};

interface NotificationRowProps {
  item: Notification;
  colors: ReturnType<typeof useTheme>['colors'];
  onToggle: (item: Notification) => void;
  onOpen: (item: Notification) => void;
}

// One notification row with a left-swipe action that toggles read/unread.
function NotificationRow({ item, colors, onToggle, onOpen }: NotificationRowProps) {
  const swipeRef = useRef<Swipeable>(null);
  const isUnread = item.status === 'UNREAD';

  const renderRightActions = () => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => {
        onToggle(item);
        swipeRef.current?.close();
      }}
      style={[
        styles.swipeAction,
        { backgroundColor: isUnread ? colors.primary : colors.muted },
      ]}
    >
      <Ionicons
        name={isUnread ? 'checkmark-done' : 'mail-unread-outline'}
        size={20}
        color={isUnread ? colors.primaryForeground : colors.foreground}
      />
      <Text
        style={[
          styles.swipeActionText,
          { color: isUnread ? colors.primaryForeground : colors.foreground },
        ]}
      >
        {isUnread ? 'Read' : 'Unread'}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onOpen(item)}
        style={[
          styles.notifItem,
          {
            backgroundColor: isUnread ? colors.secondary : colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.card }]}>
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
        {isUnread && (
          <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
        )}
      </TouchableOpacity>
    </Swipeable>
  );
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentMode = useModeStore((state) => state.currentMode);
  const isSeller = currentMode === USER_MODE.SELLER;
  const switchToBuyer = useModeStore((state) => state.switchToBuyer);
  const switchToSeller = useModeStore((state) => state.switchToSeller);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: [NOTIFICATIONS_KEY],
    queryFn: getNotifications,
  });

  // Optimistically patch the cached list so the UI reflects the change instantly
  // (and doesn't depend on a refetch round-trip that may lag), then reconcile.
  const patch = (updater: (list: Notification[]) => Notification[]) =>
    queryClient.setQueryData<NotificationListResponse>([NOTIFICATIONS_KEY], (old) =>
      old ? { ...old, content: updater(old.content) } : old
    );

  const snapshot = async () => {
    await queryClient.cancelQueries({ queryKey: [NOTIFICATIONS_KEY] });
    return queryClient.getQueryData<NotificationListResponse>([NOTIFICATIONS_KEY]);
  };
  const rollback = (_e: unknown, _v: unknown, ctx: any) => {
    if (ctx?.prev) queryClient.setQueryData([NOTIFICATIONS_KEY], ctx.prev);
  };
  const reconcile = () => {
    queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_KEY] });
    // The home headers show an unread badge off a separate count endpoint, so
    // it has to be refreshed alongside the list or it keeps showing the old
    // number after you've read something.
    queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_UNREAD_KEY] });
  };

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onMutate: async (id) => {
      const prev = await snapshot();
      patch((list) =>
        list.map((n) => (n.id === id ? { ...n, status: 'READ' as const } : n))
      );
      return { prev };
    },
    onError: rollback,
    onSettled: reconcile,
  });

  const { mutate: markUnread } = useMutation({
    mutationFn: (id: string) => markNotificationAsUnread(id),
    onMutate: async (id) => {
      const prev = await snapshot();
      patch((list) =>
        list.map((n) => (n.id === id ? { ...n, status: 'UNREAD' as const } : n))
      );
      return { prev };
    },
    onError: rollback,
    onSettled: reconcile,
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onMutate: async () => {
      const prev = await snapshot();
      patch((list) => list.map((n) => ({ ...n, status: 'READ' as const })));
      return { prev };
    },
    onError: rollback,
    onSettled: reconcile,
  });

  const toggle = (item: Notification) => {
    if (item.status === 'UNREAD') markRead(item.id);
    else markUnread(item.id);
  };

  // Marks a notification read and, where it points at something, opens it. The
  // buyer and seller screens live in separate stacks, so `asSeller` picks which
  // one to land on.
  const openInMode = (item: Notification, asSeller: boolean) => {
    if (item.status === 'UNREAD') markRead(item.id);
    const target = targetFor(item, asSeller);
    if (target) router.push(target);
  };

  // Tapping the body of a notification marks it read and, where it points at
  // something, takes the user there — e.g. an accepted request to the order so
  // they can pay, a message notice to the conversation.
  //
  // One account is both buyer and seller sharing a single inbox, so a
  // notification meant for the other mode can't be opened from here: its
  // screen lives in the other tab navigator, and opening it in the current
  // mode would show "request not found". Instead we offer to switch modes.
  const open = (item: Notification) => {
    const currentRole = isSeller ? 'SELLER' : 'BUYER';
    const requiredRole = item.role;
    if (requiredRole && requiredRole !== currentRole) {
      const targetMode = requiredRole === 'SELLER' ? 'seller' : 'buyer';
      Alert.alert(
        `Switch to ${targetMode} mode`,
        `This notification is for your ${targetMode} account. Switch to ${targetMode} mode to view it.`,
        [
          { text: 'Not now', style: 'cancel' },
          {
            text: `Switch to ${targetMode} mode`,
            onPress: () => {
              if (requiredRole === 'SELLER') switchToSeller();
              else switchToBuyer();
              openInMode(item, requiredRole === 'SELLER');
            },
          },
        ]
      );
      return;
    }
    openInMode(item, isSeller);
  };

  const notifications: Notification[] = data?.content ?? [];
  const unreadCount = notifications.filter((n) => n.status === 'UNREAD').length;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title="Notifications"
        onBackPress={() => router.back()}
      />
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationRow item={item} colors={colors} onToggle={toggle} onOpen={open} />
        )}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          notifications.length > 0 ? (
            <View style={styles.listHeader}>
              <Text style={[styles.hint, { color: colors.mutedForeground }]}>
                Swipe left to mark read or unread
              </Text>
              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={() => markAllRead(undefined)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  style={[
                    styles.markAllPill,
                    { backgroundColor: colors.secondary },
                  ]}
                >
                  <Ionicons name="checkmark-done" size={14} color={colors.primary} />
                  <Text style={[styles.markAllText, { color: colors.primary }]}>
                    Mark all read
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null
        }
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
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  hint: {
    flex: 1,
    fontSize: FontSize.xs,
  },
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
  swipeAction: {
    width: 92,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  swipeActionText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  markAllPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  markAllText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});
