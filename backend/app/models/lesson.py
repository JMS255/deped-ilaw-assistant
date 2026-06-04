from pydantic import BaseModel, Field
from typing import Literal


class UnpackRequest(BaseModel):
    bow_objective: str = Field(..., min_length=5)
    grade_level: str
    subject: str
    integrated_subjects: list[Literal["Math", "Science", "ICT", "GMRC"]] = Field(default_factory=list)


class SessionSummary(BaseModel):
    day: int
    title: str
    focus: str
    session_type: Literal["Motivation & Introduction", "Deep Learning", "Deep Learning 2", "Evaluation & Wrap-up"]


class UnpackResponse(BaseModel):
    bow_objective: str
    grade_level: str
    subject: str
    sessions: list[SessionSummary]


class SessionObjectives(BaseModel):
    cognitive: str = ""
    psychomotor: str = ""
    affective: str = ""


class SessionPlan(BaseModel):
    day: int
    title: str
    session_type: str
    objectives: SessionObjectives
    pre_lesson: str = ""
    learning_experience: str = ""
    formative_assessment: str = ""
    integration_opportunities: str = ""


class ILAWWeeklyPlan(BaseModel):
    """Full weekly ILAW plan covering all 4 sessions — the official unit of planning."""
    teacher_name: str = ""
    grade_level: str
    subject: str
    week_label: str
    learning_competency: str
    learning_resources: str = ""
    sessions: list[SessionPlan]
    ways_forward: dict = Field(default_factory=dict)
    ai_declaration: str = "This lesson plan was generated with AI assistance via the DepEd ILAW Assistant. The teacher reviewed and adapted all content to fit their class context. See DO 3, s. 2026 Annex A."
    integrated_activities: dict = Field(default_factory=dict)


# Legacy single-session model kept for backwards compat
class ILAWRequest(BaseModel):
    bow_objective: str
    session: SessionSummary
    grade_level: str
    subject: str
    integrated_subjects: list[Literal["Math", "Science", "ICT", "GMRC"]] = Field(default_factory=list)


class WeeklyILAWRequest(BaseModel):
    bow_objective: str
    week_label: str
    grade_level: str
    subject: str
    integrated_subjects: list[Literal["Math", "Science", "ICT", "GMRC"]] = Field(default_factory=list)
    sessions: list[SessionSummary]
