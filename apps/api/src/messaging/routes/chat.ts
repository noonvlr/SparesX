import { Router } from 'express';
import type { Response } from 'express';
import { authenticateToken, AuthRequest } from '../../middleware/auth';
import { asyncHandler, createError } from '../../middleware/error-handler';
import {
  appendMessage,
  ensureMessagingDatabase,
  ensureUserInChat,
  findOrCreateDirectChat,
  listMessages,
  validateParticipant,
} from '../services/chat-service';

export const chatRouter = Router();

chatRouter.post(
  '/',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await ensureMessagingDatabase();

    const participantId = req.body?.participantId as string | undefined;
    const initialMessage = req.body?.initialMessage as { text?: string } | undefined;

    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    if (!participantId) {
      throw createError('participantId is required', 400);
    }

    let participant;
    try {
      participant = await validateParticipant(participantId);
    } catch (error: any) {
      if (error instanceof Error && error.message === 'Participant not found') {
        throw createError('Participant not found', 404);
      }
      throw error;
    }

    let chatResult;
    try {
      chatResult = await findOrCreateDirectChat(req.user.id, participantId);
    } catch (error: any) {
      if (error instanceof Error && error.message === 'Cannot create a chat with yourself') {
        throw createError(error.message, 400);
      }
      throw error;
    }

    const { chat, created } = chatResult;

    let message = null;
    if (initialMessage?.text) {
      message = await appendMessage({
        chatId: chat._id,
        senderId: req.user.id,
        text: initialMessage.text,
        type: 'text',
      });
    }

    res.status(created ? 201 : 200).json({
      success: true,
      data: {
        chat,
        participant,
        initialMessage: message,
      },
      message: created ? 'Chat created' : 'Chat already exists',
    });
  })
);

chatRouter.get(
  '/:chatId/messages',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    await ensureMessagingDatabase();

    if (!req.user) {
      throw createError('Authentication required', 401);
    }

    const { chatId } = req.params;
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 20), 1), 100);

    let membership;
    try {
      membership = await ensureUserInChat(chatId, req.user.id);
    } catch (error: any) {
      if (error instanceof Error) {
        if (error.message === 'Chat not found') {
          throw createError('Chat not found', 404);
        }
        if (error.message === 'Not a participant in this chat') {
          throw createError('You are not a participant in this chat', 403);
        }
      }
      throw error;
    }

    const { messages, total } = await listMessages(chatId, page, limit);

    res.json({
      success: true,
      data: messages,
      pagination: {
        chatId,
        page,
        limit,
        total,
        hasNextPage: page * limit < total,
      },
      metadata: {
        participants: membership.participants,
      },
    });
  })
);
