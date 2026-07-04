import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConversations,
  getConversationById,
  getMessages,
  sendMessage,
  deleteMessage,
} from '@/api/messaging.api';

export const CONVERSATIONS_KEY = 'conversations';
export const MESSAGES_KEY = 'messages';

export const useConversations = () => {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY],
    queryFn: getConversations,
  });
};

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: [CONVERSATIONS_KEY, id],
    queryFn: () => getConversationById(id),
    enabled: !!id,
  });
};

export const useMessages = (conversationId: string) => {
  return useQuery({
    queryKey: [MESSAGES_KEY, conversationId],
    queryFn: () => getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      conversationId,
      content,
    }: {
      conversationId: string;
      content: string;
    }) => sendMessage(conversationId, { content }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [MESSAGES_KEY, variables.conversationId],
      });
      queryClient.invalidateQueries({
        queryKey: [CONVERSATIONS_KEY],
      });
    },
  });
};

export const useDeleteMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (messageId: string) => deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [MESSAGES_KEY] });
    },
  });
};