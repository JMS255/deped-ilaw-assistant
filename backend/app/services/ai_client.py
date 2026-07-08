import time
from google import genai
from google.genai import types
from google.genai.errors import ServerError
from functools import lru_cache
from app.config import get_settings

MODEL = "gemini-2.5-flash-lite"
FALLBACK_MODEL = "gemini-2.5-flash"
MAX_RETRIES = 3
FALLBACK_MAX_RETRIES = 2
RETRY_BACKOFF_SECONDS = 2

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


def _call_model(client: genai.Client, model: str, prompt: str, retries: int) -> str:
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=ANTI_VAGUE_INSTRUCTION,
                ),
            )
            return response.text
        except ServerError:
            if attempt == retries - 1:
                raise
            time.sleep(RETRY_BACKOFF_SECONDS * (attempt + 1))


def generate(prompt: str) -> str:
    """Single function to call Gemini — returns raw text response.

    Retries on transient server-side errors (503 overload) with backoff,
    since Gemini's "high demand" errors are usually short-lived. If the
    primary (flash-lite) model keeps failing, falls back to the full flash
    model, which gets hit with less traffic.
    """
    client = get_client()
    try:
        return _call_model(client, MODEL, prompt, MAX_RETRIES)
    except ServerError:
        return _call_model(client, FALLBACK_MODEL, prompt, FALLBACK_MAX_RETRIES)
