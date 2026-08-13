"use client";

import Link from "next/link";
import UploadedImage from "@/components/ui/UploadedImage";

export type PublicReportContext = {
  targetType: "none" | "product" | "user" | "message";
  subjectHint?: string;
  product?: {
    productId: string;
    productTitle: string;
    productUrl?: string;
    brand?: string;
    deviceModel?: string;
    partType?: string;
    category?: string;
    listingStatus?: string;
    image?: string;
    sellerId?: string;
    sellerName?: string;
  };
  reportedUser?: {
    userId: string;
    name: string;
    profileUrl?: string;
    city?: string;
    state?: string;
  };
  message?: {
    conversationId: string;
    messageId: string;
    messageContent: string;
    messageType: "text" | "image";
    messageSenderName?: string;
    messageTimestamp?: string;
  };
};

export function ReportContextCard({
  context,
}: {
  context: PublicReportContext;
}) {
  const location = [context.reportedUser?.city, context.reportedUser?.state]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-2)] p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
        You are reporting
      </p>

      {context.product ? (
        <div className="flex gap-3">
          {context.product.image ? (
            <UploadedImage
              src={context.product.image}
              alt={context.product.productTitle}
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-lg object-cover border border-[var(--border)]"
              fallback={
                <div className="h-[72px] w-[72px] rounded-lg bg-[var(--surface-3)]" />
              }
            />
          ) : (
            <div className="h-[72px] w-[72px] shrink-0 rounded-lg bg-[var(--surface-3)]" />
          )}
          <div className="min-w-0">
            <p className="font-semibold text-[var(--ink)]">
              {context.product.productTitle}
            </p>
            <p className="text-sm text-[var(--muted)]">
              {[context.product.brand, context.product.deviceModel]
                .filter(Boolean)
                .join(" / ")}
            </p>
            {context.product.sellerName ? (
              <p className="text-sm text-[var(--ink-secondary)]">
                Seller: {context.product.sellerName}
              </p>
            ) : null}
            {context.product.category ? (
              <p className="text-xs text-[var(--muted)] capitalize">
                {context.product.category}
                {context.product.listingStatus
                  ? ` · ${context.product.listingStatus}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {context.reportedUser && context.targetType !== "product" ? (
        <div>
          <p className="font-semibold text-[var(--ink)]">
            {context.reportedUser.name}
          </p>
          {location ? (
            <p className="text-sm text-[var(--muted)]">{location}</p>
          ) : null}
          {context.reportedUser.profileUrl ? (
            <Link
              href={`/u/${context.reportedUser.userId}`}
              className="text-xs font-semibold text-[var(--brand)] hover:underline"
            >
              View profile
            </Link>
          ) : null}
        </div>
      ) : null}

      {context.message ? (
        <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3">
          <p className="text-xs font-semibold text-[var(--muted)] mb-1">
            Reported message
          </p>
          <p className="text-sm text-[var(--ink)] whitespace-pre-wrap break-words">
            {context.message.messageContent}
          </p>
          <p className="text-xs text-[var(--muted)] mt-2">
            Sent by {context.message.messageSenderName || "user"}
            {context.message.messageTimestamp
              ? ` · ${new Date(context.message.messageTimestamp).toLocaleString("en-IN")}`
              : ""}
          </p>
          {context.product?.productTitle ? (
            <p className="text-xs text-[var(--muted)] mt-1">
              Conversation about {context.product.productTitle}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
