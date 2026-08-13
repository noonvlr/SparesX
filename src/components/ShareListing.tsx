"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Modal } from "@/components/ui/Modal";
import { IconButton } from "@/components/ui/IconButton";
import { Button } from "@/components/ui/Button";
import { showToast } from "@/components/ToastHost";
import { cn } from "@/lib/ui/cn";
import {
  buildListingShare,
  facebookShareUrl,
  telegramShareUrl,
  whatsappShareUrl,
  xShareUrl,
  type ShareIntent,
  type ShareableListing,
} from "@/lib/share/listingShare";

function openShareWindow(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

function ShareGrid({
  product,
  intent,
}: {
  product: ShareableListing;
  intent: ShareIntent;
}) {
  const share = buildListingShare(product, intent);

  async function nativeShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: share.title,
          text: share.text,
          url: share.url,
        });
        return;
      } catch (err) {
        if ((err as { name?: string })?.name === "AbortError") return;
      }
    }
    const ok = await copyText(share.message);
    showToast(ok ? "Share message copied" : "Could not copy", ok ? "success" : "error");
  }

  async function copyLink() {
    const ok = await copyText(share.url);
    showToast(ok ? "Link copied" : "Could not copy link", ok ? "success" : "error");
  }

  async function instagramShare() {
    const ok = await copyText(share.message);
    showToast(
      ok
        ? "Caption copied — paste it in Instagram"
        : "Could not copy caption",
      ok ? "success" : "error",
      3500,
    );
  }

  const actions: Array<{
    key: string;
    label: string;
    onClick: () => void;
    className?: string;
  }> = [
    {
      key: "more",
      label: "More",
      onClick: () => void nativeShare(),
    },
    {
      key: "whatsapp",
      label: "WhatsApp",
      onClick: () => openShareWindow(whatsappShareUrl(share.message)),
      className: "bg-[#25D366]/15 text-[#128C7E] hover:bg-[#25D366]/25",
    },
    {
      key: "facebook",
      label: "Facebook",
      onClick: () => openShareWindow(facebookShareUrl(share.url)),
      className: "bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20",
    },
    {
      key: "instagram",
      label: "Instagram",
      onClick: () => void instagramShare(),
      className: "bg-[#E1306C]/10 text-[#C13584] hover:bg-[#E1306C]/20",
    },
    {
      key: "telegram",
      label: "Telegram",
      onClick: () => openShareWindow(telegramShareUrl(share.url, share.text)),
      className: "bg-[#229ED9]/10 text-[#229ED9] hover:bg-[#229ED9]/20",
    },
    {
      key: "x",
      label: "X",
      onClick: () => openShareWindow(xShareUrl(share.url, share.text)),
      className: "bg-[var(--surface-3)] text-[var(--ink)] hover:bg-[var(--surface-hover)]",
    },
    {
      key: "copy",
      label: "Copy link",
      onClick: () => void copyLink(),
    },
  ];

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--ink-secondary)] whitespace-pre-wrap rounded-[var(--radius)] bg-[var(--surface-2)] border border-[var(--border)] px-3 py-2.5">
        {share.message}
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {actions.map((action) => (
          <button
            key={action.key}
            type="button"
            onClick={action.onClick}
            className={cn(
              "min-h-11 rounded-[var(--radius)] border border-[var(--border)] px-3 py-2 text-sm font-semibold transition-colors",
              action.className ||
                "bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]",
            )}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ShareListingSheet({
  open,
  onClose,
  product,
  intent,
}: {
  open: boolean;
  onClose: () => void;
  product: ShareableListing;
  intent: ShareIntent;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!mounted) return null;

  return createPortal(
    <Modal
      open={open}
      onClose={onClose}
      title={intent === "listed" ? "Share your listing" : "Share this part"}
    >
      <ShareGrid product={product} intent={intent} />
    </Modal>,
    document.body,
  );
}

export function ShareListingPanel({
  product,
  intent,
  className,
}: {
  product: ShareableListing;
  intent: ShareIntent;
  className?: string;
}) {
  return (
    <div className={className}>
      <ShareGrid product={product} intent={intent} />
    </div>
  );
}

export function ShareListingButton({
  product,
  intent,
  variant = "icon",
  className,
  label,
}: {
  product: ShareableListing;
  intent: ShareIntent;
  variant?: "icon" | "button";
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const text = label || "Share";

  return (
    <>
      {variant === "icon" ? (
        <IconButton
          aria-label={text}
          size="sm"
          variant="outline"
          className={cn(
            "rounded-full bg-[var(--surface)]/95 text-[var(--ink)] shadow-[var(--shadow-sm)]",
            className,
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
        </IconButton>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className={className}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen(true);
          }}
        >
          {text}
        </Button>
      )}
      <ShareListingSheet
        open={open}
        onClose={() => setOpen(false)}
        product={product}
        intent={intent}
      />
    </>
  );
}
