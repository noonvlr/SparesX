"use client";

import { useEffect, useRef, useState } from "react";
import {
  applyHouseFallback,
  filterStillLive,
  pickWeightedPromos,
  type EligibleAdsPayload,
  type PublicPromoItem,
} from "@/lib/ads/rotation";
import {
  getPromoDeviceType,
  getPromoSessionId,
  sendPromoEvents,
} from "@/lib/ads/clientTracking";
import { getCachedRole, resolveSessionUserId } from "@/lib/auth/clientAuth";
import { cn } from "@/lib/ui/cn";

const DESKTOP_MQ = "(min-width: 768px)";

export type PromoSlotProps = {
  placement: string;
  className?: string;
  /** Admin preview: no public fetch, no tracking */
  previewMode?: boolean;
  previewPayload?: EligibleAdsPayload | null;
};

function PromoUnit({
  item,
  aspect,
  previewMode,
  trackingEnabled,
}: {
  item: PublicPromoItem;
  aspect: { w: number; h: number };
  previewMode: boolean;
  trackingEnabled: boolean;
}) {
  const rootRef = useRef<HTMLElement | null>(null);
  const impressedRef = useRef(false);
  const visibleSinceRef = useRef<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [sessionId, setSessionId] = useState("");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");

  useEffect(() => {
    if (previewMode || !trackingEnabled) return;
    setSessionId(getPromoSessionId());
    setDevice(getPromoDeviceType());
  }, [previewMode, trackingEnabled]);

  useEffect(() => {
    if (previewMode || !trackingEnabled || !item.desktop) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const fireImpression = () => {
      if (impressedRef.current) return;
      impressedRef.current = true;
      clearTimer();
      sendPromoEvents([
        {
          token: item.token,
          eventType: "impression",
          device: getPromoDeviceType(),
          sessionId: getPromoSessionId(),
        },
      ]);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || impressedRef.current) return;
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          if (visibleSinceRef.current == null) {
            visibleSinceRef.current = Date.now();
          }
          if (!timerRef.current) {
            timerRef.current = setTimeout(() => {
              if (
                visibleSinceRef.current != null &&
                Date.now() - visibleSinceRef.current >= 1000
              ) {
                fireImpression();
              }
            }, 1000);
          }
        } else {
          visibleSinceRef.current = null;
          clearTimer();
        }
      },
      { threshold: [0, 0.5, 1] },
    );

    observer.observe(el);
    return () => {
      observer.disconnect();
      clearTimer();
    };
  }, [item.token, previewMode, trackingEnabled, item.desktop]);

  if (!filterStillLive([item]).length || !item.desktop) return null;

  const href = previewMode
    ? "#"
    : `/api/promos/click/${encodeURIComponent(item.campaignId)}?p=${encodeURIComponent(item.placementKey)}&t=${encodeURIComponent(item.token)}${sessionId ? `&s=${encodeURIComponent(sessionId)}` : ""}&d=${device}`;
  const label = item.destinationLabel || "Sponsored";
  const mobile = item.mobile;

  return (
    <aside
      ref={rootRef}
      className="promo-slot__unit relative w-full overflow-hidden rounded-[var(--radius)]"
      style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
    >
      <a
        href={href}
        target={previewMode ? undefined : "_blank"}
        rel="sponsored nofollow noopener"
        title={label}
        aria-label={label}
        className="block h-full w-full"
        onClick={previewMode ? (e) => e.preventDefault() : undefined}
      >
        <picture>
          {mobile ? (
            <source
              media={DESKTOP_MQ}
              srcSet={item.desktop.url}
              width={item.desktop.width}
              height={item.desktop.height}
            />
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={(mobile || item.desktop).url}
            alt={item.desktop.altText}
            width={(mobile || item.desktop).width}
            height={(mobile || item.desktop).height}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
      </a>
      <span className="pointer-events-none absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        Sponsored
      </span>
    </aside>
  );
}

export default function PromoSlot({
  placement,
  className,
  previewMode = false,
  previewPayload = null,
}: PromoSlotProps) {
  const [payload, setPayload] = useState<EligibleAdsPayload | null>(
    previewMode ? previewPayload : null,
  );
  const [picked, setPicked] = useState<PublicPromoItem[]>([]);
  const [ready, setReady] = useState(previewMode);
  const [desktopViewport, setDesktopViewport] = useState(true);
  const [trackingEnabled, setTrackingEnabled] = useState(!previewMode);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(DESKTOP_MQ);
    const sync = () => setDesktopViewport(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (previewMode) {
      setTrackingEnabled(false);
      return;
    }
    let cancelled = false;
    (async () => {
      if (getCachedRole() === "admin") {
        if (!cancelled) setTrackingEnabled(false);
        return;
      }
      await resolveSessionUserId();
      if (cancelled) return;
      setTrackingEnabled(getCachedRole() !== "admin");
    })();
    return () => {
      cancelled = true;
    };
  }, [previewMode]);

  useEffect(() => {
    if (previewMode) {
      setPayload(previewPayload);
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/promos/placement/${encodeURIComponent(placement)}`,
          { credentials: "same-origin" },
        );
        if (!res.ok) {
          if (!cancelled) {
            setPayload(null);
            setReady(true);
          }
          return;
        }
        const json = (await res.json()) as EligibleAdsPayload;
        if (!cancelled) {
          setPayload(json);
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setPayload(null);
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [placement, previewMode, previewPayload]);

  useEffect(() => {
    if (!payload) {
      setPicked([]);
      return;
    }
    const now = new Date();
    const live = filterStillLive(payload.items, now);
    const pool = applyHouseFallback(live, payload.fallbackToHouseAds);
    setPicked(pickWeightedPromos(pool, payload.maxSlots));
  }, [payload]);

  const aspect = (() => {
    if (!payload) return { w: 4, h: 1 };
    if (!desktopViewport && payload.aspectMobile) {
      return {
        w: payload.aspectMobile.width,
        h: payload.aspectMobile.height,
      };
    }
    return {
      w: payload.aspectDesktop.width,
      h: payload.aspectDesktop.height,
    };
  })();

  if (!ready) {
    return (
      <div
        className={cn("promo-slot w-full", className)}
        data-promo-slot={placement}
        aria-hidden
        style={{ aspectRatio: `${aspect.w} / ${aspect.h}` }}
      />
    );
  }

  if (!payload || picked.length === 0) {
    return null;
  }

  return (
    <div
      className={cn("promo-slot w-full space-y-3", className)}
      data-promo-slot={placement}
    >
      {picked.map((item) => (
        <PromoUnit
          key={`${item.campaignId}-${item.placementKey}`}
          item={item}
          aspect={aspect}
          previewMode={previewMode}
          trackingEnabled={trackingEnabled}
        />
      ))}
    </div>
  );
}
