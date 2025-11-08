import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { chatRouter } from '../routes/chat';
import { prisma } from '../../utils/database';
import { connectMessagingDatabase, disconnectMessagingDatabase } from '../mongoose';
import { ChatModel } from '../models/Chat';
import { MessageModel } from '../models/Message';

jest.setTimeout(60000);

describe('chat routes', () => {
  let mongod: MongoMemoryServer;
  const app = express();
  app.use(express.json());
  app.use('/api/chat', chatRouter);

  const token = jwt.sign({ userId: 'user-1' }, 'test-jwt-secret');

  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    process.env.MONGO_URI = mongod.getUri();
    await connectMessagingDatabase();
  });

  beforeEach(async () => {
    (prisma.user.findUnique as jest.Mock).mockImplementation(({ where }) => {
      if (where.id === 'user-1') {
        return Promise.resolve({ id: 'user-1', email: 'user1@example.com', role: 'BUYER', name: 'User One' });
      }
      if (where.id === 'user-2') {
        return Promise.resolve({ id: 'user-2', email: 'user2@example.com', role: 'BUYER', name: 'User Two' });
      }
      return Promise.resolve(null);
    });

    await ChatModel.deleteMany({});
    await MessageModel.deleteMany({});
  });

  afterAll(async () => {
    await disconnectMessagingDatabase();
    if (mongod) {
      await mongod.stop();
    }
  });

  it('creates a new chat and optional initial message', async () => {
    const response = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ participantId: 'user-2', initialMessage: { text: 'Hello there' } });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.chat.participants).toEqual(['user-1', 'user-2']);
    expect(response.body.data.initialMessage.text).toBe('Hello there');

    const chats = await ChatModel.find();
    expect(chats).toHaveLength(1);

    const messages = await MessageModel.find();
    expect(messages).toHaveLength(1);
  });

  it('reuses existing chat when participants already have a conversation', async () => {
    await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ participantId: 'user-2' });

    const secondResponse = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ participantId: 'user-2' });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.message).toBe('Chat already exists');

    const chats = await ChatModel.find();
    expect(chats).toHaveLength(1);
  });

  it('returns paginated messages for a chat', async () => {
    const createResponse = await request(app)
      .post('/api/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ participantId: 'user-2' });

    const chatId = createResponse.body.data.chat._id;
    await MessageModel.create({ chatId, senderId: 'user-1', type: 'text', text: 'Ping' });

    const response = await request(app)
      .get(`/api/chat/${chatId}/messages?page=1&limit=10`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
    expect(response.body.metadata.participants).toEqual(['user-1', 'user-2']);
  });
});
