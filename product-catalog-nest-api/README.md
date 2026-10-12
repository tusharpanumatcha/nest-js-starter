# Product Catalog API (NestJS)

REST API for managing a product catalog (categories and products) with NestJS, TypeScript and MongoDB.

The NestJS version of the Express project `product-catalog-api`. It has the same endpoints and
behaviour, plus request validation with DTOs, Swagger docs and an end-to-end test suite.

- **NestJS 12** (ES modules), **TypeScript 6**, **Mongoose 9** via `@nestjs/mongoose`
- **class-validator DTOs**: every request body and query string is validated, and unknown fields are rejected
- **Swagger / OpenAPI docs** at `/api/docs`
- **Built-in fake MongoDB**: runs with zero setup, auto-seeded with sample data
- **Every available API printed on startup**, and listed at `GET /api`
- **Vitest e2e tests** that run against a fresh in-memory database

## Requirements

- Node.js 20.19+ or 22.12+ (`node -v`)
- MongoDB is optional. Without it the app uses a fake in-memory MongoDB.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000, Swagger at http://localhost:3000/api/docs
```

If no MongoDB is running locally, `npm run dev` falls back to the **fake in-memory database**
(via `mongodb-memory-server`) and loads the 7 categories and 23 products from `src/data/api-data.json`.

- The first run downloads a MongoDB binary (~100 MB, cached in `~/.cache/mongodb-binaries`), so it needs internet once.
- In-memory data **resets** on every restart, including auto-restarts when you save a file.
- To use a real database, copy `.env.example` to `.env`, set `MONGODB_URI`, then run `npm run seed` once.

## Scripts

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server with auto-reload (`nest start --watch`). Uses `MONGODB_URI`, falls back to in-memory if no local MongoDB |
| `npm run dev:memory` | Same, but always with the fake in-memory database |
| `npm run serve` | Same as `npm run dev` |
| `npm run build` / `npm run start:prod` | Compile to `dist/` / run the compiled app |
| `npm run seed` | Load the sample data into the database from `MONGODB_URI` (matched by name, safe to rerun) |
| `npm run seed -- --fresh` | **Delete all** categories and products, then load the sample data |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests of every endpoint against a fresh in-memory MongoDB |
| `npm run lint` / `npm run format` / `npm run typecheck` | oxlint / Prettier / TypeScript checks |

### Environment variables (`.env`)

| Name | Default |
| --- | --- |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/product-catalog` (or `memory` for the fake database) |
| `PORT` | `3000` |

The app only falls back to the in-memory database for a **local** URI in development. A remote database
(e.g. Atlas) that can't be reached, or `NODE_ENV=production`, fails with a clear error instead.

## Endpoints

Interactive docs: **http://localhost:3000/api/docs** (OpenAPI JSON at `/api/docs-json`).
IDs are MongoDB ObjectIds (returned as `id`).

### Categories `/api/categories`

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/api/categories` | `?isActive=true\|false` (optional) | List, sorted by name |
| GET | `/api/categories/active` | | Active categories only |
| GET | `/api/categories/:id` | | One category |
| POST | `/api/categories` | `{ "category": "Name", "isActive": true }` | Create → **201**. Names are unique |
| PUT / PATCH | `/api/categories/:id` | any of `category`, `isActive` | Partial update. Renaming also updates its products |
| DELETE | `/api/categories/:id` | | **409** if products still use it |

### Products `/api/products`

| Method | Path | Body / query | Notes |
| --- | --- | --- | --- |
| GET | `/api/products` | `?category=A&category=B` or `?category=A,B`, `?search=text` | List / filter |
| POST | `/api/products/search` | `{ "categories": ["Issuer Solutions"], "search": "card" }` | Filter by body. Empty `categories` returns `[]` |
| GET | `/api/products/:id` | | One product |
| POST | `/api/products` | `{ "productname", "category", "imageName", "productDescription" }` | Create → **201**. `category` must be an existing category name |
| PUT / PATCH | `/api/products/:id` | any product field | Partial update |
| DELETE | `/api/products/:id` | | Delete |

### Other

- `GET /` and `GET /api` → `{ "message", "name", "version", "description", "docs", "endpoints": ["GET /api/products", ...] }`
  (name, version and description come from `package.json`)
- `GET /api/health` → `{ "status": "ok", "db": "connected", "mode": "mongodb" | "memory" }` (503 if the database is down)

### Errors

Every error has the same JSON shape:

```json
{ "statusCode": 422, "message": "Unprocessable Entity", "errors": ["category should not be empty"] }
```

| Status | When |
| --- | --- |
| 400 | Invalid id, malformed JSON |
| 404 | Record or route not found |
| 409 | Duplicate category name, or deleting a category that still has products |
| 422 | Validation failed (missing/invalid/unknown fields, bad query values, category does not exist) |

## Project structure

```
src/
  main.ts                       bootstrap: starts the app, prints the API list
  setup-app.ts                  global ValidationPipe, error filter, CORS, Swagger (shared with e2e tests)
  app.module.ts                 root module
  config/env.ts                 .env loading and settings
  database/
    database.module.ts          MongooseModule + choice of real / in-memory database
    memory-db.ts                fake in-memory MongoDB
  categories/                   module, controller, service, schemas/, dto/
  products/                     module, controller, service, schemas/, dto/
  seed/seed.service.ts          loads src/data/api-data.json (auto on in-memory start, or npm run seed)
  info/                         GET / , /api, /api/health and the route lister
  common/                       error filter, ObjectId pipe, shared schema options, package info
  scripts/seed.ts               npm run seed
  data/api-data.json            sample data
test/app.e2e-spec.ts            end-to-end tests
```
