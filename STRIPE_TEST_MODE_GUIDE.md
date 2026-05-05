# Stripe Test Mode & Webhook Testing Guide

## ✅ Yes, Webhooks Work with Test Cards!

Your Stripe webhook will work perfectly with demo/testing cards. Stripe's test mode generates the same webhook events as live mode, so you can test your entire payment flow safely.

## Setup for Testing

### 1. Use Test API Keys

In your `.env.local`, use Stripe **test** keys (they start with `pk_test_` and `sk_test_`):

```env
# Test Mode Keys (for development/testing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...  # Test webhook secret
```

### 2. Configure Test Webhook Endpoint

In Stripe Dashboard (Test Mode):

1. Go to **Developers → Webhooks**
2. Make sure you're in **Test mode** (toggle in top right)
3. Click **"Add endpoint"**
4. Enter your webhook URL:
   - **Local testing:** Use Stripe CLI (see below) or ngrok
   - **Production testing:** `https://www.noirefit.com/api/webhooks/stripe`
5. Select these events:
   - ✅ `checkout.session.completed`
   - ✅ `payment_intent.succeeded`
   - ✅ `payment_intent.payment_failed`
6. Copy the **Signing secret** (starts with `whsec_`) to `STRIPE_WEBHOOK_SECRET`

### 3. Test Cards to Use

Stripe provides these test card numbers (use any future expiry, any 3-digit CVC):

| Card Number | Description | Result |
|-------------|-------------|--------|
| `4242 4242 4242 4242` | Visa | ✅ Success |
| `5555 5555 5555 4444` | Mastercard | ✅ Success |
| `4000 0000 0000 0002` | Visa | ❌ Declined |
| `4000 0000 0000 9995` | Visa | ❌ Insufficient funds |
| `4000 0025 0000 3155` | Visa (3D Secure) | 🔐 Requires authentication |

**Use any:**
- **Expiry:** Any future date (e.g., `12/34`)
- **CVC:** Any 3 digits (e.g., `123`)
- **ZIP:** Any 5 digits (e.g., `12345`)

## Testing Locally (Development)

### Option 1: Stripe CLI (Recommended)

1. **Install Stripe CLI:**
   ```bash
   # Windows (PowerShell)
   scoop install stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`) and add it to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...  # From Stripe CLI output
   ```

5. **Trigger test events:**
   ```bash
   stripe trigger checkout.session.completed
   ```

### Option 2: Use Test Mode in Production

1. Set up webhook endpoint in Stripe Dashboard (Test Mode)
2. Use the test webhook secret in your production environment variables
3. Test with demo cards on your production site
4. Switch to live keys when ready

## Testing the Complete Flow

### 1. Start Your Dev Server
```bash
npm run dev
```

### 2. Make a Test Purchase

1. Add products to cart
2. Go to checkout
3. Use test card: `4242 4242 4242 4242`
4. Complete checkout

### 3. Verify Webhook Works

Check your server logs for:
```
🔔 [WEBHOOK] Received webhook request
✅ [WEBHOOK] Signature verified. Event type: checkout.session.completed
💳 [WEBHOOK] Processing checkout.session.completed event
✅ [WEBHOOK] Payment confirmed as PAID. Proceeding with order creation...
✅ [WEBHOOK] Order created successfully!
```

### 4. Check Admin Dashboard

1. Go to `/admin/orders`
2. You should see the test order with:
   - Payment Status: **PAID**
   - Payment Method: **STRIPE**
   - Order total from test purchase

## Important Notes

### Test Mode vs Live Mode

- **Test Mode:** Uses `pk_test_` and `sk_test_` keys
  - Test cards only
  - No real charges
  - Separate webhook endpoints
  
- **Live Mode:** Uses `pk_live_` and `sk_live_` keys
  - Real cards only
  - Real charges
  - Separate webhook endpoints

⚠️ **Important:** Test and Live mode webhooks are **separate**. You need to configure webhooks in both modes if testing in production.

### Webhook Secrets

- Test mode webhook secret: Starts with `whsec_` (from Stripe Dashboard or CLI)
- Live mode webhook secret: Different `whsec_` value (configure separately)

### Your Current Setup

Your webhook handler supports both test and live mode automatically because it:
- ✅ Uses environment variables (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`)
- ✅ Works with any Stripe key (test or live)
- ✅ Validates webhook signatures properly
- ✅ Processes `checkout.session.completed` events correctly

## Troubleshooting

### Webhook Not Received

1. **Check webhook endpoint URL:**
   - Local: `http://localhost:3000/api/webhooks/stripe`
   - Production: `https://www.noirefit.com/api/webhooks/stripe`

2. **Verify webhook secret matches:**
   - Test mode webhook → test secret
   - Live mode webhook → live secret

3. **Check Stripe Dashboard:**
   - Developers → Webhooks → Your endpoint
   - Click on recent events to see delivery status

4. **Check server logs:**
   - Look for webhook logs in your server console
   - Check for signature verification errors

### Test Order Not Appearing

1. **Verify payment succeeded:**
   - Check Stripe Dashboard → Payments
   - Payment status should be "Succeeded"

2. **Check webhook logs:**
   ```bash
   # If using Stripe CLI
   stripe logs tail
   ```

3. **Verify order creation:**
   - Check server logs for "Order created successfully"
   - Check database directly if needed

## Quick Test Checklist

- [ ] Using test API keys (`pk_test_`, `sk_test_`)
- [ ] Webhook endpoint configured in Stripe Dashboard (Test Mode)
- [ ] Webhook secret added to `.env.local`
- [ ] Test card used: `4242 4242 4242 4242`
- [ ] Checkout completed successfully
- [ ] Webhook received (check logs)
- [ ] Order created in database
- [ ] Order visible in admin dashboard
- [ ] Payment status = PAID
- [ ] Confirmation email sent (if configured)

## Next Steps

Once testing is complete:
1. Switch to **live** API keys in production
2. Configure **live** webhook endpoint
3. Update `STRIPE_WEBHOOK_SECRET` with live secret
4. Test with a small real transaction
5. Monitor webhook deliveries in Stripe Dashboard

Your webhook setup is production-ready! 🎉



