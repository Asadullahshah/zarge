# 🚨 URGENT: Stripe Webhook Troubleshooting Checklist

## Problem
- ✅ COD orders work (orders created, emails sent)
- ❌ Stripe orders DON'T work (no orders, no emails)

This means the webhook is **NOT working**. Follow these steps:

## ⚡ Immediate Checks (Do These First!)

### 1. Check Stripe Dashboard Webhook Configuration

**CRITICAL:** Go to https://dashboard.stripe.com/webhooks

1. **Toggle to TEST MODE** (top right corner)
2. Look for a webhook endpoint with URL: `https://www.noirefit.com/api/webhooks/stripe`
3. If it doesn't exist:
   - Click **"+ Add endpoint"**
   - URL: `https://www.noirefit.com/api/webhooks/stripe`
   - Events: Select `checkout.session.completed`
   - Click **"Add endpoint"**
   - **Copy the Signing secret** (starts with `whsec_`)

4. If it exists:
   - Click on it
   - Check **"Recent requests"** tab
   - Do you see any `checkout.session.completed` events?
   - What status codes do they show? (200 = good, 4xx/5xx = error)

### 2. Verify Webhook Secret in Vercel

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `STRIPE_WEBHOOK_SECRET`
3. Compare it with the webhook signing secret from Stripe Dashboard
4. **If they don't match:**
   - Copy the secret from Stripe Dashboard
   - Update it in Vercel
   - **Redeploy your application**

### 3. Test Webhook Immediately

1. Make a test purchase with card: `4242 4242 4242 4242`
2. Complete checkout
3. Go to Stripe Dashboard → Webhooks → Your endpoint → **"Recent requests"**
4. Wait 10-30 seconds
5. Check if a new `checkout.session.completed` event appears
6. Click on it to see:
   - Request payload
   - Response status code (should be 200)
   - Response body

### 4. Check Vercel Logs

1. Go to Vercel Dashboard → Your Project → **Logs**
2. Make a test purchase
3. Filter logs for "WEBHOOK"
4. Look for these messages:
   - `🔔 [WEBHOOK] Received webhook request` ← If you see this, webhook is being called
   - `✅ [WEBHOOK] Signature verified` ← If you see this, signature is correct
   - `❌ [WEBHOOK]` ← Any error messages?

## 🔍 Diagnostic Questions

Answer these to narrow down the issue:

### A. Is the webhook endpoint configured in Stripe?
- [ ] Yes, I can see it in Stripe Dashboard
- [ ] No, I need to create it

### B. Does Stripe show recent webhook requests?
- [ ] Yes, I see requests but they're failing (4xx/5xx)
- [ ] Yes, I see requests with status 200
- [ ] No, I don't see any requests at all

### C. What status codes do you see in Stripe Dashboard?
- [ ] 200 (Success) - but orders still not created
- [ ] 400 (Bad Request) - signature or format issue
- [ ] 500 (Server Error) - code issue
- [ ] No requests at all - webhook not being called

### D. Do you see webhook logs in Vercel?
- [ ] Yes, I see `🔔 [WEBHOOK] Received webhook request`
- [ ] No, no logs at all
- [ ] Yes, but with errors

## 🎯 Most Common Issues & Fixes

### Issue 1: Webhook Not Configured
**Symptoms:** No webhook endpoint in Stripe Dashboard

**Fix:**
1. Create webhook in Stripe Dashboard
2. URL: `https://www.noirefit.com/api/webhooks/stripe`
3. Events: `checkout.session.completed`
4. Copy signing secret to Vercel
5. Redeploy

### Issue 2: Wrong Webhook Secret
**Symptoms:** Stripe shows 400 errors, logs show "Signature verification failed"

**Fix:**
1. Get correct secret from Stripe Dashboard → Webhook → Signing secret
2. Update `STRIPE_WEBHOOK_SECRET` in Vercel
3. Redeploy

### Issue 3: Webhook Not Receiving Events
**Symptoms:** No requests in Stripe Dashboard webhook logs

