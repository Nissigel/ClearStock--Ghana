import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingGrid } from '@/components/ui/LoadingGrid';
import { useConversations } from '@/hooks/useConversations';
import { useNotificationStore } from '@/store/notificationStore';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import type { Conversation } from '@/types/messaging.types';

export default function ConversationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const resetUnreadCount = useNotificationStore((state) => state.resetUnreadCount);

  const handleConversationPress = (conversation: Conversation) => {
    resetUnreadCount();
    router.push({
      pathname: '/(buyer)/conversation/[id]',
      params: { id: conversation.id },
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-GH', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) {
      return date.toLocaleDateString('en-GH', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-GH', {
      day: 'numeric',
      month: 'short',
    });
  };

  if (isLoading) return <LoadingGrid />;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader showBack={false} title="Messages" />

      <FlatList
        data={conversations ?? []}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-outline"
            title="No conversations yet"
            subtitle="Contact a seller to start a conversation"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleConversationPress(item)}
            style={[
              styles.conversationItem,
              { borderBottomColor: colors.border },
            ]}
            activeOpacity={0.7}
          >
            <Avatar name={item.otherParty.fullName} size="lg" />

            <View style={styles.conversationContent}>
              <View style={styles.conversationHeader}>
                <Text
                  style={[styles.partyName, { color: colors.foreground }]}
                  numberOfLines={1}
                >
                  {item.otherParty.fullName}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    { color: colors.mutedForeground },
                  ]}
                >
                  {item.lastMessage
                    ? formatTime(item.lastMessage.createdAt)
                    : ''}
                </Text>
              </View>

              <Text
                style={[
                  styles.listingName,
                  { color: colors.mutedForeground },
                ]}
                numberOfLines={1}
              >
                {item.listingName}
              </Text>

              <View style={styles.lastMessageRow}>
                <Text
                  style={[
                    styles.lastMessage,
                    {
                      color:
                        item.unreadCount > 0
                          ? colors.foreground
                          : colors.mutedForeground,
                      fontWeight: item.unreadCount > 0 ? '600' : '400',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage?.content ?? 'No messages yet'}
                </Text>
                {item.unreadCount > 0 && (
                  <View
                    style={[
                      styles.unreadBadge,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        styles.unreadCount,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      {item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 0.5,
    gap: Spacing.md,
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  partyName: {
    fontSize: FontSize.base,
    fontWeight: '600',
    flex: 1,
  },
  timestamp: {
    fontSize: FontSize.xs,
    marginLeft: Spacing.sm,
  },
  listingName: {
    fontSize: FontSize.xs,
    marginBottom: 4,
  },
  lastMessageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: FontSize.sm,
    flex: 1,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: Spacing.sm,
  },
  unreadCount: {
    fontSize: FontSize.xs,
    fontWeight: 'bold',
  },
});