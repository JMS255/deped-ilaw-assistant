from fastapi import APIRouter, HTTPException
from app.models.diagnostic import (
    StudentCreate,
    StudentResponse,
    ReadingLevel,
    MathLevel,
    HealthRecord,
    HealthRecordResponse,
)
from app.services.health_calc import compute_bmi
from app.config import get_settings
from supabase import create_client
import uuid

router = APIRouter(prefix="/api/diagnostic", tags=["diagnostic"])


def get_db():
    s = get_settings()
    return create_client(s.supabase_url, s.supabase_service_key)


@router.post("/students", response_model=StudentResponse)
def create_student(student: StudentCreate):
    db = get_db()
    payload = {**student.model_dump(), "id": str(uuid.uuid4())}
    result = db.table("students").insert(payload).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create student record.")
    return result.data[0]


@router.get("/students", response_model=list[StudentResponse])
def list_students(grade_level: str | None = None, section: str | None = None):
    db = get_db()
    query = db.table("students").select("*")
    if grade_level:
        query = query.eq("grade_level", grade_level)
    if section:
        query = query.eq("section", section)
    result = query.execute()
    return result.data


@router.post("/reading")
def log_reading_level(record: ReadingLevel):
    db = get_db()
    payload = record.model_dump()
    payload["assessed_date"] = str(payload["assessed_date"])
    result = db.table("reading_levels").upsert(payload, on_conflict="student_id").execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log reading level.")
    return result.data[0]


@router.post("/math")
def log_math_level(record: MathLevel):
    db = get_db()
    payload = record.model_dump()
    payload["assessed_date"] = str(payload["assessed_date"])
    result = db.table("math_levels").upsert(payload, on_conflict="student_id").execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log math level.")
    return result.data[0]


@router.post("/health", response_model=HealthRecordResponse)
def log_health(record: HealthRecord):
    computed = compute_bmi(record)
    db = get_db()
    payload = computed.model_dump()
    payload["assessed_date"] = str(payload["assessed_date"])
    result = db.table("health_records").upsert(payload, on_conflict="student_id").execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to log health record.")
    return result.data[0]


@router.get("/students/{student_id}/summary")
def get_student_summary(student_id: str):
    db = get_db()
    student = db.table("students").select("*").eq("id", student_id).single().execute()
    reading = db.table("reading_levels").select("*").eq("student_id", student_id).maybe_single().execute()
    math = db.table("math_levels").select("*").eq("student_id", student_id).maybe_single().execute()
    health = db.table("health_records").select("*").eq("student_id", student_id).maybe_single().execute()

    return {
        "student": student.data,
        "reading": reading.data,
        "math": math.data,
        "health": health.data,
    }