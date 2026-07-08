const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"

export const AI_DEGRADED_EVENT = "ai-degraded"

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    if (res.status === 503 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(AI_DEGRADED_EVENT, { detail: err.detail }))
    }
    throw new Error(err.detail ?? "API error")
  }
  return res.json() as Promise<T>
}

// ── BOW ──────────────────────────────────────────────────────────────────────

export interface BOWSubject {
  subject_key: string
  grade: string
  label: string
  week_count: number
}

export interface BOWWeek {
  week: string
  term: string
  label: string
  competency: string
}

export function getBOWSubjects() {
  return apiFetch<BOWSubject[]>("/api/bow/subjects")
}

export function getBOWWeeks(subject_key: string, grade: string) {
  return apiFetch<{ subject_key: string; grade: string; weeks: BOWWeek[] }>(
    `/api/bow/weeks?subject_key=${encodeURIComponent(subject_key)}&grade=${encodeURIComponent(grade)}`
  )
}

export function initDefaultBOWs() {
  return apiFetch("/api/bow/init", { method: "POST" })
}

// ── Lesson Plan ──────────────────────────────────────────────────────────────

export interface SessionSummary {
  day: number
  title: string
  focus: string
  session_type: string
}

export interface UnpackResponse {
  bow_objective: string
  grade_level: string
  subject: string
  sessions: SessionSummary[]
}

export interface SessionObjectives {
  cognitive: string
  psychomotor: string
  affective: string
}

export interface SessionPlan {
  day: number
  title: string
  session_type: string
  objectives: SessionObjectives
  pre_lesson: string
  learning_experience: string
  formative_assessment: string
  integration_opportunities: string
}

export interface WaysForward {
  remediation: string
  enrichment: string
  teacher_reflection: string
  extended_learning: string
}

export interface ILAWWeeklyPlan {
  teacher_name: string
  grade_level: string
  subject: string
  week_label: string
  learning_competency: string
  learning_resources: string
  sessions: SessionPlan[]
  ways_forward: WaysForward
  ai_declaration: string
  integrated_activities: Record<string, string>
}

export interface UnpackRequest {
  bow_objective: string
  grade_level: string
  subject: string
  integrated_subjects: string[]
}

export interface WeeklyILAWRequest {
  bow_objective: string
  week_label: string
  grade_level: string
  subject: string
  integrated_subjects: string[]
  sessions: SessionSummary[]
}

export function unpackObjective(body: UnpackRequest) {
  return apiFetch<UnpackResponse>("/api/lesson/unpack", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function generateWeeklyILAW(body: WeeklyILAWRequest) {
  return apiFetch<ILAWWeeklyPlan>("/api/lesson/generate-weekly", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export async function exportDocx(plan: ILAWWeeklyPlan): Promise<void> {
  const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
  const res = await fetch(`${BASE}/api/lesson/export-docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  })
  if (!res.ok) throw new Error("Export failed")
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `ILAW_${plan.subject}_${plan.week_label}.docx`.replace(/\s+/g, "_")
  a.click()
  URL.revokeObjectURL(url)
}

// ── Orientation ──────────────────────────────────────────────────────────────

export interface OrientationPlan {
  day: number
  title: string
  theme: string
  intention: string
  learning_experience: string
  assessment: string
  wrap_up: string
}

export function getOrientationPlans() {
  return apiFetch<OrientationPlan[]>("/api/orientation/plans")
}

// ── Diagnostic ───────────────────────────────────────────────────────────────

export interface Student {
  id: string
  full_name: string
  grade_level: string
  section: string
  school_year: string
}

export interface HealthRecordResponse {
  student_id: string
  height_cm: number
  weight_kg: number
  assessed_date: string
  bmi: number
  bmi_category: string
}

export function createStudent(body: Omit<Student, "id">) {
  return apiFetch<Student>("/api/diagnostic/students", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function listStudents(grade_level?: string, section?: string) {
  const params = new URLSearchParams()
  if (grade_level) params.set("grade_level", grade_level)
  if (section) params.set("section", section)
  return apiFetch<Student[]>(`/api/diagnostic/students?${params}`)
}

export function logReadingLevel(body: {
  student_id: string
  level: string
  notes?: string
}) {
  return apiFetch("/api/diagnostic/reading", { method: "POST", body: JSON.stringify(body) })
}

export function logMathLevel(body: {
  student_id: string
  level: string
  notes?: string
}) {
  return apiFetch("/api/diagnostic/math", { method: "POST", body: JSON.stringify(body) })
}

export function logHealth(body: {
  student_id: string
  height_cm: number
  weight_kg: number
}) {
  return apiFetch<HealthRecordResponse>("/api/diagnostic/health", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

export function getStudentSummary(student_id: string) {
  return apiFetch(`/api/diagnostic/students/${student_id}/summary`)
}