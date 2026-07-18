import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { BrandHeader } from '@/components/ui/BrandHeader';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingGrid } from '@/components/ui/LoadingGrid';
import {
  useConversations,
  useDeleteConversation,
} from '@/hooks/useConversations';
import { useNotificationStore } from '@/store/notificationStore';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import type { Conversation } from '@/types/messaging.types';

export default function ConversationsScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();
  const { mutate: deleteConversation } = useDeleteConversation();
  const resetUnreadCount = useNotificationStore((state) => state.resetUnreadCount);

  const handleConversationPress = (conversation: Conversation) => {
    resetUnreadCount();
    router.push({
      pathname: '/(buyer)/(screens)/conversation/[id]',
      params: { id: conversation.id },
    });
  };

  const handleConversationLongPress = (conversation: Conversation) => {
    Alert.alert(
      'Delete chat',
      `Delete your conversation with ${conversation.otherParty.fullName}? It will be removed from your inbox.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(conversation.id),
        },
      ]
    );
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

  const all = conversations ?? [];
  const totalUnread = all.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0);

  // Filter on the party, the listing and the last message — the three things
  // someone would actually remember a chat by.
  const term = search.trim().toLowerCase();
  const visible = term
    ? all.filter((c) =>
        [c.otherParty.fullName, c.listingName, c.lastMessage?.content]
          .filter(Boolean)
          .some((field) => String(field).toLowerCase().includes(term))
      )
    : all;

  if (isLoading) return <LoadingGrid />;

  return (
    // Top edge only, so the green doesn't reappear above the tab bar.
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brandGreen }]}
      edges={['top']}
    >
      <BrandHeader
        title="Messages"
        badge={totalUnread > 0 ? `${totalUnread} new` : null}
        search={{
          value: search,
          onChangeText: setSearch,
          placeholder: 'Search conversations...',
        }}
      />

      <View style={[styles.list, { backgroundColor: colors.background }]}>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.id}
        onRefresh={refetch}
        refreshing={isRefetching}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubble-outline"
            title={term ? 'No matches' : 'No conversations yet'}
            subtitle={
              term
                ? `Nothing matches "${search}"`
                : 'Contact a seller to start a conversation'
            }
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handleConversationPress(item)}
            onLongPress={() => handleConversationLongPress(item)}
            delayLongPress={300}
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  list: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -8,
    overflow: 'hidden',
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