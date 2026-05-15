import { LoginForm } from "@/components/admin/login-form"

export default function LoginPage() {
  return (
    <div
      style={{
        backgroundImage: "url('/img/Background.jpeg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}
      className="flex items-center justify-center"
    >
      <div className="w-full max-w-md px-4">
        <div
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
          className="rounded-lg p-8 shadow-xl"
        >
          <h1 className="text-3xl font-serif font-bold text-center mb-2 text-gray-800">
            Zarge
          </h1>
          <p className="text-center text-gray-500 mb-8 text-sm">
            Admin Login
          </p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}