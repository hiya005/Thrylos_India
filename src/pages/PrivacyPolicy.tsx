import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

// Reusable component to keep the main JSX clean.
// This handles the "glassmorphism" look (white/5 background with blur)
// so we don't have to repeat these long tailwind classes 13 times.
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
      {/* The number is purple to make it pop against the white text */}
      <span className="text-purple-400 mr-2">{number}</span>
      {title}
    </h2>
    <div className="text-zinc-300 leading-relaxed space-y-3">
      {children}
    </div>
  </section>
);

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <>

      {/* Main container with the dark gradient background */}
      <div className="min-h-screen bg-gradient-to-b from-black via-zinc-950 to-black py-16 px-6">
        <div className="container mx-auto max-w-4xl">
          
          {/* Simple Back Button navigation */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-10 text-zinc-300 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          {/* Main Title with that signature Thrylos gradient text effect */}
          <h1
            className="text-5xl font-extrabold tracking-tight mb-3
            bg-gradient-to-r from-purple-400 via-violet-400 to-blue-400
            bg-clip-text text-transparent"
          >
            Privacy Policy
          </h1>

          <p className="text-sm text-zinc-400 mb-12">
            Last Updated: {new Date().toLocaleDateString()}
          </p>

          {/* Content Stack - Using the Section component for consistency */}
          <div className="space-y-10">

            <Section number="1." title="Information We Collect">
              <p>
                At Thrylos, we collect information necessary to provide our esports
                tournament and digital services:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal information (name, email, phone number)</li>
                <li>Game-specific information (UID, player stats)</li>
                <li>Payment information (UPI ID, transaction references)</li>
                <li>Social media account details (for service delivery)</li>
              </ul>
            </Section>

            <Section number="2." title="How We Use Your Information">
              <ul className="list-disc pl-6 space-y-2">
                <li>Process tournament registrations and payments</li>
                <li>Deliver esports and social media services</li>
                <li>Send service updates and notifications</li>
                <li>Improve platform functionality and experience</li>
                <li>Prevent fraud, abuse, and security threats</li>
              </ul>
            </Section>

            <Section number="3." title="Data Security">
              <p>
                We implement industry-standard technical and organizational
                security measures to protect your data. Payment details are
                processed via secure, PCI-DSS compliant gateways, and Thrylos does
                not store complete card or banking information.
              </p>
            </Section>

            <Section number="4." title="Information Sharing">
              <p>We do not sell your personal data. Information may be shared with:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processors for transaction completion</li>
                <li>Trusted service providers for platform operations</li>
                <li>Legal or regulatory authorities when required by law</li>
              </ul>
            </Section>

            <Section number="5." title="Your Rights">
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and review your personal data</li>
                <li>Request correction or deletion of data</li>
                <li>Withdraw consent for optional processing</li>
                <li>Opt out of promotional communications</li>
              </ul>
            </Section>

            <Section number="6." title="Cookies and Tracking Technologies">
              <p>
                Thrylos uses cookies and similar technologies to enhance user
                experience, analyze usage, and improve services. Users may manage
                cookie preferences through browser settings.
              </p>
            </Section>

            <Section number="7." title="Contact Us">
              <p>
                For privacy-related queries or requests:
                <br />
                <strong>Email:</strong>{' '}
                <a
                  href="mailto:thrylosindia@gmail.com"
                  className="text-purple-400 underline"
                >
                  thrylosindia@gmail.com
                </a>
              </p>
            </Section>

            <Section number="8." title="Data Retention Policy">
              <p>
                Personal data is retained only for as long as necessary to fulfill
                service purposes, legal obligations, dispute resolution, and
                enforcement of agreements, after which it is securely deleted or
                anonymized.
              </p>
            </Section>

            <Section number="9." title="Children’s Privacy">
              <p>
                Thrylos services are intended for users aged 18 years and above.
                We do not knowingly collect personal data from minors. If such data
                is identified, it will be deleted promptly.
              </p>
            </Section>

            <Section number="10." title="Third-Party Links & Services">
              <p>
                Our platform may contain links to third-party websites or services.
                Thrylos is not responsible for the privacy practices or content of
                such third parties. Users are advised to review their policies.
              </p>
            </Section>

            <Section number="11." title="Legal Compliance">
              <p>
                This Privacy Policy is designed to comply with the Information
                Technology Act, 2000, and applicable Indian data protection laws.
                Where applicable, reasonable alignment with global data protection
                standards is maintained.
              </p>
            </Section>

            <Section number="12." title="Changes to This Privacy Policy">
              <p>
                Thrylos may update this Privacy Policy periodically. Changes will
                be effective upon posting. Continued use of the platform implies
                acceptance of the updated policy.
              </p>
            </Section>

            <Section number="13." title="Governing Law">
              <p>
                This Privacy Policy is governed by the laws of India. Any disputes
                arising under this policy shall be subject to Indian jurisdiction.
              </p>
            </Section>

          </div>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;