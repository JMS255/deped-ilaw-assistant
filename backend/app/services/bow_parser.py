import re
import json
import pdfplumber
from pathlib import Path

BOW_DIR = Path(__file__).parent.parent.parent / "bow_documents"
PARSED_DIR = Path(__file__).parent.parent.parent / "bow_parsed"
PARSED_DIR.mkdir(exist_ok=True)


def _clean(text: str | None) -> str:
    if not text:
        return ""
    return re.sub(r"\s+", " ", text.replace("\n", " ")).strip()


def _extract_week_range(cell: str) -> list[str]:
    cell = cell.split("\n")[0].strip()
    match = re.match(r"(\d+)\s+to\s+(\d+)", cell)
    if match:
        start, end = int(match.group(1)), int(match.group(2))
        return [str(i) for i in range(start, end + 1)]
    match = re.match(r"(\d+)", cell)
    if match:
        return [match.group(1)]
    return []


def _detect_term(text: str) -> str | None:
    t = text.lower()
    if "unang termino" in t or "first term" in t:
        return "Term 1"
    if "ikalawang termino" in t or "second term" in t:
        return "Term 2"
    if "ikatlong termino" in t or "third term" in t:
        return "Term 3"
    if "ikaapat na termino" in t or "fourth term" in t:
        return "Term 4"
    return None


# ── AP / Math / Science / EPP Format ─────────────────────────────────────────
# Format: [Week, Competency, None] rows

def _parse_ap_format(pdf_path: str) -> dict:
    weeks: dict[str, dict] = {}
    current_term = "Term 1"

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row or not row[0]:
                        continue
                    cell0 = _clean(str(row[0]))
                    term = _detect_term(cell0)
                    if term:
                        current_term = term
                        continue
                    if cell0.lower() in ("linggo", "week", "budget of work"):
                        continue
                    week_nums = _extract_week_range(cell0)
                    if not week_nums:
                        continue
                    competency_raw = _clean(str(row[1]) if len(row) > 1 and row[1] else "")
                    if not competency_raw:
                        continue
                    competency = re.sub(r"●\s*", "", competency_raw).strip()
                    for w in week_nums:
                        key = f"{current_term} Week {w}"
                        weeks[key] = {
                            "week": w,
                            "term": current_term,
                            "label": f"{current_term} — Week {w}",
                            "competency": competency,
                        }
    return weeks


# ── GMRC Format ───────────────────────────────────────────────────────────────
# Format: week range in row[0], competency in a row after "Kasanayang Pampagkatuto" label

def _parse_gmrc_format(pdf_path: str) -> dict:
    weeks: dict[str, dict] = {}
    current_term = "Term 1"
    current_week_nums: list[str] = []
    expecting_competency_label = False
    expecting_competency_text = False

    with pdfplumber.open(pdf_path) as pdf:
        all_rows = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                all_rows.extend(table)

    i = 0
    while i < len(all_rows):
        row = all_rows[i]
        if not row:
            i += 1
            continue
        cell0 = _clean(str(row[0])) if row[0] else ""
        cell1 = _clean(str(row[1])) if len(row) > 1 and row[1] else ""
        cell2 = _clean(str(row[2])) if len(row) > 2 and row[2] else ""

        term = _detect_term(cell0) or _detect_term(cell1) or _detect_term(cell2)
        if term:
            current_term = term
            i += 1
            continue

        week_nums = _extract_week_range(cell0) if cell0 else []
        if week_nums:
            current_week_nums = week_nums
            expecting_competency_label = True
            i += 1
            continue

        if expecting_competency_label and "kasanayang pampagkatuto" in cell1.lower():
            expecting_competency_label = False
            expecting_competency_text = True
            i += 1
            continue

        if expecting_competency_text and current_week_nums:
            text = cell1 or cell2 or cell0
            if text and "kasanayang" not in text.lower() and "pamantayan" not in text.lower():
                competency = re.sub(r"\s+", " ", text).strip()
                for w in current_week_nums:
                    key = f"{current_term} Week {w}"
                    weeks[key] = {
                        "week": w,
                        "term": current_term,
                        "label": f"{current_term} — Week {w}",
                        "competency": competency,
                    }
                expecting_competency_text = False
                current_week_nums = []

        i += 1
    return weeks


