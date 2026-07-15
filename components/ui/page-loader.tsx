export function PageLoader({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#B8960C]/25 border-t-[#B8960C]" />
        <p className="text-xs uppercase tracking-[0.3em] text-gray-400">{label}</p>
      </div>
    </div>
  )
}
