# Celestial Grace Inventory — Quick Start (Intel Mac)

This is the **simplified** setup. No Docker, no PostgreSQL, no extra services.  
It uses SQLite, so your data is stored in a local file: `dev.db`.

## 1. Install prerequisites

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install node@20
```

## 2. Clone / open the project

```bash
cd ~/Projects/celestial-grace
```

## 3. Install dependencies

```bash
npm install
```

## 4. Prepare database

```bash
npx prisma migrate deploy
npx tsx prisma/seed.ts
```

## 5. Start the app

```bash
npm run dev
```

## 6. Open it

```
http://localhost:3000
```

Login:
- Email: `admin@celestialgrace.in`
- Password: `admin123`

That’s it. No databases to start, no ports to open, no Docker required.
