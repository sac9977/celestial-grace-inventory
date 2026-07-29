#!/bin/bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

echo "=== Celestial Grace Inventory - Simple Setup ==="
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js not found. Install from https://nodejs.org/"
  exit 1
fi

echo "✓ Node.js $(node --version) found"

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo ""
echo "Setting up database..."
npx prisma migrate deploy

# Seed admin user
echo ""
echo "Creating admin user..."
npx tsx prisma/seed.ts

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Start the app with: npm run dev"
echo "Then open: http://localhost:3000"
echo ""
echo "Default login:"
echo "  Email: admin@celestialgrace.in"
echo "  Password: admin123"
