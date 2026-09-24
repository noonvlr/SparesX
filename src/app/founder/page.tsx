import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs, BreadcrumbJsonLd } from "@/components/seo/Breadcrumbs";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { cn } from "@/lib/ui/cn";
import {
  FOUNDER_EDUCATION_DEGREE,
  FOUNDER_EDUCATION_YEAR,
  FOUNDER_EXPERIENCE_YEARS,
  FOUNDER_LOCATION,
  FOUNDER_META,
  FOUNDER_NAME,
  FOUNDER_PATH,
  NOON_COMPUTERS_NAME,
  NOON_COMPUTERS_URL,
  YOUTUBE_CHANNEL_NAME,
  YOUTUBE_CHANNEL_URL,
  buildFounderPersonJsonLd,
} from "@/lib/seo/entities";
import { SITE_NAME } from "@/lib/seo/site";

export const metadata: Metadata = {
  title: {
    absolute: FOUNDER_META.title,
  },
  description: FOUNDER_META.description,
  alternates: {
    canonical: FOUNDER_PATH,
  },
  openGraph: {
    title: FOUNDER_META.title,
    description: FOUNDER_META.description,
    url: FOUNDER_PATH,
    siteName: SITE_NAME,
    type: "profile",
    locale: "en_IN",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${FOUNDER_NAME}, founder of ${SITE_NAME} and ${NOON_COMPUTERS_NAME}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: FOUNDER_META.title,
    description: FOUNDER_META.description,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sectionClass = "space-y-3 text-[var(--ink-secondary)] text-[15px] leading-relaxed";
const h2Class = "text-xl font-semibold tracking-tight text-[var(--ink)]";

export default function FounderPage() {
  const personSchema = buildFounderPersonJsonLd();
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Founder", href: FOUNDER_PATH },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />
      <BreadcrumbJsonLd items={breadcrumbItems} />

      <main className="min-h-screen bg-[var(--surface-2)]">
        <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Breadcrumbs
            items={[{ name: "Home", href: "/" }, { name: "Founder" }]}
            className="mb-8 text-sm text-[var(--muted)]"
          />

          {/* Hero — no portrait asset exists in the project */}
          <header className="mb-10 sm:mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-hover)] mb-3">
              Founder
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] mb-2">
              {FOUNDER_NAME}
            </h1>
            <p className="text-lg sm:text-xl font-medium text-[var(--ink-secondary)] mb-4">
              Founder of {SITE_NAME} &amp; {NOON_COMPUTERS_NAME}
            </p>
            <p className="text-[15px] sm:text-base leading-relaxed text-[var(--muted)] max-w-2xl mb-5">
              Mobile repair professional, chip-level technician, trainer and
              technology builder focused on the mobile repair ecosystem.
            </p>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-[var(--ink-secondary)]">
              <li>
                <span className="text-[var(--muted)]">Location · </span>
                {FOUNDER_LOCATION}
              </li>
              <li>
                <span className="text-[var(--muted)]">Education · </span>
                {FOUNDER_EDUCATION_DEGREE}, {FOUNDER_EDUCATION_YEAR}
              </li>
            </ul>
          </header>

          <div className="space-y-8">
            <Card className="p-6 sm:p-7" padding="none">
              <div className={sectionClass}>
                <h2 className={h2Class}>Professional Background</h2>
                <p>
                  {FOUNDER_NAME} has more than {FOUNDER_EXPERIENCE_YEARS} years
                  of hands-on experience in mobile phone repair and servicing,
                  with a focus on chip-level repair, board-level diagnostics and
                  micro-soldering. He also works as a mobile repair trainer,
                  helping technicians develop practical repair skills.
                </p>
                <p>
                  He holds an {FOUNDER_EDUCATION_DEGREE}, completed in{" "}
                  {FOUNDER_EDUCATION_YEAR}, combining a formal technology
                  background with extensive practical experience in electronics
                  and mobile repair.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className={sectionClass}>
                <h2 className={h2Class}>Education</h2>
                <p className="font-medium text-[var(--ink)]">
                  {FOUNDER_EDUCATION_DEGREE} — {FOUNDER_EDUCATION_YEAR}
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className={sectionClass}>
                <h2 className={h2Class}>From Mobile Repair to SparesX</h2>
                <p>
                  SparesX grew out of practical experience in the mobile repair
                  industry. After years of working with mobile devices, spare
                  parts and technicians, {FOUNDER_NAME} identified a recurring
                  problem: usable spare parts were often difficult to discover,
                  sell and source through conventional channels.
                </p>
                <p>
                  Technicians frequently held leftover compatible parts from
                  earlier repairs, while others searched for the same parts
                  through informal WhatsApp groups and word of mouth. Listings
                  disappeared quickly, and connecting the right buyer with the
                  right seller was unreliable. SparesX was created to provide a
                  dedicated marketplace for that ecosystem.
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7 border-[var(--brand-muted)] bg-[var(--brand-soft)]/40">
              <div className={sectionClass}>
                <h2 className={h2Class}>Why I Built SparesX</h2>
                <p>
                  After spending years working in mobile repair and training
                  technicians, I saw how fragmented spare-parts trading could
                  be. Technicians often had usable parts they no longer needed,
                  while other technicians were searching for the same parts.
                  SparesX was created to make that connection easier through a
                  marketplace built specifically around the needs of the mobile
                  repair community.
                </p>
                <footer className="pt-2 text-[var(--ink)]">
                  <p className="font-semibold">— {FOUNDER_NAME}</p>
                  <p className="text-sm text-[var(--muted)]">
                    Founder, {SITE_NAME} &amp; {NOON_COMPUTERS_NAME}
                  </p>
                </footer>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className={sectionClass}>
                <h2 className={h2Class}>{NOON_COMPUTERS_NAME}</h2>
                <p>
                  {NOON_COMPUTERS_NAME} is a mobile service, repair and
                  technician training business founded by {FOUNDER_NAME} in{" "}
                  {FOUNDER_LOCATION}.
                </p>
                <p>
                  Its work includes mobile phone repair, chip-level servicing,
                  board-level diagnostics, micro-soldering, mobile repair
                  training and practical technician education.
                </p>
                <p>
                  <a
                    href={NOON_COMPUTERS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "md" }),
                      "inline-flex mt-1",
                    )}
                  >
                    Visit {NOON_COMPUTERS_NAME}
                  </a>
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className={sectionClass}>
                <h2 className={h2Class}>YouTube — Mobile Repair Videos</h2>
                <p>
                  {NOON_COMPUTERS_NAME} also runs a dedicated YouTube channel,{" "}
                  <strong className="text-[var(--ink)]">
                    {YOUTUBE_CHANNEL_NAME}
                  </strong>
                  , where detailed mobile service and repair videos are posted —
                  covering practical diagnostics, chip-level work and technician
                  training topics from the lab.
                </p>
                <p>
                  <a
                    href={YOUTUBE_CHANNEL_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "secondary", size: "md" }),
                      "inline-flex mt-1",
                    )}
                  >
                    Watch on YouTube
                  </a>
                </p>
              </div>
            </Card>

            <Card className="p-6 sm:p-7">
              <div className={sectionClass}>
                <h2 className={h2Class}>From Repair Lab to Technology Platform</h2>
                <p>
                  {NOON_COMPUTERS_NAME} represents the hands-on mobile repair and
                  training side of the business, while {SITE_NAME} is a
                  technology platform created to address spare-parts discovery
                  and trading within the same ecosystem.
                </p>
                <ul className="space-y-2 text-sm sm:text-[15px]">
                  <li>
                    <strong className="text-[var(--ink)]">{FOUNDER_NAME}</strong>
                    {" → "}Founder{" → "}
                    <Link
                      href="/"
                      className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
                    >
                      {SITE_NAME}
                    </Link>
                  </li>
                  <li>
                    <strong className="text-[var(--ink)]">{FOUNDER_NAME}</strong>
                    {" → "}Founder{" → "}
                    <a
                      href={NOON_COMPUTERS_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)]"
                    >
                      {NOON_COMPUTERS_NAME}
                    </a>
                  </li>
                </ul>
              </div>
            </Card>

            <nav
              aria-label="Related pages"
              className="flex flex-wrap gap-3 pt-2"
            >
              <Link
                href="/about"
                className={cn(buttonVariants({ variant: "secondary", size: "md" }))}
              >
                About {SITE_NAME}
              </Link>
              <Link href="/products" className={cn(buttonVariants({ size: "md" }))}>
                Browse marketplace
              </Link>
            </nav>
          </div>
        </section>
      </main>
    </>
  );
}
