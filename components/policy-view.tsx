// Renders admin-editable policy text into readable, on-brand sections.
// Convention: blank line separates blocks; each block's first line is a heading,
// remaining lines are paragraphs, and lines starting with "- " become bullets.
export function PolicyView({ title, content }: { title: string; content: string }) {
  const blocks = content.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean)

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-serif font-bold text-[#1a1a1a] mb-8">{title}</h1>
        <div className="space-y-8">
          {blocks.map((block, i) => {
            const lines = block.split("\n").map((l) => l.trim()).filter(Boolean)
            const [head, ...rest] = lines
            const bullets = rest.filter((l) => l.startsWith("- "))
            const paras = rest.filter((l) => !l.startsWith("- "))
            return (
              <section key={i} className="space-y-3">
                <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#1a1a1a]">
                  {head}
                </h2>
                {paras.map((p, j) => (
                  <p key={j} className="text-gray-600 leading-relaxed">
                    {p}
                  </p>
                ))}
                {bullets.length > 0 && (
                  <ul className="list-disc list-inside space-y-1.5 text-gray-600">
                    {bullets.map((b, j) => (
                      <li key={j}>{b.replace(/^-\s*/, "")}</li>
                    ))}
                  </ul>
                )}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
