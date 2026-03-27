# FinVerse

Smart personal finance tracking with AI-powered item normalization, drill-down analytics, and bill scanning.

**Live:** [vinfin.vercel.app](https://vinfin.vercel.app)

---

## What It Does

- **Log expenses** with items, categories, subcategories, quantities, and units
- **Smart normalization** — type "aloo" and the system knows you mean "Potato" (338 canonical items, 1,287 aliases seeded)
- **Drill-down analytics** — Category > Subcategory > Item level, with period toggles (Today/Week/Month/Year)
- **Item-level tracking** — search any item to see total spend, units consumed, average price over time
- **Bill scanning** — upload a receipt photo, Gemini AI extracts items and populates the form
- **Budget tracking** — set monthly limits per category, see progress with color-coded bars
- **AI chat** — ask questions about your spending in natural language
- **Export** — download filtered data as CSV, Excel, or PDF
- **PWA** — installable on phone as a native-like app

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15 (App Router), Tailwind CSS, DaisyUI |
| **Backend** | Hono.js on Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite), Drizzle ORM |
| **Vector Search** | Cloudflare Vectorize (for semantic item matching in production) |
| **AI** | Google Gemini (bill scanning, chat), Cloudflare Workers AI (insights) |
| **Auth** | Clerk |
| **Monorepo** | Turborepo, Bun |
| **CI/CD** | GitHub Actions, Vercel, Cloudflare |

---

## Architecture

```
fintrack/
├── apps/
│   ├── api/          # Hono.js API on Cloudflare Workers
│   │   ├── src/
│   │   │   ├── routes/        # expenses, categories, search, insights, budgets, incomes
│   │   │   ├── services/      # business logic (expense, normalization, budget, etc.)
│   │   │   ├── middleware/    # auth (Clerk JWT), logger, error handler
│   │   │   └── db/migrations/ # D1 SQL migrations + seed data
│   │   └── wrangler.toml     # CF Workers config (staging + prod)
│   │
│   └── web/          # Next.js frontend
│       └── src/
│           ├── app/           # pages (dashboard, expenses, entries, budgets, etc.)
│           ├── components/    # dashboard cards, charts, nav, dialogs
│           ├── hooks/         # TanStack Query hooks for all API calls
│           └── lib/           # API client, export utils, helpers
│
└── packages/
    └── shared/       # Drizzle schema, Zod validators, types, constants
```

### Normalization Pipeline

```
User types "aloo"
     │
     ▼
Alias lookup (D1) ──→ Found: "aloo" → Potato ✓ (instant, no AI)
     │
     ▼ (miss)
Vector search (Vectorize) ──→ Score ≥ 0.85: auto-match
     │                        Score 0.60-0.84: suggest
     │                        Score < 0.60: create new
     ▼
New canonical item created + alias cached for next time
```

338 items seeded across 10 categories with 1,287 Hindi/English aliases (aloo, pyaz, tamatar, doodh, sarson ka tel, etc.)

---

## Database Schema

14 tables: `users`, `expenses`, `expense_items`, `categories`, `subcategories`, `canonical_items`, `aliases`, `budgets`, `tags`, `expense_tags`, `incomes`, `expense_participants`, `logs`, `d1_migrations`

Key relationships:
- `expense_items` → `expenses` (cascade delete)
- `expense_items` → `canonical_items` (normalization link)
- `expense_items` → `categories` + `subcategories`
- `aliases` → `canonical_items` (many-to-one)
- `budgets` → `categories` (per-category budget)

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/api/expenses` | Create expense with items |
| GET | `/api/expenses` | List with filters + pagination |
| GET | `/api/expenses/:id` | Single expense with items |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/summary` | Aggregated by period/category |
| GET | `/api/categories` | List categories + subcategories |
| POST | `/api/categories` | Create custom category |
| DELETE | `/api/categories/:id` | Delete (with cascade option) |
| POST | `/api/categories/:id/subcategories` | Add subcategory |
| GET | `/api/search/suggest` | Autocomplete items |
| GET | `/api/insights/summary` | Monthly comparison |
| GET | `/api/insights/trends` | Multi-month trends |
| GET | `/api/insights/drilldown` | Category/subcategory/item analytics |
| GET | `/api/insights/item-stats` | Per-item spending history |
| POST | `/api/insights/ask` | AI-powered Q&A |
| GET | `/api/budgets` | List budgets |
| POST | `/api/budgets` | Create budget |
| GET | `/api/budgets/progress` | Budget vs actual spending |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (package manager + runtime)
- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free)
- [Clerk account](https://dashboard.clerk.com) (free)
- [Google AI API key](https://aistudio.google.com/apikey) (free)

### Setup

```bash
git clone https://github.com/VinamraSaurav/fintrack.git
cd fintrack
make setup
```

This installs dependencies, logs into Cloudflare, creates D1 databases + Vectorize indexes, generates env files, and applies migrations.

### Configure

Fill in your API keys:

```bash
# Frontend env
apps/web/.env.local

# Backend env (Cloudflare Workers local)
apps/api/.dev.vars
```

### Run

```bash
make dev
```

Opens:
- Frontend: http://localhost:3000
- API: http://localhost:8787

---

## Deployment


### Deploy Manually

```bash
make deploy-staging    # API + migrations + Vercel preview
make deploy-prod       # API + migrations + Vercel production
```

### CI/CD (GitHub Actions)

| Workflow | Trigger | Action |
|----------|---------|--------|
| **CI** | PR / push to main | Typecheck |
| **Deploy Staging** | Push to main | Deploy API to CF staging + D1 migrations |
| **Deploy Production** | GitHub Release / manual dispatch | Deploy API to CF prod + D1 migrations |

Frontend auto-deploys via Vercel Git integration.

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `CLOUDFLARE_API_TOKEN` | CF API token with Workers + D1 edit permissions |
| `CLERK_SECRET_KEY` | Clerk backend secret |
| `CLERK_PUBLISHABLE_KEY` | Clerk frontend key |
| `RESEND_API_KEY` | Resend email API key |

---

## Makefile Commands

```bash
make help              # Show all commands
make dev               # Start dev servers
make build             # Build all packages
make deploy-staging    # Deploy to staging
make deploy-prod       # Deploy to production
make db-migrate        # Apply migrations locally
make db-migrate-staging
make db-migrate-prod
make env-check         # Health check all environments
make logs-staging      # Tail staging worker logs
make logs-prod         # Tail production worker logs
```

---

## Key Features Detail

### Bill Scanning
Upload a receipt photo → Gemini 2.0 Flash extracts items with structured output (name, qty, unit, amount, category) → auto-populates the expense form. Supports multi-bill uploads (items append).

### Drill-Down Analytics
Overview page has a 3-level drill-down: **All Categories** → click a category → **Subcategories** → click one → **Individual Items**. Each level shows a pie chart (distribution), bar/line chart (time series), and a clickable table. Period toggle switches between Today/This Week/This Month/This Year.

### Smart Normalization
Local dev uses alias-based lookup (instant, no AI cost). Production adds Vectorize for semantic matching — new inputs that aren't in the alias table get matched via vector similarity, then cached as aliases for future instant lookups.

---

## License

MIT
