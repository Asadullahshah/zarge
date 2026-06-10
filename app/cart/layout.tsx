export default function CartLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="flex flex-1 flex-col bg-white">{children}</div>
}
