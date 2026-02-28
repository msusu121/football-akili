# Football Club Website – Replica Scaffold (v2)

This is **v2** of the full-stack scaffold (frontend + backend + MySQL + MinIO/S3).

## What’s new in v2

### UI/UX parity upgrades
- Navbar dropdown for **Squad → Teams / Staff**
- **Highlights** (video block) on homepage fed from DB

### Real auth UI
- Login/Register forms
- JWT token storage + `/auth/me` session refresh
- Account page with membership, tickets, orders

### CMS/Admin (role-gated)
- `/admin` dashboard (Overview, News, Matches, Team, Products, Sponsors, Media, Highlights, FAQs, Settings)
- Admin APIs under `/admin/*` (protected)
- Media library registration flow (works with presigned upload)

### Shop (members-only)
- Products list, product details, cart (localStorage)
- Checkout creates an order + payment transaction

### Ticketing
- Featured ticket events list
- Ticket purchase creates reserved ticket + transaction
- DEV confirm generates QR and marks ticket as PAID

### Payments
- Production contract endpoints under `/payments/*`
- **DEV-only**: `/payments/mock/confirm` to simulate payment success

## Run locally (Ubuntu)

```bash
cd infra
docker compose up -d

cd ../backend
cp .env.example .env
npm i
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev

cd ../frontend
cp .env.example .env
npm i
npm run dev
```

Seeded admin:
- `admin@club.local`
- `Admin@123`

## Media upload flow (MinIO/S3 compatible)

1) Request a presigned URL:

`POST /uploads/presign` (admin/editor token)

2) Upload file to the returned `uploadUrl`

3) Register the `key` in CMS:

`POST /admin/media`

Then set `heroMediaId` / `logoId` / `portraitId` / `thumbnailId` from registered assets.

---

Replace the DEV mock payment confirm with real provider callbacks (M-Pesa/Card) when you’re ready.
