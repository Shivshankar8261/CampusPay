# CampusPay — student fintech MVP

Production-style MVP for a India college–focused fintech app: simulated UPI, group pools, pocket-money budgets, micro-lending (₹100–₹1,000), campus credit score, and optional parent summary (aggregates only).

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT
- **Frontend:** Next.js 14 (App Router), proxied API for same-origin requests

## Prerequisites

- Node.js 18+
- **MongoDB is optional.** If you do not set `MONGODB_URI`, the API uses **in-memory MongoDB** (data resets when you stop the server). Wallet updates work on **standalone MongoDB** (no replica set required).

## Recommended: one command (API + web)

From **`fintech-campus/`** (this folder):

```bash
npm run setup
npm run dev
```

This starts the API on **port 4000** and the web app on **port 3000** together.

Open **http://localhost:3000** — the browser calls **`/api/...` on port 3000**; Next.js **proxies** those requests to the API (`API_ORIGIN`, default `http://127.0.0.1:4000`). You do **not** need CORS tweaks for local use.

### Verify the API

```bash
npm run smoke
```

Runs an automated check of auth, payments, pools, budget, savings, loans, and parent summary (expects API on port **4000**; set `API_BASE` if different).

### Manual setup (two terminals)

**Backend**

```bash
cd fintech-campus/backend
npm install
npm run dev
```

**Frontend**

```bash
cd fintech-campus/frontend
npm install
npm run dev
```

Optional: `cp .env.example .env.local` — set `API_ORIGIN` if the API is not on `127.0.0.1:4000`. For a **split deploy**, set `NEXT_PUBLIC_API_BASE` to your public API URL (and keep CORS enabled on Express).

To **reset** a persistent Mongo database and reload demo data: `cd backend && npm run seed`

## Sample test data (auto-loaded on empty DB, or after `npm run seed`)

| Email               | Password  |
| ------------------- | --------- |
| `riya@campus.demo`  | `demo1234` |
| `arjun@campus.demo` | `demo1234` |
| `neha@campus.demo`  | `demo1234` |

Group invite code: **GOA2026**

## API overview

| Method | Path | Notes |
| ------ | ---- | ----- |
| POST | `/api/auth/register`, `/api/auth/login` | JWT |
| GET/PATCH | `/api/me` | Profile, parent toggle |
| GET | `/api/dashboard` | Balance, 30d spend, recent tx |
| GET/POST | `/api/transactions`, `/api/transactions/simulate-upi` | Tagged P2P |
| GET/POST | `/api/groups`, `/api/groups/join`, `/api/groups/:id/contribute` | Pools |
| GET/POST | `/api/budget/setup`, `/api/budget/insights` | Pocket money |
| GET/POST/PATCH | `/api/savings`, `/api/savings/:id/simulate-allocate` | Goals |
| GET/POST | `/api/loans`, accept/reject/repay | Micro credit |
| GET | `/api/parent/summary` | Requires parent mode on |
| GET | `/api/users/search?q=` | Find peer emails |

## Constraints (by design)

- No real UPI or payment gateway — balances update in MongoDB only.
- Credit score is rule-based (repay / default), not bureau data.

## Folder structure

```
fintech-campus/
  package.json      # npm run dev (API + web), npm run smoke
  scripts/smoke.mjs
  backend/src/
  frontend/
```
