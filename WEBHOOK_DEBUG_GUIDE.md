# 🔧 Stripe Webhook Debugging Guide

## Problem: Orders Not Being Created for Stripe Payments

If COD orders work but Stripe orders don't appear, the webhook is likely not being received or processed correctly.

## Quick Checklist

### 1. Check Webhook Configuration in Stripe Dashboard

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Make sure you're in **Test mode** (toggle in top right)
3. Verify you have a webhook endpoint configured:
   - **Endpoint URL:** `https://www.noirefit.com/api/webhooks/stripe`
   - **Status:** Should show "Enabled"
4. Click on the webhook endpoint to see:
   - **Events sent:** Should show recent events
   - **Recent requests:** Check if requests are being made
   - **Status codes:** Should be 200 for successful requests

### 2. Verify Webhook Events Are Selected

In Stripe Dashboard → Your Webhook → Settings:
- ✅ `checkout.session.completed` (REQUIRED)
- ✅ `payment_intent.succeeded` (Optional, but helpful)
- ✅ `payment_intent.payment_failed` (Optional, for errors)

### 3. Check Webhook Secret

1. In Stripe Dashboard → Your Webhook → "Signing secret"
2. Click "Reveal" to see the secret (starts with `whsec_`)
3. Verify it matches your `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### 4. Check Production Environment Variables

On Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Verify these are set:
   - `STRIPE_SECRET_KEY` (test key: `sk_test_...`)
   - `STRIPE_WEBHOOK_SECRET` (from webhook: `whsec_...`)
   - `RESEND_API_KEY`
   - `RESEND_FROM_EMAIL`
   - All database URLs

### 5. Check Webhook Delivery Logs

In Stripe Dashboard → Your Webhook → Recent requests:
- Look for recent `checkout.session.completed` events
- Check the **Response** status code:
  - ✅ **200** = Webhook received successfully
  - ❌ **4xx/5xx** = Error occurred
  - ⚠️ **No requests** = Webhook not being called

### 6. Common Issues & Solutions

#### Issue 1: Webhook Not Configured
**Symptom:** No webhook endpoint in Stripe Dashboard

**Solution:**
1. Create webhook endpoint in Stripe Dashboard
2. Add URL: `https://www.noirefit.com/api/webhooks/stripe`
3. Select events: `checkout.session.completed`
4. Copy signing secret to environment variables

#### Issue 2: Wrong Webhook Secret
**Symptom:** Webhook logs show "Signature verification failed"

**Solution:**
1. Get the correct secret from Stripe Dashboard
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel
3. Redeploy the application

#### Issue 3: Webhook Endpoint Not Accessible
**Symptom:** Stripe shows "Failed to deliver" or timeout errors

**Solution:**
1. Verify URL is correct: `https://www.noirefit.com/api/webhooks/stripe`
2. Test endpoint manually:
   ```bash
   curl -X POST https://www.noirefit.com/api/webhooks/stripe
   ```
3. Check Vercel deployment is live and working

#### Issue 4: Payment Status Not "paid"
**Symptom:** Webhook received but order not created

**Check logs for:**
```
⚠️ [WEBHOOK] Payment not completed. Status: [status]
```

**Solution:**
- Test with a card that always succeeds: `4242 4242 4242 4242`
- Check Stripe Dashboard → Payments to see actual payment status

#### Issue 5: Missing Metadata
**Symptom:** Webhook logs show "No orderNumber in metadata"

**Check logs for:**
```
❌ [WEBHOOK] No orderNumber in session metadata!
```

**Solution:**
- This means checkout session wasn't created with metadata
- Check `app/api/checkout/route.ts` to ensure metadata is being set

#### Issue 6: Database Error
**Symptom:** Webhook received, payment confirmed, but order creation fails

**Check logs for:**
```
❌ [WEBHOOK] Error creating order: [error message]
```

**Solution:**
- Check database connection
- Verify all required fields are present in metadata
- Check server logs on Vercel

## How to Test

### Test 1: Check Webhook is Receiving Events

1. Make a test purchase with card `4242 4242 4242 4242`
2. Go to Stripe Dashboard → Webhooks → Your endpoint → Recent requests
3. You should see a `checkout.session.completed` event within seconds
4. Click on the event to see:
   - Request payload
   - Response status code
   - Response body

