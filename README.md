# CampusPay — Campus Credit Network (MVP)

CampusPay is a **peer-to-peer micro‑credit platform for verified Indian college students (18–25)**. It enables ₹100–₹1,000 short-term loans inside a campus network, using:

- **AutoPay simulation** (scheduled repayment)
- **Social guarantor** (required above ₹500)
- **Campus Credit Score** (behavior-based alternative credit reputation)

## Run locally

From `fintech-campus/`:

```bash
npm run setup
npm run dev
```

- Web: `http://localhost:3000`
- API: `http://127.0.0.1:4000`

## Demo accounts

- `riya@campus.demo` / `demo1234`
- `arjun@campus.demo` / `demo1234`
- `neha@campus.demo` / `demo1234`

## App structure (MVP)

- Home: credit score + active loans
- Borrow: request micro-loans + AutoPay simulation + guarantor
- Lend: accept/reject incoming requests
- History: paid/pending/overdue record
- Profile: verification + college/year + UPI link (simulated)
