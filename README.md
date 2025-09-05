# Golf Weekend Tee Times (Hybrid)

This is a bare-bones hybrid project for a Golf Weekend Tee Times app.

Architecture: The mobile app (Expo React Native) talks directly to Supabase for Auth/CRUD and calls a lightweight FastAPI backend for custom workflows and JWT-verified endpoints.

Project structure:

```
golf-tee-times/
  mobile/      # Expo React Native (TypeScript)
  backend/     # FastAPI (Python) with Supabase JWT verification
  supabase/
    schema.sql # Postgres schema for Supabase
```

## Prerequisites

- Node.js 18+
- pnpm or npm
- Xcode/Android Studio (for running the app)
- Python 3.10+

## Supabase Setup

1. Create a Supabase project.
2. Get your Project URL and anon/public key.
3. In the Supabase SQL editor, run `supabase/schema.sql` contents.

## Mobile (Expo)

Configure environment via `mobile/.env` (create from `.env.example`). Values are also plumbed via `app.config.js`:

```
SUPABASE_URL=your-project-url
SUPABASE_ANON_KEY=your-anon-key
API_URL=http://127.0.0.1:8000
```

Install and run:

```
cd mobile
pnpm install
pnpm expo start
```

Login with email/password (must exist in Supabase Auth). After sign in, you'll land on tabs: Dashboard, Interest, Member, Trades, Guest.

Admin Dashboard has a Demo button which calls backend `/me` with the Supabase JWT and shows the response.

## Backend (FastAPI)

Environment (create `backend/.env` from `.env.example`):

```
SUPABASE_URL=your-project-url
SUPABASE_JWKS_URL=https://<project-ref>.supabase.co/auth/v1/certs
SUPABASE_DB_URL=postgres://user:pass@host:5432/postgres
PORT=8000
```

Install and run:

```
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Routes:

- GET `/health` → `{"status": "ok"}`
- GET `/me` (protected) → returns `user_id` and `email` from JWT
- POST `/assign-weekend/{id}` → returns dummy assignments
- POST `/trades/validate` → returns `{ valid: true }`

## Acceptance (how to verify)

- Sign in with Supabase Auth in the app.
- Screens roughly match the `design/golf_tee_times_app.html` structure (cards, headers, badges, forms, grids).
- Dashboard shows stubbed stats and tee times.
- Interest form inserts a dummy row.
- Demo button calls backend `/me` and displays user info.
