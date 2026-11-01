# DumrooAI — In-App Feedback & Support System

A production-grade, end-to-end **In-App Feedback, Support & Issue Reporting System** built with React + Vite (frontend) and Express + Mongoose (backend).

> **Full architecture, data models, API contract, and setup guide** → [`docs/feedback-system.md`](docs/feedback-system.md)

---

## Features

- 🪲 Floating feedback widget on every authenticated page
- 📸 One-click page screenshot + multi-file attachment upload (Supabase Storage)
- 🗂 Five categories: Bug, UI/UX, Feature Request, General, Other — each with its own accent color and icon
- 🔒 Private storage bucket with short-lived signed download URLs
- 📬 Automatic Microsoft Teams Adaptive Card notifications (via Power Automate webhook)
- 📥 Transactional outbox pattern — Teams failure never loses a saved report
- 🔁 Exponential-backoff retry worker (immediate → 30 s → 2 m → 10 m → 30 m)
- 🔑 Idempotency keys prevent duplicate submissions
- 📋 User's "My Reports" page with pagination and status filters
- 🛡 Rate limiting, MIME/size/extension checks, JWT auth on every endpoint
- ✨ Premium SaaS-style UI with gradient accents, micro-interactions, dark-mode support

---

## Quick Start

### Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 LTS |
| npm | 9+ |
| MongoDB Atlas | M0+ (replica-set required for transactions) |

Docker is **not** required for development (tests use `mongodb-memory-server`).

---

### 1 — Clone & install

```bash
git clone https://github.com/keshavagr273/DumrooAI-Assignment.git
cd DumrooAI-Assignment

# Backend
cd backend && npm install

# Frontend
cd ../frontend && npm install
```

---

### 2 — Configure environment

```bash
# Backend
cp backend/.env.example backend/.env
# Fill in MONGODB_URI, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
#              SUPABASE_BUCKET_NAME, TEAMS_FEEDBACK_WEBHOOK_URL, JWT_SECRET

# Frontend
cp frontend/.env.example frontend/.env
# Fill in VITE_API_BASE_URL (default: http://localhost:5000/api)
```

> ⚠️ **MongoDB Atlas**: whitelist your machine's IP in **Network Access → Add IP Address**.
> Your current IP can be found at https://ifconfig.me.

Required environment variables — see [`.env.example`](.env.example) for the complete list:

| Variable | Where | Description |
|---|---|---|
| `MONGODB_URI` | backend | Atlas connection string |
| `JWT_SECRET` | backend | ≥ 32-char random secret |
| `SUPABASE_URL` | backend | Project URL from Supabase dashboard |
| `SUPABASE_SERVICE_ROLE_KEY` | backend | Service-role key (never expose to frontend) |
| `SUPABASE_BUCKET_NAME` | backend | `feedback-attachments` (private bucket) |
| `TEAMS_FEEDBACK_WEBHOOK_URL` | backend | Power Automate HTTP-trigger URL |
| `VITE_API_BASE_URL` | frontend | Backend API base URL |

---

### 3 — Run

```bash
# Terminal 1 — backend (http://localhost:5000)
cd backend && npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd frontend && npm run dev
```

---

### 4 — Demo credentials

Seed the database on first run (backend must be running):

```bash
curl -X POST http://localhost:5000/api/auth/seed
```

| Role | Email | Password |
|---|---|---|
| User | user@acme.com | Password123! |
| Admin | admin@acme.com | Admin123! |

---

## Tests

```bash
# Backend — 25 tests (Jest + mongodb-memory-server)
cd backend && npm test

# Frontend — 11 tests (Vitest + React Testing Library)
cd frontend && npm test
```

Tests run fully **offline** — no Atlas connection required. The backend test helper
(`src/tests/testDb.js`) tries Atlas first (3-second timeout) and falls back to an
in-process replica set automatically.

---

## Project Structure

```
.
├── backend/
│   ├── src/
│   │   ├── config/          # env validation, app config
│   │   ├── db/              # Mongoose connection
│   │   ├── middleware/       # auth, rate-limit, idempotency, admin-guard, error handler
│   │   ├── modules/
│   │   │   ├── auth/        # register, login, seed
│   │   │   ├── feedback/    # routes, controller, service, repository, model, validation
│   │   │   ├── notifications/  # outbox model/service, Teams card builder, retry worker
│   │   │   └── storage/     # StorageService abstraction, Supabase provider
│   │   └── tests/           # unit + integration (Jest)
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/      # AuthenticatedLayout, Navbar
│   │   ├── features/feedback/
│   │   │   ├── components/  # FeedbackWidget, FeedbackModal, CategorySelector, …
│   │   │   ├── hooks/       # useFeedback, useScreenshotCapture, useFeedbackUpload
│   │   │   ├── services/    # feedbackApi.js
│   │   │   ├── styles/      # feedback.tokens.css, feedback.module.css
│   │   │   └── utils/       # collectContext, compressImage, constants
│   │   ├── hooks/           # useAuth
│   │   ├── pages/           # LoginPage, DashboardPage, ReportsPage
│   │   └── services/        # api.js (Axios instance)
│   ├── .env.example
│   └── package.json
└── docs/
    └── feedback-system.md   # Full architecture & setup guide
```

---

## API Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register user |
| POST | `/api/auth/login` | — | Login, returns JWT |
| POST | `/api/auth/seed` | — | Seed demo users (dev only) |
| POST | `/api/feedback/upload-url` | JWT | Get signed upload URL |
| POST | `/api/feedback` | JWT | Submit feedback report |
| GET | `/api/feedback/my-reports` | JWT | Paginated user reports |
| GET | `/api/feedback/:id` | JWT | Single report + signed attachment URLs |
| PATCH | `/api/feedback/:id/status` | JWT + admin | Update report status |
| POST | `/api/feedback/notifications/:id/retry` | JWT + admin | Re-queue failed notification |

---

## License

MIT
