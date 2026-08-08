"use client";

import { useEffect, useState } from "react";
import { StarPicker } from "@/components/StarRatingDisplay";
import { showToast } from "@/components/ToastHost";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { Textarea } from "@/components/ui/Input";
import { authFetch, isLoggedInClient } from "@/lib/auth/clientAuth";

type Props = {
  open: boolean;
  onClose: () => void;
  sellerId: string;
  sellerName?: string;
  productId?: string;
  onSubmitted?: (stats: { averageRating: number; ratingCount: number }) => void;
};

export default function RateSellerModal({
  open,
  onClose,
  sellerId,
  sellerName,
  productId,
  onSubmitted,
}: Props) {
  const [stars, setStars] = useState(5);
  const [behaviour, setBehaviour] = useState(5);
  const [response, setResponse] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eligible, setEligible] = useState(false);
  const [reason, setReason] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (!isLoggedInClient()) {
      setEligible(false);
      setReason("Login required to rate this seller.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams({
      sellerId,
      eligibility: "1",
    });
    if (productId) params.set("productId", productId);

    authFetch(`/api/ratings?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setEligible(!!data.eligible);
        setReason(data.reason || "");
        if (data.existingRating) {
          setUpdating(true);
          setStars(data.existingRating.stars || 5);
          setBehaviour(data.existingRating.behaviour || 5);
          setResponse(data.existingRating.response || 5);
          setComment(data.existingRating.comment || "");
        } else {
          setUpdating(false);
          setStars(5);
          setBehaviour(5);
          setResponse(5);
          setComment("");
        }
      })
      .catch(() => {
        setEligible(false);
        setReason("Could not check rating eligibility.");
      })
      .finally(() => setLoading(false));
  }, [open, sellerId, productId]);

  if (!open) return null;

  const submit = async () => {
    if (!isLoggedInClient()) return;
    setSubmitting(true);
    try {
      const res = await authFetch("/api/ratings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sellerId,
          productId,
          stars,
          behaviour,
          response,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.message || "Could not submit rating", "error");
        return;
      }
      showToast(updating ? "Rating updated" : "Thanks for your rating");
      onSubmitted?.({
        averageRating: data.averageRating,
        ratingCount: data.ratingCount,
      });
      onClose();
    } catch {
      showToast("Could not submit rating", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-[var(--overlay)] p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[var(--modal-bg)] rounded-[var(--radius-lg)] shadow-[var(--shadow-modal)] border border-[var(--border)] p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[var(--ink)]">
              {updating ? "Update rating" : "Rate seller"}
            </h3>
            <p className="text-sm text-[var(--muted)] mt-0.5">
              {sellerName || "Seller"} — behaviour & response
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>

        {loading ? (
          <p className="text-sm text-[var(--muted)] py-6 text-center">Checking…</p>
        ) : !eligible ? (
          <div className="rounded-[var(--radius)] bg-[var(--warning-soft)] border border-[var(--warning)]/20 px-4 py-3 text-sm text-[var(--warning)]">
            {reason || "You are not eligible to rate this seller yet."}
          </div>
        ) : (
          <>
            <StarPicker label="Overall experience" value={stars} onChange={setStars} />
            <StarPicker
              label="Behaviour / professionalism"
              value={behaviour}
              onChange={setBehaviour}
            />
            <StarPicker
              label="Response / communication"
              value={response}
              onChange={setResponse}
            />
            <Field label="Comment (optional)" htmlFor="rate-comment">
              <Textarea
                id="rate-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="How was dealing with this seller?"
              />
            </Field>
            <Button
              type="button"
              className="w-full"
              disabled={submitting}
              loading={submitting}
              onClick={submit}
            >
              {submitting
                ? "Submitting…"
                : updating
                  ? "Update rating"
                  : "Submit rating"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
