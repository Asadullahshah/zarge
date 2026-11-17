import { sql } from "@/lib/db"

export const OUR_STORY_KEY = "our_story_content"

// Shown until an admin saves their own text.
// Format: blank line = new paragraph. A paragraph starting with "> " is
// shown in serif italic (every line of it may start with "> ").
export const OUR_STORY_DEFAULT = `Zargé was never meant to be just clothing.

It started with a feeling—one that's hard to translate, but impossible to ignore. A quiet strength. A softness that carries weight. In Pashto, Zargé reflects something close to the heart—something emotional, personal, and deeply human. That meaning sits at the core of everything we create.

For six months, we worked behind the scenes in Lahore, obsessing over every detail—fabric, texture, thread, and form. Not just to make T-shirts, but to build pieces that feel like something. Something you don't just wear, but connect with.

Each design tells a story without saying too much.

A bloom that happens in silence.

A symbol of resilience wrapped in stillness.

A reminder to believe, even when no one's watching.

We chose embroidery because it lasts. It doesn't fade like prints. It becomes part of the fabric—just like experiences become part of us. Every stitch carries intention. Every thread holds meaning.

Our oversized silhouettes, crafted from premium French Cotton Terry, are designed to give you space—physically and mentally. Space to move. Space to feel. Space to be.

Zargé is for those who don't need to be loud to be seen.

For those who understand that growth is often invisible.

For those who carry stories within them.

This is not fast fashion.

This is not just design.

> This is Zargé
> where emotion meets form,
> and stories are worn, not told.`

export async function getOurStory(): Promise<string> {
  try {
    const rows = await sql`SELECT value FROM settings WHERE key = ${OUR_STORY_KEY}`
    const value = (rows[0] as any)?.value
    return typeof value === "string" && value.trim() ? value : OUR_STORY_DEFAULT
  } catch {
    return OUR_STORY_DEFAULT
  }
}
