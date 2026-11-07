# Database design (AWS DynamoDB)

Lumora stores everything in **one DynamoDB table** (`lumora-store` by default) using a
single-table design. Every entity has a generic `PK` / `SK` key pair, and two global
secondary indexes serve the catalog's list queries.

- [Why a single table](#why-a-single-table)
- [Table definition](#table-definition)
- [Entities and keys](#entities-and-keys)
- [Access patterns](#access-patterns)
- [CRUD operations by entity](#crud-operations-by-entity)
- [Data integrity](#data-integrity)
- [Guest data and TTL](#guest-data-and-ttl)
- [Search and scaling](#search-and-scaling)
- [Security and operations](#security-and-operations)

## Why a single table

- **One request per screen.** A shopper's whole cart is one `Query` on one partition
  (`OWNER#<id>`, `begins_with(SK, "CART#")`), not a join across tables.
- **Predictable cost and speed.** Every access pattern is a key lookup or an index query.
  Nothing scans the table.
- **Simple operations.** One table to create, back up, monitor and grant IAM access to.

## Table definition

| Setting      | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Primary key  | `PK` (string, partition) + `SK` (string, sort)             |
| GSI1         | `GSI1PK` + `GSI1SK`, projection `ALL`: products by category |
| GSI2         | `GSI2PK` + `GSI2SK`, projection `ALL`: all products, newest first |
| Billing      | On-demand (`PAY_PER_REQUEST`)                              |
| TTL          | Attribute `expiresAt` (epoch seconds), used for guest data |

`npm run db:create` creates exactly this (see `scripts/create-table.ts`), waits for the
table to become active and turns on TTL.

## Entities and keys

The key builders live in `src/lib/db/keys.ts`, so no other file builds key strings by hand.

| Entity        | PK                | SK                       | GSI1PK            | GSI1SK           | GSI2PK     | GSI2SK               |
| ------------- | ----------------- | ------------------------ | ----------------- | ---------------- | ---------- | -------------------- |
| Category      | `CATEGORY`        | `CATEGORY#<slug>`        |                   |                  |            |                      |
| Product       | `PRODUCT#<slug>`  | `PRODUCT`                | `CATEGORY#<slug>` | `PRODUCT#<slug>` | `PRODUCTS` | `<createdAt>#<slug>` |
| User          | `USER#<id>`       | `PROFILE`                |                   |                  |            |                      |
| Email lookup  | `EMAIL#<email>`   | `EMAIL`                  |                   |                  |            |                      |
| Cart item     | `OWNER#<ownerId>` | `CART#<productSlug>`     |                   |                  |            |                      |
| Wishlist item | `OWNER#<ownerId>` | `WISHLIST#<productSlug>` |                   |                  |            |                      |
| Subscriber    | `NEWSLETTER`      | `EMAIL#<email>`          |                   |                  |            |                      |

Every item also stores an `entityType` attribute (`Product`, `CartItem`, ...) to make the
table easy to read in the AWS console.

`ownerId` is either a user id or `guest-<uuid>` for shoppers who haven't signed in (see
[Guest data and TTL](#guest-data-and-ttl)).

### Example items

```jsonc
// Product
{
  "PK": "PRODUCT#pulse-pro-anc-headphones", "SK": "PRODUCT",
  "GSI1PK": "CATEGORY#audio", "GSI1SK": "PRODUCT#pulse-pro-anc-headphones",
  "GSI2PK": "PRODUCTS", "GSI2SK": "2026-10-30T00:00:00.000Z#pulse-pro-anc-headphones",
  "entityType": "Product",
  "slug": "pulse-pro-anc-headphones", "name": "Pulse Pro ANC Headphones",
  "categorySlug": "audio", "price": 24900, "compareAtPrice": 29900,   // cents
  "stock": 42, "rating": 4.8, "reviewCount": 1284, "featured": true,
  "tags": ["wireless", "noise-cancelling"], "features": ["..."], "specs": [{ "label": "Battery", "value": "Up to 40 hours" }],
  "colors": [{ "name": "Midnight", "hex": "#1e1b4b" }],
  "art": { "icon": "headphones", "from": "#a855f7", "to": "#ec4899" }, "images": [],
  "createdAt": "2026-10-30T00:00:00.000Z", "updatedAt": "2026-10-30T00:00:00.000Z"
}

// User profile + its email lookup item (written together in one transaction)
{ "PK": "USER#2e7d6aea-...", "SK": "PROFILE", "entityType": "User", "id": "2e7d6aea-...",
  "email": "ada@example.com", "name": "Ada Lovelace", "role": "customer",
  "passwordHash": "$2b$10$...", "createdAt": "...", "updatedAt": "..." }
{ "PK": "EMAIL#ada@example.com", "SK": "EMAIL", "entityType": "EmailLookup", "userId": "2e7d6aea-..." }

// Cart item for a guest (expires automatically after 30 days)
{ "PK": "OWNER#guest-0673c4f3-...", "SK": "CART#pulse-pro-anc-headphones", "entityType": "CartItem",
  "productSlug": "pulse-pro-anc-headphones", "quantity": 2,
  "addedAt": "...", "updatedAt": "...", "expiresAt": 1796800000 }
```

Money is always stored as **integer cents** to avoid floating-point rounding errors.

## Access patterns

| #  | Access pattern                         | Operation                         | Key condition / index                                      | Code |
| -- | -------------------------------------- | --------------------------------- | ---------------------------------------------------------- | ---- |
| 1  | List categories (sorted)               | `Query`                           | `PK = CATEGORY`                                            | `categoryRepository.list` |
| 2  | Get a category                         | `GetItem`                         | `PK = CATEGORY, SK = CATEGORY#<slug>`                      | `categoryRepository.getBySlug` |
| 3  | List all products, newest first        | `Query` (paginated)               | GSI2: `GSI2PK = PRODUCTS`, `ScanIndexForward = false`      | `productRepository.listAll` |
| 4  | List products in a category            | `Query`                           | GSI1: `GSI1PK = CATEGORY#<slug>`                           | `productRepository.listByCategory` |
| 5  | Get a product                          | `GetItem`                         | `PK = PRODUCT#<slug>, SK = PRODUCT`                        | `productRepository.getBySlug` |
| 6  | Get several products (cart, wishlist)  | `BatchGetItem` (retries unprocessed keys) | product keys                                       | `productRepository.getManyBySlugs` |
| 7  | Get a user by id (session)             | `GetItem`                         | `PK = USER#<id>, SK = PROFILE`                             | `userRepository.getById` |
| 8  | Get a user by email (sign-in)          | `GetItem` then `GetItem`          | `PK = EMAIL#<email>` → `USER#<id>`                         | `userRepository.getByEmail` |
| 9  | Read a cart                            | `Query`                           | `PK = OWNER#<id> AND begins_with(SK, "CART#")`             | `cartRepository.list` |
| 10 | Read a wishlist                        | `Query`                           | `PK = OWNER#<id> AND begins_with(SK, "WISHLIST#")`         | `wishlistRepository.list` |
| 11 | Is a product in the cart?              | `GetItem`                         | `PK = OWNER#<id>, SK = CART#<slug>`                        | `cartRepository.get` |
| 12 | Add a newsletter subscriber once       | `PutItem` with condition          | `PK = NEWSLETTER, SK = EMAIL#<email>`                      | `newsletterRepository.subscribe` |

Search, filtering, sorting and pagination of the catalog run on the result of pattern 3,
which is cached by Next.js for five minutes (see [Search and scaling](#search-and-scaling)).

## CRUD operations by entity

All database calls live in `src/lib/db/repositories/`. Services in `src/lib/services/`
add the business rules, and the API routes in `src/app/api/` expose them over HTTP.

### Products

| Action  | DynamoDB call                                                            | API |
| ------- | ------------------------------------------------------------------------ | --- |
| Create  | `PutItem` with `attribute_not_exists(PK)` (fails with 409 if the slug exists) | `POST /api/products` (admin) |
| Read    | `GetItem`, `Query` on GSI1 / GSI2, `BatchGetItem`                         | `GET /api/products`, `GET /api/products/:slug` |
| Update  | `PutItem` with `attribute_exists(PK)`; GSI keys are rewritten so a category change moves the product | `PATCH /api/products/:slug` (admin) |
| Delete  | `DeleteItem`                                                             | `DELETE /api/products/:slug` (admin) |

After every write the service calls `revalidateTag("catalog")` so pages show the change
straight away. Carts and wishlists that point at a deleted product are cleaned up the next
time they are read.

### Categories

| Action | DynamoDB call | Where |
| ------ | ------------- | ----- |
| Create / update | `PutItem` | `categoryRepository.put`, used by `npm run db:seed` |
| Read   | `Query` / `GetItem` | `GET /api/categories`, category pages |
| Delete | `DeleteItem` | `categoryRepository.delete` |

### Users

| Action  | DynamoDB call                                                                         | API |
| ------- | ------------------------------------------------------------------------------------- | --- |
| Create  | `TransactWriteItems`: put `USER#<id>` + put `EMAIL#<email>`, both with `attribute_not_exists(PK)` | `POST /api/auth/signup` |
| Read    | `GetItem` by id, or email lookup then `GetItem`                                        | `POST /api/auth/signin`, `GET /api/auth/me` |
| Update  | `UpdateItem` (`SET #name = :name, updatedAt = :now`) with `attribute_exists(PK)`        | `PATCH /api/account` |
| Delete  | `TransactWriteItems`: delete profile + delete email lookup; cart and wishlist are batch-deleted first | `DELETE /api/account` |

Passwords are hashed with bcrypt (10 rounds) and never leave the server.

### Cart items

| Action  | DynamoDB call | API |
| ------- | ------------- | --- |
| Add     | `GetItem` (current quantity) then `PutItem` with the new total, capped by stock and the 10-per-item limit | `POST /api/cart` |
| Read    | `Query` + `BatchGetItem` for live prices and stock | `GET /api/cart` |
| Update  | `PutItem` with the new quantity (0 deletes the line) | `PATCH /api/cart/:slug` |
| Delete  | `DeleteItem` (one line) or `BatchWriteItem` delete requests (clear cart) | `DELETE /api/cart/:slug`, `DELETE /api/cart` |

Cart items store only the product slug and quantity. Prices are always read from the
product at display time, so customers never see a stale price.

### Wishlist items

| Action | DynamoDB call | API |
| ------ | ------------- | --- |
| Add    | `PutItem` with `attribute_not_exists(SK)`, so the same product can't be saved twice (409 `ALREADY_IN_WISHLIST`) | `POST /api/wishlist` |
| Read   | `Query` + `BatchGetItem` | `GET /api/wishlist` |
| Delete | `DeleteItem` | `DELETE /api/wishlist/:slug` |

## Data integrity

- **Unique emails.** The email lookup item and the profile are written in one transaction
  with `attribute_not_exists` conditions. Two sign-ups racing for the same email cannot
  both succeed; the loser gets `409 EMAIL_TAKEN`.
- **No duplicate wishlist entries.** Enforced by the database with a condition expression,
  not just by the UI.
- **Stock and quantity limits.** Checked in `cart.service.ts` on every add and update;
  quantities above the current stock are reduced when the cart is read.
- **Validation before writes.** Every request body is parsed with a zod schema
  (`src/lib/validation/schemas.ts`) before it reaches a repository.
- **Error mapping.** `withDb()` in `src/lib/db/errors.ts` logs the AWS error and turns it
  into a `503 DATABASE_UNAVAILABLE` response, so internal details never reach the client.

## Guest data and TTL

Shoppers can use the cart and wishlist before signing up. Middleware gives each visitor
an anonymous `lumora_gid` cookie, and their items are stored under
`OWNER#guest-<uuid>` with an `expiresAt` timestamp 30 days ahead (refreshed on every
change). DynamoDB's TTL deletes abandoned guest data automatically at no cost.

When a guest signs in or signs up, their cart and wishlist are merged into the account
(quantities are added together up to the allowed limit) and the guest items are deleted.

## Search and scaling

The catalog is small and read-heavy, so the product list (one GSI2 query) is cached with
Next.js `unstable_cache` for five minutes, and search, filters, sorting and pagination run
in memory on that cached list (`src/lib/business/catalog-query.ts`). This keeps search
instant without a second service to run.

DynamoDB is not a full-text search engine. If the catalog grows past a few thousand
products, the recommended path is:

1. Stream table changes with **DynamoDB Streams** to **Amazon OpenSearch Service**
   (the managed zero-ETL integration does this without custom code).
2. Point `catalogService.searchProducts` at OpenSearch. The rest of the app does not change,
   because pages and API routes only call the service.

Other scaling notes:

- The `PRODUCTS` partition on GSI2 is a single partition key. At very large catalog sizes,
  shard it (for example `PRODUCTS#0` to `PRODUCTS#9`) and query the shards in parallel.
- On-demand billing scales automatically. Switch to provisioned capacity with auto scaling
  once traffic is predictable, to lower cost.

## Security and operations

**IAM.** The app only needs these actions on the table and its indexes. Create an IAM user
(or role) with this policy, replacing the region, account id and table name:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "LumoraAppAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query",
        "dynamodb:BatchGetItem",
        "dynamodb:BatchWriteItem",
        "dynamodb:ConditionCheckItem",
        "dynamodb:DescribeTable"
      ],
      "Resource": [
        "arn:aws:dynamodb:ap-south-1:123456789012:table/lumora-store",
        "arn:aws:dynamodb:ap-south-1:123456789012:table/lumora-store/index/*"
      ]
    }
  ]
}
```

`TransactWriteItems` is authorised through the item-level actions above (`PutItem`,
`DeleteItem`, `ConditionCheckItem`). Running `npm run db:create` additionally needs
`dynamodb:CreateTable` and `dynamodb:UpdateTimeToLive`; do that once with an admin profile
rather than giving those rights to the app.

**Backups.** Turn on point-in-time recovery for the table in production
(`aws dynamodb update-continuous-backups --table-name lumora-store --point-in-time-recovery-specification PointInTimeRecoveryEnabled=true`).

**Health check.** `GET /api/health` calls `DescribeTable` and returns `200` when the table
is reachable, or `503` otherwise. Point your uptime monitor at it.
