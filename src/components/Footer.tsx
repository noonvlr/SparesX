import Link from "next/link";

const YEAR = new Date().getFullYear();

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="text-2xl font-bold text-white">
              SparesX
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400 max-w-xs">
              B2B marketplace for mobile & device spare parts. Connect with
              verified technicians, buy genuine parts, and fulfill requests faster.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Marketplace
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/products" className="hover:text-white transition">
                  Browse products
                </Link>
              </li>
              <li>
                <Link href="/requests" className="hover:text-white transition">
                  Part requests
                </Link>
              </li>
              <li>
                <Link href="/sellers" className="hover:text-white transition">
                  Sellers
                </Link>
              </li>
              <li>
                <Link href="/how-it-works" className="hover:text-white transition">
                  How it works
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Company
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="hover:text-white transition">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition">
                  Support / Contact admin
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-white transition">
                  Become a seller
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
              Legal
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <span className="text-slate-500">Privacy Policy</span>
              </li>
              <li>
                <span className="text-slate-500">Terms of Service</span>
              </li>
              <li>
                <span className="text-slate-500">Refund Policy</span>
              </li>
              <li>
                <a
                  href="mailto:support@sparesx.in"
                  className="hover:text-white transition"
                >
                  support@sparesx.in
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <p>© {YEAR} SparesX. All rights reserved.</p>
          <p>Made for technicians & spare-part businesses across India.</p>
        </div>
      </div>
    </footer>
  );
}
