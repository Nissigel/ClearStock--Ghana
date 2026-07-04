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
  const response = await apiClient.post(
    `/conversations/${conversationId}/messages`,
    data
  );
  return response.data.data as Message;
};

export const deleteMessage = async (messageId: string): Promise<void> => {
  if (ENV.USE_MOCK) {
    await new Promise((resolve) => setTimeout(resolve, 400));
    return;
  }
  await apiClient.delete(`/messages/${messageId}`);
};