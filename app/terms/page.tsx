import type { Metadata } from "next";
import LegalPage, { LegalSection } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use | Wedge Works",
  description: "Terms governing access to and use of the Wedge Works platform and products.",
};

const effectiveDate = "17 August 2026";

export default function TermsOfUsePage() {
  return (
    <LegalPage
      title="Terms of Use"
      effectiveDate={effectiveDate}
      introduction="These Terms govern access to the Wedge Works website and its workforce, bookkeeping, executive intelligence, website, point-of-sale and supply-operation products."
    >
      <LegalSection title="1. Acceptance">
        <p>By creating an account, accessing a dashboard or using a Wedge Works product, you agree to these Terms and the Privacy Policy. If you act for a company, you confirm that you have authority to bind that company. If you do not agree, do not use the services.</p>
      </LegalSection>
      <LegalSection title="2. Products covered">
        <p>These Terms apply to WedgeCLOCKin, Wedge-I, WedgeBooks, WedgeWeb, Wedge-SmartPOS, Wedge-Supply ERP and related websites, applications, previews, exports, integrations and support services made available by Wedge Works.</p>
      </LegalSection>
      <LegalSection title="3. Accounts and authorised users">
        <ul>
          <li>You must provide accurate, current and complete registration information.</li>
          <li>You are responsible for account credentials, authorised users and activity conducted through your account.</li>
          <li>Credentials may not be shared except through product functions intended for authorised users.</li>
          <li>You must promptly report suspected unauthorised access or misuse.</li>
          <li>Managers must remove access when a user leaves or changes role.</li>
        </ul>
      </LegalSection>
      <LegalSection title="4. Business and employer responsibilities">
        <p>Businesses control the data they enter and the decisions they make using the platform. Employers are responsible for employee notices and consents, lawful attendance and face-verification practices, workplace GPS configuration, employment decisions, payroll review, statutory compliance and the accuracy of manager-entered information.</p>
      </LegalSection>
      <LegalSection title="5. Acceptable use">
        <p>You must not:</p>
        <ul>
          <li>Use the service unlawfully, fraudulently or to infringe another person&apos;s rights.</li>
          <li>Attempt proxy attendance, false GPS reporting, unauthorised payroll changes or manipulation of audit records.</li>
          <li>Probe, bypass, disable or interfere with authentication, access controls, rate limits or security features.</li>
          <li>Upload malware, harmful code, unlawful material or information you have no right to process.</li>
          <li>Reverse engineer, scrape, resell or commercially exploit the service except where permitted in writing.</li>
          <li>Use automated activity that materially degrades the service or affects other customers.</li>
        </ul>
      </LegalSection>
      <LegalSection title="6. Customer data and content">
        <p>You retain your rights in business data and content you submit. You grant Wedge Works the limited permission needed to host, process, transmit, back up, analyse and display that data solely to provide, secure and improve the contracted services.</p>
        <p>You are responsible for the legality, accuracy, quality and retention of your data and for maintaining independent copies where required for legal, tax, employment or operational purposes.</p>
      </LegalSection>
      <LegalSection title="7. AI-assisted and automated features">
        <p>Some products use AI, OCR, forecasting, matching or rules-based automation. Outputs may be incomplete, probabilistic or incorrect and must be reviewed by an authorised person before being used for payroll, accounting, employment, purchasing or other material decisions.</p>
      </LegalSection>
      <LegalSection title="8. Trials, plans and payment">
        <p>Trial duration, product limits, features and prices may be shown during registration or in the relevant dashboard. A trial may become read-only or unavailable when it ends. Paid access, refunds, taxes and renewal terms are governed by the plan presented at purchase and any additional written commercial terms accepted by the customer.</p>
      </LegalSection>
      <LegalSection title="9. Third-party services">
        <p>The platform may depend on hosting, databases, email, maps, AI, payment, messaging or other third-party services. Their availability and separate terms may affect particular features. Wedge Works is not responsible for a third party&apos;s independent service or conduct.</p>
      </LegalSection>
      <LegalSection title="10. Intellectual property">
        <p>Wedge Works and its licensors retain all rights in the platform, software, product names, designs, documentation, workflows and underlying technology. No ownership is transferred to a user. Feedback may be used to improve the service without restriction or payment.</p>
      </LegalSection>
      <LegalSection title="11. Availability and changes">
        <p>Wedge Works aims to provide a reliable service but does not guarantee uninterrupted or error-free operation. Features may be repaired, updated, limited or retired for security, legal, operational or product reasons. Reasonable efforts will be made to avoid unnecessary disruption to active customers.</p>
      </LegalSection>
      <LegalSection title="12. Suspension and termination">
        <p>Access may be suspended or terminated for non-payment, unlawful activity, security risk, material breach, abuse of the service or where continued operation is no longer reasonably possible. Customers remain responsible for exporting records they are legally required to retain before access ends.</p>
      </LegalSection>
      <LegalSection title="13. Warranties and liability">
        <p>The services are provided on an “as available” basis to the extent permitted by law. Wedge Works does not warrant that every output, calculation, verification or third-party service will be complete or error-free. Nothing in these Terms excludes liability that cannot lawfully be excluded. Additional limitations are described in the Disclaimer.</p>
      </LegalSection>
      <LegalSection title="14. Indemnity">
        <p>To the extent permitted by law, a business customer is responsible for claims arising from its unlawful use of the service, its data or instructions, its employment or customer practices, or its breach of these Terms or another person&apos;s rights.</p>
      </LegalSection>
      <LegalSection title="15. Governing law">
        <p>These Terms are governed by the laws of Malaysia. The parties should first attempt to resolve disputes in good faith. Subject to any mandatory consumer or statutory rights, the courts of Malaysia will have jurisdiction.</p>
      </LegalSection>
      <LegalSection title="16. Changes and contact">
        <p>These Terms may be updated to reflect product, security, commercial or legal changes. The latest version will be published here with its effective date. Questions may be sent to <a href="mailto:support@wedge-works.com">support@wedge-works.com</a>.</p>
      </LegalSection>
    </LegalPage>
  );
}
