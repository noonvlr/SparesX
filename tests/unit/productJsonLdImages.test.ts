import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { productJsonLdImages } from "@/lib/seo/productJsonLdImages";
import { absoluteUrl } from "@/lib/seo/site";

const BLOB =
  "https://wm6vuzwpg65hpvqy.public.blob.vercel-storage.com/speaker.webp";
const BLOB_2 =
  "https://wm6vuzwpg65hpvqy.public.blob.vercel-storage.com/speaker-2.webp";

describe("product JSON-LD images", () => {
  it("keeps one or many absolute blob URLs", () => {
    assert.deepEqual(productJsonLdImages([BLOB]), [BLOB]);
    assert.deepEqual(productJsonLdImages([BLOB, `  ${BLOB_2}  `]), [BLOB, BLOB_2]);
  });

  it("does not invent an image when the listing has none", () => {
    assert.deepEqual(productJsonLdImages([]), []);
    assert.deepEqual(productJsonLdImages(undefined), []);
    assert.deepEqual(productJsonLdImages(["", "   "]), []);
    assert.deepEqual(productJsonLdImages(["/og-image.jpg"]), []);
  });

  it("drops private, relative junk, and non-image schemes", () => {
    assert.deepEqual(
      productJsonLdImages([
        "javascript:alert(1)",
        "data:image/png;base64,aaaa",
        "blob:https://www.sparesx.com/123",
        "https://evil.example/stolen.jpg",
        "not a url",
        BLOB,
      ]),
      [BLOB],
    );
  });

  it("turns stored http and protocol-relative blob URLs into https", () => {
    assert.deepEqual(
      productJsonLdImages([
        "http://wm6vuzwpg65hpvqy.public.blob.vercel-storage.com/speaker.webp",
        "//wm6vuzwpg65hpvqy.public.blob.vercel-storage.com/speaker-2.webp",
      ]),
      [BLOB, BLOB_2],
    );
  });

  it("makes local upload paths absolute https and dedupes", () => {
    assert.deepEqual(productJsonLdImages(["/uploads/parts/a.jpg", "/uploads/parts/a.jpg"]), [
      absoluteUrl("/uploads/parts/a.jpg"),
    ]);
  });
});
