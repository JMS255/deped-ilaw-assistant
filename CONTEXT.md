# DepEd ILAW Assistant — Project Context

## What This Is
An AI-powered lesson planning and diagnostic toolkit for Filipino public school teachers implementing the DepEd ILAW framework and the new 3-term school calendar (SY 2026-2027).

## Stack
| Layer | Tech |
|---|---|
| Frontend | Next.js 16, TypeScript, Tailwind CSS — `frontend/` |
| Backend | Python 3.12, FastAPI — `backend/` |
| AI | Groq API (`llama-3.3-70b-versatile`) |
| Database | Supabase (PostgreSQL) |
| Export | python-docx (DOCX), pdfplumber (PDF parsing) |

## How to Run
**Backend** — double-click `start-ilaw-backend.bat` on Desktop, or:
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload
```
Runs at: http://localhost:8000
API docs: http://localhost:8000/docs

**Frontend** — double-click `start-ilaw-frontend.bat` on Desktop, or:
```bash
cd frontend
npm run dev
```
Runs at: http://localhost:3000

**Initialize BOW data** (run once after backend starts):
```powershell
Invoke-WebRequest -Uri http://localhost:8000/api/bow/init -Method POST
```

## Environment Variables
**backend/.env**
```
GROQ_API_KEY=gsk_...          # Groq API key
SUPABASE_URL=https://...      # Supabase project URL
SUPABASE_SERVICE_KEY=eyJ...   # Supabase service role key
FRONTEND_URL=http://localhost:3000
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Key Files
```
backend/
├── main.py                          # FastAPI app entry point
├── bow_documents/                   # BOW PDF source files (8 subjects)
├── bow_parsed/                      # Parsed BOW JSON files (auto-generated)
├── app/
│   ├── config.py                    # Settings from .env
│   ├── models/
│   │   ├── lesson.py                # ILAW plan models (ILAWWeeklyPlan, WaysForward, etc.)
│   │   └── diagnostic.py            # Student/health models
│   ├── services/
│   │   ├── ai_client.py             # Groq client + ANTI_VAGUE_INSTRUCTION system prompt
│   │   ├── ilaw_engine.py           # Core AI logic: unpack BOW → 4 sessions → weekly plan
│   │   ├── bow_parser.py            # PDF parsers for all 8 BOW formats
│   │   ├── docx_export.py           # DOCX export matching official DLL template
│   │   └── health_calc.py           # BMI calculator
│   └── routers/
│       ├── lesson_plan.py           # POST /api/lesson/unpack, /generate-weekly, /export-docx
│       ├── bow.py                   # GET /api/bow/subjects, /weeks, POST /upload, /init
│       ├── diagnostic.py            # Student CRUD + reading/math/health endpoints
│       └── orientation.py           # GET /api/orientation/plans (5 pre-written Week 1 plans)

frontend/
└── src/
    ├── app/
    │   ├── page.tsx                 # Dashboard home
    │   ├── lesson-planner/          # Main feature: BOW → sessions → weekly ILAW plan
    │   ├── diagnostic/              # Student assessments + BMI calculator
    │   ├── orientation/             # Orientation Week templates (Week 1)
    │   └── bow-upload/              # Upload new BOW PDFs for any subject
    └── lib/
        └── api.ts                   # Typed API client for all endpoints
```

## BOW Subjects Loaded
All Grade 5, parsed from PDFs in `bow_documents/`:
| Subject | Format | Status |
|---|---|---|
| Araling Panlipunan | ap | ✓ |
| GMRC | gmrc | ✓ |
| Mathematics | ap | ✓ |
| Science | ap | ✓ |
| English | english | ✓ |
| Filipino | filipino | ✓ |
| MAPEH | mapeh | ✓ |
| EPP | ap | ✓ |

## Core Features
1. **BOW Unpacking** — Select Subject → Week → competency auto-fills from PDF → AI splits into 4 sessions
2. **Weekly ILAW Generator** — Generates all 4 sessions at once with:
   - Objectives per session (Cognitive / Psychomotor / Affective domains)
   - Pre-lesson (pampagana)
   - Learning Experience with CLASS-PICS principles (time-boxed, named activities)
   - Formative Assessment (embedded, not end-of-lesson)
   - Ways Forward: Remediation + Enrichment + Extended Learning + Teacher Reflection
   - AI Declaration (DO 3, s. 2026)
3. **DOCX Export** — Downloads a formatted .docx matching the official First Trimester Daily Lesson Log
4. **Diagnostic Tracker** — Log student Reading level, Math level, Height/Weight/BMI
5. **Orientation Week Templates** — 5 pre-written ILAW plans for Week 1 (Values, SEL, Anti-Bullying, etc.)
6. **BOW Upload** — Upload any new BOW PDF to add more subjects/grades

## ILAW Framework (DO 09, s. 2026)
- **I** — Intentions: Objectives per domain (Cognitive, Psychomotor, Affective)
- **L** — Learning Experience: Step-by-step procedures using CLASS-PICS
- **A** — Assessment: Formative, embedded during instruction (ESRU cycle)
- **W** — Ways Forward: Remediation + Enrichment + Extended Learning + Teacher Reflection

## Known Issues / Watch Out For
- Groq `llama-3.3-70b-versatile` sometimes returns list values instead of strings — handled by `_to_str()` coercion in `models/lesson.py` model validators
- Groq free tier token limit is ~6000/request — weekly plan generation uses 2 API calls (sessions + ways_forward separately)
- English and Filipino BOW PDFs have no week numbers — competencies are listed by term and numbered sequentially
- MAPEH BOW uses `*` for week (whole-term competencies)
- Python 3.14 is incompatible — must use Python 3.12

## Supabase Tables
Run `supabase_schema.sql` in Supabase SQL Editor to create:
- `students` — full_name, grade_level, section, school_year
- `reading_levels` — student_id, level, notes, assessed_date
- `math_levels` — student_id, level, notes, assessed_date
- `health_records` — student_id, height_cm, weight_kg, bmi, bmi_category, assessed_date

## What's Next (Planned)
- [ ] Fix: error on generate when Groq returns malformed JSON (add retry logic)
- [ ] Add more grade levels (currently Grade 5 only)
- [ ] Print-friendly view for lesson plans
- [ ] Class roster management in Diagnostic Tracker
- [ ] Offline/PWA support for classroom use