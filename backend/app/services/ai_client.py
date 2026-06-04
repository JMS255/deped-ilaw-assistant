from google import genai
from google.genai import types
from functools import lru_cache
from app.config import get_settings

MODEL = "gemini-2.5-flash-lite"

ANTI_VAGUE_INSTRUCTION = """
CRITICAL OUTPUT RULES — violating any of these will make the output unusable:
1. NEVER write bullet-point outlines. Write full, step-by-step classroom procedures.
2. ALWAYS time-box each activity (e.g., "Minutes 1–5: Teacher distributes cut-out maps...").
3. ALWAYS name every activity specifically (e.g., "Skit: Ang Pagdating ng mga Espanyol", not just "Skit activity").
4. Use DepEd Filipino classroom language naturally: pampagana, pagtataya, talakayan, pagbubuod.
5. Every procedure must be executable by a teacher with zero preparation beyond reading it.
6. No meta-commentary like "This is a good activity because..." — just the procedure.
7. Return ONLY valid JSON. No markdown code fences, no explanations outside the JSON object.
"""


@lru_cache(maxsize=1)
def get_client() -> genai.Client:
    settings = get_settings()
    return genai.Client(api_key=settings.gemini_api_key)


def generate(prompt: str) -> str:
    """Single function to call Gemini — returns raw text response."""
    client = get_client()
    response = client.models.generate_content(
        model=MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=ANTI_VAGUE_INSTRUCTION,
        ),
    )
    return response.text
