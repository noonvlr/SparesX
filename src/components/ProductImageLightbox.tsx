"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import UploadedImage from "@/components/ui/UploadedImage";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/ui/cn";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const ZOOM_STEP = 0.5;

type ProductImageLightboxProps = {
  open: boolean;
  images: string[];
  alt: string;
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default function ProductImageLightbox({
  open,
  images,
  alt,
  index,
  onIndexChange,
  onClose,
}: ProductImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });
  const pointersRef = useRef(
    new Map<number, { x: number; y: number }>(),
  );
  const pinchStartRef = useRef<{
    distance: number;
    scale: number;
    midpoint: { x: number; y: number };
    offset: { x: number; y: number };
  } | null>(null);
  const panStartRef = useRef<{
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const lastTapRef = useRef(0);
  const stageRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
    setScale(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  const applyScale = useCallback((next: number) => {
    const s = clamp(next, MIN_SCALE, MAX_SCALE);
    scaleRef.current = s;
    setScale(s);
    if (s <= 1) {
      offsetRef.current = { x: 0, y: 0 };
      setOffset({ x: 0, y: 0 });
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    resetView();
  }, [open, index, resetView]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === "ArrowLeft" && images.length > 1) {
        e.preventDefault();
        onIndexChange((index - 1 + images.length) % images.length);
      }
      if (e.key === "ArrowRight" && images.length > 1) {
        e.preventDefault();
        onIndexChange((index + 1) % images.length);
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        applyScale(scaleRef.current + ZOOM_STEP);
      }
      if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        applyScale(scaleRef.current - ZOOM_STEP);
      }
      if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, images.length, index, onIndexChange, applyScale, resetView]);

  useEffect(() => {
    if (!open) return;
    const stage = stageRef.current;
    if (!stage) return;
    const onWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -ZOOM_STEP * 0.4 : ZOOM_STEP * 0.4;
      applyScale(scaleRef.current + delta);
    };
    stage.addEventListener("wheel", onWheelNative, { passive: false });
    return () => stage.removeEventListener("wheel", onWheelNative);
  }, [open, applyScale]);

  const distance = (
    a: { x: number; y: number },
    b: { x: number; y: number },
  ) => Math.hypot(a.x - b.x, a.y - b.y);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setInteracting(true);

    if (pointersRef.current.size === 2) {
      const [a, b] = Array.from(pointersRef.current.values());
      pinchStartRef.current = {
        distance: distance(a, b),
        scale: scaleRef.current,
        midpoint: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        offset: { ...offsetRef.current },
      };
      panStartRef.current = null;
      return;
    }

    if (pointersRef.current.size === 1) {
      const now = Date.now();
      if (now - lastTapRef.current < 280 && scaleRef.current <= 1.05) {
        applyScale(2.5);
        lastTapRef.current = 0;
      } else if (now - lastTapRef.current < 280 && scaleRef.current > 1.05) {
        resetView();
        lastTapRef.current = 0;
      } else {
        lastTapRef.current = now;
      }

      if (scaleRef.current > 1) {
        panStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          offsetX: offsetRef.current.x,
          offsetY: offsetRef.current.y,
        };
      }
    }
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(e.pointerId)) return;
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointersRef.current.size === 2 && pinchStartRef.current) {
      const [a, b] = Array.from(pointersRef.current.values());
      const dist = distance(a, b);
      if (pinchStartRef.current.distance > 0) {
        const ratio = dist / pinchStartRef.current.distance;
        applyScale(pinchStartRef.current.scale * ratio);
      }
      return;
    }

    if (panStartRef.current && scaleRef.current > 1) {
      const next = {
        x: panStartRef.current.offsetX + (e.clientX - panStartRef.current.x),
        y: panStartRef.current.offsetY + (e.clientY - panStartRef.current.y),
      };
      offsetRef.current = next;
      setOffset(next);
    }
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size < 2) pinchStartRef.current = null;
    if (pointersRef.current.size === 0) {
      panStartRef.current = null;
      setInteracting(false);
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
  };

  if (!mounted || !open || images.length === 0) return null;

  const src = images[clamp(index, 0, images.length - 1)];
  const canNav = images.length > 1;

  return createPortal(
    <div
      className="fixed inset-0 z-[var(--z-toast)] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-3 shrink-0">
        <p className="text-sm font-medium text-white/80 tabular-nums px-1">
          {index + 1} / {images.length}
        </p>
        <div className="flex items-center gap-1">
          <IconButton
            aria-label="Zoom out"
            size="md"
            className="text-white hover:bg-white/15"
            onClick={() => applyScale(scaleRef.current - ZOOM_STEP)}
            disabled={scale <= MIN_SCALE}
          >
            <MinusIcon />
          </IconButton>
          <button
            type="button"
            className="min-w-[3.25rem] text-center text-xs font-semibold text-white/80 tabular-nums"
            onClick={resetView}
            aria-label="Reset zoom"
          >
            {Math.round(scale * 100)}%
          </button>
          <IconButton
            aria-label="Zoom in"
            size="md"
            className="text-white hover:bg-white/15"
            onClick={() => applyScale(scaleRef.current + ZOOM_STEP)}
            disabled={scale >= MAX_SCALE}
          >
            <PlusIcon />
          </IconButton>
          <IconButton
            aria-label="Close image viewer"
            size="md"
            className="text-white hover:bg-white/15 ml-1"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      <div
        ref={stageRef}
        className={cn(
          "relative flex-1 min-h-0 touch-none select-none overflow-hidden",
          scale > 1 ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className="absolute inset-0 flex items-center justify-center will-change-transform"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
            transition: interacting ? undefined : "transform 120ms ease-out",
          }}
        >
          <div className="relative h-[min(100%,100dvh)] w-[min(100%,100vw)] max-h-full max-w-full">
            <UploadedImage
              src={src}
              alt={alt}
              fill
              sizes="100vw"
              priority
              className="object-contain pointer-events-none"
              draggable={false}
            />
          </div>
        </div>

        {canNav ? (
          <>
            <IconButton
              aria-label="Previous image"
              size="lg"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white bg-black/40 hover:bg-black/60"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index - 1 + images.length) % images.length);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              aria-label="Next image"
              size="lg"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white bg-black/40 hover:bg-black/60"
              onClick={(e) => {
                e.stopPropagation();
                onIndexChange((index + 1) % images.length);
              }}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <ChevronRightIcon />
            </IconButton>
          </>
        ) : null}
      </div>

      <p className="shrink-0 text-center text-[11px] text-white/50 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        Pinch or use +/− to zoom · double-tap to toggle
      </p>
    </div>,
    document.body,
  );
}

function CloseIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14M5 12h14" />
    </svg>
  );
}

function MinusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}
