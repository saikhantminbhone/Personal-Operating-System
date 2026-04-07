# Saikhant Labs OS — Deployment Guide

## Prerequisites

| Tool    | Required Version | Install                 |
| ------- | ---------------- | ----------------------- |
| Node.js | 20+              | https://nodejs.org      |
| pnpm    | 9+               | `npm install -g pnpm@9` |
| Docker  | 24+              | https://docker.com      |
| Git     | Any              | https://git-scm.com     |

---

## Local Development

### 1. Clone and install

```bash
git clone <your-repo-url> saikhant-labs
cd saikhant-labs

# Install all workspace dependencies
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` — **minimum required fields:**

```bash
# Database (already configured for local docker)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/saikhant_os"

# Auth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here-minimum-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# AI — get from console.anthropic.com
ANTHROPIC_API_KEY="sk-ant-..."

# App URLs
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

Optional (for full features):

```bash
# Google OAuth — console.cloud.google.com
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Stripe — dashboard.stripe.com
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
STRIPE_PRO_PRICE_ID="price_..."
STRIPE_TEAM_PRICE_ID="price_..."
```

### 3. Start infrastructure

```bash
docker-compose up -d
```

Verify all containers are running:

```bash
docker-compose ps
# Should show: postgres (Up), redis (Up), meilisearch (Up)
```

If postgres isn't ready yet, wait 10 seconds and try again.

### 4. Setup database

```bash
pnpm db:generate    # Generate Prisma client
pnpm db:migrate     # Create all tables
pnpm db:seed        # Load demo data
```

### 5. Start development

```bash
pnpm dev
```

| Service            | URL                                           |
| ------------------ | --------------------------------------------- |
| Web app            | http://localhost:3000                         |
| API                | http://localhost:3001                         |
| API docs (Swagger) | http://localhost:3001/api/docs                |
| Marketing          | http://localhost:3002                         |
| DB Studio          | Run: `pnpm db:studio` → http://localhost:5555 |

**Demo login:** `sai@saikhant.com` / `demo123456`

### Troubleshooting

**`ERR_PNPM_FETCH_404 @saikhant-os/shared`**

```bash
# The shared package is local - ensure pnpm-workspace.yaml is correct
cat pnpm-workspace.yaml
# Should list: apps/api, apps/web, apps/marketing, packages/shared, packages/config
pnpm install --force
```

**Port already in use**

```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
```

**Database connection refused**

```bash
docker-compose restart postgres
# Wait 10s then:
pnpm db:migrate
```

**Prisma client not found**

```bash
pnpm db:generate
```

**pnpm install fails with workspace errors**

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm store prune
pnpm install
```

---

## Production Deployment

### Option A — Docker Compose (VPS / Single Server)

Best for: Small teams, personal use, cost-effective self-hosting.

**Requirements:** VPS with 2GB RAM minimum (4GB recommended), Ubuntu 22.04+.

#### 1. Server setup

```bash
# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker

# Install pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh
```

#### 2. Clone and configure

```bash
git clone <your-repo-url> /opt/saikhant-labs
cd /opt/saikhant-labs

# Create production env
cp .env.example .env.production
nano .env.production
```

Production `.env.production`:

```bash
NODE_ENV="production"
DATABASE_URL="postgresql://postgres:STRONG_PASSWORD@postgres:5432/saikhant_os"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://app.yourdomain.com"
ANTHROPIC_API_KEY="sk-ant-..."
NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
NEXT_PUBLIC_APP_URL="https://app.yourdomain.com"
POSTGRES_USER="postgres"
POSTGRES_PASSWORD="STRONG_PASSWORD_HERE"
POSTGRES_DB="saikhant_os"
```

