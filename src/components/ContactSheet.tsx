"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { openChatUi } from "@/components/chat/openChat";
import { showToast } from "@/components/ToastHost";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

export type WaState = {
  status: string;
  unlocked: boolean;
  canRequest: boolean;
  reason?: string;
  whatsappUrl?: string | null;
};

type ContactSheetProps = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  sellerId: string | null;
  waState: WaState | null;
  loading: boolean;
  error: string | null;
  waActionLoading: boolean;
  onWhatsApp: () => void;
};

export function ContactSheet({
  open,
  onClose,
  productId,
  productName,
  sellerId,
  waState,
  loading,
  error,
  waActionLoading,
  onWhatsApp,
}: ContactSheetProps) {
  const waLabel = waActionLoading ? "…" : "Connect on WhatsApp";
  const waReady = Boolean(waState?.unlocked && waState.whatsappUrl);

  return (
    <Modal open={open} onClose={onClose} title="Contact seller">
      <p className="text-sm text-[var(--muted)] mb-4 line-clamp-2 -mt-1">
        {productName}
      </p>

      {loading ? (
        <div className="py-10 text-center text-sm text-[var(--muted)]">
          Loading options…
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            type="button"
            disabled={waActionLoading || !waState || !waReady}
            onClick={onWhatsApp}
            className="w-full !bg-[#25D366] hover:!bg-[#1ebe57]"
          >
            {waLabel}
          </Button>
          {waReady ? (
            <p className="text-xs text-[var(--muted)]">
              Opens WhatsApp with a message about this listing.
            </p>
          ) : waState?.reason ? (
            <p className="text-xs text-[var(--warning)]">{waState.reason}</p>
          ) : null}
          <Button
            type="button"
            variant="primary"
            disabled={!sellerId}
            className="w-full"
            onClick={() => {
              if (!sellerId) return;
              onClose();
              openChatUi({ peerId: sellerId, productId });
            }}
          >
            In-app chat
          </Button>
          {error ? (
            <p className="text-sm text-[var(--danger)] pt-1">{error}</p>
          ) : null}
        </div>
      )}
    </Modal>
  );
}

type AuthPromptProps = {
  open: boolean;
  onClose: () => void;
  nextPath: string;
  description?: string;
};

export function AuthPromptSheet({
  open,
  onClose,
  nextPath,
  description = "Login or sign up to contact the seller via WhatsApp or chat.",
}: AuthPromptProps) {
  const router = useRouter();
  return (
    <Modal open={open} onClose={onClose} title="Login required">
      <p className="text-sm text-[var(--muted)] mb-5">{description}</p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          onClick={() =>
            router.push(`/login?next=${encodeURIComponent(nextPath)}`)
          }
        >
          Login
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            router.push(`/register?next=${encodeURIComponent(nextPath)}`)
          }
        >
          Sign up
        </Button>
      </div>
    </Modal>
  );
}

/** Open WhatsApp for a listing. Logged-in users get a prefilled chat immediately. */
export async function runWhatsAppAction(opts: {
  sellerId: string;
  productId: string;
  waState: WaState | null;
  setWaState: (s: WaState) => void;
  setLoading: (v: boolean) => void;
}) {
  const { sellerId, productId, waState, setWaState, setLoading } = opts;
  if (!isLoggedInClient()) return;

  if (waState?.unlocked && waState.whatsappUrl) {
    window.open(waState.whatsappUrl, "_blank", "noopener,noreferrer");
    return;
  }

  setLoading(true);
  try {
    const waRes = await authFetch(
      `/api/whatsapp-connect?sellerId=${encodeURIComponent(sellerId)}&productId=${encodeURIComponent(productId)}`,
    );
    const waData = await waRes.json().catch(() => ({}));
    if (!waRes.ok) {
      showToast(waData.message || "Could not open WhatsApp", "error");
      return;
    }
    const next: WaState = {
      status: waData.status || "approved",
      unlocked: !!waData.unlocked,
      canRequest: false,
      reason: waData.reason,
      whatsappUrl: waData.whatsappUrl || null,
    };
    setWaState(next);
    if (next.unlocked && next.whatsappUrl) {
      window.open(next.whatsappUrl, "_blank", "noopener,noreferrer");
      return;
    }
    showToast(next.reason || "WhatsApp is not available for this seller", "error");
  } catch {
    showToast("Something went wrong. Try again.", "error");
  } finally {
    setLoading(false);
  }
}

export function useContactFlow(productId: string) {
  const [contactOpen, setContactOpen] = useState(false);
  const [authPrompt, setAuthPrompt] = useState(false);
  const [loadingContact, setLoadingContact] = useState(false);
  const [waState, setWaState] = useState<WaState | null>(null);
  const [waActionLoading, setWaActionLoading] = useState(false);
  const [sellerId, setSellerId] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const cacheKeyRef = useRef<string | null>(null);

  const openContact = async () => {
    if (!isLoggedInClient()) {
      setAuthPrompt(true);
      return;
    }
    setContactOpen(true);

    // Prevent duplicate fetches from double-taps / rapid clicks
    if (loadingRef.current) return;

    // Reuse cached payload for the same product when reopening
    if (
      cacheKeyRef.current === productId &&
      sellerId &&
      !contactError &&
      waState
    ) {
      return;
    }

    loadingRef.current = true;
    setLoadingContact(true);
    setContactError(null);
    setWaState(null);
    setSellerId(null);
    try {
      const res = await authFetch(`/api/products/${productId}`);
      const data = await res.json();
      if (!res.ok) {
        setContactError(data.error || "Could not load seller contact");
        return;
      }
      const seller = data.product?.technician;
      if (!seller || typeof seller !== "object" || !seller._id) {
        setContactError("Seller contact unavailable");
        return;
      }
      const sid = String(seller._id);
      setSellerId(sid);
      const waRes = await authFetch(
        `/api/whatsapp-connect?sellerId=${encodeURIComponent(sid)}&productId=${encodeURIComponent(productId)}`,
      );
      const waData = await waRes.json().catch(() => ({}));
      if (waRes.ok) {
        setWaState({
          status: waData.status || "none",
          unlocked: !!waData.unlocked,
          canRequest: !!waData.canRequest,
          reason: waData.reason,
          whatsappUrl: waData.whatsappUrl || null,
        });
        cacheKeyRef.current = productId;
      } else {
        setContactError(waData.message || "Could not load WhatsApp status");
      }
    } catch {
      setContactError("Failed to load contact options");
    } finally {
      loadingRef.current = false;
      setLoadingContact(false);
    }
  };

  const onWhatsApp = () => {
    if (!sellerId) return;
    void runWhatsAppAction({
      sellerId,
      productId,
      waState,
      setWaState,
      setLoading: setWaActionLoading,
    });
  };

  return {
    contactOpen,
    setContactOpen,
    authPrompt,
    setAuthPrompt,
    loadingContact,
    waState,
    waActionLoading,
    sellerId,
    contactError,
    openContact,
    onWhatsApp,
  };
}
