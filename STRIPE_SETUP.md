# Stripe Configuration

Stripe has been configured with the following test keys:

## Environment Variables

Add these to your `.env.local` file:

```env
```

## Current Setup

✅ Stripe Checkout Sessions are configured
✅ Payment processing is enabled
✅ Webhook handler is ready at `/api/webhooks/stripe`

## Webhook Setup (Required for Production)

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
5. Copy the webhook signing secret and add it to `STRIPE_WEBHOOK_SECRET` in `.env.local`

## Testing

Use Stripe test cards:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future expiry date and any CVC

## Important Notes

- These are **test keys** - use live keys for production
- The publishable key is included but not currently used (Stripe Checkout handles the frontend)
- Webhook secret is required for production to verify payment events




