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

const RefundPolicy = () => {
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
          Refund Policy
        </h1>

        <p className="text-sm text-zinc-400 mb-12">
          Effective Date: {new Date().toLocaleDateString()}
        </p>

        <div className="space-y-10">

          <Section number="1." title="Nature of Services">
            <p>
              Thrylos India provides customized digital and technology services
              including website development, software development, cloud solutions,
              and automation systems. Due to the customized and resource-intensive
              nature of these services, refunds are limited and governed strictly
              by this policy.
            </p>
          </Section>

          <Section number="2." title="Advance Payment Requirement">
            <p>
              An advance payment is mandatory before the commencement of any project.
              Work shall not begin until the advance payment has been successfully received.
            </p>
            <p>
              The advance payment secures project resources, development time,
              and operational allocation.
            </p>
          </Section>

          <Section number="3." title="No Complete Refund Policy">
            <p>
              Under no circumstances shall a full (100%) refund be issued once
              payment has been made.
            </p>
          </Section>

          <Section number="4." title="Advance Payment Non-Refundable">
            <p>
              The advance payment made prior to project initiation is strictly
              non-refundable. This amount compensates for resource booking,
              project planning, consultation, and initial setup work.
            </p>
          </Section>

          <Section number="5." title="Mid-Project Cancellation Refund Structure">
            <p>
              If a client chooses to terminate the project after work has commenced,
              refund eligibility will be determined based on the proportion of work completed
              relative to the agreed project scope.
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                If less than 50% of the agreed project scope has been completed,
                up to 40% of the total project fee (excluding advance payment)
                may be refunded.
              </li>
              <li>
                If more than 50% of the agreed project scope has been completed,
                only up to 10% of the total project fee (excluding advance payment)
                may be refunded.
              </li>
            </ul>

            <p>
              The determination of project completion percentage shall be based
              on documented deliverables, milestones, and internal development logs.
            </p>
          </Section>

          <Section number="6." title="Non-Refundable Cases">
            <ul className="list-disc pl-6 space-y-2">
              <li>Change of mind after project initiation</li>
              <li>Delay in client feedback or approvals</li>
              <li>Failure to provide required content or credentials</li>
              <li>Project suspension due to client-side issues</li>
              <li>Completed and delivered digital services</li>
            </ul>
          </Section>

          <Section number="7." title="Refund Processing">
            <p>
              Approved refunds, if applicable, will be processed within
              7–14 business days via the original mode of payment.
            </p>
            <p>
              Transaction processing fees charged by payment gateways
              may be deducted from the refundable amount.
            </p>
          </Section>

          <Section number="8." title="Dispute Resolution">
            <p>
              Any disputes regarding refunds must be raised in writing
              within 7 days of project cancellation. Both parties agree
              to attempt amicable resolution before initiating legal proceedings.
            </p>
          </Section>

          <Section number="9." title="Policy Modifications">
            <p>
              Thrylos India reserves the right to modify this Refund Policy
              at any time. Updated versions will be published on this page.
            </p>
          </Section>

          <Section number="10." title="Contact Information">
            <p>
              For refund-related inquiries:
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

export default RefundPolicy;
