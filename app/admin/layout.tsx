export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Middleware handles authentication protection for all /admin routes
  // Protected route layouts also have requireAuth() for additional security
  // This root layout just passes through - protection is handled by:
  // 1. middleware.ts - protects all /admin routes except /admin/login
  // 2. app/admin/(protected)/layout.tsx - requires auth for protected routes
  // 3. app/admin/(dashboard)/layout.tsx - requires auth for dashboard routes
  return <>{children}</>
}