#### 3. Build and deploy

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start everything
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
docker-compose -f docker-compose.prod.yml exec api npx ts-node prisma/seed.ts
```

#### 4. Nginx reverse proxy

```bash
sudo apt install nginx certbot python3-certbot-nginx -y
```

`/etc/nginx/sites-available/saikhant-os`:

```nginx
server {
    server_name app.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Stripe webhooks need raw body
        location /api/v1/billing/webhook {
            proxy_pass http://localhost:3001;
            proxy_set_header Host $host;
        }
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/saikhant-os /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# SSL
sudo certbot --nginx -d app.yourdomain.com -d api.yourdomain.com
```

#### 5. Auto-restart on reboot

```bash
sudo systemctl enable docker
docker-compose -f docker-compose.prod.yml --env-file .env.production up -d --restart-policy=always
```

---

### Option B — Vercel (Web) + Railway (API + DB)

Best for: Fastest time to deploy, no server management.

#### Web → Vercel

1. Push to GitHub
2. Import at vercel.com → New Project → select your repo
3. Set Framework: Next.js, Root Directory: `apps/web`
4. Add environment variables in Vercel dashboard
5. Deploy

```bash
# Or via CLI
npm install -g vercel
cd apps/web
vercel --prod
```

#### API → Railway

1. railway.app → New Project → Deploy from GitHub
2. Select repo, set root directory to `apps/api`
3. Add PostgreSQL and Redis plugins
4. Set environment variables
5. Railway auto-detects NestJS and deploys

```bash
# railway.json in apps/api/
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "node dist/main",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

### Option C — AWS ECS (Production Scale)

Best for: High availability, auto-scaling, enterprise.

#### 1. Push images to ECR

```bash
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="ap-southeast-1"

# Create repositories
aws ecr create-repository --repository-name saikhant-os-api --region $AWS_REGION
aws ecr create-repository --repository-name saikhant-os-web --region $AWS_REGION

# Login
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS \
  --password-stdin $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push
docker build -t saikhant-os-api -f apps/api/Dockerfile .
docker tag saikhant-os-api:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/saikhant-os-api:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/saikhant-os-api:latest

docker build -t saikhant-os-web -f apps/web/Dockerfile .
docker tag saikhant-os-web:latest $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/saikhant-os-web:latest
docker push $AWS_ACCOUNT.dkr.ecr.$AWS_REGION.amazonaws.com/saikhant-os-web:latest
```

#### 2. Infrastructure

| AWS Service       | Purpose                          |
| ----------------- | -------------------------------- |
| ECS Fargate       | Run API and Web containers       |
| RDS PostgreSQL    | Production database (Multi-AZ)   |
| ElastiCache Redis | Cache and job queue              |
| ALB               | Load balancing + SSL termination |
| Route 53          | DNS                              |
| ACM               | SSL certificates                 |
| Secrets Manager   | All environment variables        |
| ECR               | Container image registry         |
| CloudWatch        | Logs and monitoring              |

#### 3. CI/CD (GitHub Actions)

The `.github/workflows/deploy.yml` is pre-configured. Add these secrets to your GitHub repo:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
```

Every push to `main` automatically:

1. Runs tests
2. Builds Docker images
3. Pushes to ECR
4. Deploys to ECS
5. Runs health checks

---

## Database Management

```bash
# Create new migration after schema changes
pnpm db:migrate

# Deploy migrations in production (safe, no data loss)
npx prisma migrate deploy

# Open visual database browser
pnpm db:studio

# Reset database (DANGER: deletes all data)
pnpm db:reset

# Manual backup (production)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
psql $DATABASE_URL < backup_file.sql
```

---

## Environment Variables Reference

### Required (App won't start without these)

| Variable              | Description                       |
| --------------------- | --------------------------------- |
| `DATABASE_URL`        | PostgreSQL connection string      |
| `NEXTAUTH_SECRET`     | JWT signing secret (min 32 chars) |
| `NEXTAUTH_URL`        | Full URL of the web app           |
| `ANTHROPIC_API_KEY`   | Claude API key                    |
| `NEXT_PUBLIC_API_URL` | Full URL of API with /api/v1 path |
| `NEXT_PUBLIC_APP_URL` | Full URL of the web app           |

### Optional (Features degrade gracefully without these)

| Variable                                    | Feature                             |
| ------------------------------------------- | ----------------------------------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth login                  |
| `STRIPE_SECRET_KEY` etc.                    | Billing and subscriptions           |
| `MEILISEARCH_HOST` / `MEILISEARCH_API_KEY`  | Enhanced search                     |
| `AWS_*` / `AWS_S3_BUCKET`                   | File uploads                        |
| `SENDGRID_API_KEY`                          | Email notifications                 |
| `REDIS_URL`                                 | Job queue (falls back to in-memory) |

---

## Health Checks

```bash
# API health
curl http://localhost:3001/api/v1/health
# Expected: {"status":"ok","database":"connected"}

# Web
curl http://localhost:3000
# Expected: 200 OK

# Database
docker exec saikhant_os_db pg_isready -U postgres
# Expected: /var/run/postgresql:5432 - accepting connections
```

---

## Monitoring & Logs

```bash
# View all logs
docker-compose logs -f

# API logs only
docker-compose logs -f api

# Web logs only
docker-compose logs -f web

# Database logs
docker-compose logs -f postgres
```

Production monitoring stack:

- **Sentry** — error tracking (`SENTRY_DSN` env var)
- **Uptime Kuma** — self-hosted uptime monitoring
- **CloudWatch** — AWS metrics and logs (if on ECS)

---

## Security Checklist (Before Going Public)

- [ ] Change `NEXTAUTH_SECRET` from example value
- [ ] Set strong `POSTGRES_PASSWORD`
- [ ] Disable Swagger in production (`NODE_ENV=production` does this automatically)
- [ ] Configure CORS to only allow your domain
- [ ] Enable SSL/HTTPS (Let's Encrypt via certbot)
- [ ] Set up database backups (automated daily backups)
- [ ] Configure rate limiting (already built in, verify limits)
- [ ] Review API key scopes
- [ ] Enable 2FA on cloud provider accounts
- [ ] Store all secrets in AWS Secrets Manager / environment (never in code)

---

## Mobile Access

The web app is fully responsive and works on mobile browsers:

- **iPhone Safari** — fully supported, PWA installable
- **Android Chrome** — fully supported, PWA installable
- **Minimum screen** — 375px (iPhone SE)

### Install as PWA (Add to Home Screen)

**iOS:** Share → Add to Home Screen
**Android:** Menu → Add to Home Screen / Install App

The app works offline for viewing (service worker caches dashboard data).

---

## Stripe Webhook Setup (Production)

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Forward webhooks locally for testing
stripe listen --forward-to localhost:3001/api/v1/billing/webhook

# In production, add webhook endpoint in Stripe Dashboard:
# https://dashboard.stripe.com/webhooks
# Endpoint URL: https://api.yourdomain.com/api/v1/billing/webhook
# Events to listen: checkout.session.completed, customer.subscription.updated, customer.subscription.deleted
```

---

## Upgrade Guide

When pulling new code:

```bash
git pull origin main
pnpm install           # Install new dependencies
pnpm db:generate       # Regenerate Prisma client if schema changed
pnpm db:migrate        # Apply any new migrations
pnpm dev               # Restart dev server
```

Production:

```bash
git pull origin main
pnpm install --frozen-lockfile
pnpm db:generate
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy
```

---

_Saikhant Labs OS — Built by Sai Khant Min Bhone · saikhant.com_
