# goCart: tech & lifestyle store

goCart is a production-ready full-stack e-commerce application built with **Next.js 15
(App Router), React 19, TypeScript, Tailwind CSS, PostgreSQL and Prisma**. Shoppers can
browse six collections, search and filter 36 products, keep a cart and a wishlist (signed in
or not), check out with cash on delivery or a card, and see their order history. Admins
manage the catalog from an admin console.

![goCart home page](docs/screenshots/home-desktop.webp)

## Contents

- [Demo video](#demo-video)
- [Features](#features)
- [Tech stack](#tech-stack)
- [Screenshots](#screenshots)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [Database](#database)
- [Environment variables](#environment-variables)
- [Installation](#installation)
- [Available scripts](#available-scripts)
- [API reference](#api-reference)
- [Testing and quality](#testing-and-quality)
- [Deployment (Vercel + Neon)](#deployment-vercel--neon)
- [Security](#security)
- [Known limitations and next steps](#known-limitations-and-next-steps)

## Demo video

▶ **Demo video:** _add the link here after uploading `gocart-demo.mp4` (YouTube, Google Drive, etc.)_

The 3½-minute walkthrough covers browsing, filters, search, the product page, cart,
checkout validation, a cash-on-delivery order, sign-up with guest-cart merge, order history,
the wishlist, dark mode, the 404 page, the health check, admin create/update/delete and the
mobile layout.

## Features

**Storefront**

- Home page with an interactive parallax hero, category grid, bestsellers, flash deals with a
  live countdown, a new-arrivals rail and a newsletter sign-up.
- Six categories (Audio, Wearables, Smart Home, Workspace, Travel & Bags, Fitness), each with its
  own page.
- Product listing with **search, filters and sorting** (category, price presets or a custom range,
  minimum rating, in stock, on sale; sort by featured, newest, price, rating or name) and
  pagination. Filters live in the URL, so every result page can be bookmarked and shared.
- Search-as-you-type suggestions in the header with keyboard support.
- Product page with a gallery (hover to zoom), colours, quantity, stock status, features,
  specifications and **related products**.
- Generated product art (gradients and icons), so the store looks complete without image
  hosting. Real photos can be added per product through the `images` field.

**Cart, wishlist and checkout**

- Add to cart, change quantity, remove, clear; subtotal, sale savings, shipping (free over $75)
  and total, with a free-shipping progress bar.
- Stock-aware: quantities are capped by stock and a 10-per-item limit; sold-out items are flagged
  and left out of the total.
- Wishlist with add/remove and "move to cart"; duplicates are blocked by the database.
- Works for guests: the cart, wishlist and any orders move into the account on sign-in.
- Checkout with full form validation and two payment options: **cash on delivery** and **card via
  Stripe Checkout** (enabled when Stripe keys are set). Stock is reserved in a database
  transaction, so the last unit can't be sold twice.
- Order confirmation page and **order history** on the account page.

**Accounts and admin**

- Sign up, sign in, sign out with secure httpOnly session cookies; password strength meter.
- Profile page: edit your name, see cart and wishlist counts, delete your account.
- **Admin console** (`/admin/products`) for emails listed in `ADMIN_EMAILS`: catalog stats, search
  and filters, and create / edit / delete products.

**Experience**

- Fully responsive (mobile menu drawer, mobile filter drawer, touch-friendly controls).
- Light and **dark mode**, remembered per browser.
- Skeleton loading states, friendly empty states, toast notifications.
- Error handling at every layer: field-level validation messages, error pages with retry, a custom
  404 page, and consistent JSON errors from the API.
- Accessible: semantic HTML, labelled controls, focus rings, skip link, `aria-live` result counts,
  reduced-motion support.
- SEO: page titles and descriptions, `sitemap.xml`, `robots.txt` and product structured data.

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| Framework | Next.js 15 (App Router, Server Components, Route Handlers) |
| UI | React 19, Tailwind CSS 3, Lucide icons, Plus Jakarta Sans, Sonner toasts |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL (hosted on **Neon**), accessed with **Prisma ORM 7** and the `pg` driver adapter |
| Validation | Zod (shared by the browser and the server) |
| Auth | bcrypt password hashing, JWT (HS256, `jose`) in an httpOnly cookie |
| Payments | Stripe Checkout (optional) and cash on delivery |
| Testing | Vitest (unit + integration against real PostgreSQL), ESLint, `tsc` |
| CI / hosting | GitHub Actions (with a PostgreSQL service), Vercel (with a daily cron job) |

## Screenshots

| Desktop | Mobile |
| ------- | ------ |
| ![Products with filters](docs/screenshots/products-desktop.webp) | ![Home on mobile](docs/screenshots/home-mobile.webp) |
| ![Product page](docs/screenshots/product-detail-desktop.webp) | ![Product on mobile](docs/screenshots/product-detail-mobile.webp) |
| ![Cart](docs/screenshots/cart-desktop.webp) | ![Filter drawer](docs/screenshots/filters-drawer-mobile.webp) |
| ![Checkout](docs/screenshots/checkout-desktop.webp) | ![Menu](docs/screenshots/menu-mobile.webp) |
| ![Order confirmed](docs/screenshots/order-confirmed-desktop.webp) | ![Cart on mobile](docs/screenshots/cart-mobile.webp) |
| ![Account with order history](docs/screenshots/account-orders-desktop.webp) | ![Checkout on mobile](docs/screenshots/checkout-mobile.webp) |
| ![Admin console](docs/screenshots/admin-products-desktop.webp) | |
| ![Dark mode](docs/screenshots/home-dark-desktop.webp) | |

More in [`docs/screenshots`](docs/screenshots): search results, a category page, the wishlist,
checkout validation, sign-in, the empty cart, the admin edit form and the 404 page.

## Project structure

```
gocart/
├── .github/workflows/ci.yml   # lint, typecheck, unit tests, migrations, integration tests, build
├── docs/
│   ├── DATABASE.md            # schema, relationships, indexes, CRUD, transactions
│   └── screenshots/
├── prisma/
│   ├── schema.prisma          # database schema (models, relations, indexes)
│   ├── migrations/            # SQL migrations applied by `prisma migrate deploy`
│   └── seed.ts                # loads the catalog from src/data/catalog.ts
├── prisma.config.ts           # Prisma CLI config (migrations path, seed command, database URL)
├── src/
│   ├── app/                   # routes (pages and API)
│   │   ├── api/               # REST route handlers (thin: validate → service → JSON)
│   │   ├── products/          # listing + [slug] detail page
│   │   ├── categories/[slug]/
│   │   ├── cart/  wishlist/  checkout/  account/  admin/
│   │   ├── layout.tsx         # shell: header, footer, store provider, theme
│   │   ├── not-found.tsx  error.tsx  global-error.tsx
│   │   └── sitemap.ts  robots.ts  icon.svg
│   ├── components/            # UI only, grouped by feature
│   │   ├── ui/                # buttons, inputs, badges, skeletons, empty states
│   │   ├── layout/  home/  catalog/  product/  cart/  checkout/  account/  admin/  art/
│   │   └── providers/         # client store: cart count, wishlist, user
│   ├── lib/
│   │   ├── api/               # route wrapper, JSON errors, CSRF origin check, admin guard
│   │   ├── auth/              # sessions, guest ids
│   │   ├── business/          # pure logic: pricing, search, ranking, pagination
│   │   ├── services/          # use cases: catalog, cart, wishlist, orders, auth, users
│   │   ├── db/                # Prisma client, query builders, row mappers, repositories
│   │   ├── validation/        # zod schemas shared by client and server
│   │   ├── client/            # typed fetch helper for the browser
│   │   ├── utils/             # formatting, class names, slugs
│   │   ├── stripe.ts          # Stripe Checkout helpers
│   │   ├── config.ts          # validated environment variables
│   │   └── errors.ts          # AppError hierarchy
│   ├── data/catalog.ts        # seed data: 6 categories, 36 products
│   ├── generated/prisma/      # generated Prisma client (git-ignored, built on install)
│   ├── types/index.ts         # shared domain types
│   └── middleware.ts          # assigns guest ids
└── tests/
    ├── unit/                  # pricing, search, query builder, validation
    └── integration/           # repositories and transactions against real PostgreSQL
```

## Architecture

```mermaid
flowchart LR
  subgraph Browser
    RSC[Server-rendered pages]
    CC[Client components<br/>cart, filters, checkout, admin]
  end
  subgraph "Next.js on Vercel"
    MW[middleware.ts<br/>guest id cookie]
    PG[Pages<br/>Server Components]
    API[Route handlers<br/>/api/*]
    SVC[Services<br/>business rules]
    BIZ[Pure logic<br/>pricing, search]
    REPO[Repositories<br/>Prisma]
  end
  DB[(PostgreSQL<br/>Neon)]
  STRIPE[Stripe Checkout]

  CC -- fetch JSON --> API
  RSC --> PG
  MW --> PG
  PG --> SVC
  API -- zod validation --> SVC
  SVC --> BIZ
  SVC --> REPO
  REPO -- SQL via pg adapter --> DB
  SVC -. card payments .-> STRIPE
  STRIPE -. signed webhook .-> API
```

The code is layered so each part has one job, and dependencies only point downwards:

1. **UI** (`src/app/**/page.tsx`, `src/components`). Pages are Server Components that read data
   through services. Interactive parts (cart, filters, checkout, admin) are Client Components that
   call the API.
2. **API** (`src/app/api`). Each handler parses input with zod, calls one service and returns JSON.
   The `route()` wrapper turns any thrown `AppError` into a consistent error response and rejects
   cross-site write requests.
3. **Services** (`src/lib/services`). Use cases such as "add to cart", "place order" or "sign in".
   They apply the rules (stock, limits, merging guest data, order ownership) and know nothing
   about HTTP.
4. **Business logic** (`src/lib/business`). Pure functions (totals, search scoring, ranking,
   pagination) with no I/O, which makes them easy to unit test.
5. **Data access** (`src/lib/db`). Repositories are the only code that talks to the database.
   Prisma rows are mapped to plain domain objects, and database errors become safe `503`
   responses.

**Caching.** Catalog reads are cached with `unstable_cache` for five minutes and tagged `catalog`;
admin writes call `revalidateTag("catalog")`, so changes show immediately. Carts, wishlists,
accounts and orders are always fresh.

## Database

The full design is in **[docs/DATABASE.md](docs/DATABASE.md)**: the ER diagram, every table and
index, foreign-key behaviour, the SQL behind each feature, CRUD per entity, the order
transaction, search, guest-data cleanup and Neon setup.

In short:

| Table | Holds |
| ----- | ----- |
| `users` | Accounts (unique email, bcrypt hash, `customer`/`admin` role) |
| `categories` | The six collections |
| `products` | The catalog (prices in cents, stock, tags, specs, search text) |
| `cart_items` | One row per product per cart (user or guest) |
| `wishlist_items` | One row per saved product (user or guest) |
| `orders`, `order_items` | Placed orders with snapshot line items |
| `newsletter_subscribers` | Newsletter emails |

Integrity is enforced by the database itself: unique indexes (one account per email, no duplicate
cart lines or wishlist entries), foreign keys with cascade rules, and CHECK constraints (no
negative prices or stock, sale price below original price, exactly one owner per cart row).

### Option A: Neon (recommended, free, no card needed)

1. Create a free account at [neon.tech](https://neon.tech) and a new project. Choose the
   **AWS Asia Pacific (Singapore)** region to match `vercel.json`.
2. On the project dashboard click **Connect** and copy:
   - the **pooled** connection string (host contains `-pooler`) → `DATABASE_URL`
   - the **direct** connection string (turn connection pooling off) → `DIRECT_URL`
3. Put both in `.env.local`, then run `npm run db:setup` to create the tables and load the catalog.

### Option B: local PostgreSQL

Any PostgreSQL 14+ works. With Docker:

```bash
docker run --name gocart-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=gocart -p 5432:5432 -d postgres:16
```

Then set `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gocart"` (leave `DIRECT_URL`
empty) and run `npm run db:setup`.

## Environment variables

Copy `.env.example` to `.env.local` and fill it in. `.env.local` is git-ignored; nothing secret is
committed.

| Variable | Required | Description |
| -------- | -------- | ----------- |
| `DATABASE_URL` | yes | PostgreSQL connection string the app uses. On Neon, the **pooled** one |
| `DIRECT_URL` | on Neon | Direct (non-pooled) connection string, used for migrations |
| `AUTH_SECRET` | yes in production | At least 32 characters; signs session cookies. Generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `ADMIN_EMAILS` | no | Comma-separated emails that get the admin role when they sign up |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public URL of the site, used for metadata and the sitemap |
| `STRIPE_SECRET_KEY` | no | Enables card payments (use a `sk_test_…` key for demos). Without it, only cash on delivery is offered |
| `STRIPE_WEBHOOK_SECRET` | with Stripe | Signing secret of the Stripe webhook endpoint |
| `CRON_SECRET` | in production | Random string that protects the daily guest-data cleanup job |

## Installation

Requirements: **Node.js 20.9+** (22 recommended, see `.nvmrc`), npm, and a PostgreSQL database
(Neon or local).

```bash
git clone https://github.com/<your-username>/gocart.git
cd gocart
npm install                     # also generates the Prisma client
cp .env.example .env.local      # then fill in DATABASE_URL (and DIRECT_URL on Neon)

npm run db:setup                # apply migrations + load the catalog
npm run dev                     # http://localhost:3000
```

To try the admin console, add your email to `ADMIN_EMAILS` before you sign up, then open
`/admin/products`.

## Available scripts

| Script | What it does |
| ------ | ------------ |
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build / serve it |
| `npm run lint` | ESLint (Next.js core web vitals + TypeScript rules) |
| `npm run typecheck` | TypeScript in strict mode |
| `npm test` | Unit tests |
| `npm run test:integration` | Integration tests against `TEST_DATABASE_URL` (a throwaway database whose name contains "test") |
| `npm run db:migrate` | Create and apply a migration after changing `schema.prisma` (development) |
| `npm run db:deploy` | Apply pending migrations (production) |
| `npm run db:seed` | Load the catalog (safe to re-run) |
| `npm run db:setup` | `db:deploy` + `db:seed` |
| `npm run db:reset` | Drop and recreate the database from migrations (development only) |
| `npm run db:studio` | Browse the data in Prisma Studio |

## API reference

All endpoints return JSON. Errors always look like
`{ "error": { "code": "OUT_OF_STOCK", "message": "...", "details": { "fieldErrors": { ... } } } }`.
Write requests must come from the site's own origin.

| Method | Path | Description |
| ------ | ---- | ----------- |
| GET | `/api/health` | Database connectivity check (`200` or `503`) |
| GET | `/api/categories` | Categories with product counts |
| GET | `/api/products` | Search and filter: `q`, `category`, `minPrice`, `maxPrice` (dollars), `minRating`, `inStock`, `onSale`, `sort`, `page`, `pageSize` |
| POST | `/api/products` | Create a product (admin) |
| GET | `/api/products/:slug` | Product and related products |
| PATCH / DELETE | `/api/products/:slug` | Update / delete a product (admin) |
| GET | `/api/search?q=` | Search suggestions for the header |
| GET / POST / DELETE | `/api/cart` | Read the cart / add `{ productSlug, quantity }` / clear it |
| PATCH / DELETE | `/api/cart/:slug` | Set quantity `{ quantity }` (0 removes) / remove a line |
| GET / POST | `/api/wishlist` | Read / add `{ productSlug }` (409 if already saved) |
| DELETE | `/api/wishlist/:slug` | Remove from the wishlist |
| POST | `/api/checkout` | Place an order from the cart: `{ paymentMethod: "cod" \| "stripe", customer, shippingAddress }` |
| POST | `/api/checkout/verify` | Re-check a card payment with Stripe after returning from Checkout |
| GET | `/api/orders/:id` | An order (only for the buyer or an admin) |
| POST | `/api/webhooks/stripe` | Stripe events (signature verified) |
| GET | `/api/cron/cleanup` | Deletes expired guest carts and wishlists (needs `CRON_SECRET`) |
| POST | `/api/auth/signup` | `{ name, email, password }` |
| POST | `/api/auth/signin` | `{ email, password }` |
| POST | `/api/auth/signout` | End the session |
| GET | `/api/auth/me` | Current user or `null` |
| PATCH / DELETE | `/api/account` | Update `{ name }` / delete the account |
| POST | `/api/newsletter` | `{ email }` |

Example:

```bash
curl "http://localhost:3000/api/products?category=audio&maxPrice=150&sort=price-asc"
```

## Testing and quality

```bash
npm run lint && npm run typecheck && npm test && npm run build
TEST_DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gocart_test" npm run test:integration
```

- **Unit tests** (`tests/unit`): cart totals, shipping and discounts, quantity limits and guest
  merges, search ranking, the SQL filter builder, pagination and the validation schemas.
- **Integration tests** (`tests/integration`) run the real repositories against PostgreSQL, built
  from the same migration files: database filters match the reference results, duplicate emails
  and wishlist entries are rejected, carts are isolated per owner, cascades on delete, orders
  reserve stock atomically, a failed order writes nothing, **three simultaneous checkouts for the
  last unit produce exactly one order**, cancelled card orders restock once, guest orders move to
  the account, and expired guest data is cleaned up.
- **CI** (`.github/workflows/ci.yml`) starts PostgreSQL 16, then runs lint, typecheck, unit tests,
  `prisma migrate deploy`, a drift check (`prisma migrate diff --exit-code`), the seed, the
  integration tests and the production build on every push and pull request.

## Deployment (Vercel + Neon)

1. Push the repository to GitHub.
2. Create the Neon database (see [Database](#option-a-neon-recommended-free-no-card-needed)).
3. In Vercel choose **Add New → Project** and import the repository.
4. Under **Environment Variables** add `DATABASE_URL` (pooled), `DIRECT_URL` (direct),
   `AUTH_SECRET`, `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL` (your Vercel URL) and `CRON_SECRET`.
   Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` only if you want card payments.
5. Deploy. `vercel.json` runs `npm run vercel-build` (`prisma migrate deploy && next build`), so the
   tables are created on the first deployment.
6. Load the catalog once from your machine (with the Neon URLs in `.env.local`): `npm run db:seed`.
7. Open `https://<your-app>/api/health`; it should return `{"status":"ok","database":"connected"}`.

`vercel.json` also:

- runs the functions in Singapore (`sin1`), next to a Neon database in the Singapore region;
- schedules the daily cleanup job (`/api/cron/cleanup` at 03:00 UTC).

**Card payments (optional).** In the Stripe dashboard (test mode), add a webhook endpoint
`https://<your-app>/api/webhooks/stripe` with the events `checkout.session.completed`,
`checkout.session.async_payment_succeeded` and `checkout.session.expired`, and copy its signing
secret into `STRIPE_WEBHOOK_SECRET`. Locally, use
`stripe listen --forward-to localhost:3000/api/webhooks/stripe`. Test card: `4242 4242 4242 4242`.

## Security

- No credentials in the code; configuration is validated at startup (`src/lib/config.ts`).
- Passwords hashed with bcrypt; sign-in takes the same time whether or not the email exists.
- Sessions are signed JWTs in `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookies.
- Write requests from other origins are rejected (CSRF protection).
- Every input is validated with zod; request bodies are limited to 64 KB.
- Orders are visible only to whoever placed them (or an admin); other ids return 404.
- Card payments are confirmed only by Stripe: webhook signatures are verified, and the success page
  checks the session with Stripe's API before marking an order paid.
- All queries go through Prisma (parameterised SQL); database errors are logged on the server and
  never sent to the browser.
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`.

## Known limitations and next steps

- **Order fulfilment** (moving orders through processing → shipped → delivered) has statuses in the
  database but no admin screen yet.
- **Search** uses `LIKE` on a normalised text column plus relevance ranking in code, which suits
  thousands of products. For much larger catalogs, add a `pg_trgm` index or PostgreSQL full-text
  search (see [docs/DATABASE.md](docs/DATABASE.md#search)).
- **Rate limiting** for sign-in and sign-up should be added at the edge (for example Vercel Firewall
  rules) before a public launch.
- `npm audit` reports an advisory in the PostCSS copy bundled inside Next.js 15. It only affects
  build-time processing of the project's own CSS, not the running site; upgrading to Next.js 16
  resolves it.

## License

MIT
