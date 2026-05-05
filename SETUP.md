# House of Noire - Setup Guide

## Prerequisites

- Node.js 18+ installed
- Neon PostgreSQL database (already configured)
- Vercel Blob storage token (already configured)
- Stripe account (for payments)

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Database (already provided)
DATABASE_URL=postgresql://neondb_owner:npg_UVMd9eCw7spP@ep-hidden-lake-ahda2avm-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://neondb_owner:npg_UVMd9eCw7spP@ep-hidden-lake-ahda2avm.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require

# Blob Storage (already provided)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_NOqbQblgvVW8hZdi_PhGJUH1SM5pzRz5WyiaUBwHrUosJCN

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-change-in-production

# Stripe (add your keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Important:** Generate a secure `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### 3. Run Database Migrations

```bash
npm run db:migrate
```

This will create all necessary tables in your Neon database.

### 4. Create Admin User

```bash
npm run create-admin <email> <password> [name]
```

Example:
```bash
npm run create-admin admin@houseofnoire.com mySecurePassword123 "Admin User"
```

### 5. Start Development Server

```bash
npm run dev
```

Visit:
- **Frontend:** http://localhost:3000
- **Admin Panel:** http://localhost:3000/admin/login

## Stripe Setup

1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Add them to `.env.local`
4. Set up webhook endpoint:
   - In Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events: `checkout.session.completed`, `payment_intent.succeeded`, `payment_intent.payment_failed`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## Deployment to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy

The database connection will automatically use Neon's serverless connection pooling.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── admin/             # Admin dashboard (protected)
│   ├── api/               # API routes
│   ├── cart/              # Shopping cart
│   ├── checkout/          # Checkout flow
│   ├── product/           # Product pages
│   └── [pages]/           # Public pages
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── layout/            # Layout components
│   ├── product/           # Product components
│   └── ui/                # UI components
├── lib/                   # Utilities
│   ├── db.ts             # Database connection
│   ├── blob.ts           # Vercel Blob utilities
│   └── auth.ts           # NextAuth config
└── scripts/               # Scripts
    ├── schema.sql        # Database schema
    ├── migrate.ts        # Migration runner
    └── create-admin.ts   # Admin user creator
```

## Features

✅ **Admin Panel**
- Product management (CRUD)
- Category management
- Order management
- Drag & drop image upload
- SEO fields

✅ **Customer-Facing**
- Product listings
- Product detail pages
- Shopping cart
- Checkout with Stripe
- SEO/AEO optimized

✅ **Technical**
- Neon Serverless PostgreSQL
- Vercel Blob for images
- NextAuth authentication
- Stripe payments
- Dark luxury theme

## Troubleshooting

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check Neon dashboard for connection status
- Ensure SSL mode is enabled

### Image Upload Issues
- Verify `BLOB_READ_WRITE_TOKEN` is set
- Check Vercel Blob dashboard for storage limits

### Stripe Issues
- Verify API keys are correct
- Check webhook endpoint is configured
- Ensure webhook secret matches

## Next Steps

1. Add your first products via admin panel
2. Create categories
3. Test checkout flow
4. Configure shipping rates
5. Set up email notifications (optional)

