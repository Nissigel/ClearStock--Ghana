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
  createdAt: string;
}

export interface SendMessageRequest {
  content: string;
}

export type ConversationStatus = 'ACTIVE' | 'CLOSED';