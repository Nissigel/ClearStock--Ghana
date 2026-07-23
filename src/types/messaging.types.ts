export interface Conversation {
  id: string;
  listingId: string;
  listingName: string;
  listingPrimaryImageUrl: string | null;
  buyerUserId: string;
  sellerUserId: string;
  otherParty: ConversationParty;
  status: ConversationStatus;
  buyerPhoneVisible: boolean;
  sellerPhoneVisible: boolean;
  /** False once the deal is rated/closed — the chat should stop accepting messages. */
  canSendMessages: boolean;
  /** Why the chat is closed, shown in the conversation when messaging is locked. */
  messagingLockedReason: string | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationParty {
  id: string;
  fullName: string;
  profilePhotoUrl: string | null;
  phoneNumber: string | null;
}

export interface LastMessage {
  id: string;
  content: string;
  senderUserId: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderUserId: string;
  content: string;
  isRead: boolean;
  deletedAt: string | null;
  editedAt: string | null;
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface CreateConversationRequest {
  listingId: string;
}

export type ConversationStatus = 'ACTIVE' | 'CLOSED';