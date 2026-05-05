import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy | House of Noire",
  description: "Read our privacy policy to understand how House of Noire collects, uses, and protects your personal information.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-[#BDBDBD]">
          <p className="text-sm text-[#808080]">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">1. Introduction</h2>
            <p>
              House of Noire (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">2. Information We Collect</h2>
            <p>We collect information that you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Personal Information:</strong> Name, email address, phone number, shipping and billing addresses</li>
              <li><strong>Payment Information:</strong> Payment method details (processed securely through Stripe for card payments)</li>
              <li><strong>Order Information:</strong> Products purchased, order history, and preferences</li>
              <li><strong>Account Information:</strong> If you create an account, we collect login credentials and profile information</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate with you about your orders, products, and promotions</li>
              <li>Improve our website and customer service</li>
              <li>Send you marketing communications (with your consent)</li>
              <li>Detect and prevent fraud</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">4. Information Sharing</h2>
            <p>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Service Providers:</strong> Third-party companies that help us operate our business (e.g., payment processors, shipping companies)</li>
              <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">5. Payment Processing</h2>
            <p>
              For card payments, we use Stripe, a secure payment processor. Your payment information is encrypted and processed securely. 
              We do not store your full card details on our servers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, 
              alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">7. Cookies</h2>
            <p>
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookies 
              through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your information</li>
              <li>Opt-out of marketing communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">9. Children&apos;s Privacy</h2>
            <p>
              Our website is not intended for children under 18. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page 
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">11. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us through our <a href="/contact" className="text-primary hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



