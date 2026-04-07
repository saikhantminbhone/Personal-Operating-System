.PHONY: setup dev build test lint clean db-reset deploy-staging

setup:
	./setup.sh

dev:
	docker-compose up -d && pnpm dev

build:
	pnpm build

test:
	pnpm test

lint:
	pnpm lint

typecheck:
	pnpm typecheck

clean:
	pnpm clean && docker-compose down

db-reset:
	pnpm --filter @saikhant-os/api db:reset

db-studio:
	cd apps/api && npx prisma studio

deploy-staging:
	docker-compose -f docker-compose.prod.yml up -d

logs:
	docker-compose logs -f
