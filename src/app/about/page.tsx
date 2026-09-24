import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";
import {
  ABOUT_META,
  FOUNDER_EDUCATION_DEGREE,
  FOUNDER_EDUCATION_YEAR,
  FOUNDER_EXPERIENCE_YEARS,
  FOUNDER_LOCATION,
  FOUNDER_NAME,
  FOUNDER_PATH,
  FOUNDER_URL,
  NOON_COMPUTERS_NAME,
  NOON_COMPUTERS_URL,
  PERSON_ID,
  buildAboutPageJsonLd,
  buildOrganizationJsonLd,
} from "@/lib/seo/entities";
import { SITE_CONTACT_EMAIL, SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: {
    absolute: ABOUT_META.title,
  },
  description: ABOUT_META.description,
  keywords: [
    "about sparesx",
    "mobile parts marketplace",
    "technician network",
    "Syed Idrees",
    "Noon Computers",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: ABOUT_META.title,
    description: ABOUT_META.description,
    type: "website",
    url: "/about",
    siteName: SITE_NAME,
    locale: "en_IN",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "About SparesX",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: ABOUT_META.title,
    description: ABOUT_META.description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const h2Class = "text-lg sm:text-xl font-semibold text-[var(--ink)] mb-3";
const bodyClass = "text-[var(--ink-secondary)] text-[15px] leading-relaxed space-y-3";

export default function AboutPage() {
  const aboutSchema = buildAboutPageJsonLd();
  const orgSchema = buildOrganizationJsonLd();
  const personStub = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: FOUNDER_NAME,
    url: FOUNDER_URL,
    jobTitle: "Founder",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personStub) }}
      />

      <main className="min-h-screen bg-[var(--surface-2)]">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <PageHeader
            className="mb-8"
            title={`About ${SITE_NAME}`}
            description="A dedicated marketplace for mobile spare parts in India, built for technicians."
          />

          <div className="space-y-6">
            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>What is SparesX?</h2>
              <div className={bodyClass}>
                <p>
                  SparesX is a marketplace built exclusively for mobile device
                  spare parts. Technicians can list what they have, search for
                  what they need, and request parts that are not yet available.
                </p>
                <p>
                  SparesX does not hold inventory, set prices, or process
                  payments. It connects buyers and technicians directly, with
                  Trust Scores to help people decide who to deal with.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>Why SparesX exists</h2>
              <div className={bodyClass}>
                <p>
                  Every mobile repair technician knows the problem: a drawer
                  full of good parts with nowhere to sell them, and a search for
                  the right part that too often ends in crowded WhatsApp groups
                  or word of mouth. Listings disappear quickly, and finding a
                  compatible part can mean scrolling through unrelated messages.
                </p>
                <p>
                  SparesX was built to give that trade a focused home —
                  organized listings, part requests, and direct connections
                  between technicians across India.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>Founder — {FOUNDER_NAME}</h2>
              <div className={bodyClass}>
                <p>
                  Meet {FOUNDER_NAME}, founder of {SITE_NAME} and{" "}
                  {NOON_COMPUTERS_NAME}. He holds an {FOUNDER_EDUCATION_DEGREE}{" "}
                  ({FOUNDER_EDUCATION_YEAR}) and has more than{" "}
                  {FOUNDER_EXPERIENCE_YEARS} years of hands-on experience in
                  mobile phone repair, chip-level servicing and technician
                  training, based in {FOUNDER_LOCATION}.
                </p>
                <p>
                  <Link
                    href={FOUNDER_PATH}
                    className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                  >
                    Meet Syed Idrees, founder of SparesX and Noon Computers
                  </Link>
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>{NOON_COMPUTERS_NAME}</h2>
              <div className={bodyClass}>
                <p>
                  {NOON_COMPUTERS_NAME} is a mobile service, repair and
                  technician training business founded by {FOUNDER_NAME} in{" "}
                  {FOUNDER_LOCATION}. It covers practical repair work — including
                  chip-level servicing, board-level diagnostics and
                  micro-soldering — alongside technician training.
                </p>
                <p>
                  SparesX is operated by {FOUNDER_NAME}, trading as{" "}
                  {NOON_COMPUTERS_NAME}.{" "}
                  <a
                    href={NOON_COMPUTERS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                  >
                    Visit Noon Computers
                  </a>
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>The mobile repair ecosystem</h2>
              <div className={bodyClass}>
                <p>
                  Repair shops, independent technicians and training labs all
                  depend on timely access to compatible spare parts. SparesX
                  sits in that ecosystem as a discovery and connection layer —
                  while {NOON_COMPUTERS_NAME} represents the hands-on repair and
                  training side of the same founder&apos;s work.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>Marketplace functionality</h2>
              <div className={bodyClass}>
                <p>
                  Browse listings by part type, brand and model; post requests
                  when a part is not listed; message or connect with technicians
                  directly; and use Trust Scores and profile signals before you
                  deal. SparesX does not process payments — you finalize
                  exchanges between yourselves.
                </p>
                <p>
                  <Link
                    href="/products"
                    className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                  >
                    Browse the SparesX marketplace
                  </Link>
                  {" · "}
                  <Link
                    href="/how-it-works"
                    className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                  >
                    How it works
                  </Link>
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>Vision</h2>
              <div className={bodyClass}>
                <p>
                  Give technicians a focused, trustworthy place to trade mobile
                  spare parts — without the noise of general marketplaces or
                  ephemeral chat groups — and keep refining the platform with
                  the people who use it every day.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <h2 className={h2Class}>Contact</h2>
              <div className={bodyClass}>
                <p>
                  Questions about the platform, policies or support can be sent
                  to{" "}
                  <a
                    href={`mailto:${SITE_CONTACT_EMAIL}`}
                    className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                  >
                    {SITE_CONTACT_EMAIL}
                  </a>
                  , or through{" "}
                  <Link
                    href="/support"
                    className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)]"
                  >
                    Support
                  </Link>
                  .
                </p>
                <div className="flex flex-wrap gap-3 pt-1">
                  <Link
                    href={FOUNDER_PATH}
                    className={cn(buttonVariants({ size: "md" }))}
                  >
                    Meet the Founder
                  </Link>
                  <Link
                    href="/support"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "md" }),
                    )}
                  >
                    Contact support
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}
