"use client";

import { useEffect, useState } from "react";
import { StarPicker } from "@/components/StarRatingDisplay";
import { showToast } from "@/components/ToastHost";

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
    const token = localStorage.getItem("token");
    if (!token) {
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

    fetch(`/api/ratings?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    const token = localStorage.getItem("token");
    if (!token) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/ratings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
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
      className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {updating ? "Update rating" : "Rate seller"}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {sellerName || "Seller"} — behaviour & response
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-sm font-semibold"
          >
            Close
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 py-6 text-center">Checking…</p>
        ) : !eligible ? (
          <div className="rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-900">
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
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-1.5">
                Comment (optional)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, 500))}
                rows={3}
                className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm"
                placeholder="How was dealing with this seller?"
              />
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={submit}
              className="w-full py-3 rounded-xl bg-[var(--brand)] text-white font-semibold hover:bg-[var(--brand-hover)] disabled:opacity-50"
            >
              {submitting
                ? "Submitting…"
                : updating
                  ? "Update rating"
                  : "Submit rating"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
