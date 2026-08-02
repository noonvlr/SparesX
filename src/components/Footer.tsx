import Link from "next/link";

const YEAR = new Date().getFullYear();

const linkClass =
  "text-[var(--footer-fg)] hover:text-[var(--footer-heading)] transition-colors duration-[var(--duration-normal)]";

export default function Footer() {
  return (
    <footer
      className="mt-auto bg-[var(--footer-bg)] text-[var(--footer-fg)] border-t border-[var(--footer-border)]"
      data-theme-transition
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="text-2xl font-bold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
            >
              SparesX
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-[var(--footer-muted)] max-w-xs">
              India-only marketplace connecting buyers and sellers of mobile &amp;
              device spare parts. SparesX is not the seller — we provide the
              platform. No in-app payments yet.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--footer-heading)] uppercase tracking-wider mb-3">
              Marketplace
            </h3>
            <ul className="space-y-2 text-sm">
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
                  Trust Score explained
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--footer-heading)] uppercase tracking-wider mb-3">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
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
                  Support / Contact admin
                </Link>
              </li>
              <li>
                <Link href="/register" className={linkClass}>
                  Become a seller
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-[var(--footer-heading)] uppercase tracking-wider mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
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
              <li>
                <a href="mailto:support@sparesx.in" className={linkClass}>
                  support@sparesx.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--footer-border)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-[var(--footer-muted)]">
          <p>© {YEAR} SparesX. All rights reserved.</p>
          <p>Made for technicians & spare-part businesses across India.</p>
        </div>
      </div>
    </footer>
  );
}
