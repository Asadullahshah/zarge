# House of Noire - E-Commerce Website

Premium dark-themed e-commerce platform for formal wear, semi-formal apparel, and home textiles.

## Tech Stack

- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **Tailwind CSS** (Dark luxury theme)
- **Neon Serverless PostgreSQL** (Database)
- **Vercel Blob** (Image storage)
- **NextAuth v5** (Authentication)
- **Stripe** (Payments)
- **Shadcn/UI** (UI Components)

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in your values:
   - `DATABASE_URL` - Neon pooled connection string
   - `DATABASE_URL_UNPOOLED` - Neon unpooled connection string
   - `BLOB_READ_WRITE_TOKEN` - Vercel Blob token
   - `NEXTAUTH_SECRET` - Random secret for NextAuth
   - Stripe keys (if using payments)

3. **Run database migrations:**
   ```bash
   npm run db:migrate
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

## Database

This project uses **Neon Serverless PostgreSQL** directly (no Prisma). The schema is defined in `scripts/schema.sql`.

### Running Migrations

```bash
npm run db:migrate
```

This will execute the SQL schema from `scripts/schema.sql` against your Neon database.

## Project Structure

```
├── app/                    # Next.js App Router pages
│   ├── admin/             # Admin dashboard
│   ├── api/               # API routes
│   └── [pages]/           # Public pages
├── components/            # React components
├── lib/                   # Utilities
│   ├── db.ts             # Database connection (Neon)
│   ├── blob.ts           # Vercel Blob utilities
│   └── utils.ts          # Helper functions
└── scripts/               # Scripts
    ├── schema.sql        # Database schema
    └── migrate.ts       # Migration runner
```

## Features

- ✅ Dark luxury theme
- ✅ Admin dashboard with product management
- ✅ Drag & drop image upload (Vercel Blob)
- ✅ Category management
- ✅ Product variants (size, color, material)
- ✅ SEO & AEO optimization
- ✅ Shopping cart & checkout
- ✅ Order management
- ✅ Stripe payment integration

## Deployment

Deploy to Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The database connection will automatically use Neon's serverless connection pooling.

