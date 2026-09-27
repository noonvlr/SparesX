/**
 * Send / retry bookkeeping for optimistic chat bubbles. Guarantees one
 * in-flight request per bubble and never reports "failed" for a bubble whose
 * server copy was already found by a poll.
 */

export type SendGuard = {
  isInFlight: (clientId: string) => boolean;
  isResolved: (clientId: string) => boolean;
  /** Server copy seen (send response or poll echo). */
  resolve: (clientId: string) => void;
};

export type SendOutcome = "sent" | "failed" | "skipped" | "resolved-elsewhere";

export function createSendGuard(): SendGuard & {
  begin: (clientId: string) => boolean;
  end: (clientId: string) => void;
  beginRetry: (clientId: string) => boolean;
  endRetry: (clientId: string) => void;
} {
  const inFlight = new Set<string>();
  const retrying = new Set<string>();
  const resolved = new Set<string>();
  return {
    isInFlight: (id) => inFlight.has(id) || retrying.has(id),
    isResolved: (id) => resolved.has(id),
    resolve: (id) => {
      resolved.add(id);
    },
    begin(id) {
      if (inFlight.has(id) || resolved.has(id)) return false;
      inFlight.add(id);
      return true;
    },
    end(id) {
      inFlight.delete(id);
    },
    beginRetry(id) {
      if (inFlight.has(id) || retrying.has(id) || resolved.has(id)) return false;
      retrying.add(id);
      return true;
    },
    endRetry(id) {
      retrying.delete(id);
    },
  };
}

export async function runSend<T>(params: {
  clientId: string;
  guard: ReturnType<typeof createSendGuard>;
  deliver: () => Promise<T>;
  onSending?: () => void;
  onSuccess: (saved: T) => void;
  onFailure: (err: unknown) => void;
}): Promise<SendOutcome> {
  const { clientId, guard } = params;
  if (!guard.begin(clientId)) return "skipped";
  params.onSending?.();
  try {
    const saved = await params.deliver();
    guard.resolve(clientId);
    params.onSuccess(saved);
    return "sent";
  } catch (err) {
    if (guard.isResolved(clientId)) return "resolved-elsewhere";
    params.onFailure(err);
    return "failed";
  } finally {
    guard.end(clientId);
  }
}

/**
 * Retry a failed bubble: first reconcile with the server (the earlier attempt
 * may have been accepted), then resend only if no server copy exists.
 */
export async function runRetry(params: {
  clientId: string;
  guard: ReturnType<typeof createSendGuard>;
  reconcile: () => Promise<void>;
  resend: () => Promise<SendOutcome>;
  onSending?: () => void;
}): Promise<SendOutcome> {
  const { clientId, guard } = params;
  if (!guard.beginRetry(clientId)) return "skipped";
  params.onSending?.();
  try {
    try {
      await params.reconcile();
    } catch {
      // resend below
    }
    if (guard.isResolved(clientId)) return "resolved-elsewhere";
    return await params.resend();
  } finally {
    guard.endRetry(clientId);
  }
}
