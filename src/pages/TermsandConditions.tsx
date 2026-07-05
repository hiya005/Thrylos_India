import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const Section = ({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 space-y-4">
    <h2 className="text-2xl font-bold text-white">
      <span className="text-purple-400 mr-2">{number}</span>
      {title}
    </h2>
    <div className="text-zinc-300 leading-relaxed space-y-3">
      {children}
    </div>
  </section>
);

const TermsAndConditions = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black py-16 px-6">
      <div className="container mx-auto max-w-4xl">
        
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-10 text-zinc-300 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>

        <h1
          className="text-5xl font-extrabold tracking-tight mb-3
          bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400
          bg-clip-text text-transparent"
        >
          Terms & Conditions
        </h1>

        <p className="text-sm text-zinc-400 mb-12">
          Effective Date: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-10">

          <Section number="1." title="Acceptance of Terms">
            <p>
              By accessing or using services provided by Thrylos India
              ("Company", "we", "our", "us"), you agree to be legally bound
              by these Terms & Conditions.
            </p>
          </Section>

          <Section number="2." title="Services Offered">
            <p>
              Thrylos India provides technology services including but not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Website and web application development</li>
              <li>Software and SaaS development</li>
              <li>Cloud infrastructure setup and deployment</li>
              <li>Automation systems</li>
              <li>Technical consulting and IT solutions</li>
            </ul>
          </Section>

          <Section number="3." title="Client Responsibilities">
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate project requirements</li>
              <li>Provide timely approvals and feedback</li>
              <li>Ensure legal rights to all content provided</li>
              <li>Comply with applicable laws while using delivered services</li>
            </ul>
          </Section>

          <Section number="4." title="Payments & Billing">
            <p>
              Payments must be made as per the agreed quotation or contract.
              We may require advance payments before commencing work.
            </p>
            <p>
              All payments are processed via RBI-compliant and PCI-DSS certified
              third-party payment gateways. Thrylos India does not store
              sensitive card details.
            </p>
            <p>
              Failure to complete payments may result in suspension or termination
              of services.
            </p>
          </Section>

          <Section number="5." title="Refund & Cancellation">
            <p>
              Due to the customized and digital nature of services, payments
              once made are generally non-refundable unless otherwise stated
              in a written agreement.
            </p>
            <p>
              Cancellation requests must be submitted in writing.
              Refund eligibility will be evaluated based on work completed.
            </p>
          </Section>

          <Section number="6." title="Intellectual Property Rights">
            <p>
              Upon full payment, ownership of final deliverables may transfer
              to the client unless otherwise agreed.
            </p>
            <p>
              Thrylos India retains the right to use project work for portfolio
              and marketing purposes unless restricted by NDA.
            </p>
          </Section>

          <Section number="7." title="Confidentiality">
            <p>
              Both parties agree to maintain confidentiality of proprietary
              information, project data, business strategies, and technical materials.
            </p>
          </Section>

          <Section number="8." title="Limitation of Liability">
            <p>
              Thrylos India shall not be liable for indirect, incidental,
              special, or consequential damages arising from service usage.
            </p>
            <p>
              Total liability shall not exceed the amount paid for the specific service.
            </p>
          </Section>

          <Section number="9." title="Service Availability">
            <p>
              While we strive for uninterrupted service, we do not guarantee
              that services will be error-free or continuously available.
            </p>
          </Section>

          <Section number="10." title="Third-Party Services">
            <p>
              Projects may integrate third-party tools, hosting providers,
              or APIs. We are not responsible for disruptions caused by
              such external providers.
            </p>
          </Section>

          <Section number="11." title="Termination">
            <p>
              We reserve the right to suspend or terminate services in cases of:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Non-payment</li>
              <li>Fraudulent activities</li>
              <li>Violation of laws</li>
              <li>Breach of these Terms</li>
            </ul>
          </Section>

          <Section number="12." title="Compliance with Law">
            <p>
              These Terms comply with the Information Technology Act, 2000,
              and applicable Indian regulations.
            </p>
          </Section>

          <Section number="13." title="Governing Law & Jurisdiction">
            <p>
              These Terms shall be governed by the laws of India.
              Any disputes shall be subject to the jurisdiction of
              Indian courts.
            </p>
          </Section>

          <Section number="14." title="Amendments">
            <p>
              Thrylos India reserves the right to modify these Terms at any time.
              Continued use of services constitutes acceptance of revised terms.
            </p>
          </Section>

          <Section number="15." title="Contact Information">
            <p>
              For questions regarding these Terms:
            </p>
            <p>
              <strong>Email:</strong>{" "}
              <a
                href="mailto:thrylosindia@gmail.com"
                className="text-purple-400 underline"
              >
                thrylosindia@gmail.com
              </a>
            </p>
          </Section>

        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;
