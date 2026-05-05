# Email Setup Guide - Order Confirmations

This guide explains how to set up and verify order confirmation emails after Stripe payments.

## ✅ Quick Reference - Configured Values

Your Resend credentials are already configured:

- **API Key:** `re_EsHs25QK_8Av7FdR9EZok7JaGk6i46aKh`
- **From Email:** `House of Noire <houseofnoirefit@gmail.com>`

**Add these to your `.env.local` file:**
```env
RESEND_API_KEY=re_EsHs25QK_8Av7FdR9EZok7JaGk6i46aKh
RESEND_FROM_EMAIL=House of Noire <houseofnoirefit@gmail.com>
```

## Email Service Setup

The system uses **Resend** for sending order confirmation emails. Resend is a modern email API that's easy to set up and has a generous free tier.

### Step 1: Create a Resend Account

1. Go to https://resend.com
2. Sign up for a free account
3. Verify your email address

### Step 2: Get Your API Key

1. In the Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name (e.g., "House of Noire Production")
4. Copy the API key (starts with `re_...`)

### Step 3: Add Environment Variables

Add these to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=re_EsHs25QK_8Av7FdR9EZok7JaGk6i46aKh
RESEND_FROM_EMAIL=House of Noire <houseofnoirefit@gmail.com>
```

**Important Notes:**
- The API key is already configured above
- The `RESEND_FROM_EMAIL` uses your Gmail address
- For production, you can verify your custom domain (noirefit.com) in Resend and use `House of Noire <noreply@noirefit.com>`
- For testing, you can use Resend's test domain: `onboarding@resend.dev`

### Step 4: Verify Your Domain (Production)

1. In Resend dashboard, go to **Domains**
2. Click **Add Domain**
3. Enter `noirefit.com`
4. Add the DNS records Resend provides to your domain's DNS settings
5. Wait for verification (usually a few minutes)

## How Order Confirmation Emails Work

### Stripe Payments

When a customer completes a Stripe payment:

1. Stripe sends a webhook to `/api/webhooks/stripe`
2. The webhook handler processes `checkout.session.completed` event
3. Order status is updated to `PAID` and `PROCESSING`
4. **Order confirmation email is automatically sent** to the customer

### Cash on Delivery (COD)

When a customer places a COD order:

1. Order is created immediately
2. **Order confirmation email is sent** right away
3. Customer receives email with order details and COD instructions

## How to Verify Emails Are Working

### Method 1: Test with a Real Order (Recommended)

1. **Place a test order:**
   - Go to your website
   - Add items to cart
   - Complete checkout with Stripe test card: `4242 4242 4242 4242`
   - Use your real email address
   - Complete the payment

2. **Check your email:**
   - Check your inbox (and spam folder)
   - You should receive an order confirmation email
   - Email should include:
     - Order number
     - Order items with quantities and prices
     - Shipping address
     - Payment method
     - Total amount

### Method 2: Check Server Logs

1. **Check your deployment logs** (Vercel, etc.):
   ```bash
   # Look for these log messages:
   ✅ Order confirmation email sent: [email-id]
   ```

2. **If email fails, you'll see:**
   ```
   Error sending order confirmation email: [error message]
   ```

### Method 3: Use Resend Dashboard

1. Go to Resend dashboard → **Emails**
2. You'll see all sent emails with:
   - Recipient
   - Subject
   - Status (Delivered, Bounced, etc.)
   - Timestamp

### Method 4: Test COD Order

1. Place a COD order on your website
2. Check your email immediately
3. You should receive confirmation email right away

## Troubleshooting

### Emails Not Sending

1. **Check environment variables:**
   ```bash
   # Make sure these are set in your production environment
   RESEND_API_KEY=re_EsHs25QK_8Av7FdR9EZok7JaGk6i46aKh
   RESEND_FROM_EMAIL=House of Noire <houseofnoirefit@gmail.com>
   ```

2. **Check Resend API key:**
   - Go to Resend dashboard
   - Verify API key is active
   - Check if you've hit rate limits

3. **Check domain verification:**
   - If using custom domain, ensure it's verified
   - For testing, use `onboarding@resend.dev`

4. **Check server logs:**
   - Look for error messages
   - Check if email function is being called

### Emails Going to Spam

1. **Verify your domain** in Resend
2. **Set up SPF and DKIM records** (Resend provides these)
3. **Use a professional from address**
4. **Avoid spam trigger words** in email content

### Testing Locally

For local development, emails are logged to console instead of being sent:

```
📧 Order Confirmation Email (not sent - configure RESEND_API_KEY):
  to: customer@example.com
  subject: Order Confirmation - ORD-12345
```

To actually send emails locally, add `RESEND_API_KEY` to your `.env.local`.

## Email Template

The order confirmation email includes:

- **Header:** House of Noire branding
- **Order Details:** Order number, date, payment method
- **Order Items:** Product names, quantities, sizes, colors, prices
- **Order Summary:** Subtotal, tax (if any), shipping (free), total
- **Shipping Address:** Full delivery address
- **COD Notice:** Special instructions for Cash on Delivery orders
- **Footer:** Contact information and website link

## Production Checklist

- [ ] Resend account created
- [ ] API key added to environment variables
- [ ] Domain verified in Resend (for production)
- [ ] DNS records added (SPF, DKIM)
- [ ] Test order placed and email received
- [ ] Email template looks correct
- [ ] COD orders also send emails
- [ ] Check spam folder to ensure deliverability

## Support

If you need help:
- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com
- Check server logs for specific error messages

