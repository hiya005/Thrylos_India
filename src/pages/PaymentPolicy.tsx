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

const PaymentPolicy = () => {
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
          Payment Policy
        </h1>

        <p className="text-sm text-zinc-400 mb-12">
          Effective Date: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-10">

          <Section number="1." title="General Payment Terms">
            <p>
              Thrylos India provides customized technology services including
              website development, software development, cloud solutions,
              automation systems, and consulting.
            </p>
            <p>
              All payments must be made as per the quotation, invoice,
              or mutually agreed contract.
            </p>
          </Section>

          <Section number="2." title="Advance Payment Requirement">
            <p>
              A mandatory advance payment is required before commencement
              of any project.
            </p>
            <p>
              Work will begin only after confirmation of payment receipt.
              The advance amount secures project resources and development allocation.
            </p>
          </Section>

          <Section number="3." title="Accepted Payment Methods">
            <ul className="list-disc pl-6 space-y-2">
              <li>UPI</li>
              <li>Debit/Credit Cards</li>
              <li>Net Banking</li>
              <li>Approved Digital Payment Gateways</li>
              <li>Bank Transfer (NEFT/RTGS/IMPS)</li>
            </ul>
            <p>
              Payments are processed via RBI-compliant and PCI-DSS certified
              third-party payment processors.
            </p>
          </Section>

          <Section number="4." title="No Storage of Card Data">
            <p>
              Thrylos India does not store full credit/debit card numbers,
              CVV, or sensitive banking details on its servers.
              All transactions are securely processed by authorized payment gateways.
            </p>
          </Section>

          <Section number="5." title="Milestone & Final Payments">
            <p>
              Projects may be divided into milestones. Clients must clear
              milestone payments before proceeding to the next development phase.
            </p>
            <p>
              Final deliverables may be withheld until full payment is received.
            </p>
          </Section>

          <Section number="6." title="Late Payments">
            <p>
              Delayed payments may result in:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Project suspension</li>
              <li>Delayed delivery timelines</li>
              <li>Termination of services</li>
            </ul>
          </Section>

          <Section number="7." title="Taxes & Charges">
            <p>
              All applicable taxes (including GST, if applicable)
              shall be borne by the client unless stated otherwise.
            </p>
          </Section>

          <Section number="8." title="Chargebacks & Disputes">
            <p>
              Initiating fraudulent chargebacks or payment disputes
              after service delivery is strictly prohibited.
            </p>
            <p>
              In case of a chargeback, we reserve the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Suspend all ongoing services</li>
              <li>Provide documented proof of service delivery</li>
              <li>Initiate legal recovery proceedings</li>
            </ul>
          </Section>

          <Section number="9." title="Currency">
            <p>
              Payments shall be processed in Indian Rupees (INR)
              unless otherwise agreed in writing.
            </p>
          </Section>

          <Section number="10." title="Policy Updates">
            <p>
              Thrylos India reserves the right to update this Payment Policy
              at any time. Continued use of services implies acceptance
              of the updated policy.
            </p>
          </Section>

          <Section number="11." title="Contact Information">
            <p>
              For payment-related queries:
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

export default PaymentPolicy;
