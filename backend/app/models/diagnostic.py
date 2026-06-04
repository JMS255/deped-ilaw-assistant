from pydantic import BaseModel, Field
from typing import Literal
from datetime import date


class StudentCreate(BaseModel):
    full_name: str
    grade_level: str
    section: str
    school_year: str = Field(..., description="e.g. 2025-2026")


class StudentResponse(StudentCreate):
    id: str


class ReadingLevel(BaseModel):
    student_id: str
    level: Literal["Non-Reader", "Frustration", "Instructional", "Independent"]
    notes: str = ""
    assessed_date: date = Field(default_factory=date.today)


class MathLevel(BaseModel):
    student_id: str
    level: Literal["Below Basic", "Basic", "Proficient", "Advanced"]
    notes: str = ""
    assessed_date: date = Field(default_factory=date.today)


class HealthRecord(BaseModel):
    student_id: str
    height_cm: float = Field(..., gt=0, le=250)
    weight_kg: float = Field(..., gt=0, le=200)
    assessed_date: date = Field(default_factory=date.today)


class HealthRecordResponse(HealthRecord):
    bmi: float
    bmi_category: Literal["Underweight", "Normal", "Overweight", "Obese"]