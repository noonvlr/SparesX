import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing use of the SparesX India marketplace connecting buyers and sellers of spare parts.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="28 July 2026">
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">1. Acceptance</h2>
        <p>By using SparesX, you agree to these Terms.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          2. Nature of the Platform
        </h2>
        <p>
          SparesX is an online marketplace that connects buyers and sellers in
          India. SparesX is not the seller; it only provides the platform for
          buyers and sellers to connect.
        </p>
        <p className="mt-2">
          SparesX does not manufacture, own, inspect, or guarantee the products
          listed by users. There are no in-app payments on SparesX at this time.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">3. Eligibility</h2>
        <p>Users must:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Be at least 18 years old</li>
          <li>Provide accurate information</li>
          <li>Be located in / serving India</li>
          <li>Comply with Indian laws</li>
        </ul>
        <p className="mt-2">
          Anyone in India can register and sell, subject to these Terms and
          platform policies.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">4. User Accounts</h2>
        <p>Users are responsible for:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Maintaining account security</li>
          <li>Keeping passwords confidential</li>
          <li>All activity under their account</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">5. Listings</h2>
        <p>Sellers are responsible for ensuring that:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Product descriptions are accurate</li>
          <li>Images represent the actual product</li>
          <li>Pricing is accurate</li>
          <li>They have the legal right to sell the listed item</li>
        </ul>
        <p className="mt-2">Misleading listings may be removed.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          6. Buyer Responsibilities
        </h2>
        <p>Buyers should:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Verify product details</li>
          <li>Communicate with sellers before purchasing</li>
          <li>Exercise reasonable caution when dealing with other users</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">7. Payments</h2>
        <p>Currently, SparesX does not process or collect payments.</p>
        <p className="mt-2">
          All payments are arranged directly between buyers and sellers. SparesX
          is not responsible for payment disputes arising between users.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">8. Shipping</h2>
        <p>
          Shipping arrangements are the responsibility of buyers and sellers
          unless otherwise stated.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          9. Prohibited Activities
        </h2>
        <p>Users must not:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Sell counterfeit goods</li>
          <li>Sell stolen property</li>
          <li>Upload false information</li>
          <li>Spam other users</li>
          <li>Harass or threaten others</li>
          <li>Attempt unauthorized access to the platform</li>
          <li>Distribute malware or malicious code</li>
          <li>Violate applicable laws</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          10. Intellectual Property
        </h2>
        <p>
          Users retain ownership of the content they upload but grant SparesX a
          non-exclusive license to display, host, and use that content for
          operating and promoting the platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">11. Suspension</h2>
        <p>
          We may suspend or terminate accounts that violate these Terms or
          engage in fraudulent or abusive activity.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          12. Limitation of Liability
        </h2>
        <p>SparesX provides the platform &quot;as is&quot; without warranties.</p>
        <p className="mt-2">
          To the fullest extent permitted by law, SparesX is not liable for:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Product quality</li>
          <li>Transactions between users</li>
          <li>Payment disputes</li>
          <li>Shipping issues</li>
          <li>Losses arising from user interactions</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          13. Governing Law
        </h2>
        <p>
          These Terms are governed by the laws of India. Any disputes shall be
          subject to the courts having jurisdiction over your business location.
        </p>
      </section>
    </LegalPage>
  );
}
