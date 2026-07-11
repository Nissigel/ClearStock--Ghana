import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useMessages, useSendMessage, useConversation } from '@/hooks/useConversations';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { MAX_MESSAGE_LENGTH } from '@/constants/app';
import type { Message } from '@/types/messaging.types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const { data: conversation } = useConversation(id);
  const { data: messages, isLoading } = useMessages(id);
  const { mutate: send, isPending } = useSendMessage();

  const handleSend = () => {
    if (!messageText.trim() || isPending) return;
    send(
      { conversationId: id, content: messageText.trim() },
      {
        onSuccess: () => {
          setMessageText('');
          flatListRef.current?.scrollToEnd({ animated: true });
        },
      }
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderUserId === currentUserId;
    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.ownMessageRow : styles.otherMessageRow,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            {
              backgroundColor: isOwn ? colors.primary : colors.card,
              borderColor: isOwn ? colors.primary : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              { color: isOwn ? colors.primaryForeground : colors.foreground },
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              {
                color: isOwn
                  ? colors.primaryForeground
                  : colors.mutedForeground,
                opacity: 0.7,
              },
            ]}
          >
            {new Date(item.createdAt).toLocaleTimeString('en-GH', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.background }]}
    >
      <ScreenHeader
        showBack
        title={conversation?.otherParty.fullName ?? 'Conversation'}
        rightElement={
          conversation?.listingName ? (
            <Text
              style={[styles.listingTag, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {conversation.listingName}
            </Text>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: false })
          }
          ListEmptyComponent={
            !isLoading ? (
              <View style={styles.emptyMessages}>
                <Text
                  style={[
                    styles.emptyText,
                    { color: colors.mutedForeground },
                  ]}
                >
                  No messages yet. Say hello!
                </Text>
              </View>
            ) : null
          }
        />

        {/* Phone reveal banner */}
        {conversation?.buyerPhoneVisible && conversation?.otherParty.phoneNumber && (
          <View
            style={[
              styles.phoneBanner,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Ionicons name="call-outline" size={16} color={colors.primary} />
            <Text style={[styles.phoneText, { color: colors.primary }]}>
              {conversation.otherParty.phoneNumber}
            </Text>
          </View>
        )}

        {/* Message Input */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          <TextInput
            value={messageText}
            onChangeText={setMessageText}
            placeholder="Type a message..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            maxLength={MAX_MESSAGE_LENGTH}
            style={[
              styles.textInput,
              {
                color: colors.foreground,
                backgroundColor: colors.card,
                borderColor: colors.input,
              },
            ]}
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!messageText.trim() || isPending}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  messageText.trim() ? colors.primary : colors.muted,
              },
            ]}
          >
            <Ionicons
              name="send"
              size={18}
              color={
                messageText.trim()
                  ? colors.primaryForeground
                  : colors.mutedForeground
              }
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  messagesList: {
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  messageRow: {
    marginBottom: Spacing.sm,
  },
  ownMessageRow: {
    alignItems: 'flex-end',
  },
  otherMessageRow: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
  },
  messageText: {
    fontSize: FontSize.base,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: FontSize.xs,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  listingTag: {
    fontSize: FontSize.xs,
    maxWidth: 100,
  },
  phoneBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: Spacing.md,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  phoneText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    gap: Spacing.sm,
    borderTopWidth: 0.5,
  },
  textInput: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.base,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMessages: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing['4xl'],
  },
  emptyText: {
    fontSize: FontSize.sm,
  },
});