**Fix:**
1. Verify webhook is enabled
2. Check you're in TEST MODE in Stripe Dashboard
3. Verify endpoint URL is correct
4. Make sure you're using test API keys (`sk_test_`)

### Issue 4: Test Mode vs Live Mode Mismatch
**Symptoms:** Webhook configured but not receiving events

**Fix:**
- If using test cards, webhook must be in TEST MODE
- If using live cards, webhook must be in LIVE MODE
- Test and Live modes have **separate** webhook endpoints!

## 📋 Step-by-Step Fix

### Step 1: Verify Webhook Exists
```
✅ Go to Stripe Dashboard → Webhooks
✅ Toggle to TEST MODE
✅ Check if endpoint exists: https://www.noirefit.com/api/webhooks/stripe
✅ If NO → Create it (see Issue 1 above)
```

### Step 2: Verify Webhook Secret
```
✅ Copy signing secret from Stripe Dashboard
✅ Check Vercel → Environment Variables → STRIPE_WEBHOOK_SECRET
✅ Compare them - do they match?
✅ If NO → Update Vercel and redeploy
```

### Step 3: Test Webhook Delivery
```
✅ Make test purchase with card: 4242 4242 4242 4242
✅ Go to Stripe Dashboard → Webhooks → Recent requests
✅ Wait 30 seconds
✅ Do you see checkout.session.completed event?
✅ If NO → Webhook not being called (see Issue 3)
✅ If YES → Check response status code
```

### Step 4: Check Server Logs
```
✅ Go to Vercel Dashboard → Logs
✅ Filter for "WEBHOOK"
✅ Make another test purchase
✅ Look for webhook logs
✅ If NO logs → Webhook not reaching server
✅ If ERROR logs → Fix the specific error
```

### Step 5: Verify Environment Variables
```
✅ Vercel → Settings → Environment Variables
✅ Verify all these exist:
   - STRIPE_SECRET_KEY (should start with sk_test_)
   - STRIPE_WEBHOOK_SECRET (should start with whsec_)
   - DATABASE_URL
   - RESEND_API_KEY
   - RESEND_FROM_EMAIL
```

## 🚀 Quick Test Procedure

1. **Make a test purchase:**
   - Card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits

2. **Check Stripe Dashboard immediately:**
   - Go to Webhooks → Your endpoint → Recent requests
   - Look for `checkout.session.completed` event
   - Check response status

3. **Check Vercel Logs:**
   - Go to Logs tab
   - Filter for "WEBHOOK"
   - Look for error messages

4. **Check Admin Dashboard:**
   - Go to `/admin/orders`
   - Refresh the page
   - Look for new order

## 💡 Expected Behavior

When working correctly:

1. ✅ You make a test purchase
2. ✅ Stripe processes payment (instant)
3. ✅ Stripe sends webhook to your endpoint (within 1-5 seconds)
4. ✅ Your server receives webhook and creates order (within 1-2 seconds)
5. ✅ Order appears in admin dashboard
6. ✅ Confirmation email is sent

## 🔧 Still Not Working?

If you've checked everything above and it's still not working:

1. **Check Vercel Function Runtime:**
   - Vercel → Your Project → Functions
   - Look for `/api/webhooks/stripe`
   - Check for runtime errors

2. **Check Database Connection:**
   - Verify `DATABASE_URL` is correct
   - Check if database is accessible

3. **Check Stripe API Keys:**
   - Verify you're using TEST keys (`sk_test_`, `pk_test_`)
   - Make sure keys match the mode (test vs live)

4. **Manual Webhook Test:**
   - Use Stripe CLI to send test webhook
   - Or use Stripe Dashboard → Webhooks → Send test webhook

## 📞 Need More Help?

Provide this information:
1. Screenshot of Stripe Dashboard → Webhooks → Recent requests
2. Screenshot of Vercel Dashboard → Logs (filtered for "WEBHOOK")
3. Status codes you see in Stripe Dashboard
4. Any error messages from logs

---

**Most likely issue:** Webhook not configured in Stripe Dashboard or wrong webhook secret! 🔑



