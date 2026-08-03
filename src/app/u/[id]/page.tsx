import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PublicProfileClient from "./PublicProfileClient";
import { fetchPublicProfile } from "@/lib/users/publicProfile";
import { SITE_NAME, absoluteUrl } from "@/lib/seo/site";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const bundle = await fetchPublicProfile(id);

  if (!bundle) {
    return {
      title: "Profile not found",
      robots: { index: false, follow: true },
    };
  }

  const { profile, listingCount } = bundle;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");
  const title = location ? `${profile.name} — ${location}` : profile.name;
  const description = `${profile.name} sells spare parts on ${SITE_NAME}${
    location ? ` from ${location}` : ""
  }. ${listingCount} active listing${listingCount === 1 ? "" : "s"}${
    profile.ratingCount
      ? `, rated ${profile.averageRating?.toFixed(1)}/5 by ${profile.ratingCount} buyer${
          profile.ratingCount === 1 ? "" : "s"
        }`
      : ""
  }. Contact the seller directly through in-app chat.`;

  const canonical = `/u/${profile._id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      type: "profile",
      url: canonical,
      images: profile.profilePicture ? [profile.profilePicture] : undefined,
    },
    twitter: {
      card: "summary",
      title: `${title} | ${SITE_NAME}`,
      description,
    },
    // Empty profiles have nothing worth ranking; keep them out of the index.
    robots: { index: listingCount > 0, follow: true },
  };
}

export default async function PublicProfilePage({ params }: Params) {
  const { id } = await params;
  const bundle = await fetchPublicProfile(id, { includeRatings: true });

  if (!bundle) notFound();

  const { profile, listings, ratings } = bundle;
  const location = [profile.city, profile.state].filter(Boolean).join(", ");

  const profileSchema = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: absoluteUrl(`/u/${profile._id}`),
    mainEntity: {
      "@type": "Person",
      name: profile.name,
      url: absoluteUrl(`/u/${profile._id}`),
      ...(profile.profilePicture ? { image: profile.profilePicture } : {}),
      ...(profile.about ? { description: profile.about } : {}),
      ...(location
        ? {
            address: {
              "@type": "PostalAddress",
              ...(profile.city ? { addressLocality: profile.city } : {}),
              ...(profile.state ? { addressRegion: profile.state } : {}),
              addressCountry: "IN",
            },
          }
        : {}),
      ...(profile.ratingCount && profile.averageRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: profile.averageRating,
              reviewCount: profile.ratingCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(profileSchema) }}
      />
      <PublicProfileClient
        userId={profile._id}
        initialProfile={profile}
        initialListings={listings}
        initialRatings={ratings}
      />
    </>
  );
}
