"use client";

import Image, { type ImageProps } from "next/image";
import { useState, type ReactNode } from "react";
import {
  isGoogleAvatarUrl,
  isUnoptimizableUrl,
  resolveUploadUrl,
} from "@/lib/ui/imageUrl";

type UploadedImageProps = Omit<ImageProps, "src" | "unoptimized"> & {
  src?: string | null;
  /** When the remote image fails, render this instead of a broken img. */
  fallback?: ReactNode;
};

/**
 * `next/image` for user-uploaded images and external avatars (e.g. Google).
 *
 * Normalizes legacy URL shapes and skips the optimizer for inline data/blob
 * previews and Google avatar CDNs (which often block the optimizer / referrer).
 */
export default function UploadedImage({
  src,
  alt,
  fallback = null,
  onError,
  ...rest
}: UploadedImageProps) {
  const resolved = resolveUploadUrl(src);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) return <>{fallback}</>;

  const googleAvatar = isGoogleAvatarUrl(resolved);

  return (
    <Image
      src={resolved}
      alt={alt}
      unoptimized={isUnoptimizableUrl(resolved)}
      referrerPolicy={googleAvatar ? "no-referrer" : undefined}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
