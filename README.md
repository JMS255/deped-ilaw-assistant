# DepEd ILAW Assistant

AI-powered lesson planning and diagnostic toolkit for Filipino educators.

## Features

- **ILAW Lesson Planner** — Input a BOW objective, auto-split into 4 sessions, generate full classroom-ready ILAW plans
- **Diagnostic Tracker** — Log Reading, Math, and Health (BMI) assessments per student
- **Orientation Week Templates** — 5 pre-written ILAW plans for the first week of school

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS |
| Backend | Python, FastAPI |
| AI | Claude claude-sonnet-4-6 (Anthropic) |
| Database | Supabase (PostgreSQL) |

---

## Setup

### 1. Supabase Database

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase_schema.sql`
3. Copy your **Project URL** and **Service Role Key** from Settings → API

### 2. Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt

# Create .env from example
copy .env.example .env
# Fill in: GROQ_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

uvicorn main:app --reload
```

API runs at `http://localhost:8000`
Interactive docs: `http://localhost:8000/docs`

### 3. Frontend (Next.js)

```bash
cd frontend
npm install

# Create .env.local from example
copy .env.local.example .env.local
# Set: NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
```

App runs at `http://localhost:3000`

---

## Getting Your API Keys

### Groq
1. Go to [console.groq.com](https://console.groq.com)
2. Create a free API key (no credit card needed)
3. Model used: `llama-3.3-70b-versatile`

### Supabase
1. Project Settings → API
2. Copy **Project URL** and **service_role** key (not anon key)

---

## Project Structure

```
deped-ilaw-assistant/
├── backend/
│   ├── app/
│   │   ├── config.py              # Settings from .env
│   │   ├── models/
│   │   │   ├── lesson.py          # Pydantic schemas for lesson planning
│   │   │   └── diagnostic.py      # Pydantic schemas for assessments
│   │   ├── services/
│   │   │   ├── ai_client.py       # Claude API client + system prompt
│   │   │   ├── ilaw_engine.py     # BOW unpacking + ILAW generation logic
│   │   │   └── health_calc.py     # BMI calculation
│   │   └── routers/
│   │       ├── lesson_plan.py     # POST /api/lesson/unpack, /generate-ilaw
│   │       ├── diagnostic.py      # Student + assessment CRUD
│   │       └── orientation.py     # GET /api/orientation/plans
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   └── src/
│       ├── app/
│       │   ├── page.tsx           # Dashboard home
│       │   ├── lesson-planner/    # BOW → Sessions → ILAW plan
│       │   ├── diagnostic/        # Student assessments + BMI
│       │   └── orientation/       # Week 1 templates
│       └── lib/
│           └── api.ts             # Typed API client
└── supabase_schema.sql
```