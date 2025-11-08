import Queue from 'bull';
import { isRedisDisabled } from '../utils/redis';

type BullQueue<T = any> = Queue.Queue<T>;

let emailQueue: BullQueue | null = null;
let notificationQueue: BullQueue | null = null;

if (!isRedisDisabled) {
  const redisHost = process.env.REDIS_HOST || 'localhost';
  const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

  emailQueue = new Queue('email processing', {
    redis: {
      host: redisHost,
      port: redisPort,
    },
  });

  notificationQueue = new Queue('notification processing', {
    redis: {
      host: redisHost,
      port: redisPort,
    },
  });

  emailQueue.process('send-welcome-email', async (job) => {
    const { email, name } = job.data;

    console.log(`Sending welcome email to ${email} for ${name}`);

    // TODO: Implement actual email sending logic
    // await sendEmail({
    //   to: email,
    //   subject: 'Welcome to SparesX!',
    //   template: 'welcome',
    //   data: { name }
    // });
  });

  notificationQueue.process('send-notification', async (job) => {
    const { userId, message, type } = job.data;

    console.log(`Sending notification to user ${userId}: ${message}`);

    // TODO: Implement actual notification logic
    // await sendNotification({
    //   userId,
    //   message,
    //   type
    // });
  });

  emailQueue.on('completed', (job) => {
    console.log(`Email job ${job.id} completed`);
  });

  emailQueue.on('failed', (job, err) => {
    console.error(`Email job ${job.id} failed:`, err);
  });

  notificationQueue.on('completed', (job) => {
    console.log(`Notification job ${job.id} completed`);
  });

  notificationQueue.on('failed', (job, err) => {
    console.error(`Notification job ${job.id} failed:`, err);
  });
} else {
  console.info('Bull queues disabled because SKIP_REDIS=true');
}

export function startQueueProcessor() {
  if (isRedisDisabled) {
    console.info('Queue processor skipped; Redis is disabled.');
    return;
  }

  console.log('Queue processors started');
}

export function addEmailJob(type: string, data: any, options?: any) {
  if (!emailQueue) {
    console.info(`Skipped adding email job "${type}" because Redis queues are disabled.`);
    return Promise.resolve();
  }

  return emailQueue.add(type, data, {
    removeOnComplete: 10,
    removeOnFail: 5,
    ...options,
  });
}

export function addNotificationJob(type: string, data: any, options?: any) {
  if (!notificationQueue) {
    console.info(`Skipped adding notification job "${type}" because Redis queues are disabled.`);
    return Promise.resolve();
  }

  return notificationQueue.add(type, data, {
    removeOnComplete: 10,
    removeOnFail: 5,
    ...options,
  });
}

export { emailQueue, notificationQueue };