import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service | House of Noire",
  description: "Read our terms of service and understand the terms and conditions for using House of Noire.",
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-8">Terms of Service</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-[#BDBDBD]">
          <p className="text-sm text-[#808080]">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using the House of Noire website, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily access the materials on House of Noire&apos;s website for personal, non-commercial transitory viewing only. 
              This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained on the website</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">3. Product Information</h2>
            <p>
              We strive to provide accurate product descriptions, images, and pricing. However, we do not warrant that product descriptions, 
              images, or other content on this site is accurate, complete, reliable, current, or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">4. Pricing and Payment</h2>
            <p>
              All prices are displayed in PKR (Pakistani Rupees). We reserve the right to change prices at any time without prior notice. 
              Payment can be made via Stripe (credit/debit card) or Cash on Delivery (COD). For COD orders, payment is collected upon delivery.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">5. Orders and Shipping</h2>
            <p>
              When you place an order, you are making an offer to purchase products. We reserve the right to accept or reject your order 
              for any reason. Shipping is free on all orders. Delivery times may vary based on your location.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">6. Returns and Refunds</h2>
            <p>
              Please refer to our <a href="/exchange-policy" className="text-primary hover:underline">Exchange Policy</a> for details on 
              returns, exchanges, and refunds.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">7. Limitation of Liability</h2>
            <p>
              House of Noire shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from 
              your use of or inability to use the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">8. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Your continued use of the website after any changes constitutes 
              acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">9. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us through our <a href="/contact" className="text-primary hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



