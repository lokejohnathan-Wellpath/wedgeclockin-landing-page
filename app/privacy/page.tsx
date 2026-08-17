import type { Metadata } from "next";
import LegalPage, { LegalSection } from "../components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy | Wedge Works",
  description: "Privacy Policy for the Wedge Works platform and its business software products.",
};

const effectiveDate = "17 August 2026";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      effectiveDate={effectiveDate}
      introduction="This Policy explains how Wedge Works handles personal and business information across WedgeCLOCKin, Wedge-I, WedgeBooks, WedgeWeb, Wedge-SmartPOS, Wedge-Supply ERP and related services."
    >
      <LegalSection title="1. Scope and roles">
        <p>This Privacy Policy applies to the Wedge Works website, progressive web applications, mobile applications, manager and employee portals, product dashboards and supporting services. Depending on the product and circumstances, Wedge Works may process data for its own platform administration or on behalf of a subscribing business.</p>
        <p>Employers and merchants remain responsible for the information they collect through the platform, the instructions they give to Wedge Works, and the notices or consents required from their employees, customers and other individuals.</p>
      </LegalSection>
      <LegalSection title="2. Information we process">
        <ul>
          <li>Account information such as names, email addresses, telephone numbers, passwords and verification records.</li>
          <li>Business information such as company names, registration details, addresses, outlet codes, workplace settings and subscription information.</li>
          <li>Employee information such as identity or passport numbers, employee codes, departments, positions, attendance, leave, payroll, overtime, statutory details and employment documents.</li>
          <li>Attendance verification information such as camera images, registered face information, timestamps, precise location and workplace-radius results.</li>
          <li>SmartPOS information such as customer profiles, pets, appointments, services, products, sales, payment-method records and receipts.</li>
          <li>WedgeBooks information such as uploaded receipts, invoices, source documents, extracted text, bookkeeping categories, journals and exports.</li>
          <li>Operational information entered into Wedge-Supply ERP, Wedge-I and WedgeWeb, including inventory, purchasing, production, business metrics, website drafts and user instructions.</li>
          <li>Technical information such as IP address, device and browser information, security logs, diagnostic events and session information.</li>
        </ul>
      </LegalSection>
      <LegalSection title="3. Face verification and camera access">
        <p>WedgeCLOCKin uses camera images to register an employee and compare an attendance image against the employee&apos;s registered face information. Face information is used for identity and attendance security. It is not sold or used for advertising.</p>
        <p>Employers must inform employees about the use of face verification and obtain any consent required under applicable law before registering or verifying an employee.</p>
      </LegalSection>
      <LegalSection title="4. Precise location information">
        <p>WedgeCLOCKin may collect precise location only when an employee performs an attendance action. The location is compared with the workplace location and attendance radius configured by the employer. Wedge Works does not use attendance location for advertising or continuous background tracking.</p>
      </LegalSection>
      <LegalSection title="5. How information is used">
        <ul>
          <li>Provide, authenticate, secure and support the requested products.</li>
          <li>Record attendance, leave, overtime, payroll, appointments, sales and business operations.</li>
          <li>Process documents, generate exports and provide AI-assisted analysis or recommendations.</li>
          <li>Administer trials, subscriptions, service access and customer support.</li>
          <li>Detect misuse, investigate incidents, enforce platform rules and maintain audit records.</li>
          <li>Improve reliability, usability and product performance.</li>
          <li>Comply with applicable laws, lawful requests and dispute-resolution obligations.</li>
        </ul>
      </LegalSection>
      <LegalSection title="6. Legal and operational basis">
        <p>Information is processed where necessary to provide contracted services, follow a customer&apos;s lawful instructions, comply with legal obligations, protect platform and user security, administer legitimate business operations, or where valid consent has been obtained. Malaysian users may also have rights under the Personal Data Protection Act 2010 and other applicable laws.</p>
      </LegalSection>
      <LegalSection title="7. Service providers and disclosure">
        <p>Wedge Works may use carefully selected providers for cloud hosting, databases, deployment, email delivery, payments, document processing, maps, geolocation support and AI-assisted face or document analysis. They may process information only as needed to supply their services and subject to their contractual and legal obligations.</p>
        <p>Information may also be disclosed when required by law, to protect rights or safety, to investigate fraud or security incidents, or as part of a lawful business restructuring. Wedge Works does not sell personal information.</p>
      </LegalSection>
      <LegalSection title="8. Storage, security and cross-border processing">
        <p>Reasonable technical and organisational safeguards are used, including encrypted transmission, authenticated access, role controls, company-level data separation, encryption of registered face information and security monitoring. No internet service can guarantee absolute security.</p>
        <p>Cloud providers may store or process information outside Malaysia. Where this occurs, Wedge Works uses reasonable contractual, technical and organisational safeguards suitable to the information and service involved.</p>
      </LegalSection>
      <LegalSection title="9. Retention">
        <p>Information is retained for as long as reasonably needed to provide the service, satisfy employment and business record requirements, maintain audit integrity, resolve disputes, prevent fraud and meet legal obligations. Retention periods may differ between attendance, payroll, accounting, sales, employment and security records.</p>
        <p>When information is no longer required, it may be deleted, anonymised or securely isolated, subject to lawful retention obligations and legitimate backup cycles.</p>
      </LegalSection>
      <LegalSection title="10. User choices and rights">
        <p>Subject to applicable law, individuals may request access to, correction of or deletion of personal information, withdraw consent where processing depends on consent, or ask questions about how information is handled. Employees should ordinarily contact their employer first because the employer controls their workforce records.</p>
      </LegalSection>
      <LegalSection title="11. Cookies and local device storage">
        <p>Wedge Works may use browser storage, authentication tokens and essential technical cookies to keep users signed in, preserve product settings, protect sessions and provide requested functionality. The platform does not use this information to sell behavioural advertising.</p>
      </LegalSection>
      <LegalSection title="12. Children">
        <p>Wedge Works is designed for businesses and their authorised workforce or customers. It is not directed to children. A business that enters information relating to a minor is responsible for ensuring that it has lawful authority to do so.</p>
      </LegalSection>
      <LegalSection title="13. Changes to this Policy">
        <p>This Policy may be updated as products, providers or legal obligations change. The revised version will be published here with a new effective date. Material changes may also be communicated through the platform where appropriate.</p>
      </LegalSection>
      <LegalSection title="14. Contact">
        <p>Privacy questions, access requests and deletion requests may be sent to <a href="mailto:support@wedge-works.com">support@wedge-works.com</a>. Please identify the relevant Wedge Works product, business account and nature of the request. Business hours are Monday to Friday, 9:00 AM to 6:00 PM, Malaysia Time.</p>
      </LegalSection>
    </LegalPage>
  );
}
