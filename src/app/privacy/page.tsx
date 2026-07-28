import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SparesX collects, uses, and protects personal information on the India marketplace platform.",
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="28 July 2026">
      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">1. Introduction</h2>
        <p>
          Welcome to SparesX. We respect your privacy and are committed to
          protecting your personal information. This Privacy Policy explains how
          we collect, use, store, and disclose your information when you use the
          SparesX website.
        </p>
        <p className="mt-2">
          By using SparesX, you agree to the collection and use of information
          in accordance with this Privacy Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          2. Information We Collect
        </h2>
        <p>We may collect:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Name</li>
          <li>Email address</li>
          <li>Mobile number</li>
          <li>Profile information</li>
          <li>Business information (if provided)</li>
          <li>Product listings</li>
          <li>Product images</li>
          <li>Messages exchanged through the platform</li>
          <li>IP address</li>
          <li>Browser and device information</li>
          <li>Usage analytics</li>
          <li>Login history</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          3. How We Use Your Information
        </h2>
        <p>We use your information to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Create and manage your account</li>
          <li>Display your product listings</li>
          <li>Enable communication between buyers and sellers</li>
          <li>Improve our services</li>
          <li>Prevent fraud and abuse</li>
          <li>Respond to customer support requests</li>
          <li>Comply with legal obligations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          4. Information Sharing
        </h2>
        <p>We do not sell your personal information.</p>
        <p className="mt-2">We may share information:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            With service providers that help operate SparesX (such as cloud
            hosting and image storage)
          </li>
          <li>When required by law</li>
          <li>To investigate fraud or security incidents</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">5. User Content</h2>
        <p>
          Listings, product images, profile information, and other content you
          choose to publish may be visible to other users.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">6. Data Security</h2>
        <p>
          We use reasonable administrative, technical, and organizational
          safeguards to protect your information. However, no method of
          transmission or storage is completely secure.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">7. Cookies</h2>
        <p>SparesX may use cookies and similar technologies to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Keep users signed in</li>
          <li>Remember preferences</li>
          <li>Improve performance</li>
          <li>Analyze website traffic</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          8. Data Retention
        </h2>
        <p>
          We retain your information for as long as necessary to operate the
          platform, comply with legal obligations, resolve disputes, and enforce
          our agreements.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">9. Your Rights</h2>
        <p>You may:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Update your profile information</li>
          <li>
            Request deletion of your account (subject to legal or operational
            requirements)
          </li>
          <li>Contact us regarding your personal information</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          10. Children&apos;s Privacy
        </h2>
        <p>SparesX is intended for users who are at least 18 years old.</p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">11. Changes</h2>
        <p>
          We may update this Privacy Policy from time to time. Continued use of
          the platform constitutes acceptance of the updated policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-gray-900 mb-2">12. Contact</h2>
        <ul className="list-none space-y-1 mt-2">
          <li>
            <strong>Business name:</strong> SparesX
          </li>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:support@sparesx.in" className="text-blue-600">
              support@sparesx.in
            </a>
          </li>
          <li>
            <strong>Phone:</strong> Available via{" "}
            <a href="/support" className="text-blue-600">
              Support
            </a>
          </li>
          <li>
            <strong>Service area:</strong> India only
          </li>
          <li>
            <strong>Address:</strong> India (contact support for correspondence
            details)
          </li>
        </ul>
      </section>
    </LegalPage>
  );
}
