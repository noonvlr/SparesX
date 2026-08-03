import Link from "next/link";
import BecomeSellerLink from "@/components/BecomeSellerLink";

const YEAR = new Date().getFullYear();

const linkClass =
  "text-[var(--footer-fg)] hover:text-[var(--footer-heading)] transition-colors duration-[var(--duration-normal)]";

const headingClass =
  "text-xs font-semibold text-[var(--footer-heading)] uppercase tracking-wider mb-4";

export default function Footer() {
  return (
    <footer
      className="mt-auto bg-[var(--footer-bg)] text-[var(--footer-fg)] border-t border-[var(--footer-border)]"
      data-theme-transition
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="sm:col-span-2 lg:col-span-4">
            <Link
              href="/"
              className="text-2xl font-bold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
            >
              SparesX
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[var(--footer-muted)] max-w-sm">
              A dedicated marketplace for mobile spare parts in India, built for
              technicians. Every listing is tied to a seller&apos;s Trust Score.
              SparesX connects buyers and sellers directly — organized listing,
              no middleman.
            </p>
          </div>

          <div className="lg:col-span-2">
            <h3 className={headingClass}>Marketplace</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products" className={linkClass}>
                  Browse products
                </Link>
              </li>
              <li>
                <Link href="/requests" className={linkClass}>
                  Part requests
                </Link>
              </li>
              <li>
                <Link href="/sellers" className={linkClass}>
                  Sellers
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className={linkClass}>
                  How it works
                </Link>
              </li>
              <li>
                <Link href="/trust-score" className={linkClass}>
                  Trust Score
                </Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h3 className={headingClass}>Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className={linkClass}>
                  About us
                </Link>
              </li>
              <li>
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support" className={linkClass}>
                  Support
                </Link>
              </li>
              <li>
                <BecomeSellerLink className={linkClass} />
              </li>
            </ul>
          </div>

          <div className="lg:col-span-4">
            <h3 className={headingClass}>Legal</h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
              <li>
                <Link href="/privacy" className={linkClass}>
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className={linkClass}>
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/refund" className={linkClass}>
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/guidelines" className={linkClass}>
                  Community Guidelines
                </Link>
              </li>
              <li>
                <Link href="/prohibited-items" className={linkClass}>
                  Prohibited Items
                </Link>
              </li>
              <li>
                <Link href="/seller-guidelines" className={linkClass}>
                  Seller Guidelines
                </Link>
              </li>
              <li>
                <Link href="/disputes" className={linkClass}>
                  Dispute Resolution
                </Link>
              </li>
              <li>
                <Link href="/report-abuse" className={linkClass}>
                  Report Abuse
                </Link>
              </li>
            </ul>
            <p className="mt-5 text-sm">
              <a href="mailto:noon.vlr@gmail.com" className={linkClass}>
                noon.vlr@gmail.com
              </a>
              <span className="text-[var(--footer-muted)] mx-2">·</span>
              <a href="tel:8015606071" className={linkClass}>
                8015606071
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[var(--footer-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--footer-muted)]">
          <p>© {YEAR} SparesX · Noon Computers. All rights reserved.</p>
          <p>Made for technicians across India.</p>
        </div>
      </div>
    </footer>
  );
}
