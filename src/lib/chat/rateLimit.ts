/**
 * Chat write rate limits — Mongo-backed via checkRateLimitAsync (memory fallback).
 */
import { checkRateLimitAsync } from "@/lib/security/authRateLimit";

export async function allowMessageSend(userId: string): Promise<boolean> {
  const result = await checkRateLimitAsync({
    key: `chat:msg:${userId}`,
    limit: 30,
    windowMs: 60_000,
  });
  return result.ok;
}

export async function allowConversationCreate(userId: string): Promise<boolean> {
  const result = await checkRateLimitAsync({
    key: `chat:conv:${userId}`,
    limit: 10,
    windowMs: 60_000,
  });
  return result.ok;
}
