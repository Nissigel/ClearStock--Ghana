import type { AxiosError } from 'axios';
import ENV from '@/config/env';
import apiClient from '@/api/client';
import {
  MOCK_CONVERSATIONS,
  MOCK_MESSAGES,
} from '@/mocks/messaging.mock';
import type {
  Conversation,
  Message,
  SendMessageRequest,
} from '@/types/messaging.types';

// Returns null when no conversation exists yet for this listing (backend
// responds 404) — that's the normal "not started" state, not an error.
export const getConversationByListingId = async (
  listingId: string
): Promise<Conversation | null> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return (
      MOCK_CONVERSATIONS.find((c) => c.listingId === listingId) ?? null
    );
  }
  try {
    const response = await apiClient.get(
      `/conversations/listing/${listingId}`
    );
    return response.data.data as Conversation;
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
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      listingId,
      listingName: '',
      listingPrimaryImageUrl: null,
      buyerUserId: 'user-001',
      sellerUserId: 'user-002',
      otherParty: {
        id: 'user-002',
        fullName: 'Seller',
        profilePhotoUrl: null,
        phoneNumber: null,
      },
      status: 'ACTIVE',
      buyerPhoneVisible: false,
      sellerPhoneVisible: false,
      lastMessage: null,
      unreadCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_CONVERSATIONS.unshift(newConversation);
    return newConversation;
  }
  const response = await apiClient.post('/conversations', { listingId });
  return response.data.data as Conversation;
};

export const getConversations = async (): Promise<Conversation[]> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 800));
    return MOCK_CONVERSATIONS;
  }
  const response = await apiClient.get('/conversations');
  return response.data.data as Conversation[];
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
  return response.data.data as Conversation;
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
  return response.data.data as Message[];
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
      createdAt: new Date().toISOString(),
    };
    if (MOCK_MESSAGES[conversationId]) {
      MOCK_MESSAGES[conversationId].push(newMessage);
    }
    return newMessage;
  }
  const response = await apiClient.post('/messages', {
    conversationId,
    ...data,
  });
  return response.data.data as Message;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }
  await apiClient.delete(`/messages/${messageId}`);
};