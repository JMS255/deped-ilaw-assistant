from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/orientation", tags=["orientation"])

ORIENTATION_PLANS = [
    {
        "day": 1,
        "title": "Pagpapakilala at Pagbabago ng Isipan (Values Formation Day 1)",
        "theme": "Values Formation",
        "intention": "Maipakita ng mga mag-aaral ang kanilang sariling pagpapahalaga sa pamamagitan ng isang simpleng aktibidad ng pagpapakilala.",
        "learning_experience": """
Minutes 1–5 (Pampagana): Teacher greets students warmly and asks everyone to stand. Play soft background music. Ask: "Isang salita lang — paano mo ilarawan ang iyong sarili?" Students say one word each.

Minutes 6–20 (Activity 1 — "Ako Bilang Isang Bata"): Distribute a half-sheet of paper. Students draw their face and write 3 words describing their strengths. Teacher models first: "Ako si Gng. [Pangalan]. Malakas ako sa... Mahal ko ang..."

Minutes 21–35 (Activity 2 — Sharing Circle): Groups of 5 share their drawings. Each group selects one "pinaka-espesyal na katangian" to present to class.

Minutes 36–50 (Class Discussion): Teacher facilitates: "Bakit mahalaga ang pagkilala sa ating sarili?" Write key answers on the board.

Minutes 51–60 (Wrap-up): Students write one sentence: "Ngayong taon, nais kong maging mas..." Collect as baseline data.
""",
        "assessment": "Observation checklist: Did the student participate in sharing? (Yes/No). Did the student write a complete sentence? (Yes/No).",
        "wrap_up": "Assignment: Draw your family and write their names. Bring tomorrow.",
    },
    {
        "day": 2,
        "title": "Kamusta Ka? — Socio-Emotional Learning at Wellbeing Check",
        "theme": "Socio-Emotional Learning & Wellbeing",
        "intention": "Matukoy ng mga mag-aaral ang mga emosyon at makapagpahayag ng kanilang kalagayan nang may respeto.",
        "learning_experience": """
Minutes 1–8 (Pampagana — "Emotion Weather Report"): Draw a simple weather chart on the board (sunny = masaya, cloudy = malungkot, rainy = nag-aalala, stormy = galit). Each student points to or says their "weather" today.

Minutes 9–25 (Activity — "Ang Aking Puso"): Students fold paper into fourths. In each section they draw/write: (1) Isang bagay na nagpapasaya sa akin, (2) Isang bagay na nagpapalungkot, (3) Isang bagay na natatakot ako, (4) Isang bagay na sineserbisyo ko sa iba.

Minutes 26–40 (Partner Share): In pairs, students share one section only — whichever they are comfortable sharing. Teacher circulates and notes students who may need follow-up.

Minutes 41–55 (Teacher Talk — Coping Strategies): Teacher shares 3 simple strategies: (1) Huminga nang malalim, (2) Kausapin ang isang pinagkakatiwalaan, (3) Sumulat o gumuhit. Demonstrate breathing exercise together.

Minutes 56–60: Students give a thumbs up/down/middle for "How do you feel right now?"
""",
        "assessment": "Informal: Teacher records 3 students who showed signs of distress for follow-up counseling referral.",
        "wrap_up": "Reflection slip: 'Isa sa mga bagay na makakatulong sa akin ngayong taon ay...'",
    },
    {
        "day": 3,
        "title": "Ligtas na Paaralan — Anti-Bullying Campaign",
        "theme": "Anti-Bullying",
        "intention": "Maitukoy ng mga mag-aaral ang iba't ibang uri ng pang-aabuso at makapagtukoy ng tamang hakbang kapag nakaranas o nakasaksi.",
        "learning_experience": """
Minutes 1–7 (Pampagana — Scenario Cards): Post 4 printed scenario cards on the board. Students vote silently: "Ito ba ay bullying? — Oo o Hindi?" using thumbs.

Minutes 8–25 (Mini-Skit "Tigilan Mo Yan!"): Divide class into groups of 5. Each group performs a 1-minute skit showing a bullying scenario and a CORRECT response. Roles: bully, victim, bystander who acts, bystander who ignores, teacher. Teacher gives 5 minutes to prepare.

Minutes 26–40 (Debrief Discussion): After each skit, ask: "Ano ang tamang ginawa?" "Paano mo mararamdaman kung ikaw ang biktima?" Write "3 Hakbang" on board: (1) Sabihin sa bully na huminto, (2) Lumayo, (3) Mag-ulat sa guro.

Minutes 41–55 (Pledge Making): Students write and sign their own "Anti-Bullying Pledge" on a half-sheet. Display on classroom bulletin board.

Minutes 56–60: Teacher posts the school's anti-bullying hotline or contact person.
""",
        "assessment": "True or False (5 items) — written on paper, checked immediately as a class.",
        "wrap_up": "Assignment: Tell one family member about the 3 Hakbang. Ask them to sign your pledge.",
    },
    {
        "day": 4,
        "title": "Ang Aming Silid-Aralan — Classroom Rules and School Routines",
        "theme": "Classroom Management & Community Building",
        "intention": "Maitatag ng mga mag-aaral ang mga alituntunin ng klase at maipahayag ang kanilang personal na layunin para sa taong paaralan.",
        "learning_experience": """
Minutes 1–5 (Pampagana): Teacher asks: "Kung ikaw ang guro para isang araw, ano ang pinakamahalaga mong alituntunin?" Take 3–4 answers.

Minutes 6–20 (Collaborative Rule-Making): Divide class into 4 groups. Each group writes 2 classroom rules they believe are most important. Groups present. Teacher consolidates into a master list of 5–6 rules on chart paper.

Minutes 21–35 (Classroom Routines Walk-Through): Teacher demonstrates: how to enter the room, how to ask permission, how to pass papers, emergency drill procedure. Students practice each routine once.

Minutes 36–50 (Goal-Setting — "Ang Aking Pangarap ngayong Taon"): Students decorate a half-sheet and write: (1) My academic goal, (2) My behavior goal, (3) One thing I will do to help my classmates. These are posted on the "Dream Wall."

Minutes 51–60: Group photo activity — teacher photographs each student's goal sheet as a record.
""",
        "assessment": "Observation: Did the student write a complete goal sheet? (Check/Not Yet).",
        "wrap_up": "Take-home: Share your 3 goals with a parent or guardian. Ask them to write one word of encouragement below your goals.",
    },
    {
        "day": 5,
        "title": "Kalusugan Ko, Aking Pag-aari — Health and Hygiene Awareness",
        "theme": "Health & Wellbeing",
        "intention": "Maitukoy ng mga mag-aaral ang tamang gawi sa kalinisan at mapahalagahan ang pag-aalaga sa sariling kalusugan.",
        "learning_experience": """
Minutes 1–7 (Pampagana — "Tama o Mali?"): Teacher calls out habits. Students stand if TAMA, sit if MALI. Examples: "Kumakain bago matulog ng gabi," "Nagsosopa ng kamay bago kumain," "Natutulog ng 8 oras."

Minutes 8–25 (Demo — Proper Handwashing): Teacher demonstrates the 7-step handwashing procedure using water and soap (or hand sanitizer). Students practice in pairs. Post the 7 steps on the board permanently.

Minutes 26–40 (Health Pledge Poster): Groups of 4 create a poster titled "5 Gawi para sa Malusog na Katawan." Must include drawings. Display in the room.

Minutes 41–55 (BMI Awareness — Teacher-Led): Teacher explains height and weight measurement in simple terms. If school nurse is available, take height/weight measurements. Teacher records data for diagnostic purposes.

Minutes 56–60: Students fill out a simple health survey (do you eat breakfast? do you sleep 8+ hours?).
""",
        "assessment": "Can name at least 3 healthy habits without looking at notes. (Oral check — spot 5 students).",
        "wrap_up": "Assignment: Practice handwashing tonight and have a parent sign the health habit slip.",
    },
]


class OrientationPlan(BaseModel):
    day: int
    title: str
    theme: str
    intention: str
    learning_experience: str
    assessment: str
    wrap_up: str


@router.get("/plans", response_model=list[OrientationPlan])
def get_all_orientation_plans():
    return ORIENTATION_PLANS


@router.get("/plans/{day}", response_model=OrientationPlan)
def get_orientation_plan(day: int):
    for plan in ORIENTATION_PLANS:
        if plan["day"] == day:
            return plan
    from fastapi import HTTPException
    raise HTTPException(status_code=404, detail=f"No orientation plan for day {day}.")