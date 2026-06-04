"use client"

import { useState } from "react"
import {
  createStudent,
  logReadingLevel,
  logMathLevel,
  logHealth,
  type Student,
  type HealthRecordResponse,
} from "@/lib/api"
import { UserPlus, BookOpen, Calculator, Heart, Loader2, CheckCircle } from "lucide-react"

const READING_LEVELS = ["Non-Reader", "Frustration", "Instructional", "Independent"]
const MATH_LEVELS = ["Below Basic", "Basic", "Proficient", "Advanced"]
const GRADES = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"]

const BMI_COLORS: Record<string, string> = {
  Underweight: "text-yellow-700 bg-yellow-50 border-yellow-200",
  Normal: "text-green-700 bg-green-50 border-green-200",
  Overweight: "text-orange-700 bg-orange-50 border-orange-200",
  Obese: "text-red-700 bg-red-50 border-red-200",
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3 border-b bg-gray-50">
        {icon}
        <h2 className="font-bold text-gray-800 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

export default function DiagnosticPage() {
  // Student creation
  const [studentForm, setStudentForm] = useState({ full_name: "", grade_level: "Grade 4", section: "", school_year: "2025-2026" })
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null)
  const [loadingStudent, setLoadingStudent] = useState(false)
  const [studentError, setStudentError] = useState<string | null>(null)

  // Assessment forms
  const [studentId, setStudentId] = useState("")
  const [readingLevel, setReadingLevel] = useState("Instructional")
  const [readingNotes, setReadingNotes] = useState("")
  const [mathLevel, setMathLevel] = useState("Basic")
  const [mathNotes, setMathNotes] = useState("")
  const [heightCm, setHeightCm] = useState("")
  const [weightKg, setWeightKg] = useState("")
  const [healthResult, setHealthResult] = useState<HealthRecordResponse | null>(null)

  const [savingReading, setSavingReading] = useState(false)
  const [savingMath, setSavingMath] = useState(false)
  const [savingHealth, setSavingHealth] = useState(false)
  const [savedReading, setSavedReading] = useState(false)
  const [savedMath, setSavedMath] = useState(false)
  const [assessError, setAssessError] = useState<string | null>(null)

  async function handleCreateStudent() {
    if (!studentForm.full_name.trim() || !studentForm.section.trim()) return
    setLoadingStudent(true)
    setStudentError(null)
    try {
      const s = await createStudent(studentForm)
      setCreatedStudent(s)
      setStudentId(s.id)
    } catch (e) {
      setStudentError(e instanceof Error ? e.message : "Error")
    } finally {
      setLoadingStudent(false)
    }
  }

  async function handleSaveReading() {
    if (!studentId) return
    setSavingReading(true)
    setAssessError(null)
    try {
      await logReadingLevel({ student_id: studentId, level: readingLevel, notes: readingNotes })
      setSavedReading(true)
    } catch (e) {
      setAssessError(e instanceof Error ? e.message : "Error")
    } finally {
      setSavingReading(false)
    }
  }

  async function handleSaveMath() {
    if (!studentId) return
    setSavingMath(true)
    setAssessError(null)
    try {
      await logMathLevel({ student_id: studentId, level: mathLevel, notes: mathNotes })
      setSavedMath(true)
    } catch (e) {
      setAssessError(e instanceof Error ? e.message : "Error")
    } finally {
      setSavingMath(false)
    }
  }

  async function handleSaveHealth() {
    if (!studentId || !heightCm || !weightKg) return
    setSavingHealth(true)
    setAssessError(null)
    try {
      const result = await logHealth({
        student_id: studentId,
        height_cm: parseFloat(heightCm),
        weight_kg: parseFloat(weightKg),
      })
      setHealthResult(result)
    } catch (e) {
      setAssessError(e instanceof Error ? e.message : "Error")
    } finally {
      setSavingHealth(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Diagnostic Tracker</h1>
        <p className="text-gray-500 text-sm mt-1">Beginning of School Year Assessment — Reading, Math, at Health Records</p>
      </div>

      <Section icon={<UserPlus className="w-4 h-4 text-blue-700" />} title="Irehistro ang Estudyante">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Buong Pangalan</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Juan dela Cruz"
              value={studentForm.full_name}
              onChange={(e) => setStudentForm((p) => ({ ...p, full_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Seksiyon</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="Sampaguita"
              value={studentForm.section}
              onChange={(e) => setStudentForm((p) => ({ ...p, section: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Grade Level</label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={studentForm.grade_level}
              onChange={(e) => setStudentForm((p) => ({ ...p, grade_level: e.target.value }))}
            >
              {GRADES.map((g) => <option key={g}>{g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">School Year</label>
            <input
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="2025-2026"
              value={studentForm.school_year}
              onChange={(e) => setStudentForm((p) => ({ ...p, school_year: e.target.value }))}
            />
          </div>
        </div>
        {studentError && <p className="text-xs text-red-600 mt-2">{studentError}</p>}
        {createdStudent && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-xs text-green-700 flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            Nairehistro: <strong>{createdStudent.full_name}</strong> — ID: <code className="bg-green-100 px-1 rounded">{createdStudent.id.slice(0, 8)}...</code>
          </div>
        )}
        <button
          onClick={handleCreateStudent}
          disabled={loadingStudent || !studentForm.full_name.trim() || !studentForm.section.trim()}
          className="mt-4 bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loadingStudent ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          Irehistro
        </button>
      </Section>

      {/* Assessment sections — shown after student created or manual ID entry */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-3 text-xs text-yellow-800">
        <strong>Student ID:</strong>{" "}
        <input
          className="border-b border-yellow-400 bg-transparent focus:outline-none text-xs font-mono w-64"
          placeholder="I-paste ang student ID para sa assessment"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
        />
      </div>

      {assessError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{assessError}</p>}

      <div className="grid md:grid-cols-2 gap-5">
        <Section icon={<BookOpen className="w-4 h-4 text-indigo-700" />} title="Reading Level">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Antas sa Pagbabasa</label>
              <div className="grid grid-cols-2 gap-2">
                {READING_LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setReadingLevel(l)}
                    className={`text-xs py-2 rounded-lg border font-medium transition-colors ${readingLevel === l ? "bg-indigo-700 text-white border-indigo-700" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
              rows={2}
              placeholder="Mga notes (opsyonal)"
              value={readingNotes}
              onChange={(e) => setReadingNotes(e.target.value)}
            />
            <button
              onClick={handleSaveReading}
              disabled={savingReading || !studentId}
              className="w-full bg-indigo-700 text-white py-2 rounded-lg text-xs font-semibold hover:bg-indigo-800 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {savingReading ? <Loader2 className="w-3 h-3 animate-spin" /> : savedReading ? <CheckCircle className="w-3 h-3" /> : null}
              {savedReading ? "Nai-save!" : "I-save ang Reading Level"}
            </button>
          </div>
        </Section>

        <Section icon={<Calculator className="w-4 h-4 text-teal-700" />} title="Math Level">
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Antas sa Matematika</label>
              <div className="grid grid-cols-2 gap-2">
                {MATH_LEVELS.map((l) => (
                  <button
                    key={l}
                    onClick={() => setMathLevel(l)}
                    className={`text-xs py-2 rounded-lg border font-medium transition-colors ${mathLevel === l ? "bg-teal-700 text-white border-teal-700" : "bg-white text-gray-600 border-gray-300 hover:border-teal-400"}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:ring-2 focus:ring-teal-400"
              rows={2}
              placeholder="Mga notes (opsyonal)"
              value={mathNotes}
              onChange={(e) => setMathNotes(e.target.value)}
            />
            <button
              onClick={handleSaveMath}
              disabled={savingMath || !studentId}
              className="w-full bg-teal-700 text-white py-2 rounded-lg text-xs font-semibold hover:bg-teal-800 disabled:opacity-50 flex items-center justify-center gap-1"
            >
              {savingMath ? <Loader2 className="w-3 h-3 animate-spin" /> : savedMath ? <CheckCircle className="w-3 h-3" /> : null}
              {savedMath ? "Nai-save!" : "I-save ang Math Level"}
            </button>
          </div>
        </Section>
      </div>

      <Section icon={<Heart className="w-4 h-4 text-rose-700" />} title="Health Assessment (BMI Calculator)">
        <div className="grid md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Taas (cm)</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="120"
              value={heightCm}
              onChange={(e) => setHeightCm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Timbang (kg)</label>
            <input
              type="number"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              placeholder="32"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <button
            onClick={handleSaveHealth}
            disabled={savingHealth || !studentId || !heightCm || !weightKg}
            className="bg-rose-700 text-white py-2 rounded-lg text-sm font-semibold hover:bg-rose-800 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {savingHealth ? <Loader2 className="w-4 h-4 animate-spin" /> : <Heart className="w-4 h-4" />}
            Kalkulahin at I-save
          </button>
        </div>

        {healthResult && (
          <div className={`mt-4 border rounded-xl px-5 py-4 flex items-center justify-between ${BMI_COLORS[healthResult.bmi_category]}`}>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">BMI Result</p>
              <p className="text-3xl font-bold">{healthResult.bmi}</p>
              <p className="text-sm font-semibold">{healthResult.bmi_category}</p>
            </div>
            <div className="text-right text-xs opacity-75 space-y-1">
              <p>Taas: {healthResult.height_cm} cm</p>
              <p>Timbang: {healthResult.weight_kg} kg</p>
            </div>
          </div>
        )}
      </Section>
    </div>
  )
}