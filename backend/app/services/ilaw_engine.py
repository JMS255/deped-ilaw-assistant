import json
import re
from app.services.ai_client import generate, ANTI_VAGUE_INSTRUCTION
from app.models.lesson import (
    UnpackRequest,
    UnpackResponse,
    SessionSummary,
    WeeklyILAWRequest,
    ILAWWeeklyPlan,
    SessionPlan,
    SessionObjectives,
)


def _extract_json(raw: str) -> str:
    raw = raw.strip()
    match = re.search(r"```(?:json)?\s*([\s\S]+?)\s*```", raw)
    if match:
        return match.group(1).strip()
    return raw


INTEGRATION_GUIDES = {
    "Math": "Insert a Math integration: timelines, data tables, counting, measurement, or simple computation tied directly to the lesson content.",
    "Science": "Insert a Science integration: connect lesson concepts to natural phenomena, observation, or the scientific method.",
    "ICT": "Insert an ICT integration: students use a specific app, create a PowerPoint slide, watch a curated video, or use Google Maps/Wikipedia.",
    "GMRC": "Insert a GMRC/Values integration: draw a values lesson from the topic (e.g., bayanihan, katapatan) — students write or discuss it.",
}

CLASS_PICS = """
LEARNING DESIGN PRINCIPLES (CLASS-PICS) — embed ALL of these in the Learning Experience:
- Clear Goals: Make the objective explicit to students at the start of each session.
- Scaffolding (I Do → We Do → You Do): Teacher models first, then guided practice, then independent work.
- Active Retrieval: Include at least one activity that makes students recall prior knowledge.
- Social Learning: Include at least one pair or group activity per session.
- Self-awareness/Metacognition: End each session with students reflecting on what they learned.
- Purposeful Integration: Connect the lesson to real life or Filipino values naturally.
- Inclusion: Every activity must be doable by all learners regardless of ability.
- Checks for Understanding: Include informal formative checks throughout (not just at the end).
"""


def unpack_bow_objective(req: UnpackRequest) -> UnpackResponse:
    prompt = f"""
You are an expert DepEd curriculum specialist implementing the ILAW framework for Filipino teachers.

BOW Learning Competency: "{req.bow_objective}"
Subject: {req.subject}
Grade Level: {req.grade_level}

Split this competency into EXACTLY 4 distinct daily sessions for one teaching week.

Session structure:
- Day 1: Motivation & Introduction — Hook students, activate prior knowledge, introduce the big idea
- Day 2: Deep Learning — First major concept-building experience
- Day 3: Deep Learning 2 — Application or analysis (DIFFERENT activity type from Day 2)
- Day 4: Evaluation & Wrap-up — Summative check and synthesis

Rules:
- Each session must fit in 60 minutes
- Sessions must NOT repeat the same activity type
- Session titles must be specific and engaging (not generic like "Introduction to Topic")
- Focus must describe what students will DO

Return ONLY valid JSON (no markdown fences):
{{
  "sessions": [
    {{"day": 1, "title": "...", "focus": "...", "session_type": "Motivation & Introduction"}},
    {{"day": 2, "title": "...", "focus": "...", "session_type": "Deep Learning"}},
    {{"day": 3, "title": "...", "focus": "...", "session_type": "Deep Learning 2"}},
    {{"day": 4, "title": "...", "focus": "...", "session_type": "Evaluation & Wrap-up"}}
  ]
}}
"""

    raw = _extract_json(generate(prompt))
    data = json.loads(raw)
    sessions = [SessionSummary(**s) for s in data["sessions"]]
    return UnpackResponse(
        bow_objective=req.bow_objective,
        grade_level=req.grade_level,
        subject=req.subject,
        sessions=sessions,
    )


