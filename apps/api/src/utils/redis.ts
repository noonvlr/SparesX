import { createClient, RedisClientType } from 'redis';

const redisDisabled = String(process.env.SKIP_REDIS ?? '').toLowerCase() === 'true';

const redisClient: RedisClientType | null = redisDisabled
  ? null
  : createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 50, 500),
      },
    });

if (redisClient) {
  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis Client Connected');
  });
}

export async function connectRedis() {
  if (!redisClient) {
    console.info('Redis connection skipped because SKIP_REDIS=true');
    return;
  }

  try {
    await redisClient.connect();
    console.log('Redis connected successfully');
  } catch (error) {
    console.error('Redis connection failed:', error);
    if (process.env.NODE_ENV === 'development') {
      console.warn('Continuing without Redis in development environment.');
    } else {
      throw error;
    }
  }
}

export async function disconnectRedis() {
  if (!redisClient) {
    return;
  }

  try {
    await redisClient.disconnect();
    console.log('Redis disconnected successfully');
  } catch (error) {
    console.error('Redis disconnection failed:', error);
    throw error;
  }
}

export const cache = {
  async get(key: string) {
    if (!redisClient) {
      return null;
    }

    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttlSeconds = 3600) {
    if (!redisClient) {
      return;
    }

    try {
      await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async del(key: string) {
    if (!redisClient) {
      return;
    }

    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async exists(key: string) {
    if (!redisClient) {
      return false;
    }

    try {
      return await redisClient.exists(key);
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  },
};

process.on('beforeExit', async () => {
  await disconnectRedis();
});

export const redis = redisClient;
export const isRedisDisabled = redisClient === null;
