# Celestial Grace Inventory

A self-hosted inventory and backend management system for handbag businesses.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database (SQLite - no server needed)
npx prisma migrate deploy
npx tsx prisma/seed.ts

# 3. Start the app
npm run dev
```

Open `http://localhost:3000` in your browser.

**Default login:**
- Email: `admin@celestialgrace.in`
- Password: `admin123`

## Tech Stack

- Next.js 16 + TypeScript
- SQLite (via Prisma)
- NextAuth v5
- Tailwind CSS + shadcn/ui

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/       # Main app pages
│   │   ├── products/      # Product CRUD
│   │   ├── raw-materials/ # Raw material CRUD
│   │   ├── suppliers/     # Supplier CRUD
│   │   ├── purchase-orders/# PO management
│   │   ├── customers/     # Customer CRUD
│   │   ├── sales-orders/  # Sales order management
│   │   ├── inventory/     # Stock tracking
│   │   ├── bom/           # Bill of materials
│   │   ├── import/        # Excel import wizard
│   │   └── admin/         # User management
│   ├── login/             # Login page
│   └── api/               # API routes
├── components/
│   └── ui/                # Reusable UI components
└── lib/
    ├── prisma.ts          # Prisma client
    └── utils.ts           # Utilities
```

## Backup

```bash
# Backup SQLite database
cp dev.db "backup-$(date +%Y%m%d).db"

# Restore
cp "backup-YYYYMMDD.db" dev.db
```

## License

Private - All rights reserved
