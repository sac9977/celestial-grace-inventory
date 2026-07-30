# Celestial Grace Inventory

A self-hosted inventory and backend management system for handbag businesses.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database (SQLite - no server needed)
npx prisma db push
npx tsx prisma/seed.ts

# 3. Start the app
npm start
```

Open `http://localhost:3000` in your browser.

**Default login:**
- Email: `admin@celestialgrace.in`
- Password: `admin123`

## Backup

```bash
cp prisma/dev.db "backup-$(date +%Y%m%d).db"
```

## License

Private - All rights reserved