# ── English Format ────────────────────────────────────────────────────────────
# Format: SUB DOMAINS | LEARNING COMPETENCIES grid with Grade 5 T1/T2/T3 checkmarks
# No week numbers — returns competencies by term as a list

def _parse_english_format(pdf_path: str) -> dict:
    weeks: dict[str, dict] = {}
    current_subdomain = ""

    with pdfplumber.open(pdf_path) as pdf:
        all_rows = []
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                all_rows.extend(table)

    # Find the header row to determine Grade 5 T1/T2/T3 column indices
    g5_t1_col = g5_t2_col = g5_t3_col = None
    header_found = False

    for i, row in enumerate(all_rows):
        if not row:
            continue
        cells = [_clean(str(c)) if c else "" for c in row]
        if "sub domains" in " ".join(cells).lower() or "sub domain" in " ".join(cells).lower():
            # Next row has T1 T2 T3 column markers
            if i + 1 < len(all_rows):
                next_row = [_clean(str(c)) if c else "" for c in all_rows[i + 1]]
                # Find Grade 5 columns: look for pattern T1 T2 T3 after GRADE 5
                grade5_start = None
                for j, c in enumerate(cells):
                    if "grade 5" in c.lower() or ("grade" in c.lower() and "5" in c):
                        grade5_start = j
                        break
                if grade5_start is not None:
                    t_count = 0
                    for j in range(grade5_start, len(next_row)):
                        if next_row[j] in ("T1", "T2", "T3"):
                            if t_count == 0:
                                g5_t1_col = j
                            elif t_count == 1:
                                g5_t2_col = j
                            elif t_count == 2:
                                g5_t3_col = j
                            t_count += 1
                    header_found = True
            break

    if not header_found or g5_t1_col is None:
        # Fallback: just collect all competencies under each term header
        return _parse_competency_list_format(pdf_path, "english")

    term_map = {"T1": "Term 1", "T2": "Term 2", "T3": "Term 3"}
    competency_counter = {"Term 1": 0, "Term 2": 0, "Term 3": 0}

    for row in all_rows:
        if not row:
            continue
        cells = [_clean(str(c)) if c else "" for c in row]

        # Track current subdomain
        if cells[0] and cells[0] not in ("SUB DOMAINS", "Budget of Work"):
            potential_subdomain = cells[0]
            if len(potential_subdomain) > 3 and not re.match(r"^\d", potential_subdomain):
                current_subdomain = potential_subdomain

        # Get competency text (column 1 or 2)
        competency_text = ""
        if len(cells) > 2 and cells[2]:
            competency_text = cells[2]
        elif len(cells) > 1 and cells[1] and cells[1] not in ("T1", "T2", "T3"):
            competency_text = cells[1]

        if not competency_text or len(competency_text) < 5:
            continue

        for term_key, col in [("Term 1", g5_t1_col), ("Term 2", g5_t2_col), ("Term 3", g5_t3_col)]:
            if col and col < len(row) and row[col] and "✓" in str(row[col]):
                competency_counter[term_key] += 1
                n = competency_counter[term_key]
                key = f"{term_key} Competency {n}"
                label_text = f"{current_subdomain}: {competency_text}" if current_subdomain else competency_text
                weeks[key] = {
                    "week": str(n),
                    "term": term_key,
                    "label": f"{term_key} — {label_text[:60]}",
                    "competency": f"[{current_subdomain}] {competency_text}",
                }

    return weeks


# ── Filipino / competency-list Format ────────────────────────────────────────
# Format: Subdomain | Kasanayang Pampagkatuto rows — no week numbers

