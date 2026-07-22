import type { AxiosError } from 'axios';
import ENV from '@/config/env';
import apiClient from '@/api/client';
import { useAuthStore } from '@/store/authStore';
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
} from '@/mocks/messaging.mock';
import type {
  Conversation,
  ConversationStatus,
  Message,
  SendMessageRequest,
} from '@/types/messaging.types';

// ─── Backend response shapes ──────────────────────────────────────────────────
// The backend uses different field names (messageContent/seen) and a leaner
// conversation shape (no otherParty / names / unread counts), so map here.

interface RawMessage {
  id: number;
  conversationId: number;
  senderUserId: number;
  messageContent: string;
  deleted: boolean;
  seen: boolean;
  seenAt: string | null;
  createdAt: string;
  editedAt: string | null;
}

interface RawConversation {
  id: number;
  listingId: number;
  listingProductName: string | null;
  buyerUserId: number;
  sellerUserId: number;
  buyerPhone: string | null;
  sellerPhone: string | null;
  buyerName: string | null;
  sellerName: string | null;
  buyerProfileImageUrl: string | null;
  sellerProfileImageUrl: string | null;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
  lastMessageSenderId: number | null;
  unreadCount: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const currentUserId = () => useAuthStore.getState().user?.id ?? '';

const mapMessage = (raw: RawMessage): Message => ({
  id: String(raw.id),
  conversationId: String(raw.conversationId),
  senderUserId: String(raw.senderUserId),
  content: raw.messageContent,
  isRead: raw.seen,
  deletedAt: raw.deleted ? raw.seenAt ?? raw.createdAt : null,
  editedAt: raw.editedAt ?? null,
  createdAt: raw.createdAt,
});

const mapConversation = (raw: RawConversation): Conversation => {
  const me = currentUserId();
  const isBuyer = String(raw.buyerUserId) === me;
  const otherId = isBuyer ? raw.sellerUserId : raw.buyerUserId;
  const otherPhone = isBuyer ? raw.sellerPhone : raw.buyerPhone;
  // Prefer the other party's name — for a seller that's their shop name. Older
  // accounts were created before sign-up saved a name, so the backend sends
  // null for those and we fall back to the phone rather than showing nothing.
  const otherName = isBuyer ? raw.sellerName : raw.buyerName;
  const otherPhoto = isBuyer ? raw.sellerProfileImageUrl : raw.buyerProfileImageUrl;
  return {
    id: String(raw.id),
    listingId: String(raw.listingId),
    listingName: raw.listingProductName ?? 'Listing',
    listingPrimaryImageUrl: null,
    buyerUserId: String(raw.buyerUserId),
    sellerUserId: String(raw.sellerUserId),
    otherParty: {
      id: String(otherId),
      fullName: otherName || otherPhone || 'ClearStock user',
      profilePhotoUrl: otherPhoto || null,
      phoneNumber: otherPhone || null,
    },
    status: (raw.status as ConversationStatus) ?? 'ACTIVE',
    buyerPhoneVisible: !!raw.buyerPhone,
    sellerPhoneVisible: !!raw.sellerPhone,
    lastMessage: raw.lastMessageContent
      ? {
          id: `${raw.id}-last`,
          content: raw.lastMessageContent,
          senderUserId: String(raw.lastMessageSenderId ?? ''),
          createdAt: raw.lastMessageAt ?? raw.updatedAt,
        }
      : null,
    unreadCount: raw.unreadCount ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
};

// ─── API ──────────────────────────────────────────────────────────────────────

// Returns null when no conversation exists yet for this listing (backend
// responds 404) — that's the normal "not started" state, not an error.
export const getConversationByListingId = async (
  listingId: string
): Promise<Conversation | null> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return MOCK_CONVERSATIONS.find((c) => c.listingId === listingId) ?? null;
  }
  try {
    const response = await apiClient.get(`/conversations/listing/${listingId}`);
    return mapConversation(response.data.data as RawConversation);
  } catch (error) {
    const axiosError = error as AxiosError;
    if (axiosError.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createConversation = async (
  listingId: string
): Promise<Conversation> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_CONVERSATIONS[0];
  }
  const response = await apiClient.post('/conversations', {
    listingId: Number(listingId),
  });
  return mapConversation(response.data.data as RawConversation);
};

export const getConversations = async (): Promise<Conversation[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_CONVERSATIONS;
  }
  const response = await apiClient.get('/conversations');
  return (response.data.data as RawConversation[]).map(mapConversation);
};

export const getConversationById = async (
  id: string
): Promise<Conversation> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const conversation = MOCK_CONVERSATIONS.find((c) => c.id === id);
    if (!conversation) {
      throw new Error('Conversation not found.');
    }
    return conversation;
  }
  const response = await apiClient.get(`/conversations/${id}`);
  return mapConversation(response.data.data as RawConversation);
};

export const getMessages = async (
  conversationId: string
): Promise<Message[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 600));
    return MOCK_MESSAGES[conversationId] ?? [];
  }
  const response = await apiClient.get(
    `/conversations/${conversationId}/messages`
  );
  return (response.data.data as RawMessage[]).map(mapMessage);
};

export const sendMessage = async (
  conversationId: string,
  data: SendMessageRequest
): Promise<Message> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId,
      senderUserId: 'user-001',
      content: data.content,
      isRead: false,
      deletedAt: null,
      editedAt: null,
      createdAt: new Date().toISOString(),
    };
    if (MOCK_MESSAGES[conversationId]) {
      MOCK_MESSAGES[conversationId].push(newMessage);
    }
    return newMessage;
  }
  // Backend expects { conversationId, messageContent }.
  const response = await apiClient.post('/messages', {
    conversationId: Number(conversationId),
    messageContent: data.content,
  });
  return mapMessage(response.data.data as RawMessage);
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }
  await apiClient.delete(`/messages/${messageId}`);
};

// Edit an own message. The backend only allows this within 3 minutes of sending.
export const editMessage = async (
  messageId: string,
  content: string
): Promise<Message> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    throw new Error('Not available in mock mode.');
  }
  const response = await apiClient.put(`/messages/${messageId}`, {
    messageContent: content,
  });
  return mapMessage(response.data.data as RawMessage);
};

// "Delete for me" — hides the conversation from the current user's inbox only.
export const deleteConversation = async (
  conversationId: string
): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }
  await apiClient.delete(`/conversations/${conversationId}`);
};
