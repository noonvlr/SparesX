"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import TrustBadges from "@/components/TrustBadges";
import StarRatingDisplay from "@/components/StarRatingDisplay";
import RateSellerModal from "@/components/RateSellerModal";
import { openChatUi } from "@/components/chat/openChat";
import { AuthPromptSheet } from "@/components/ContactSheet";
import { Card, EmptyState } from "@/components/ui/Card";
import { Button, buttonVariants } from "@/components/ui/Button";
import type { PublicBadge } from "@/lib/badges/catalog";

type PublicProfile = {
  _id: string;
  name: string;
  profilePicture?: string | null;
  city?: string | null;
  state?: string | null;
  about?: string | null;
  role?: string;
  createdAt?: string;
  phoneVerified?: boolean;
  emailVerified?: boolean;
  kycVerified?: boolean;
  businessVerified?: boolean;
  addressVerified?: boolean;
  isTrusted?: boolean;
  trustScore?: number;
  trustLabel?: string;
  averageRating?: number;
  ratingCount?: number;
  badges?: PublicBadge[];
  activeBadgeKeys?: string[];
};

type RatingRow = {
  _id: string;
  stars: number;
  behaviour: number;
  response: number;
  comment?: string;
  createdAt: string;
  rater?: { name?: string; city?: string } | null;
};