def generate_weekly_ilaw_plan(req: WeeklyILAWRequest) -> ILAWWeeklyPlan:
    integration_instructions = ""
    if req.integrated_subjects:
        parts = [INTEGRATION_GUIDES[s] for s in req.integrated_subjects]
        integration_instructions = "\n\nSUBJECT INTEGRATION (embed into the relevant sessions):\n" + "\n".join(parts)

    sessions_desc = "\n".join(
        f"  Day {s.day} ({s.session_type}): {s.title} — {s.focus}"
        for s in req.sessions
    )

    # ── Call 1: Generate all 4 sessions ──────────────────────────────────────
    sessions_prompt = f"""
You are a DepEd ILAW lesson plan writer for Filipino teachers.

Subject: {req.subject} | Grade: {req.grade_level} | Week: {req.week_label}
Competency: {req.bow_objective}
{integration_instructions}

{CLASS_PICS}

Generate all 4 sessions below. Each session fits in 60 minutes.
{sessions_desc}

For EACH session return:
- objectives: cognitive (natutukoy/naipaliliwanag), psychomotor (naisasagawa), affective (napapahalagahan)
- pre_lesson: named 5-min warm-up
- learning_experience: step-by-step with time-boxes (Minutes X-Y:...), named activities (skit/puzzle/game), teacher dialogue cues
- formative_assessment: specific check with actual questions or criteria
- integration_opportunities: any subject integration used

Return ONLY JSON (no markdown):
{{"learning_resources":"...","sessions":[{{"day":1,"title":"...","session_type":"Motivation & Introduction","objectives":{{"cognitive":"...","psychomotor":"...","affective":"..."}},"pre_lesson":"...","learning_experience":"...","formative_assessment":"...","integration_opportunities":"..."}},{{"day":2,...}},{{"day":3,...}},{{"day":4,...}}]}}
"""

    sessions_data = json.loads(_extract_json(generate(sessions_prompt)))

    # ── Call 2: Generate Ways Forward ─────────────────────────────────────────
    wf_prompt = f"""
You are a DepEd ILAW lesson plan writer.

Subject: {req.subject} | Grade: {req.grade_level}
Competency: {req.bow_objective}

Generate the Ways Forward section for this weekly plan.

Return ONLY JSON (no markdown):
{{
  "ways_forward": {{
    "remediation": "Specific 3-step activity for students who did not meet objectives. Name the activity.",
    "enrichment": "Specific challenge for advanced students. Name it and describe it.",
    "teacher_reflection": "Write ONE paragraph (not a list, not bullet points, not an array) with 3 reflection questions joined together as a single string.",
    "extended_learning": "A take-home activity or family engagement suggestion."
  }},
  "integrated_activities": {{}}
}}
"""

    wf_data = json.loads(_extract_json(generate(wf_prompt)))

    # Merge both responses
    data = {**sessions_data, **wf_data}

    def to_str(v) -> str:
        """Convert ANYTHING the AI returns into a plain Python string."""
        if v is None:
            return ""
        if isinstance(v, list):
            return " ".join(str(i) for i in v)
        return str(v)

    # Build sessions — every field explicitly converted to str before hitting Pydantic
    sessions = []
    for s_data, s_req in zip(data.get("sessions", []), req.sessions):
        obj = s_data.get("objectives", {})
        sessions.append(SessionPlan(
            day=s_req.day,
            title=s_req.title,
            session_type=s_req.session_type,
            objectives=SessionObjectives(
                cognitive=to_str(obj.get("cognitive")),
                psychomotor=to_str(obj.get("psychomotor")),
                affective=to_str(obj.get("affective")),
            ),
            pre_lesson=to_str(s_data.get("pre_lesson")),
            learning_experience=to_str(s_data.get("learning_experience")),
            formative_assessment=to_str(s_data.get("formative_assessment")),
            integration_opportunities=to_str(s_data.get("integration_opportunities")),
        ))

    # ways_forward is a plain dict — no Pydantic model, no validation issues
    wf = data.get("ways_forward", {})
    ways_forward = {
        "remediation": to_str(wf.get("remediation")),
        "enrichment": to_str(wf.get("enrichment")),
        "teacher_reflection": to_str(wf.get("teacher_reflection")),
        "extended_learning": to_str(wf.get("extended_learning")),
    }

    return ILAWWeeklyPlan(
        grade_level=req.grade_level,
        subject=req.subject,
        week_label=req.week_label,
        learning_competency=req.bow_objective,
        learning_resources=to_str(data.get("learning_resources")),
        sessions=sessions,
        ways_forward=ways_forward,
        integrated_activities=data.get("integrated_activities", {}),
    )