### Test 2: Check Server Logs

1. Go to Vercel Dashboard → Your Project → Logs
2. Look for webhook logs:
   ```
   🔔 [WEBHOOK] Received webhook request
   ✅ [WEBHOOK] Signature verified
   💳 [WEBHOOK] Processing checkout.session.completed
   ```

3. Check for errors:
   ```
   ❌ [WEBHOOK] Error creating order
   ❌ [WEBHOOK] Signature verification failed
   ```

### Test 3: Manual Webhook Test

Use Stripe CLI to test locally or send test webhook:

1. **Install Stripe CLI:**
   ```bash
   # Windows
   scoop install stripe
   ```

2. **Forward webhooks:**
   ```bash
   stripe listen --forward-to https://www.noirefit.com/api/webhooks/stripe
   ```

3. **Trigger test event:**
   ```bash
   stripe trigger checkout.session.completed
   ```

## Expected Log Flow

When webhook works correctly, you should see:

```
🔔 [WEBHOOK] Received webhook request
✅ [WEBHOOK] Signature verified. Event type: checkout.session.completed
💳 [WEBHOOK] Processing checkout.session.completed event
📋 [WEBHOOK] Session details: { id: 'cs_...', payment_status: 'paid', ... }
✅ [WEBHOOK] Payment confirmed as PAID. Proceeding with order creation...
📦 [WEBHOOK] Creating order from metadata. Order Number: ORD-...
🔍 [WEBHOOK] Checking if order already exists...
💾 [WEBHOOK] Inserting order into database...
✅ [WEBHOOK] Order created successfully! Order ID: ...
📝 [WEBHOOK] Creating order items...
✅ [WEBHOOK] All order items created
📧 [WEBHOOK] Sending order confirmation email to: ...
✅ [WEBHOOK] Order confirmation email sent successfully!
✅ [WEBHOOK] Order processing completed successfully!
```

## Quick Fix Steps

### Step 1: Verify Webhook Exists
- [ ] Open Stripe Dashboard → Webhooks
- [ ] Confirm endpoint exists: `https://www.noirefit.com/api/webhooks/stripe`
- [ ] Verify it's enabled

### Step 2: Verify Webhook Secret
- [ ] Copy webhook signing secret from Stripe Dashboard
- [ ] Verify it matches `STRIPE_WEBHOOK_SECRET` in Vercel
- [ ] If different, update Vercel and redeploy

### Step 3: Check Recent Events
- [ ] Make a test purchase
- [ ] Check Stripe Dashboard → Webhooks → Recent requests
- [ ] Look for `checkout.session.completed` event
- [ ] Check response status code

### Step 4: Check Server Logs
- [ ] Go to Vercel Dashboard → Logs
- [ ] Filter for "WEBHOOK"
- [ ] Look for errors or warnings

### Step 5: Test Again
- [ ] Make another test purchase
- [ ] Wait 10-30 seconds
- [ ] Check admin dashboard for order
- [ ] Check email inbox for confirmation

## Still Not Working?

1. **Check Vercel Function Logs:**
   - Vercel Dashboard → Your Project → Functions → `/api/webhooks/stripe`
   - Look for runtime errors

2. **Verify Database Connection:**
   - Ensure `DATABASE_URL` is correct in Vercel
   - Test database connection separately

3. **Check Stripe Test Mode:**
   - Ensure you're using test keys (`sk_test_`, `pk_test_`)
   - Test mode webhook secrets start with `whsec_`

4. **Contact Support:**
   - Check Stripe Dashboard for webhook delivery errors
   - Review Vercel logs for runtime errors
   - Check if there are any deployment issues

## Environment Variables Checklist

Make sure these are set in Vercel:

```env
# Stripe
STRIPE_SECRET_KEY=sk_test_... (or sk_live_... for production)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (or pk_live_...)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)

# Database
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...

# Email
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=House of Noire <info@noirefit.com>

# NextAuth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://www.noirefit.com

# App
NEXT_PUBLIC_APP_URL=https://www.noirefit.com
```

## Next Steps

1. Follow the checklist above
2. Check Stripe Dashboard webhook logs
3. Check Vercel server logs
4. Test with a simple purchase
5. Verify order appears in admin dashboard

Your webhook code is correct - the issue is likely configuration or webhook delivery. 🔍



