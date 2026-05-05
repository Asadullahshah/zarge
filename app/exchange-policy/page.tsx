import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Exchange Policy | House of Noire",
  description: "Learn about House of Noire's exchange and return policy for products.",
}

export default function ExchangePolicyPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-8">Exchange Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-[#BDBDBD]">
          <p className="text-sm text-[#808080]">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">1. Exchange Eligibility</h2>
            <p>
              We want you to be completely satisfied with your purchase. Items can be exchanged within 7 days of delivery, provided they meet the following conditions:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Items must be unused, unworn, and in their original condition</li>
              <li>Items must have all original tags and labels attached</li>
              <li>Items must be in their original packaging (if applicable)</li>
              <li>Proof of purchase (order number or receipt) is required</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">2. Non-Exchangeable Items</h2>
            <p>The following items cannot be exchanged:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Items that have been worn, used, or washed</li>
              <li>Items without original tags or labels</li>
              <li>Items damaged due to misuse or negligence</li>
              <li>Items purchased on sale or clearance (unless defective)</li>
              <li>Personalized or customized items</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">3. Size and Color Exchanges</h2>
            <p>
              If you need a different size or color, you can exchange your item for another size or color of the same product, 
              subject to availability. We recommend checking product availability before initiating an exchange.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">4. Defective or Damaged Items</h2>
            <p>
              If you receive a defective or damaged item, please contact us immediately within 48 hours of delivery. We will arrange 
              for a replacement or full refund, including return shipping costs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">5. How to Initiate an Exchange</h2>
            <p>To initiate an exchange:</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Contact us through our <a href="/contact" className="text-primary hover:underline">contact page</a> or email with your order number</li>
              <li>Provide details about the item you wish to exchange and the reason</li>
              <li>If approved, we will provide you with return instructions</li>
              <li>Package the item securely in its original packaging</li>
              <li>Ship the item back to us using the provided return address</li>
              <li>Once we receive and inspect the item, we will process your exchange</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">6. Return Shipping</h2>
            <p>
              For exchanges due to our error (wrong item, defective item), we will cover the return shipping costs. 
              For other exchanges, the customer is responsible for return shipping costs.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">7. Refunds</h2>
            <p>
              If an exchange is not possible (e.g., item is out of stock), we will issue a refund to your original payment method. 
              Refunds will be processed within 5-10 business days after we receive the returned item.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">8. Cash on Delivery (COD) Orders</h2>
            <p>
              For COD orders, refunds will be processed via bank transfer or other agreed-upon method. Please provide your bank 
              account details when requesting a refund.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">9. Processing Time</h2>
            <p>
              Exchanges are typically processed within 3-5 business days after we receive the returned item. You will receive 
              a confirmation email once your exchange has been processed.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">10. Contact Us</h2>
            <p>
              If you have any questions about our exchange policy, please contact us through our <a href="/contact" className="text-primary hover:underline">contact page</a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



