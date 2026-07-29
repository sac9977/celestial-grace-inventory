#!/bin/bash
set -euo pipefail

echo "=== PostgreSQL Diagnostic ==="

# Check if PostgreSQL is installed
if ! command -v psql &>/dev/null; then
  echo "ERROR: PostgreSQL not found. Install with: brew install postgresql@16"
  exit 1
fi

echo "✓ PostgreSQL found: $(psql --version)"

# Check if PostgreSQL is running
echo ""
echo "Checking if PostgreSQL is running..."
if pg_isready -U postgres &>/dev/null; then
  echo "✓ PostgreSQL is running"
else
  echo "✗ PostgreSQL is NOT running"
  echo "  Starting PostgreSQL..."
  brew services start postgresql@16 2>/dev/null || true
  sleep 2
  if pg_isready -U postgres &>/dev/null; then
    echo "✓ PostgreSQL started"
  else
    echo "✗ Failed to start PostgreSQL"
    echo "  Check logs: tail -f /usr/local/var/log/postgresql/*.log"
    exit 1
  fi
fi

# Check if database exists
echo ""
echo "Checking database 'celestial_grace'..."
if PGPASSWORD=postgres psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'celestial_grace'" | grep -q 1; then
  echo "✓ Database exists"
else
  echo "✗ Database does not exist"
  echo "  Creating database..."
  PGPASSWORD=postgres psql -U postgres -c "CREATE DATABASE celestial_grace;"
  echo "✓ Database created"
fi

# Check current DATABASE_URL
echo ""
echo "Current DATABASE_URL:"
grep "^DATABASE_URL=" .env || echo "  NOT FOUND in .env"

# Test connection
echo ""
echo "Testing connection..."
if PGPASSWORD=postgres psql -U postgres -d celestial_grace -c "SELECT 1;" &>/dev/null; then
  echo "✓ Connection successful"
else
  echo "✗ Connection failed"
  echo ""
  echo "Troubleshooting steps:"
  echo "1. Check PostgreSQL password for 'postgres' user"
  echo "2. Verify pg_hba.conf allows local connections"
  echo "3. Try: psql -U postgres -d postgres"
fi

echo ""
echo "=== Diagnostic complete ==="
