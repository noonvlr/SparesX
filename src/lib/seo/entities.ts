/**
 * Public entity identity for SparesX, Noon Computers, and founder Syed Idrees.
 * Keep claims limited to verified information used elsewhere on the site.
 */
import {
  SITE_CONTACT_EMAIL,
  SITE_NAME,
  SITE_OPERATOR,
  SITE_URL,
  absoluteUrl,
} from "@/lib/seo/site";

export const FOUNDER_NAME = "Syed Idrees";
export const FOUNDER_PATH = "/founder";
export const FOUNDER_URL = absoluteUrl(FOUNDER_PATH);

export const FOUNDER_JOB_TITLE = "Founder";
export const FOUNDER_LOCATION = "Vellore, Tamil Nadu, India";
export const FOUNDER_EDUCATION_DEGREE = "M.Sc. Computer Science";
export const FOUNDER_EDUCATION_YEAR = 2016;
export const FOUNDER_EXPERIENCE_YEARS = "16+";

/** Official Noon Computers site (external). */
export const NOON_COMPUTERS_URL = "https://noonvlr.in/";
export const NOON_COMPUTERS_NAME = SITE_OPERATOR;

/**
 * Official YouTube channel for detailed mobile service / repair videos
 * (Noon Computers Tamil), verified via noonvlr.in and the live channel handle.
 */
export const YOUTUBE_CHANNEL_NAME = "Noon Computers Tamil";
export const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@NoonComputersTamil";

export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const PERSON_ID = `${SITE_URL}/#founder`;

/** Verified public profile URLs for Schema.org sameAs. */
export const FOUNDER_SAME_AS = [YOUTUBE_CHANNEL_URL] as const;
export const NOON_COMPUTERS_SAME_AS = [YOUTUBE_CHANNEL_URL] as const;

export const FOUNDER_META = {
  title: "Syed Idrees — Founder of SparesX & Noon Computers",
  description:
    "Learn about Syed Idrees, founder of SparesX and Noon Computers, with an M.Sc. in Computer Science and 16+ years of experience in mobile repair, chip-level servicing and technician training.",
} as const;

export const ABOUT_META = {
  title: "About SparesX — Mobile Spare Parts Marketplace",
  description:
    "Learn about SparesX, its mission, founder Syed Idrees, and the mobile repair ecosystem behind the platform.",
} as const;

export const HOME_META = {
  title: "SparesX — Mobile Spare Parts Marketplace for Technicians",
  description:
    "SparesX is a marketplace for mobile spare parts in India where technicians list, find, and request parts. Trust scores help you connect directly — SparesX does not process payments.",
} as const;

/** Shared Organization JSON-LD for SparesX (single #organization id). */
export function buildOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: SITE_NAME,
    alternateName: ["SparesX.com", "sparesx.com"],
    legalName: SITE_OPERATOR,
    url: SITE_URL,
    logo: absoluteUrl("/icon-512.png"),
    description:
      "Marketplace connecting buyers and technicians of mobile spare parts across India. SparesX does not sell parts or process payments.",
    founder: {
      "@type": "Person",
      "@id": PERSON_ID,
      name: FOUNDER_NAME,
      url: FOUNDER_URL,
    },
    foundingLocation: {
      "@type": "Place",
      name: FOUNDER_LOCATION,
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: SITE_CONTACT_EMAIL,
        areaServed: "IN",
        availableLanguage: ["en"],
      },
    ],
  };
}

/** WebSite JSON-LD linked to the Organization publisher. */
export function buildWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: SITE_NAME,
    alternateName: ["SparesX.com", "sparesx.com", "Spares X"],
    description: HOME_META.description,
    url: SITE_URL,
    inLanguage: "en-IN",
    publisher: { "@id": ORGANIZATION_ID },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Person JSON-LD for Syed Idrees.
 * Education institution is omitted — only degree and year are verified.
 */
export function buildFounderPersonJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": PERSON_ID,
    name: FOUNDER_NAME,
    jobTitle: FOUNDER_JOB_TITLE,
    url: FOUNDER_URL,
    description: FOUNDER_META.description,
    homeLocation: {
      "@type": "Place",
      name: FOUNDER_LOCATION,
    },
    knowsAbout: [
      "Mobile phone repair",
      "Chip-level mobile repair",
      "Board-level diagnostics",
      "Micro-soldering",
      "Mobile repair training",
      "Spare parts marketplace",
    ],
    sameAs: [...FOUNDER_SAME_AS],
    worksFor: {
      "@type": "Organization",
      "@id": ORGANIZATION_ID,
      name: SITE_NAME,
      url: SITE_URL,
    },
    founderOf: [
      {
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        "@type": "Organization",
        name: NOON_COMPUTERS_NAME,
        url: NOON_COMPUTERS_URL,
        description:
          "Mobile service, repair and technician training business in Vellore, Tamil Nadu.",
        sameAs: [...NOON_COMPUTERS_SAME_AS],
      },
    ],
  };
}

export function buildAboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: ABOUT_META.title,
    description: ABOUT_META.description,
    url: absoluteUrl("/about"),
    isPartOf: { "@id": WEBSITE_ID },
    mainEntity: { "@id": ORGANIZATION_ID },
    about: [
      { "@id": ORGANIZATION_ID },
      { "@id": PERSON_ID },
    ],
  };
}
