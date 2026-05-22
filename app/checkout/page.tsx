"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatPrice } from "@/lib/utils"
import Image from "next/image"
import Link from "next/link"

const checkoutSchema = z.object({
  email: z.string().trim().email("Invalid email address"),
  phone: z.string().trim().optional(),
  paymentMethod: z.enum(["STRIPE", "COD"], {
    required_error: "Please select a payment method",
  }),
  shippingAddress: z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    address: z.string().trim().min(1, "Address is required"),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    zipCode: z.string().trim().min(1, "Zip code is required"),
    country: z.string().trim().min(1, "Country is required"),
  }),
  billingAddress: z.object({
    firstName: z.string().trim().min(1, "First name is required"),
    lastName: z.string().trim().min(1, "Last name is required"),
    address: z.string().trim().min(1, "Address is required"),
    city: z.string().trim().min(1, "City is required"),
    state: z.string().trim().min(1, "State is required"),
    zipCode: z.string().trim().min(1, "Zip code is required"),
    country: z.string().trim().min(1, "Country is required"),
  }).optional(),
  useShippingForBilling: z.boolean().optional(),
}).superRefine((data, ctx) => {
  // Only validate billing address if NOT using shipping for billing
  if (data.useShippingForBilling !== true) {
    if (!data.billingAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Billing address is required when not using shipping address",
        path: ["billingAddress"],
      })
      return
    }
    const billing = data.billingAddress
    if (!billing.firstName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "First name is required",
        path: ["billingAddress", "firstName"],
      })
    }
    if (!billing.lastName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Last name is required",
        path: ["billingAddress", "lastName"],
      })
    }
    if (!billing.address?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Address is required",
        path: ["billingAddress", "address"],
      })
    }
    if (!billing.city?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "City is required",
        path: ["billingAddress", "city"],
      })
    }
    if (!billing.state?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "State is required",
        path: ["billingAddress", "state"],
      })
    }
    if (!billing.zipCode?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Zip code is required",
        path: ["billingAddress", "zipCode"],
      })
    }
    if (!billing.country?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Country is required",
        path: ["billingAddress", "country"],
      })
    }
  }
  // If using shipping for billing, skip billing address validation entirely
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

interface CartItem {
  id: string
  productId: string
  productName: string
  productSlug: string
  quantity: number
  price: number
  total: number
  images: Array<{ url: string; alt?: string }>
}

function CheckoutForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartTotal, setCartTotal] = useState(0)
  const [cartLoading, setCartLoading] = useState(true)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: "STRIPE",
      useShippingForBilling: true,
      shippingAddress: {
        country: "PK",
      },
      billingAddress: {
        country: "PK",
      },
    },
  })

  const useShippingForBilling = watch("useShippingForBilling")
  const shippingAddress = watch("shippingAddress")

  // Sync billing address with shipping address when checkbox is checked
  // This runs whenever useShippingForBilling changes or shippingAddress changes
  useEffect(() => {
    if (useShippingForBilling) {
      const currentShipping = getValues("shippingAddress")
      // Always sync billing address to shipping address, even if shipping is partially filled
      // This ensures billingAddress is always valid when checkbox is checked
      setValue("billingAddress", {
        firstName: currentShipping?.firstName || "",
        lastName: currentShipping?.lastName || "",
        address: currentShipping?.address || "",
        city: currentShipping?.city || "",
        state: currentShipping?.state || "",
        zipCode: currentShipping?.zipCode || "",
        country: currentShipping?.country || "PK",
      }, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    }
  }, [useShippingForBilling, shippingAddress, setValue, getValues])

  useEffect(() => {
    if (searchParams.get("canceled")) {
      setError("Checkout was canceled. Please try again.")
    }
  }, [searchParams])

  // Fetch cart items
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await fetch("/api/cart")
        if (response.ok) {
          const data = await response.json()
          setCartItems(data.items || [])
          setCartTotal(data.total || 0)
        }
      } catch (err) {
        console.error("Error fetching cart:", err)
      } finally {
        setCartLoading(false)
      }
    }
    fetchCart()
  }, [])

  const onSubmit = async (data: CheckoutFormData) => {
    console.log("=== FORM SUBMISSION STARTED ===")
    console.log("Form submitted with data:", data)
    console.log("Form errors:", errors)
    console.log("Cart items:", cartItems)
    
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items to your cart before proceeding.")
      return
    }
    
    setLoading(true)
    setError("")

    try {
      console.log("Submitting checkout form to API...")
      
      // Ensure billing address is set correctly
      const billingAddress = data.useShippingForBilling 
        ? data.shippingAddress 
        : (data.billingAddress || data.shippingAddress)
      
      console.log("Using billing address:", billingAddress)
      
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email.trim(),
          phone: data.phone?.trim() || "",
          paymentMethod: data.paymentMethod,
          shippingAddress: {
            firstName: data.shippingAddress.firstName.trim(),
            lastName: data.shippingAddress.lastName.trim(),
            address: data.shippingAddress.address.trim(),
            city: data.shippingAddress.city.trim(),
            state: data.shippingAddress.state.trim(),
            zipCode: data.shippingAddress.zipCode.trim(),
            country: data.shippingAddress.country.trim(),
          },
          billingAddress: {
            firstName: billingAddress.firstName.trim(),
            lastName: billingAddress.lastName.trim(),
            address: billingAddress.address.trim(),
            city: billingAddress.city.trim(),
            state: billingAddress.state.trim(),
            zipCode: billingAddress.zipCode.trim(),
            country: billingAddress.country.trim(),
          },
        }),
      })

      console.log("API response status:", response.status)
      const responseData = await response.json()
      console.log("Checkout API response:", responseData)

      if (!response.ok) {
        throw new Error(responseData.error || "Failed to create checkout session")
      }

      const { url, orderNumber } = responseData

      // For COD orders, redirect to success page directly
      if (data.paymentMethod === "COD") {
        console.log("COD order created, redirecting to success page")
        router.push(`/checkout/success?order_number=${orderNumber}`)
        return
      }

      // For Stripe orders, redirect to Stripe checkout
      if (url) {
        console.log("Redirecting to Stripe checkout:", url)
        window.location.href = url
      } else {
        throw new Error("No checkout URL received from Stripe")
      }
    } catch (err: any) {
      console.error("Checkout error:", err)
      setError(err.message || "An error occurred. Please try again.")
      setLoading(false)
    }
  }

  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    console.log("=== BUTTON CLICKED ===")
    console.log("Form errors:", errors)
    console.log("Cart items:", cartItems.length)
    console.log("Loading:", loading)
    
    if (cartItems.length === 0) {
      setError("Your cart is empty. Please add items to your cart before proceeding.")
      return
    }
    
    // Get current form values
    const formValues = getValues()
    console.log("Current form values:", formValues)
    
    // If useShippingForBilling is true, ensure billingAddress is synced before validation
    if (formValues.useShippingForBilling) {
      const currentShipping = formValues.shippingAddress
      setValue("billingAddress", {
        firstName: currentShipping?.firstName || "",
        lastName: currentShipping?.lastName || "",
        address: currentShipping?.address || "",
        city: currentShipping?.city || "",
        state: currentShipping?.state || "",
        zipCode: currentShipping?.zipCode || "",
        country: currentShipping?.country || "PK",
      }, { shouldValidate: false, shouldDirty: false, shouldTouch: false })
    }
    
    // Trigger form validation and submission
    // handleSubmit returns a function that validates and calls onSubmit if valid
    const submitHandler = handleSubmit(
      (data) => {
        console.log("Validation passed, calling onSubmit")
        onSubmit(data)
      },
      (errors) => {
        console.log("Validation failed:", errors)
        setError("Please fill in all required fields correctly.")
        // Scroll to first error
        const firstError = Object.keys(errors)[0]
        if (firstError) {
          const element = document.querySelector(`[name="${firstError}"]`) || 
                         document.querySelector(`#${firstError}`)
          element?.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }
    )
    
    submitHandler()
  }

  // Remove custom handler - use handleSubmit directly

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-serif font-bold mb-8">Checkout</h1>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          {error}
        </div>
      )}

      {/* Display form validation errors */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-yellow-500/10 text-yellow-400 p-4 rounded-md mb-6">
          <p className="font-semibold mb-2">Please fix the following errors:</p>
          <ul className="list-disc list-inside space-y-1 text-sm">
            {errors.email && <li>Email: {errors.email.message}</li>}
            {errors.shippingAddress?.firstName && <li>First Name: {errors.shippingAddress.firstName.message}</li>}
            {errors.shippingAddress?.lastName && <li>Last Name: {errors.shippingAddress.lastName.message}</li>}
            {errors.shippingAddress?.address && <li>Address: {errors.shippingAddress.address.message}</li>}
            {errors.shippingAddress?.city && <li>City: {errors.shippingAddress.city.message}</li>}
            {errors.shippingAddress?.state && <li>State: {errors.shippingAddress.state.message}</li>}
            {errors.shippingAddress?.zipCode && <li>Zip Code: {errors.shippingAddress.zipCode.message}</li>}
            {errors.shippingAddress?.country && <li>Country: {errors.shippingAddress.country.message}</li>}
            {errors.billingAddress && !useShippingForBilling && (
              <>
                {errors.billingAddress.firstName && <li>Billing First Name: {errors.billingAddress.firstName.message}</li>}
                {errors.billingAddress.lastName && <li>Billing Last Name: {errors.billingAddress.lastName.message}</li>}
                {errors.billingAddress.address && <li>Billing Address: {errors.billingAddress.address.message}</li>}
                {errors.billingAddress.city && <li>Billing City: {errors.billingAddress.city.message}</li>}
                {errors.billingAddress.state && <li>Billing State: {errors.billingAddress.state.message}</li>}
                {errors.billingAddress.zipCode && <li>Billing Zip Code: {errors.billingAddress.zipCode.message}</li>}
                {errors.billingAddress.country && <li>Billing Country: {errors.billingAddress.country.message}</li>}
              </>
            )}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Shipping Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Shipping Information</h2>

            <div className="bg-[#121213] p-6 rounded-lg space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" {...register("email")} />
                {errors.email && (
                  <p className="text-destructive text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" type="tel" {...register("phone")} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingFirstName">First Name *</Label>
                  <Input
                    id="shippingFirstName"
                    {...register("shippingAddress.firstName")}
                  />
                  {errors.shippingAddress?.firstName && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.shippingAddress.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shippingLastName">Last Name *</Label>
                  <Input
                    id="shippingLastName"
                    {...register("shippingAddress.lastName")}
                  />
                  {errors.shippingAddress?.lastName && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.shippingAddress.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="shippingAddress">Address *</Label>
                <Input
                  id="shippingAddress"
                  {...register("shippingAddress.address")}
                />
                {errors.shippingAddress?.address && (
                  <p className="text-destructive text-sm mt-1">
                    {errors.shippingAddress.address.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingCity">City *</Label>
                  <Input id="shippingCity" {...register("shippingAddress.city")} />
                  {errors.shippingAddress?.city && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.shippingAddress.city.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shippingState">State *</Label>
                  <Input id="shippingState" {...register("shippingAddress.state")} />
                  {errors.shippingAddress?.state && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.shippingAddress.state.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingZipCode">Zip Code *</Label>
                  <Input
                    id="shippingZipCode"
                    {...register("shippingAddress.zipCode")}
                  />
                  {errors.shippingAddress?.zipCode && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.shippingAddress.zipCode.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="shippingCountry">Country *</Label>
                  <Input
                    id="shippingCountry"
                    {...register("shippingAddress.country")}
                  />
                  {errors.shippingAddress?.country && (
                    <p className="text-destructive text-sm mt-1">
                      {errors.shippingAddress.country.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Billing Information */}
            <div>
              <h2 className="text-2xl font-semibold mb-4">Billing Information</h2>

              <div className="bg-[#121213] p-6 rounded-lg space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    {...register("useShippingForBilling")}
                    className="rounded border-input"
                  />
                  <span>Use shipping address for billing</span>
                </label>

                {!useShippingForBilling && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingFirstName">First Name *</Label>
                        <Input
                          id="billingFirstName"
                          {...register("billingAddress.firstName")}
                        />
                        {errors.billingAddress?.firstName && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.billingAddress.firstName.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="billingLastName">Last Name *</Label>
                        <Input
                          id="billingLastName"
                          {...register("billingAddress.lastName")}
                        />
                        {errors.billingAddress?.lastName && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.billingAddress.lastName.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="billingAddress">Address *</Label>
                      <Input
                        id="billingAddress"
                        {...register("billingAddress.address")}
                      />
                      {errors.billingAddress?.address && (
                        <p className="text-destructive text-sm mt-1">
                          {errors.billingAddress.address.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingCity">City *</Label>
                        <Input id="billingCity" {...register("billingAddress.city")} />
                        {errors.billingAddress?.city && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.billingAddress.city.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="billingState">State *</Label>
                        <Input id="billingState" {...register("billingAddress.state")} />
                        {errors.billingAddress?.state && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.billingAddress.state.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="billingZipCode">Zip Code *</Label>
                        <Input
                          id="billingZipCode"
                          {...register("billingAddress.zipCode")}
                        />
                        {errors.billingAddress?.zipCode && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.billingAddress.zipCode.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="billingCountry">Country *</Label>
                        <Input
                          id="billingCountry"
                          {...register("billingAddress.country")}
                        />
                        {errors.billingAddress?.country && (
                          <p className="text-destructive text-sm mt-1">
                            {errors.billingAddress.country.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-[#121213] rounded-lg p-6 border border-[#1A1A1B] sticky top-24">
              <h2 className="text-2xl font-serif font-bold mb-6">Order Summary</h2>
              
              {cartLoading ? (
                <p className="text-[#BDBDBD] mb-6">Loading cart...</p>
              ) : cartItems.length === 0 ? (
                <div className="mb-6">
                  <p className="text-destructive mb-4">Your cart is empty</p>
                  <Link href="/cart">
                    <Button variant="outline" className="w-full">View Cart</Button>
                  </Link>
                </div>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 pb-4 border-b border-[#1A1A1B]">
                        {item.images && item.images.length > 0 && (
                          <div className="relative w-20 h-20 flex-shrink-0">
                            <Image
                              src={item.images[0].url}
                              alt={item.images[0].alt || item.productName}
                              fill
                              sizes="(max-width: 768px) 100vw, 50vw"
                              className="object-cover rounded"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate">{item.productName}</h3>
                          <p className="text-sm text-[#BDBDBD]">Quantity: {item.quantity}</p>
                          <p className="text-sm font-semibold mt-1">{formatPrice(item.total)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#1A1A1B] pt-4 mb-6">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <Label htmlFor="paymentMethod" className="text-base font-semibold mb-3 block">
                  Payment Method *
                </Label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 p-4 border border-[#1A1A1B] rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      value="STRIPE"
                      {...register("paymentMethod")}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Credit/Debit Card (Stripe)</span>
                      <p className="text-sm text-[#BDBDBD]">Secure payment processing</p>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 p-4 border border-[#1A1A1B] rounded-lg cursor-pointer hover:border-primary transition-colors">
                    <input
                      type="radio"
                      value="COD"
                      {...register("paymentMethod")}
                      className="w-4 h-4 text-primary"
                    />
                    <div className="flex-1">
                      <span className="font-medium">Cash on Delivery (COD)</span>
                      <p className="text-sm text-[#BDBDBD]">Pay when you receive your order</p>
                    </div>
                  </label>
                </div>
                {errors.paymentMethod && (
                  <p className="text-destructive text-sm mt-2">{errors.paymentMethod.message}</p>
                )}
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-[#BDBDBD] text-sm">
                  {watch("paymentMethod") === "COD" 
                    ? "You will pay cash when your order is delivered."
                    : "Payment will be processed securely through Stripe."}
                </p>
                <p className="text-[#BDBDBD] text-xs italic">
                  Note: All prices are final. Shipping is free.
                </p>
              </div>
              <Button 
                type="button"
                className="w-full" 
                size="lg" 
                disabled={loading || (cartItems.length === 0 && !cartLoading)}
                onClick={handleButtonClick}
              >
                {loading 
                  ? "Processing..." 
                  : cartItems.length === 0 && !cartLoading 
                  ? "Cart is Empty" 
                  : watch("paymentMethod") === "COD"
                  ? "Place Order (COD)"
                  : "Proceed to Payment"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8">Loading...</div>}>
      <CheckoutForm />
    </Suspense>
  )
}

