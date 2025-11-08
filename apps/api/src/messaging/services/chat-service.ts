import { prisma } from '../../utils/database';
import { ChatModel, ChatDocument } from '../models/Chat';
import { MessageDocument, MessageModel, MessageType } from '../models/Message';
import { connectMessagingDatabase } from '../mongoose';
import mongoose from 'mongoose';

export interface CreateMessageInput {
  chatId: string | mongoose.Types.ObjectId;
  senderId: string;
  type?: MessageType;
  text?: string;
  mediaUrl?: string;
  mediaMetadata?: Record<string, unknown>;
  localId?: string;
}

export async function ensureMessagingDatabase() {
  await connectMessagingDatabase();
}

function normaliseParticipants(participants: string[]): string[] {
  const unique = Array.from(new Set(participants));
  unique.sort();
  return unique;
}

export async function findOrCreateDirectChat(currentUserId: string, participantId: string) {
  if (currentUserId === participantId) {
    throw new Error('Cannot create a chat with yourself');
  }

  const participants = normaliseParticipants([currentUserId, participantId]);

  let chat = await ChatModel.findOne({
    isGroup: false,
    participants: { $all: participants, $size: 2 },
  }).lean<ChatDocument>();

  let created = false;

  if (!chat) {
    chat = (
      await ChatModel.create({
        participants,
        isGroup: false,
      })
    ).toObject();
    created = true;
  }

  return { chat, created };
}

export async function validateParticipant(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, avatar: true },
  });

  if (!user) {
    throw new Error('Participant not found');
  }

  return user;
}

export async function appendMessage(input: CreateMessageInput) {
  const payload = {
    chatId: input.chatId,
    senderId: input.senderId,
    type: input.type ?? 'text',
    text: input.text,
    mediaUrl: input.mediaUrl,
    mediaMetadata: input.mediaMetadata,
    localId: input.localId,
    status: 'sent' as const,
  };

  const message = await MessageModel.create(payload);

  await ChatModel.findByIdAndUpdate(input.chatId, {
    $set: { lastMessageAt: new Date() },
  }).lean();

  return message.toObject();
}

export interface ListMessagesResult {
  messages: MessageDocument[];
  total: number;
}

export async function listMessages(chatId: string, page: number, limit: number): Promise<ListMessagesResult> {
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    MessageModel.find({ chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    MessageModel.countDocuments({ chatId }),
  ]);

  return { messages, total };
}

export async function ensureUserInChat(chatId: string, userId: string) {
  const chat = await ChatModel.findById(chatId).lean<ChatDocument | null>();

  if (!chat) {
    throw new Error('Chat not found');
  }

  if (!chat.participants.includes(userId)) {
    throw new Error('Not a participant in this chat');
  }

  return chat;
}


