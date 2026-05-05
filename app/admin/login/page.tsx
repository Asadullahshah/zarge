import { LoginForm } from "@/components/admin/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B0C]">
      <div className="w-full max-w-md">
        <div className="bg-[#121213] rounded-lg p-8 shadow-xl">
          <h1 className="text-3xl font-serif font-bold text-center mb-2">
            Zarge
          </h1>
          <p className="text-center text-[#BDBDBD] mb-8">Admin Login</p>
          <LoginForm />
        </div>
      </div>
    </div>
  )
}

