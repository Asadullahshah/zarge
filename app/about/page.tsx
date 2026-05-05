import { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About Us | Zarge",
  description: "Learn about Zarge - Your premier destination for fashion, home essentials, and quality lifestyle products.",
}

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-serif font-bold mb-8">About Zarge</h1>
        
        <div className="prose prose-invert max-w-none space-y-6 text-[#BDBDBD]">
          <p className="text-lg">
            Welcome to Zarge, your premier destination for exquisite fashion, elegant home essentials, and quality lifestyle products.
          </p>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">Our Story</h2>
            <p>
              Zarge was founded with a vision to bring together the finest in fashion and home essentials under one roof. 
              We believe that style and quality should be accessible to everyone, and we&apos;re committed to offering products that 
              reflect elegance, sophistication, and timeless appeal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">Our Mission</h2>
            <p>
              Our mission is to provide our customers with carefully curated collections that blend contemporary trends with classic 
              elegance. We source products from trusted manufacturers and ensure that every item meets our high standards for quality 
              and craftsmanship.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">What We Offer</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Men&apos;s Fashion:</strong> A wide selection of formal wear, casual clothing, and accessories</li>
              <li><strong>Women&apos;s Fashion:</strong> Elegant outfits, traditional wear, and modern styles</li>
              <li><strong>Home Essentials:</strong> Quality bed sheets, home textiles, and decor items</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">Our Commitment</h2>
            <p>
              At Zarge, we are committed to:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Providing exceptional customer service</li>
              <li>Ensuring product quality and authenticity</li>
              <li>Offering competitive prices and regular sales</li>
              <li>Maintaining a seamless shopping experience</li>
              <li>Supporting our customers with reliable delivery and support</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-serif font-bold text-[#F7F7F7] mt-8 mb-4">Contact Us</h2>
            <p>
              Have questions or need assistance? We&apos;re here to help! Visit our <Link href="/contact" className="text-primary hover:underline">contact page</Link> to get in touch with our team.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}



