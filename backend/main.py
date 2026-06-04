from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.config import get_settings
from app.routers import lesson_plan, diagnostic, orientation, bow
from app.services.bow_parser import parse_and_save
from pathlib import Path


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-initialize BOW data on startup if not already parsed
    parsed_dir = Path(__file__).parent / "bow_parsed"
    if not any(parsed_dir.glob("*.json")):
        DEFAULT_BOWS = [
            ("[G5] Araling Panlipunan  (1) (1).pdf", "Araling Panlipunan", "Grade 5", "ap"),
            ("[G5] GMRC (1).pdf", "GMRC", "Grade 5", "gmrc"),
            ("[G5] Mathematics.pdf", "Mathematics", "Grade 5", "ap"),
            ("[G5] Science.pdf", "Science", "Grade 5", "ap"),
            ("[G5] English.pdf", "English", "Grade 5", "english"),
            ("[G5] Filipino.pdf", "Filipino", "Grade 5", "filipino"),
            ("[G5] MAPEH.pdf", "MAPEH", "Grade 5", "mapeh"),
            ("[G5] EPP_ AFA _ FCS _ IA (1).pdf", "EPP", "Grade 5", "ap"),
        ]
        for filename, subject, grade, fmt in DEFAULT_BOWS:
            try:
                parse_and_save(filename, subject, grade, fmt)
            except Exception:
                pass
    yield

app = FastAPI(
    title="DepEd ILAW Assistant API",
    description="AI-powered lesson planning and diagnostic toolkit for Filipino educators.",
    version="1.0.0",
    lifespan=lifespan,
)

settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(lesson_plan.router)
app.include_router(diagnostic.router)
app.include_router(orientation.router)
app.include_router(bow.router)


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "DepEd ILAW Assistant API"}