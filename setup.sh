#!/bin/bash
set -e

echo "⬡ Saikhant Labs OS — Setup"
echo "================================"

# Check Node.js
if ! command -v node >/dev/null 2>&1; then
  echo "❌ Node.js 20+ is required. Install from https://nodejs.org"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "❌ Node.js 20+ required. You have $(node -v)"
  exit 1
fi
echo "✓ Node.js $(node -v)"

# Check/install pnpm
if ! command -v pnpm >/dev/null 2>&1; then
  echo "Installing pnpm..."
  npm install -g pnpm@9
fi
echo "✓ pnpm $(pnpm -v)"

# Check Docker
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker is required. Install from https://docker.com"
  exit 1
fi
echo "✓ Docker $(docker -v | cut -d' ' -f3 | tr -d ',')"

echo ""
echo "✓ All requirements met"
echo ""

# Copy env
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ .env created from .env.example"
  echo ""
  echo "⚠️  IMPORTANT: Edit .env and set at minimum:"
  echo "   NEXTAUTH_SECRET  — any random string (min 32 chars)"
  echo "   ANTHROPIC_API_KEY — from console.anthropic.com"
  echo ""
  read -p "Press Enter after editing .env to continue..."
else
  echo "✓ .env already exists"
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
pnpm install
echo "✓ Dependencies installed"

# Start infrastructure
echo ""
echo "Starting Docker services (PostgreSQL, Redis, Meilisearch)..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
RETRIES=30
until docker exec saikhant_os_db pg_isready -U postgres >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
  RETRIES=$((RETRIES-1))
  sleep 1
  printf "."
done
echo ""

if [ $RETRIES -eq 0 ]; then
  echo "❌ PostgreSQL did not start in time. Check: docker-compose logs postgres"
  exit 1
fi
echo "✓ PostgreSQL ready"

# Database setup
echo ""
echo "Setting up database..."
pnpm --filter @saikhant-os/api db:generate
pnpm --filter @saikhant-os/api db:migrate
pnpm --filter @saikhant-os/api db:seed
echo "✓ Database ready"

echo ""
echo "======================================"
echo "✅ Setup complete! Start with: pnpm dev"
echo "======================================"
echo ""
echo "Web:      http://localhost:3000"
echo "API:      http://localhost:3001"
echo "API Docs: http://localhost:3001/api/docs"
echo ""
echo "Demo login:"
echo "  Email:    sai@saikhant.com"
echo "  Password: demo123456"
