from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, StreamingResponse
from app.services.ilaw_engine import unpack_bow_objective, generate_weekly_ilaw_plan
from app.services.docx_export import export_weekly_plan_docx
from app.models.lesson import UnpackRequest, WeeklyILAWRequest, ILAWWeeklyPlan
import json
import io

router = APIRouter(prefix="/api/lesson", tags=["lesson"])


@router.post("/unpack")
def unpack_objective(req: UnpackRequest):
    try:
        result = unpack_bow_objective(req)
        return JSONResponse(content=result.model_dump())
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned malformed JSON. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-weekly")
async def generate_weekly(request: Request):
    try:
        body = await request.json()
        req = WeeklyILAWRequest(**body)
        plan = generate_weekly_ilaw_plan(req)
        # Serialize manually — zero Pydantic response validation
        return JSONResponse(content={
            "teacher_name": plan.teacher_name,
            "grade_level": plan.grade_level,
            "subject": plan.subject,
            "week_label": plan.week_label,
            "learning_competency": plan.learning_competency,
            "learning_resources": plan.learning_resources,
            "ai_declaration": plan.ai_declaration,
            "integrated_activities": plan.integrated_activities,
            "ways_forward": plan.ways_forward,
            "sessions": [
                {
                    "day": s.day,
                    "title": s.title,
                    "session_type": s.session_type,
                    "objectives": {
                        "cognitive": s.objectives.cognitive,
                        "psychomotor": s.objectives.psychomotor,
                        "affective": s.objectives.affective,
                    },
                    "pre_lesson": s.pre_lesson,
                    "learning_experience": s.learning_experience,
                    "formative_assessment": s.formative_assessment,
                    "integration_opportunities": s.integration_opportunities,
                }
                for s in plan.sessions
            ],
        })
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="AI returned malformed JSON. Try again.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/export-docx")
async def export_docx(request: Request):
    try:
        body = await request.json()

        def s(v):
            if isinstance(v, list):
                return " ".join(str(i) for i in v)
            return str(v) if v is not None else ""

        wf = body.get("ways_forward", {})
        sessions_raw = body.get("sessions", [])

        from app.models.lesson import SessionPlan, SessionObjectives
        sessions = [
            SessionPlan(
                day=sess["day"],
                title=sess["title"],
                session_type=sess["session_type"],
                objectives=SessionObjectives(
                    cognitive=s(sess.get("objectives", {}).get("cognitive")),
                    psychomotor=s(sess.get("objectives", {}).get("psychomotor")),
                    affective=s(sess.get("objectives", {}).get("affective")),
                ),
                pre_lesson=s(sess.get("pre_lesson")),
                learning_experience=s(sess.get("learning_experience")),
                formative_assessment=s(sess.get("formative_assessment")),
                integration_opportunities=s(sess.get("integration_opportunities")),
            )
            for sess in sessions_raw
        ]

        plan = ILAWWeeklyPlan(
            teacher_name=body.get("teacher_name", ""),
            grade_level=body.get("grade_level", ""),
            subject=body.get("subject", ""),
            week_label=body.get("week_label", ""),
            learning_competency=body.get("learning_competency", ""),
            learning_resources=body.get("learning_resources", ""),
            sessions=sessions,
            ways_forward={
                "remediation": s(wf.get("remediation")),
                "enrichment": s(wf.get("enrichment")),
                "teacher_reflection": s(wf.get("teacher_reflection")),
                "extended_learning": s(wf.get("extended_learning")),
            },
            ai_declaration=body.get("ai_declaration", ""),
        )

        buffer = export_weekly_plan_docx(plan)
        import re
        filename = f"ILAW_{plan.subject}_{plan.week_label}.docx"
        filename = re.sub(r"[^\w\-.]", "_", filename)
        return StreamingResponse(
            io.BytesIO(buffer),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
