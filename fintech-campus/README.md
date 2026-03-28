# CampusPay — student fintech MVP

Production-style MVP for a India college–focused fintech app: simulated UPI, group pools, pocket-money budgets, micro-lending (₹100–₹1,000), campus credit score, and optional parent summary (aggregates only).

## Stack

- **Backend:** Node.js, Express, MongoDB (Mongoose), JWT
- **Frontend:** Next.js 14 (App Router), mobile-first CSS

## Prerequisites

- Node.js 18+
- **MongoDB is optional.** If you do not set `MONGODB_URI`, the API starts an **in-memory MongoDB** (data resets when you stop the server). For persistent data, run Mongo locally or Atlas and set `MONGODB_URI`.

## Setup (working prototype in ~2 minutes)

### 1. Backend

```bash
cd fintech-campus/backend
npm install
npm run dev
```

On first start, if the database is empty, **demo accounts are created automatically** (same as `npm run seed`).

Optional: `cp .env.example .env` and set a real `JWT_SECRET` / `MONGODB_URI`.

To **reset** a persistent Mongo database and reload demo data: `npm run seed`

API: `http://localhost:4000`

### 2. Frontend

```bash
cd fintech-campus/frontend
cp .env.example .env.local
npm install
npm run dev
```

App: `http://localhost:3000`

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
  backend/src/
    models/          # Mongoose schemas
    routes/          # Express routers
    middleware/      # JWT
    services/        # Auto loan repayment job
    seed.js
  frontend/
    app/             # Next.js pages
    components/
    lib/api.js       # Fetch + token helper
```
