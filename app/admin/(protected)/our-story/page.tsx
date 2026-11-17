import { requireAuth } from "@/lib/auth-helpers"
import { getOurStory } from "@/lib/our-story"
import { OurStoryForm } from "@/components/admin/our-story-form"

export const dynamic = "force-dynamic"

export default async function OurStoryPage() {
  await requireAuth()

  const content = await getOurStory()

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold">Our Story</h1>
        <p className="text-[#BDBDBD] mt-1">
          Edit the Our Story text shown on the landing page.
        </p>
      </div>

      <div className="max-w-4xl">
        <OurStoryForm initialContent={content} />
      </div>
    </div>
  )
}
