import Link from "next/link";
import { absoluteUrl } from "@/lib/seo/site";

export type BreadcrumbItem = {
  name: string;
  /** Omit on the current page (last crumb). */
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/** Visible breadcrumb trail. Last item is the current page (no link). */
export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={
        className ?? "mb-4 text-sm text-[var(--muted)]"
      }
    >
      <ol className="flex flex-wrap items-center gap-x-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.name}-${index}`} className="flex items-center">
              {index > 0 ? <span className="mx-2">/</span> : null}
              {isLast || !item.href ? (
                <span className="text-[var(--ink-secondary)]">{item.name}</span>
              ) : (
                <Link href={item.href} className="hover:text-[var(--brand)]">
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/**
 * BreadcrumbList JSON-LD. Every item must include a canonical path `href`
 * matching the page URLs (including the current page).
 */
export function buildBreadcrumbJsonLd(
  items: Array<{ name: string; href: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.href),
    })),
  };
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: Array<{ name: string; href: string }>;
}) {
  if (items.length === 0) return null;
  const schema = buildBreadcrumbJsonLd(items);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
