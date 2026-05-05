import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { notFound } from "next/navigation"
import { FAQManager } from "@/components/admin/faq-manager"

export default async function CategoryFAQsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  await requireAuth()
  
  const { slug } = await params

  const category = await sql`
    SELECT * FROM categories WHERE slug = ${slug}
  `

  if (category.length === 0) {
    notFound()
  }

  const [categoryData] = category

  const faqs = await sql`
    SELECT * FROM category_faqs
    WHERE category_id = ${categoryData.id}
    ORDER BY "order" ASC, created_at ASC
  `

  // Map FAQs to match the FAQ interface
  const formattedFAQs = faqs.map((faq: any) => ({
    id: faq.id,
    question: faq.question || "",
    answer: faq.answer || "",
    order: typeof faq.order === "number" ? faq.order : parseInt(faq.order || "0", 10),
  }))

  return (
    <div>
      <h1 className="text-3xl font-serif font-bold mb-8">
        FAQs for {categoryData.name}
      </h1>
      <p className="text-[#BDBDBD] mb-8">
        Manage frequently asked questions for this category. These FAQs are optimized for AEO (Answer Engine Optimization).
      </p>
      <FAQManager categoryId={categoryData.id} initialFAQs={formattedFAQs} />
    </div>
  )
}

