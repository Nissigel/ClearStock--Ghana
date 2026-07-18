import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useRef } from 'react';
import type { AxiosError } from 'axios';
import { useTheme } from '@/hooks/useTheme';
import { Avatar } from '@/components/ui/Avatar';
import { QuickReplies } from '@/components/ui/QuickReplies';
import {
  useMessages,
  useSendMessage,
  useConversation,
  useEditMessage,
  useDeleteMessage,
} from '@/hooks/useConversations';
import { useAuthStore } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { FontSize, Spacing, Radius } from '@/constants/theme';
import { MAX_MESSAGE_LENGTH } from '@/constants/app';
import type { Message } from '@/types/messaging.types';

export default function ConversationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [messageText, setMessageText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);

  const { data: conversation } = useConversation(id);
  const { data: messages, isLoading } = useMessages(id);
  const { mutate: send, isPending } = useSendMessage();
  const { mutate: editMessage, isPending: isEditing } = useEditMessage();
  const { mutate: deleteMessage } = useDeleteMessage();

  const EDIT_WINDOW_MS = 3 * 60 * 1000;
  const canEdit = (message: Message) =>
    message.senderUserId === currentUserId &&
    !message.deletedAt &&
    Date.now() - new Date(message.createdAt).getTime() < EDIT_WINDOW_MS;

  const busy = isPending || isEditing;

  // Buyers ask questions, sellers answer them — so the one-tap messages differ.
  const isBuyer = String(conversation?.buyerUserId) === String(currentUserId);

  // Contact details stay hidden until a purchase request has been accepted.
  // The backend already withholds them, but gate on the flag explicitly so the
  // rule is visible here rather than resting on a value happening to be null.
  const otherPhoneVisible = isBuyer
    ? conversation?.sellerPhoneVisible
    : conversation?.buyerPhoneVisible;

  // Sends straight away rather than filling the box: the point is to skip
  // typing entirely.
  const handleQuickReply = (text: string) => {
    if (busy) return;
    send(
      { conversationId: id, content: text },
      {
        onSuccess: () =>
          flatListRef.current?.scrollToEnd({ animated: true }),
      }
    );
  };

  const handleSend = () => {
    const text = messageText.trim();
    if (!text || busy) return;

    if (editingId) {
      editMessage(
        { messageId: editingId, content: text },
        {
          onSuccess: () => {
            setEditingId(null);
            setMessageText('');
          },
          onError: (err) => {
            const msg =
              (err as AxiosError<{ message?: string }>).response?.data?.message ??
              'Could not edit the message.';
            Alert.alert('Edit failed', msg);
          },
        }
      );
      return;
    }

    send(
      { conversationId: id, content: text },
      {
        onSuccess: () => {
          setMessageText('');
          flatListRef.current?.scrollToEnd({ animated: true });
        },
      }
    );
  };

  const cancelEdit = () => {
    setEditingId(null);
    setMessageText('');
  };

  const handleLongPress = (message: Message) => {
    if (message.senderUserId !== currentUserId || message.deletedAt) return;

    const options: Parameters<typeof Alert.alert>[2] = [];
    if (canEdit(message)) {
      options.push({
        text: 'Edit',
        onPress: () => {
          setEditingId(message.id);
          setMessageText(message.content);
          inputRef.current?.focus();
        },
      });
    }
    options.push({
      text: 'Delete',
      style: 'destructive',
      onPress: () =>
        Alert.alert('Delete message', 'Delete this message?', [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              if (editingId === message.id) cancelEdit();
              deleteMessage(message.id);
            },
          },
        ]),
    });
    options.push({ text: 'Cancel', style: 'cancel' });

    Alert.alert('Message', undefined, options);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = item.senderUserId === currentUserId;
    const isDeleted = !!item.deletedAt;
    const textColor = isOwn ? colors.primaryForeground : colors.foreground;
    const metaColor = isOwn ? colors.primaryForeground : colors.mutedForeground;
    return (
      <View
        style={[
          styles.messageRow,
          isOwn ? styles.ownMessageRow : styles.otherMessageRow,
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => handleLongPress(item)}
          delayLongPress={250}
          disabled={!isOwn || isDeleted}
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
              { color: textColor },
              isDeleted && styles.deletedText,
            ]}
          >
            {item.content}
          </Text>
          <View style={styles.metaRow}>
            {!isDeleted && item.editedAt && (
              <Text style={[styles.metaLabel, { color: metaColor }]}>
                edited ·{' '}
              </Text>
            )}
            <Text style={[styles.metaLabel, { color: metaColor }]}>
              {new Date(item.createdAt).toLocaleTimeString('en-GH', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: colors.brandGreen }]}
      edges={['top']}
    >
      {/* Green header, matching the rest of the app */}
      <View style={[styles.header, { backgroundColor: colors.brandGreen }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="chevron-back"
            size={26}
            color={colors.brandGreenForeground}
          />
        </TouchableOpacity>
        <Avatar
          uri={conversation?.otherParty.profilePhotoUrl}
          name={conversation?.otherParty.fullName}
          size="md"
        />
        <View style={styles.headerText}>
          <Text
            style={[styles.headerName, { color: colors.brandGreenForeground }]}
            numberOfLines={1}
          >
            {conversation?.otherParty.fullName ?? 'Conversation'}
          </Text>
          {/* No number here — it appears once in the contact banner below,
              and only after a purchase request has been accepted. */}
          {!!conversation?.listingName && (
            <Text
              style={[styles.headerSub, { color: colors.brandGreenMuted }]}
              numberOfLines={1}
            >
              {isBuyer ? 'Seller' : 'Buyer'}
            </Text>
          )}
        </View>
      </View>

      <KeyboardAvoidingView
        style={[styles.flex, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Sits below the green band, on the conversation surface — tap it to
            open the listing being discussed. */}
        {!!conversation?.listingName && (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(buyer)/(tabs)/listing/[id]',
                params: { id: String(conversation.listingId) },
              })
            }
            activeOpacity={0.8}
            style={[
              styles.listingCard,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Ionicons name="pricetag-outline" size={16} color={colors.primary} />
            <View style={styles.listingCardText}>
              <Text
                style={[styles.listingCardLabel, { color: colors.mutedForeground }]}
              >
                Discussing listing
              </Text>
              <Text
                style={[styles.listingCardName, { color: colors.primary }]}
                numberOfLines={1}
              >
                {conversation.listingName}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.mutedForeground}
            />
          </TouchableOpacity>
        )}

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
        {/* Contact is revealed only once a purchase request has been accepted.
            Gated on the other party's flag — it previously always checked the
            buyer's, which only worked because both flip together. */}
        {otherPhoneVisible && conversation?.otherParty.phoneNumber && (
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

        {/* Editing banner */}
        {editingId && (
          <View
            style={[
              styles.editingBanner,
              { backgroundColor: colors.secondary, borderColor: colors.border },
            ]}
          >
            <Ionicons name="pencil" size={14} color={colors.primary} />
            <Text style={[styles.editingText, { color: colors.primary }]}>
              Editing message
            </Text>
            <TouchableOpacity onPress={cancelEdit} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* One-tap messages, so a deal doesn't depend on typing English. */}
        {!editingId && (
          <QuickReplies
            role={isBuyer ? 'BUYER' : 'SELLER'}
            onSelect={handleQuickReply}
            disabled={busy}
          />
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
            ref={inputRef}
            value={messageText}
            onChangeText={setMessageText}
            placeholder={editingId ? 'Edit your message...' : 'Type a message...'}
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
            disabled={!messageText.trim() || busy}
            style={[
              styles.sendButton,
              {
                backgroundColor:
                  messageText.trim() ? colors.primary : colors.muted,
              },
            ]}
          >
            <Ionicons
              name={editingId ? 'checkmark' : 'send'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xs,
    paddingBottom: Spacing.md,
  },
  headerText: {
    flex: 1,
  },
  headerName: {
    fontSize: FontSize.md,
    fontWeight: 'bold',
  },
  headerSub: {
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  listingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: 0.5,
    borderRadius: Radius.lg,
  },
  listingCardText: {
    flex: 1,
  },
  listingCardLabel: {
    fontSize: FontSize.xs,
  },
  listingCardName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
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
  deletedText: {
    fontStyle: 'italic',
    opacity: 0.7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  metaLabel: {
    fontSize: FontSize.xs,
    opacity: 0.7,
  },
  editingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: 0.5,
  },
  editingText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontWeight: '600',
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