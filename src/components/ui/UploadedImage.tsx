import Image, { type ImageProps } from "next/image";
import { isUnoptimizableUrl, resolveUploadUrl } from "@/lib/ui/imageUrl";

type UploadedImageProps = Omit<ImageProps, "src" | "unoptimized"> & {
  src?: string | null;
};

/**
 * `next/image` for user-uploaded images.
 *
 * Normalizes legacy URL shapes and skips the optimizer for inline data/blob
 * previews, which it can't process. Renders nothing when there's no image, so
 * callers keep their own placeholder markup.
 */
export default function UploadedImage({
  src,
  alt,
  ...rest
}: UploadedImageProps) {
  const resolved = resolveUploadUrl(src);
  if (!resolved) return null;

  return (
    <Image
      src={resolved}
      alt={alt}
      unoptimized={isUnoptimizableUrl(resolved)}
      {...rest}
    />
  );
}
