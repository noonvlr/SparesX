import type { Metadata } from "next";
import LegalPage from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing use of the SparesX India marketplace connecting buyers and sellers of spare parts.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="3 August 2026">
      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          1. Acceptance of Terms
        </h2>
        <p>
          By accessing or using SparesX, you agree to be bound by these Terms of
          Service (&quot;Terms&quot;). SparesX is operated by Syed Idrees, trading as
          Noon Computers.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          2. Nature of the Platform
        </h2>
        <p>
          SparesX is an online platform that connects buyers and sellers of mobile
          and device spare parts within India. SparesX is not a party to any
          transaction between users, does not manufacture, own, inspect, or
          guarantee any product listed, and does not currently process or collect
          payments of any kind.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">3. Eligibility</h2>
        <p>To use SparesX, you must:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Be at least 18 years of age</li>
          <li>Provide accurate and current information</li>
          <li>Be located in, or provide goods/services to, India</li>
          <li>Comply with all applicable Indian laws</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">4. User Accounts</h2>
        <p>
          You are responsible for maintaining the confidentiality of your account
          credentials and for all activity that occurs under your account.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">5. Listings</h2>
        <p>Sellers represent and warrant that:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Product descriptions and pricing are accurate</li>
          <li>Images represent the actual item being offered</li>
          <li>They hold the legal right to sell the listed item</li>
        </ul>
        <p className="mt-2">
          SparesX may remove any listing it reasonably believes to be inaccurate,
          misleading, or in violation of these Terms.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          6. Buyer Responsibilities
        </h2>
        <p>
          Buyers are responsible for independently verifying product details,
          communicating with sellers prior to purchase, and exercising reasonable
          diligence when transacting with other users.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">7. Payments</h2>
        <p>
          SparesX does not process, collect, or hold payments. All payment
          arrangements are made directly between buyers and sellers, entirely at
          their own risk. SparesX bears no responsibility for any payment dispute
          arising between users.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          8. Shipping and Delivery
        </h2>
        <p>
          Shipping, delivery, and related logistics are the sole responsibility of
          the buyer and seller involved, unless otherwise expressly stated on the
          Platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          9. Prohibited Activities
        </h2>
        <p>Users shall not:</p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>List or sell counterfeit or stolen goods</li>
          <li>Upload false or misleading information</li>
          <li>Spam, harass, or threaten other users</li>
          <li>Attempt unauthorized access to the Platform or its systems</li>
          <li>Introduce malware or malicious code</li>
          <li>Violate any applicable law</li>
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          10. Intellectual Property
        </h2>
        <p>
          Users retain ownership of content they upload but grant SparesX a
          non-exclusive, royalty-free license to host, display, and use such
          content for the purpose of operating and promoting the Platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          11. Suspension and Termination
        </h2>
        <p>
          We may suspend or terminate any account found to be in violation of
          these Terms or engaged in fraudulent, unlawful, or abusive conduct, with
          or without prior notice, where warranted.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          12. Limitation of Liability
        </h2>
        <p>
          The Platform is provided on an &quot;as is&quot; and &quot;as available&quot;
          basis, without warranties of any kind. To the fullest extent permitted by
          applicable law, SparesX and its Proprietor shall not be liable for any
          loss arising from product quality, transactions between users, payment
          disputes, shipping issues, or any interaction between users of the
          Platform.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">
          13. Governing Law and Jurisdiction
        </h2>
        <p>
          These Terms shall be governed by and construed in accordance with the
          laws of India. Any dispute arising out of or in connection with these
          Terms shall be subject to the exclusive jurisdiction of the competent
          courts at Vellore, Tamil Nadu, India.
        </p>
      </section>

      <section>
        <h2 className="text-xl font-bold text-[var(--ink)] mb-2">14. Contact</h2>
        <p>Syed Idrees, Noon Computers</p>
        <p className="mt-1">
          No. 57, 2nd Floor, M.P. Sarathy Mansion, Anna Salai, Vellore, Tamil
          Nadu, India
        </p>
        <p className="mt-1">
          Phone: <a href="tel:8015606071">8015606071</a>
          {" | "}
          Email:{" "}
          <a href="mailto:noon.vlr@gmail.com">noon.vlr@gmail.com</a>
        </p>
      </section>
    </LegalPage>
  );
}
