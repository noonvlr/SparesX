export type ChatUser = {
  _id: string;
  name: string;
  profilePicture?: string;
  lastSeen?: string;
  role?: string;
  online?: boolean;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  isTrusted?: boolean;
};

export type ChatProduct = {
  _id: string;
  name: string;
  images?: string[];
  price?: number;
  brand?: string;
  deviceModel?: string;
  slug?: string;
  status?: string;
};

export type ChatConversation = {
  _id: string;
  participants: ChatUser[];
  productId?: ChatProduct | string;
  lastMessage?: string;
  lastMessageType?: "text" | "image";
  lastMessageTime?: string;
  lastMessageSenderId?: string;
  unreadCount?: number;
  peer?: ChatUser;
  peerOnline?: boolean;
  peerTyping?: boolean;
  updatedAt?: string;
  createdAt?: string;
};

export type ChatMessage = {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type: "text" | "image";
  text?: string;
  mediaUrl?: string;
  delivered: boolean;
  read: boolean;
  createdAt: string;
};
