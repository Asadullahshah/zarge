export function PromoBanner({ message }: { message: string }) {
  return (
    <div className="w-full bg-[#D4AF37] text-[#1a1a1a] text-center py-2 px-4 text-sm font-medium tracking-wide">
      {message}
    </div>
  )
}
