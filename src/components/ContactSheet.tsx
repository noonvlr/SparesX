"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { openChatUi } from "@/components/chat/openChat";
import { showToast } from "@/components/ToastHost";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/ui/cn";

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
  const waLabel = (() => {
    if (waActionLoading) return "…";
    if (waState?.unlocked) return "Open WhatsApp";
    if (waState?.status === "pending") return "WhatsApp pending";
    return "Request WhatsApp";
  })();

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
            disabled={waActionLoading || !waState}
            onClick={onWhatsApp}
            className={cn(
              "w-full",
              waState?.status === "pending" && !waState.unlocked
                ? "!bg-[var(--warning-soft)] !text-[var(--warning)] border border-orange-200"
                : "!bg-[#25D366] hover:!bg-[#1ebe57]",
            )}
          >
            {waLabel}
          </Button>
          {waState?.status === "pending" && !waState.unlocked && (
            <p className="text-xs text-[var(--warning)]">
              Once approved, WhatsApp unlocks for all of this seller&apos;s
              listings.
            </p>
          )}
          {waState?.unlocked && (
            <p className="text-xs text-[var(--success)]">
              Already unlocked — works for any of their products.
            </p>
          )}
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

/** Shared WhatsApp connect action used by ProductCard and ProductDetail. */
export async function runWhatsAppAction(opts: {
  sellerId: string;
  productId: string;
  waState: WaState | null;
  setWaState: (s: WaState) => void;
  setLoading: (v: boolean) => void;
}) {
  const { sellerId, productId, waState, setWaState, setLoading } = opts;
  const token = localStorage.getItem("token");
  if (!token) return;

  if (waState?.unlocked && waState.whatsappUrl) {
    window.open(waState.whatsappUrl, "_blank", "noopener,noreferrer");
    return;
  }
  if (waState?.status === "pending") {
    showToast("Waiting for the seller to approve your WhatsApp request");
    return;
  }
  if (waState && !waState.canRequest) {
    showToast(waState.reason || "Cannot request WhatsApp right now", "error");
    return;
  }

  setLoading(true);
  try {
    const res = await fetch("/api/whatsapp-connect", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sellerId, productId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(data.message || "Could not send request", "error");
      return;
    }
    if (data.unlocked || data.status === "approved") {
      const waRes = await fetch(
        `/api/whatsapp-connect?sellerId=${encodeURIComponent(sellerId)}&productId=${encodeURIComponent(productId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      const waData = await waRes.json().catch(() => ({}));
      if (waRes.ok) {
        setWaState({
          status: waData.status || "approved",
          unlocked: !!waData.unlocked,
          canRequest: false,
          whatsappUrl: waData.whatsappUrl || null,
        });
        if (waData.whatsappUrl) {
          window.open(waData.whatsappUrl, "_blank", "noopener,noreferrer");
        }
      }
      showToast("WhatsApp unlocked for all listings from this seller");
      return;
    }
    setWaState({
      status: "pending",
      unlocked: false,
      canRequest: false,
      reason: "Waiting for approval",
    });
    showToast(
      "Request sent. Once approved, WhatsApp stays unlocked for all their listings.",
    );
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

  const openContact = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthPrompt(true);
      return;
    }
    setContactOpen(true);
    setLoadingContact(true);
    setContactError(null);
    setWaState(null);
    setSellerId(null);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      const waRes = await fetch(
        `/api/whatsapp-connect?sellerId=${encodeURIComponent(sid)}&productId=${encodeURIComponent(productId)}`,
        { headers: { Authorization: `Bearer ${token}` } },
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
      } else {
        setContactError(waData.message || "Could not load WhatsApp status");
      }
    } catch {
      setContactError("Failed to load contact options");
    } finally {
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
