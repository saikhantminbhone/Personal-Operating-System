# ⬡ Saikhant Labs OS

> Your Personal Operating System — built to scale from one user to millions.

A production-grade, full-stack personal productivity platform with 8 integrated modules, AI-powered planning, and a dark cyberpunk aesthetic. Built with Next.js 14, NestJS, PostgreSQL, and the Anthropic Claude API.

---

## 🗂 Architecture

```
saikhant-labs-os/           ← Turborepo monorepo root
├── apps/
│   ├── web/                ← Next.js 14 frontend (TypeScript + Tailwind)
│   └── api/                ← NestJS backend (TypeScript + Prisma)
├── packages/
│   └── shared/             ← Shared types, DTOs, enums
├── docker-compose.yml      ← Local dev: Postgres + Redis + Meilisearch
└── .github/workflows/      ← CI (lint/test/build) + CD (deploy to AWS ECS)
```

## ⚡ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| Backend | NestJS, TypeScript, REST API |
| Database | PostgreSQL 16, Prisma ORM |
| Auth | NextAuth.js (credentials + Google OAuth) |
| AI | Anthropic Claude API (briefings + chat) |
| Cache | Redis |
| Search | Meilisearch |
| State | Zustand + TanStack React Query |
| Infra | Docker, docker-compose, AWS ECS |
| CI/CD | GitHub Actions |

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js >= 20
- pnpm >= 9 (`npm install -g pnpm`)
- Docker + Docker Compose

### 1. Clone & install
```bash
git clone https://github.com/yourusername/saikhant-labs-os.git
cd saikhant-labs-os
pnpm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env — minimum required:
# DATABASE_URL (auto-set for local)
# NEXTAUTH_SECRET (any random string)
# ANTHROPIC_API_KEY (from console.anthropic.com)
# GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET (optional, for Google OAuth)
```

### 3. Start infrastructure
```bash
docker-compose up -d
# Starts: PostgreSQL (5432), Redis (6379), Meilisearch (7700)
```

### 4. Setup database
```bash
pnpm db:generate     # Generate Prisma client
pnpm db:migrate      # Run migrations
pnpm db:seed         # Seed with demo data
```

### 5. Start development servers
```bash
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:3001
# API Docs: http://localhost:3001/api/docs
```

### Demo credentials
```
Email: sai@saikhant.com
Password: demo123456
```

---

## 📦 Modules

| # | Module | Status | Description |
|---|---|---|---|
| 1 | Goals & OKRs | ✅ Full | Goal tracking with Key Results, auto progress calc |
| 2 | Task Manager | ✅ Full | Energy-matched task queue, priority system |
| 3 | AI Assistant | ✅ Full | Daily briefing + Claude-powered chat with full context |
| 4 | Analytics | ✅ Full | Charts, heatmaps, pillar breakdown, trends |
| 5 | Habits | ✅ Full | Streak tracking, logging, weekly charts |
| 6 | Finance | ✅ Full | Accounts, transactions, net worth, monthly summary |
| 7 | Knowledge Base | ✅ Backend | Notes, collections, daily note, full-text search |
| 8 | Projects | ✅ Backend | Kanban board, sprints, project management |

---

## 🗃 Database

Full Prisma schema with 20+ tables covering all 8 modules. Key design decisions:
- All monetary values stored in **cents** (integer, never floats)
- **Soft deletes** on all user data (`deletedAt` column)
- **Row-level security** ready for multi-tenant v3
- **Indexes** on all foreign keys and common query patterns

```bash
pnpm db:studio    # Open Prisma Studio (visual database browser)
pnpm db:reset     # Reset and re-seed (dev only)
```

---

## 🔐 Security

- JWT access tokens (15min) + refresh tokens (30 days, httpOnly cookie)
- Google OAuth 2.0
- Bcrypt password hashing (12 rounds)
- Helmet.js security headers
- CORS whitelist
- Input validation on all DTOs (class-validator)
- SQL injection protected via Prisma parameterized queries
- Rate limiting: 100 req/min per user

---

## 🐳 Production Deployment

### Docker Compose (self-hosted)
```bash
cp .env.example .env.production
# Fill in all production values

docker-compose -f docker-compose.prod.yml up -d
```

### AWS ECS (recommended)
1. Push images to ECR (automated via GitHub Actions on `main` push)
2. Set secrets in AWS Secrets Manager
3. Configure ECS task definitions pointing to your ECR images
4. Set up RDS PostgreSQL + ElastiCache Redis

Required GitHub secrets for CD:
```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
NEXTAUTH_SECRET
ANTHROPIC_API_KEY
DATABASE_URL
```

---

## 🧪 Development Commands

```bash
pnpm dev            # Start all apps in watch mode
pnpm build          # Build all apps
pnpm lint           # Lint all workspaces
pnpm typecheck      # TypeScript check all workspaces
pnpm test           # Run all tests

# Database
pnpm db:generate    # Generate Prisma client after schema changes
pnpm db:migrate     # Create and run new migration
pnpm db:seed        # Seed demo data
pnpm db:studio      # Open Prisma Studio at http://localhost:5555
pnpm db:reset       # Reset DB + re-seed (dev only!)
```

---

## 📁 API Reference

Full Swagger docs available at `http://localhost:3001/api/docs` in development.

Base URL: `http://localhost:3001/api/v1`

| Resource | Endpoints |
|---|---|
| Auth | `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/checkin` |
| Goals | `CRUD /goals`, `CRUD /goals/:id/key-results` |
| Tasks | `CRUD /tasks`, `GET /tasks/focus-queue`, `PATCH /tasks/:id/complete` |
| Habits | `CRUD /habits`, `POST /habits/:id/log`, `GET /habits/today` |
| Finance | `CRUD /finance/accounts`, `CRUD /finance/transactions`, `GET /finance/summary` |
| Knowledge | `CRUD /knowledge/notes`, `CRUD /knowledge/collections`, `GET /knowledge/notes/daily` |
| Projects | `CRUD /projects`, `POST /projects/:id/sprints`, `GET /projects/:id/kanban` |
| Analytics | `GET /analytics/dashboard`, `GET /analytics/goals/by-pillar`, `GET /analytics/productivity/trend` |
| AI | `GET /ai/briefing`, `POST /ai/chat`, `GET /ai/chat/history` |
| Health | `GET /health` |

---

## 🗺 Roadmap

- **Phase 0** ✅ Foundation (monorepo, auth, goals, tasks, AI, analytics)
- **Phase 1** ✅ Core modules (habits, finance, knowledge, projects)
- **Phase 2** 🔜 Intelligence layer (semantic search, AI auto-categorization, PWA)
- **Phase 3** 🔜 SaaS launch (multi-tenancy, Stripe billing, public beta)
- **Phase 4** 🔜 Platform (public API, integrations marketplace, mobile app)

---

## 👤 Author

**Sai Khant Min Bhone** — Senior Software Engineer  
[saikhant.com](https://saikhant.com) · Bangkok, Thailand

---

*Built with Saikhant Labs. All rights reserved.*