def _parse_competency_list_format(pdf_path: str, fmt: str = "filipino") -> dict:
    weeks: dict[str, dict] = {}
    current_term = "Term 1"
    current_subdomain = ""
    competency_counter: dict[str, int] = {}

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row:
                        continue
                    cell0 = _clean(str(row[0])) if row[0] else ""
                    cell1 = _clean(str(row[1])) if len(row) > 1 and row[1] else ""

                    term = _detect_term(cell0) or _detect_term(cell1)
                    if term:
                        current_term = term
                        continue

                    if cell0.lower() in ("subdomain", "budget of work", "linggo", "week"):
                        continue
                    if "kasanayang pampagkatuto" in cell0.lower() or "learning competency" in cell0.lower():
                        continue

                    # Subdomain detection
                    if cell0 and cell1 and len(cell0) > 3 and not re.match(r"^\d", cell0):
                        current_subdomain = cell0
                        competency_text = cell1
                    elif cell1 and len(cell1) > 10:
                        competency_text = cell1
                    else:
                        continue

                    if not competency_text or len(competency_text) < 10:
                        continue
                    if "pamantayan" in competency_text.lower():
                        continue

                    if current_term not in competency_counter:
                        competency_counter[current_term] = 0
                    competency_counter[current_term] += 1
                    n = competency_counter[current_term]
                    key = f"{current_term} Competency {n}"
                    short = competency_text[:55]
                    weeks[key] = {
                        "week": str(n),
                        "term": current_term,
                        "label": f"{current_term} — {short}...",
                        "competency": f"[{current_subdomain}] {competency_text}" if current_subdomain else competency_text,
                    }

    return weeks


# ── MAPEH Format ──────────────────────────────────────────────────────────────
# Format: * | whole-term competency block

def _parse_mapeh_format(pdf_path: str) -> dict:
    weeks: dict[str, dict] = {}
    current_term = "Term 1"

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    if not row:
                        continue
                    cell0 = _clean(str(row[0])) if row[0] else ""
                    cell1 = _clean(str(row[1])) if len(row) > 1 and row[1] else ""

                    term = _detect_term(cell0) or _detect_term(cell1)
                    if term:
                        current_term = term
                        continue

                    if cell0 == "*" and cell1:
                        competency = re.sub(r"●\s*", "", cell1).strip()
                        short = competency[:60]
                        # MAPEH has Music&Arts and PE&Health as two entries per term
                        existing = [k for k in weeks if k.startswith(current_term)]
                        n = len(existing) + 1
                        key = f"{current_term} Component {n}"
                        weeks[key] = {
                            "week": str(n),
                            "term": current_term,
                            "label": f"{current_term} — {short}...",
                            "competency": competency,
                        }

    return weeks


# ── Public API ────────────────────────────────────────────────────────────────

FORMAT_PARSERS = {
    "ap": _parse_ap_format,
    "gmrc": _parse_gmrc_format,
    "english": _parse_english_format,
    "filipino": _parse_competency_list_format,
    "mapeh": _parse_mapeh_format,
}


def parse_and_save(pdf_filename: str, subject_key: str, grade: str, format_type: str = "ap") -> dict:
    pdf_path = str(BOW_DIR / pdf_filename)
    parser = FORMAT_PARSERS.get(format_type, _parse_ap_format)
    weeks = parser(pdf_path)

    output = {
        "subject_key": subject_key,
        "grade": grade,
        "pdf_filename": pdf_filename,
        "format_type": format_type,
        "weeks": weeks,
    }

    out_path = PARSED_DIR / f"{subject_key}_{grade}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    return output


def load_bow(subject_key: str, grade: str) -> dict | None:
    path = PARSED_DIR / f"{subject_key}_{grade}.json"
    if not path.exists():
        return None
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def list_available_subjects() -> list[dict]:
    subjects = []
    for f in PARSED_DIR.glob("*.json"):
        with open(f, encoding="utf-8") as fp:
            data = json.load(fp)
        subjects.append({
            "subject_key": data["subject_key"],
            "grade": data["grade"],
            "label": f"{data['subject_key']} — {data['grade']}",
            "week_count": len(data["weeks"]),
        })
    return sorted(subjects, key=lambda x: x["subject_key"])
