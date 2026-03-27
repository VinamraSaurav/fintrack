.PHONY: help setup dev build lint typecheck install clean \
       db-generate db-migrate db-migrate-staging db-migrate-prod db-seed db-studio \
       deploy-staging deploy-prod deploy-all \
       logs-staging logs-prod cf-login cf-whoami cf-setup env-check

# ─── Paths ────────────────────────────────────────────────────────────────────
ROOT     := $(shell pwd)
BUN      := bun
WRANGLER := cd $(ROOT)/apps/api && $(BUN) x wrangler
DRIZZLE  := cd $(ROOT)/apps/api && $(BUN) x drizzle-kit
VERCEL   := $(BUN) x vercel

# ─── Colors ───────────────────────────────────────────────────────────────────
CYAN   := \033[36m
GREEN  := \033[32m
YELLOW := \033[33m
RED    := \033[31m
BOLD   := \033[1m
DIM    := \033[2m
PURPLE := \033[35m
BLUE   := \033[34m
RESET  := \033[0m

# ─── Help ─────────────────────────────────────────────────────────────────────
help: ## Show this help message
	@echo ""
	@echo "$(PURPLE)$(BOLD)  ███████╗██╗███╗   ██╗██╗   ██╗███████╗██████╗ ███████╗███████╗$(RESET)"
	@echo "$(PURPLE)$(BOLD)  ██╔════╝██║████╗  ██║██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝$(RESET)"
	@echo "$(BLUE)$(BOLD)  █████╗  ██║██╔██╗ ██║██║   ██║█████╗  ██████╔╝███████╗█████╗  $(RESET)"
	@echo "$(BLUE)$(BOLD)  ██╔══╝  ██║██║╚██╗██║╚██╗ ██╔╝██╔══╝  ██╔══██╗╚════██║██╔══╝  $(RESET)"
	@echo "$(CYAN)$(BOLD)  ██║     ██║██║ ╚████║ ╚████╔╝ ███████╗██║  ██║███████║███████╗$(RESET)"
	@echo "$(CYAN)$(BOLD)  ╚═╝     ╚═╝╚═╝  ╚═══╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝$(RESET)"
	@echo ""
	@echo "  $(DIM)Smart Personal Finance Tracker$(RESET)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-22s$(RESET) %s\n", $$1, $$2}'
	@echo ""

# ─── Development ──────────────────────────────────────────────────────────────
install: ## Install all dependencies
	$(BUN) install

dev: ## Start all apps in development mode
	$(BUN) run dev

build: ## Build all packages
	$(BUN) run build

lint: ## Run linting across all packages
	$(BUN) run lint

typecheck: ## Run type checking across all packages
	$(BUN) run typecheck

format: ## Format all files with Prettier
	$(BUN) run format

clean: ## Clean build artifacts and node_modules
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/web/.next apps/api/dist .turbo apps/*/.turbo packages/*/.turbo

# ─── Database ─────────────────────────────────────────────────────────────────
db-generate: ## Generate Drizzle migrations from schema
	$(DRIZZLE) generate

db-migrate: ## Apply migrations to local D1
	$(WRANGLER) d1 migrations apply fintrack-db --local

db-migrate-staging: ## Apply migrations to staging D1
	$(WRANGLER) d1 migrations apply fintrack-db-staging --remote --env staging

db-migrate-prod: ## Apply migrations to production D1
	$(WRANGLER) d1 migrations apply fintrack-db --remote

db-seed: ## Re-generate and apply seed data locally
	cd $(ROOT)/apps/api && $(BUN) run scripts/seed-canonical.ts > src/db/migrations/seed_latest.sql
	$(WRANGLER) d1 execute fintrack-db --local --file=src/db/migrations/seed_latest.sql

db-studio: ## Open Drizzle Studio (database GUI)
	$(DRIZZLE) studio

# ─── Deployment ───────────────────────────────────────────────────────────────
deploy-staging: ## Deploy API to CF staging + trigger Vercel preview
	@echo "$(CYAN)Deploying API to staging...$(RESET)"
	$(WRANGLER) deploy --env staging
	@echo "$(GREEN)✓ API deployed to staging$(RESET)"
	@echo ""
	@echo "$(CYAN)Applying migrations to staging D1...$(RESET)"
	$(WRANGLER) d1 migrations apply fintrack-db-staging --remote --env staging
	@echo "$(GREEN)✓ Migrations applied$(RESET)"
	@echo ""
	@echo "$(CYAN)Deploying frontend to Vercel preview...$(RESET)"
	cd $(ROOT) && $(VERCEL) --force
	@echo ""
	@echo "$(GREEN)═══════════════════════════════════════════════$(RESET)"
	@echo "$(GREEN)  Staging deployment complete!                 $(RESET)"
	@echo "$(GREEN)═══════════════════════════════════════════════$(RESET)"

deploy-prod: ## Deploy API to CF production + trigger Vercel production
	@echo "$(RED)╔══════════════════════════════════════════╗$(RESET)"
	@echo "$(RED)║  PRODUCTION DEPLOYMENT                   ║$(RESET)"
	@echo "$(RED)╚══════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(CYAN)Deploying API to production...$(RESET)"
	$(WRANGLER) deploy
	@echo "$(GREEN)✓ API deployed to production$(RESET)"
	@echo ""
	@echo "$(CYAN)Applying migrations to production D1...$(RESET)"
	$(WRANGLER) d1 migrations apply fintrack-db --remote
	@echo "$(GREEN)✓ Migrations applied$(RESET)"
	@echo ""
	@echo "$(CYAN)Deploying frontend to Vercel production...$(RESET)"
	cd $(ROOT) && $(VERCEL) --prod --force
	@echo ""
	@echo "$(GREEN)═══════════════════════════════════════════════$(RESET)"
	@echo "$(GREEN)  Production deployment complete!              $(RESET)"
	@echo "$(GREEN)═══════════════════════════════════════════════$(RESET)"

deploy-all: ## Deploy to both staging and production
	$(MAKE) deploy-staging
	$(MAKE) deploy-prod

# ─── Secrets ──────────────────────────────────────────────────────────────────
env-sync-staging: ## Sync all secrets from .dev.vars to CF staging
	@echo "$(CYAN)Syncing secrets to staging from .dev.vars...$(RESET)"
	@grep -v '^#' $(ROOT)/apps/api/.dev.vars | grep -v '^$$' | while IFS='=' read -r key val; do \
		echo "  → $$key"; \
		echo "$$val" | $(WRANGLER) secret put "$$key" --env staging 2>&1 | tail -1; \
	done
	@echo "$(GREEN)✓ Staging secrets synced$(RESET)"

env-sync-prod: ## Sync all secrets from .dev.vars to CF production
	@echo "$(CYAN)Syncing secrets to production from .dev.vars...$(RESET)"
	@grep -v '^#' $(ROOT)/apps/api/.dev.vars | grep -v '^$$' | while IFS='=' read -r key val; do \
		echo "  → $$key"; \
		echo "$$val" | $(WRANGLER) secret put "$$key" 2>&1 | tail -1; \
	done
	@echo "$(GREEN)✓ Production secrets synced$(RESET)"

env-sync: ## Sync all secrets to both staging and production
	$(MAKE) env-sync-staging
	$(MAKE) env-sync-prod
	@echo "$(GREEN)✓ Production secrets set$(RESET)"

# ─── Logs & Monitoring ───────────────────────────────────────────────────────
logs-staging: ## Tail logs from staging worker
	$(WRANGLER) tail --env staging

logs-prod: ## Tail logs from production worker
	$(WRANGLER) tail

# ─── Auth ─────────────────────────────────────────────────────────────────────
cf-login: ## Login to Cloudflare
	$(WRANGLER) login

cf-whoami: ## Check Cloudflare auth status
	$(WRANGLER) whoami

# ─── Environment Check ───────────────────────────────────────────────────────
env-check: ## Verify all env files and services are configured
	@echo "$(CYAN)Checking environment...$(RESET)"
	@echo ""
	@echo "$(YELLOW)Local:$(RESET)"
	@test -f apps/web/.env.local && echo "  $(GREEN)✓$(RESET) apps/web/.env.local" || echo "  $(RED)✗$(RESET) apps/web/.env.local missing"
	@test -f apps/api/.dev.vars && echo "  $(GREEN)✓$(RESET) apps/api/.dev.vars" || echo "  $(RED)✗$(RESET) apps/api/.dev.vars missing"
	@echo ""
	@echo "$(YELLOW)Staging API:$(RESET)"
	@curl -sf https://finverse-api-staging.vinamrasaurav1715.workers.dev/health > /dev/null 2>&1 && \
		echo "  $(GREEN)✓$(RESET) finverse-api-staging is healthy" || \
		echo "  $(RED)✗$(RESET) finverse-api-staging is not responding"
	@echo ""
	@echo "$(YELLOW)Production API:$(RESET)"
	@curl -sf https://finverse-api.vinamrasaurav1715.workers.dev/health > /dev/null 2>&1 && \
		echo "  $(GREEN)✓$(RESET) finverse-api is healthy" || \
		echo "  $(RED)✗$(RESET) finverse-api is not responding"
	@echo ""

# ─── First-Time Setup (run once) ─────────────────────────────────────────────
setup: ## First-time setup (install + login + create resources)
	@echo "$(CYAN)Installing dependencies...$(RESET)"
	@$(BUN) install
	@echo ""
	@echo "$(CYAN)Cloudflare login...$(RESET)"
	@$(WRANGLER) whoami 2>/dev/null || $(WRANGLER) login
	@echo ""
	@echo "$(CYAN)Applying local migrations...$(RESET)"
	@$(WRANGLER) d1 migrations apply fintrack-db --local 2>&1 || true
	@echo ""
	@if [ ! -f apps/web/.env.local ]; then \
		cp .env.example apps/web/.env.local; \
		echo "$(GREEN)Created apps/web/.env.local$(RESET)"; \
	fi
	@if [ ! -f apps/api/.dev.vars ]; then \
		cp apps/api/.dev.vars.example apps/api/.dev.vars; \
		echo "$(GREEN)Created apps/api/.dev.vars$(RESET)"; \
	fi
	@echo ""
	@echo "$(GREEN)Setup complete! Run: make dev$(RESET)"
