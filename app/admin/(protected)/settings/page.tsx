import { requireAuth } from "@/lib/auth-helpers"
import { sql } from "@/lib/db"
import { SettingsForm } from "@/components/admin/settings-form"
import { PasswordUpdateForm } from "@/components/admin/password-update-form"
import { PaymentMethodsForm } from "@/components/admin/payment-methods-form"
import { PromoBannerForm } from "@/components/admin/promo-banner-form"

export default async function SettingsPage() {
  await requireAuth()

  const settings = await sql`
    SELECT * FROM settings ORDER BY key
  `

  const settingsMap = settings.reduce((acc: any, setting: any) => {
    acc[setting.key] = setting.value
    return acc
  }, {})

  const promoBannerRows = await sql`
    SELECT enabled, message FROM site_settings WHERE key = 'promo_banner'
  `
  const promoBanner = promoBannerRows[0] || { enabled: false, message: "" }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-serif font-bold">Settings</h1>
      
      {/* Password Update Section */}
      <div className="max-w-2xl">
        <PasswordUpdateForm />
      </div>

      {/* Payment Methods Section */}
      <div className="max-w-4xl">
        <PaymentMethodsForm initialSettings={settingsMap} />
      </div>

      {/* Promo Banner Section */}
      <div className="max-w-4xl">
        <PromoBannerForm initialEnabled={promoBanner.enabled} initialMessage={promoBanner.message} />
      </div>

      {/* Site Settings Section */}
      <div className="max-w-4xl">
        <SettingsForm initialSettings={settingsMap} />
      </div>
    </div>
  )
}