export default function PublicProfileClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [listings, setListings] = useState<ProductCardData[]>([]);
  const [isOwn, setIsOwn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ratings, setRatings] = useState<RatingRow[]>([]);
  const [showRate, setShowRate] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    setLoading(true);
    fetch(`/api/users/${userId}/public`, { headers })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.message || "Profile not found");
          setProfile(null);
          return;
        }
        setProfile(data.profile);
        setListings(data.listings || []);
        setIsOwn(!!data.meta?.isOwnProfile);
        setError("");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));

    fetch(`/api/ratings?sellerId=${userId}&limit=8`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.ratings) setRatings(data.ratings);
      })
      .catch(() => {});
  }, [userId]);

  const requireAuth = () => {
    if (localStorage.getItem("token")) return true;
    setShowAuth(true);
    return false;
  };

  const handleMessage = () => {
    if (!requireAuth() || !profile) return;
    openChatUi({ peerId: profile._id });
  };

  const handleRate = () => {
    if (!requireAuth()) return;
    setShowRate(true);
  };

  const handleReport = () => {
    if (!requireAuth() || !profile) return;
    const params = new URLSearchParams({
      type: "abuse",
      reportedUserId: profile._id,
      subject: `Report user: ${profile.name}`.slice(0, 140),
    });
    router.push(`/support?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-[var(--muted)]">
        Loading profile…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <EmptyState
        className="max-w-lg mx-auto"
        title="Profile not found"
        description={error || "This user is unavailable."}
        action={
          <Link href="/sellers" className={buttonVariants({ variant: "primary" })}>
            Browse sellers
          </Link>
        }
      />
    );
  }

  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const editHref =
    profile.role === "admin" ? "/admin/settings" : "/technician/profile";

  return (
    <main className="min-h-screen bg-[var(--surface-2)]">
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {isOwn && (
          <div className="rounded-[var(--radius)] bg-[var(--brand-soft)] border border-[var(--brand-muted)] px-4 py-3 text-sm text-[var(--brand-hover)] flex flex-wrap items-center justify-between gap-2">
            <span>This is your public profile. Contact details stay private.</span>
            <Link href={editHref} className="font-semibold underline">
              Edit profile
            </Link>
          </div>
        )}

        <Card className="p-5 sm:p-8">
          <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
            {profile.profilePicture ? (
              <img
                src={profile.profilePicture}
                alt={profile.name}
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--radius-lg)] object-cover border border-[var(--border)]"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand)] to-[var(--brand-hover)] text-white flex items-center justify-center text-3xl font-semibold">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold text-[var(--ink)] tracking-tight">
                  {profile.name}
                </h1>
                <p className="text-sm text-[var(--muted)] mt-1 capitalize">
                  {profile.role === "admin" ? "Administrator" : "Seller on SparesX"}
                  {profile.createdAt
                    ? ` · Joined ${new Date(profile.createdAt).toLocaleDateString(
                        "en-IN",
                        { month: "short", year: "numeric" },
                      )}`
                    : ""}
                </p>
              </div>

              <StarRatingDisplay
                value={profile.averageRating || 0}
                count={profile.ratingCount || 0}
                size="md"
              />

              <TrustBadges
                phoneVerified={profile.phoneVerified}
                emailVerified={profile.emailVerified}
                kycVerified={profile.kycVerified}
                businessVerified={profile.businessVerified}
                addressVerified={profile.addressVerified}
                isTrusted={profile.isTrusted}
                trustScore={profile.trustScore}
                trustLabel={profile.trustLabel}
                badges={profile.badges}
                activeBadgeKeys={profile.activeBadgeKeys}
                showScore
                size="md"
              />

              {location && (
                <p className="text-sm text-[var(--ink-secondary)]">
                  <span className="font-semibold text-[var(--ink)]">Location:</span>{" "}
                  {location}
                </p>
              )}

              {!isOwn && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button type="button" onClick={handleMessage}>
                    Message
                  </Button>
                  <Button type="button" variant="soft" onClick={handleRate}>
                    Rate
                  </Button>
                  <button
                    type="button"
                    onClick={handleReport}
                    className="px-4 py-2.5 rounded-[var(--radius)] text-[var(--danger)] border border-red-200 text-sm font-semibold hover:bg-[var(--danger-soft)] transition-colors"
                  >
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6">
          <h2 className="text-lg font-semibold text-[var(--ink)] mb-3">About</h2>
          {profile.about?.trim() ? (
            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed whitespace-pre-wrap">
              {profile.about.trim()}
            </p>
          ) : (
            <p className="text-sm text-[var(--muted)] leading-relaxed">
              {isOwn
                ? "You haven’t added an about section yet. Edit your profile to introduce yourself to buyers."
                : location
                  ? `${profile.name} is listed on SparesX from ${location}. Contact details are private — use in-app chat to enquire.`
                  : `${profile.name} is listed on SparesX. Contact details are private — use in-app chat to enquire.`}
            </p>
          )}
          {isOwn && (
            <Link
              href={editHref}
              className="inline-block mt-3 text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
            >
              {profile.about?.trim() ? "Edit about" : "Add about"} →
            </Link>
          )}
        </Card>

        <Card className="p-5 sm:p-6">
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Ratings</h2>
            <span className="text-xs text-[var(--muted)]">
              {profile.ratingCount || 0} review
              {(profile.ratingCount || 0) === 1 ? "" : "s"}
            </span>
          </div>
          {ratings.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">No public ratings yet.</p>
          ) : (
            <ul className="space-y-3">
              {ratings.map((r) => (
                <li
                  key={r._id}
                  className="rounded-[var(--radius)] border border-[var(--border)] px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {r.rater?.name || "Member"}
                    </p>
                    <StarRatingDisplay value={r.stars} />
                  </div>
                  {r.comment && (
                    <p className="text-sm text-[var(--ink-secondary)] mt-1.5">{r.comment}</p>
                  )}
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    Behaviour {r.behaviour}/5 · Response {r.response}/5
                    {r.createdAt
                      ? ` · ${new Date(r.createdAt).toLocaleDateString("en-IN")}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <section>
          <div className="flex items-end justify-between gap-3 mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--ink)] tracking-tight">
              Active listings
            </h2>
            <span className="text-xs text-[var(--muted)]">
              {listings.length} item{listings.length === 1 ? "" : "s"}
            </span>
          </div>
          {listings.length === 0 ? (
            <EmptyState
              className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] bg-[var(--surface)]"
              title="No approved listings yet"
            />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {listings.map((item) => (
                <ProductCard key={item._id} product={item} />
              ))}
            </div>
          )}
        </section>
      </section>

      <RateSellerModal
        open={showRate}
        onClose={() => setShowRate(false)}
        sellerId={profile._id}
        sellerName={profile.name}
        onSubmitted={(stats) =>
          setProfile((p) =>
            p
              ? {
                  ...p,
                  averageRating: stats.averageRating,
                  ratingCount: stats.ratingCount,
                }
              : p,
          )
        }
      />

      <AuthPromptSheet
        open={showAuth}
        onClose={() => setShowAuth(false)}
        nextPath={`/u/${userId}`}
        description="Login to message, rate, or report this user."
      />
    </main>
  );
}
