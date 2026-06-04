import shutil
from pathlib import Path
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.services.bow_parser import (
    parse_and_save,
    load_bow,
    list_available_subjects,
    BOW_DIR,
)

router = APIRouter(prefix="/api/bow", tags=["bow"])

ORIENTATION_WEEK = {
    "week": "0",
    "term": "Orientation",
    "label": "Orientation Week (Week 1 of School Year)",
    "competency": "ORIENTATION_WEEK",
}


@router.get("/subjects")
def get_subjects():
    return list_available_subjects()


@router.get("/weeks")
def get_weeks(subject_key: str, grade: str):
    data = load_bow(subject_key, grade)
    if not data:
        raise HTTPException(
            status_code=404,
            detail=f"No BOW data found for {subject_key} {grade}. Upload the PDF first.",
        )

    weeks = [ORIENTATION_WEEK] + list(data["weeks"].values())
    return {"subject_key": subject_key, "grade": grade, "weeks": weeks}


@router.get("/competency")
def get_competency(subject_key: str, grade: str, week_key: str):
    if week_key == "ORIENTATION":
        return ORIENTATION_WEEK

    data = load_bow(subject_key, grade)
    if not data:
        raise HTTPException(status_code=404, detail="BOW data not found.")

    entry = data["weeks"].get(week_key)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Week '{week_key}' not found.")

    return entry


@router.post("/upload")
async def upload_bow_pdf(
    file: UploadFile = File(...),
    subject_key: str = Form(...),
    grade: str = Form(...),
    format_type: str = Form("ap"),
):
    """Upload a new BOW PDF. format_type: 'ap' for standard AP format, 'gmrc' for GMRC format."""
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are accepted.")

    BOW_DIR.mkdir(exist_ok=True)
    save_path = BOW_DIR / file.filename
    with open(save_path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = parse_and_save(file.filename, subject_key, grade, format_type)
        return {
            "message": "PDF uploaded and parsed successfully.",
            "subject_key": subject_key,
            "grade": grade,
            "weeks_parsed": len(result["weeks"]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")


@router.post("/init")
def init_default_bows():
    """Parse all default BOW PDFs that ship with the app."""
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

    results = []
    for filename, subject, grade, fmt in DEFAULT_BOWS:
        try:
            data = parse_and_save(filename, subject, grade, fmt)
            results.append({"subject": f"{subject} {grade}", "weeks": len(data["weeks"])})
        except Exception as e:
            results.append({"subject": f"{subject} {grade}", "error": str(e)})

    return {"parsed": results}
