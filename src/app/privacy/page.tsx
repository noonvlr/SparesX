import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How SparesX collects, uses, and protects personal information on the India marketplace platform.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="3 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">1. Introduction</h2>
        <p>
          This Privacy Policy is issued by Syed Idrees, trading as Noon Computers
          (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;), the Proprietor operating the SparesX
          platform (&quot;SparesX,&quot; &quot;the Platform&quot;). It explains how we
          collect, use, store, and disclose personal information in connection with
          your use of the Platform, in accordance with applicable Indian law,
          including the Information Technology Act, 2000, the Information Technology
          (Reasonable Security Practices and Procedures and Sensitive Personal Data
          or Information) Rules, 2011, and the Digital Personal Data Protection Act,
          2023, where applicable.
        </p>
        <p className="mt-2">
          By accessing or using SparesX, you consent to the collection and
          processing of your information as described in this Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          2. Information We Collect
        </h2>
        <p>We may collect the following categories of information:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Name, email address, and mobile number</li>
          <li>Profile and business information you choose to provide</li>
          <li>Product listings and associated images</li>
          <li>Messages exchanged with other users through the Platform</li>
          <li>IP address, browser type, and device information</li>
          <li>Usage analytics and login history</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          3. How We Use Your Information
        </h2>
        <p>We use the information collected to:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Create, verify, and manage your account</li>
          <li>Publish and display your product listings</li>
          <li>Facilitate communication between buyers and sellers</li>
          <li>Maintain and improve the Platform</li>
          <li>Detect, investigate, and prevent fraud or misuse</li>
          <li>Respond to support and grievance requests</li>
          <li>Comply with applicable legal and regulatory obligations</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          4. Disclosure of Information
        </h2>
        <p>
          We do not sell personal information to third parties. We may disclose
          information:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>
            To service providers who support our operations (e.g., hosting and
            storage providers), under confidentiality obligations
          </li>
          <li>
            Where required by law, regulation, or valid legal process
          </li>
          <li>
            To investigate suspected fraud, security incidents, or violations of
            our policies
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          5. User-Generated Content
        </h2>
        <p>
          Listings, images, profile details, and other content you choose to
          publish are visible to other users of the Platform and are your
          responsibility to keep accurate and lawful.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">6. Data Security</h2>
        <p>
          We implement reasonable administrative, technical, and organizational
          safeguards designed to protect your information. However, no method of
          electronic transmission or storage is completely secure, and we cannot
          guarantee absolute security.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          7. Cookies and Similar Technologies
        </h2>
        <p>
          We may use cookies to keep you signed in, remember preferences, analyze
          traffic, and improve Platform performance. You may control cookie
          settings through your browser.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          8. Data Retention
        </h2>
        <p>
          We retain personal information for as long as reasonably necessary to
          operate the Platform, comply with legal obligations, resolve disputes,
          and enforce our agreements.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">9. Your Rights</h2>
        <p>Subject to applicable law, you may:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Access and update your profile information</li>
          <li>
            Request deletion of your account, subject to legal or operational
            retention requirements
          </li>
          <li>
            Raise a grievance regarding the processing of your personal
            information (see Section 12)
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          10. Children&apos;s Privacy
        </h2>
        <p>
          SparesX is intended for use by individuals who are at least 18 years of
          age. We do not knowingly collect information from minors.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          11. Changes to this Policy
        </h2>
        <p>
          We may revise this Privacy Policy from time to time. Continued use of
          the Platform after any revision constitutes acceptance of the updated
          Policy.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          12. Grievance Officer &amp; Contact
        </h2>
        <p>
          In accordance with applicable Indian law, the following Grievance
          Officer may be contacted with respect to this Privacy Policy or any
          complaint regarding the processing of your personal information:
        </p>
        <ul className="list-none space-y-1 mt-2">
          <li>
            <strong>Name:</strong> Syed Idrees
          </li>
          <li>
            <strong>Entity:</strong> Noon Computers
          </li>
          <li>
            <strong>Address:</strong> No. 57, 2nd Floor, M.P. Sarathy Mansion,
            Anna Salai, Vellore, Tamil Nadu, India
          </li>
          <li>
            <strong>Phone:</strong>{" "}
            <a href="tel:8015606071">8015606071</a>
          </li>
          <li>
            <strong>Email:</strong>{" "}
            <a href="mailto:noon.vlr@gmail.com">noon.vlr@gmail.com</a>
          </li>
        </ul>
        <p className="mt-2">
          We aim to acknowledge grievances within a reasonable time and resolve
          them as expeditiously as possible.
        </p>
      </section>
    </LegalPage>
  );
}
