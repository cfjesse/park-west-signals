# Art API

Express + SQLite API for artworks, customers and purchases. It uses Node's built-in `node:sqlite` (no native build step), so it needs Node >= 22.13.

```bash
npm install
npm run seed    # sample customers and artworks (wipes existing data)
npm start       # http://localhost:3000/api   (PORT / DB_FILE env vars supported)
npm test
```

## Data model

See [schema.sql](schema.sql).

- **artworks**: `id` (UUID), `artist_name`, `title`, `media`, `size`, `style`, `date_created` (YYYY-MM-DD), `price` (whole dollars), `status` (`available` | `sold`), `customer_id`, `sold_date`
- **customers**: `id` (UUID), `name`, `age`, `email`, `phone`, `address`, `credit` (whole dollars)

A sold artwork points at its buyer through `artworks.customer_id`. A customer's purchase history is the set of sold artworks linked to them. The database guarantees an artwork is `sold` if and only if it has a buyer and a sold date.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/health` | |
| GET | `/api/artworks` | filters: `status`, `style`, `media`, `artist` |
| GET | `/api/artworks/:id` | includes `customer_name` when sold |
| PUT / PATCH | `/api/artworks/:id` | editable: `artist_name`, `title`, `media`, `size`, `style`, `date_created`, `price`. `status`, `customer_id` and `sold_date` are changed only by a purchase |
| GET | `/api/customers` | |
| GET | `/api/customers/:id` | includes `purchase_history` |
| PUT / PATCH | `/api/customers/:id` | editable: `name`, `age`, `email`, `phone`, `address`, `credit` |
| POST | `/api/customers/:id/purchases` | body `{ "artwork_id": "..." }`. Sets the artwork to `sold`, links the buyer, sets `sold_date` and deducts the price from credit. 409 if the artwork is sold or credit is too low |

PUT and PATCH behave the same: supplied fields are merged into the record. Errors return `{ "error": "...", "details": [...] }` with 400, 404 or 409.

## Moving to Netlify / Turso

Netlify's own database is Postgres. For hosted SQLite use [Turso](https://turso.tech) (libSQL). Only the database driver changes:

1. `npm i @libsql/client serverless-http`
2. Add `src/db/libsql.js` implementing the same three methods as `src/db/sqlite.js`: `query(sql, args)`, `run(sql, args)` and `batch(statements)` (use `client.batch(stmts, 'write')`). Read the URL and token from env vars.
3. Run `schema.sql` against the Turso database.
4. Add a Netlify Function that wraps `createApp({ artworks: artworksRepo(db), customers: customersRepo(db) })` with `serverless-http`.

Routes, repositories and `schema.sql` stay as they are.
