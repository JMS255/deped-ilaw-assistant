"use client"

import { useState, useEffect } from "react"
import {
  getBOWSubjects, getBOWWeeks, initDefaultBOWs,
  unpackObjective, generateWeeklyILAW, exportDocx,
  type BOWSubject, type BOWWeek, type UnpackResponse,
  type ILAWWeeklyPlan, type SessionSummary,
} from "@/lib/api"
import {
  Loader2, ChevronDown, ChevronUp, Download,
  BookOpen, RefreshCw, Upload, FileText,
} from "lucide-react"
import Link from "next/link"

const INTEGRATIONS = ["Math", "Science", "ICT", "GMRC"]

const SESSION_COLORS: Record<string, string> = {
  "Motivation & Introduction": "bg-yellow-50 border-yellow-400 text-yellow-900",
  "Deep Learning": "bg-blue-50 border-blue-400 text-blue-900",
  "Deep Learning 2": "bg-purple-50 border-purple-400 text-purple-900",
  "Evaluation & Wrap-up": "bg-green-50 border-green-400 text-green-900",
}

function SessionCard({ session }: { session: ILAWWeeklyPlan["sessions"][0] }) {
  const [open, setOpen] = useState<string | null>("learning_experience")
  const color = SESSION_COLORS[session.session_type] ?? "bg-gray-50 border-gray-300"

  const sections = [
    {
      key: "objectives", label: "Objectives (I — Intensyon)", content: (
        <div className="space-y-1 text-sm text-gray-700">
          <p><span className="font-semibold text-blue-700">Cognitive:</span> {session.objectives.cognitive}</p>
          <p><span className="font-semibold text-green-700">Psychomotor:</span> {session.objectives.psychomotor}</p>
          <p><span className="font-semibold text-orange-700">Affective:</span> {session.objectives.affective}</p>
        </div>
      )
    },
    { key: "pre_lesson", label: "Pre-Lesson (Pampagana)", content: <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.pre_lesson}</p> },
    { key: "learning_experience", label: "L — Learning Experience (Karanasan sa Pagkatuto)", content: <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{session.learning_experience}</p> },
    { key: "formative_assessment", label: "A — Formative Assessment (Pagtataya)", content: <p className="text-sm text-gray-700 whitespace-pre-wrap">{session.formative_assessment}</p> },
  ]

  if (session.integration_opportunities) {
    sections.push({ key: "integration", label: "Integration Opportunities", content: <p className="text-sm text-gray-700">{session.integration_opportunities}</p> })
  }

  return (
    <div className={`border-2 rounded-xl overflow-hidden ${color}`}>
      <div className="px-4 py-3 border-b border-current/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest opacity-70">Day {session.day}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 font-medium border border-current/20">{session.session_type}</span>
        </div>
        <h3 className="font-bold text-sm mt-0.5">{session.title}</h3>
      </div>
      <div className="bg-white divide-y">
        {sections.map((s) => (
          <div key={s.key}>
            <button
              className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setOpen(open === s.key ? null : s.key)}
            >
              {s.label}
              {open === s.key ? <ChevronUp className="w-3.5 h-3.5 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
            </button>
            {open === s.key && <div className="px-4 pb-3">{s.content}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

function WaysForwardCard({ wf }: { wf: ILAWWeeklyPlan["ways_forward"] }) {
  const items = [
    { label: "Remediation (Para sa mga nahihirapan)", content: wf.remediation || "Bigyan ng flashcards ang mga nahihirapan para sa bahay na pag-aaral.", color: "border-red-300 bg-red-50" },
    { label: "Enrichment (Para sa mga advanced)", content: wf.enrichment || "Bigyan ng karagdagang gawain ang mga advanced na mag-aaral.", color: "border-emerald-300 bg-emerald-50" },
    { label: "Extended Learning (Take-home)", content: wf.extended_learning || "Ibahagi sa pamilya ang natutunan ngayon. Humingi ng kanilang reaksiyon.", color: "border-blue-300 bg-blue-50" },
    { label: "Teacher Reflection", content: wf.teacher_reflection || "Ano ang naging epektibo? Ano ang dapat baguhin para sa susunod na aralin?", color: "border-purple-300 bg-purple-50" },
  ]
  return (
    <div className="bg-white border-2 border-orange-300 rounded-xl overflow-hidden">
      <div className="bg-orange-600 text-white px-5 py-3">
        <h3 className="font-bold text-sm">W — Ways Forward</h3>
        <p className="text-xs opacity-80">Remediation · Enrichment · Extended Learning · Teacher Reflection</p>
      </div>
      <div className="grid md:grid-cols-2 gap-3 p-4">
        {items.map((item) => (
          <div key={item.label} className={`border rounded-lg p-3 ${item.color}`}>
            <p className="text-xs font-bold text-gray-700 mb-1">{item.label}</p>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function LessonPlannerPage() {
  const [subjects, setSubjects] = useState<BOWSubject[]>([])
  const [weeks, setWeeks] = useState<BOWWeek[]>([])
  const [selectedSubject, setSelectedSubject] = useState<BOWSubject | null>(null)
  const [selectedWeek, setSelectedWeek] = useState<BOWWeek | null>(null)
  const [integrations, setIntegrations] = useState<string[]>([])

  const [unpackResult, setUnpackResult] = useState<UnpackResponse | null>(null)
  const [weeklyPlan, setWeeklyPlan] = useState<ILAWWeeklyPlan | null>(null)

  const [loadingSubjects, setLoadingSubjects] = useState(true)
  const [loadingWeeks, setLoadingWeeks] = useState(false)
  const [loadingUnpack, setLoadingUnpack] = useState(false)
  const [loadingGenerate, setLoadingGenerate] = useState(false)
  const [loadingExport, setLoadingExport] = useState(false)
  const [initializing, setInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => { loadSubjects() }, [])

  async function loadSubjects() {
    setLoadingSubjects(true)
    try { setSubjects(await getBOWSubjects()) }
    catch { setSubjects([]) }
    finally { setLoadingSubjects(false) }
  }

  async function handleInitialize() {
    setInitializing(true)
    setError(null)
    try { await initDefaultBOWs(); await loadSubjects() }
    catch (e) { setError(e instanceof Error ? e.message : "Failed to initialize.") }
    finally { setInitializing(false) }
  }

  async function handleSelectSubject(subject: BOWSubject) {
    setSelectedSubject(subject)
    setSelectedWeek(null); setWeeks([]); setUnpackResult(null); setWeeklyPlan(null)
    setLoadingWeeks(true)
    try {
      const data = await getBOWWeeks(subject.subject_key, subject.grade)
      setWeeks(data.weeks)
    } catch (e) { setError(e instanceof Error ? e.message : "Failed to load weeks.") }
    finally { setLoadingWeeks(false) }
  }

  function handleSelectWeek(week: BOWWeek) {
    setSelectedWeek(week); setUnpackResult(null); setWeeklyPlan(null)
  }

  function toggleIntegration(s: string) {
    setIntegrations((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s])
  }

  async function handleUnpack() {
    if (!selectedWeek || !selectedSubject || selectedWeek.competency === "ORIENTATION_WEEK") return
    setLoadingUnpack(true); setError(null); setUnpackResult(null); setWeeklyPlan(null)
    try {
      setUnpackResult(await unpackObjective({
        bow_objective: selectedWeek.competency,
        grade_level: selectedSubject.grade,
        subject: selectedSubject.subject_key,
        integrated_subjects: integrations,
      }))
    } catch (e) { setError(e instanceof Error ? e.message : "Error") }
    finally { setLoadingUnpack(false) }
  }

  async function handleGenerateWeekly(sessions: SessionSummary[]) {
    if (!unpackResult || !selectedSubject || !selectedWeek) return
    setLoadingGenerate(true); setError(null); setWeeklyPlan(null)
    try {
      setWeeklyPlan(await generateWeeklyILAW({
        bow_objective: unpackResult.bow_objective,
        week_label: selectedWeek.label,
        grade_level: unpackResult.grade_level,
        subject: unpackResult.subject,
        integrated_subjects: integrations,
        sessions,
      }))
    } catch (e) { setError(e instanceof Error ? e.message : "Error") }
    finally { setLoadingGenerate(false) }
  }

  async function handleExport() {
    if (!weeklyPlan) return
    setLoadingExport(true)
    try { await exportDocx(weeklyPlan) }
    catch (e) { setError(e instanceof Error ? e.message : "Export failed") }
    finally { setLoadingExport(false) }
  }

  const isOrientationWeek = selectedWeek?.competency === "ORIENTATION_WEEK"

  // Group weeks by term for display
  const weeksByTerm = weeks.reduce<Record<string, BOWWeek[]>>((acc, w) => {
    const key = w.competency === "ORIENTATION_WEEK" ? "Orientation" : w.term
    if (!acc[key]) acc[key] = []
    acc[key].push(w)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ILAW Lesson Planner</h1>
        <p className="text-gray-500 text-sm mt-1">BOW → 4 Sessions → Full Weekly ILAW Plan → Download DOCX</p>
      </div>

      {/* Step 1: Subject */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">1</span>
            Pumili ng Asignatura
          </h2>
          <button onClick={handleInitialize} disabled={initializing}
            className="flex items-center gap-1 text-xs text-blue-700 hover:underline disabled:opacity-50">
            {initializing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {subjects.length === 0 ? "I-load ang BOW Data" : "I-refresh"}
          </button>
        </div>

        {loadingSubjects ? (
          <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Nilo-load...</div>
        ) : subjects.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
            Walang BOW data pa. I-click ang <strong>"I-load ang BOW Data"</strong>.
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {subjects.map((s) => (
              <button key={s.label} onClick={() => handleSelectSubject(s)}
                className={`px-4 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${selectedSubject?.label === s.label ? "border-blue-700 bg-blue-700 text-white" : "border-gray-200 hover:border-blue-400 bg-white text-gray-700"}`}>
                {s.subject_key}
                <span className="ml-1.5 text-xs opacity-70">{s.week_count}w</span>
              </button>
            ))}
            <Link href="/bow-upload"
              className="px-4 py-2 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-400 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1 transition-all">
              <Upload className="w-3.5 h-3.5" /> Add Subject
            </Link>
          </div>
        )}
      </div>

      {/* Step 2: Week Selection */}
      {selectedSubject && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">2</span>
            Pumili ng Linggo / Competency
          </h2>
          {loadingWeeks ? (
            <div className="flex items-center gap-2 text-sm text-gray-400"><Loader2 className="w-4 h-4 animate-spin" /> Nilo-load...</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(weeksByTerm).map(([term, termWeeks]) => (
                <div key={term}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">{term}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {termWeeks.map((w) => (
                      <button key={w.label} onClick={() => handleSelectWeek(w)}
                        className={`px-2.5 py-1 text-xs rounded-lg border font-medium transition-colors ${
                          selectedWeek?.label === w.label
                            ? w.competency === "ORIENTATION_WEEK" ? "bg-orange-600 text-white border-orange-600" : "bg-blue-700 text-white border-blue-700"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                        }`}>
                        {w.competency === "ORIENTATION_WEEK" ? "Orientation" : `W${w.week}`}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orientation redirect */}
      {isOrientationWeek && (
        <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-6 text-center space-y-3">
          <p className="text-2xl">📋</p>
          <h3 className="font-bold text-orange-900">Orientation Week Mode</h3>
          <p className="text-sm text-orange-800">Ang unang linggo ay para sa Orientation. Tingnan ang mga handa nang ILAW plans.</p>
          <Link href="/orientation" className="inline-block bg-orange-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700">
            Orientation Week Templates →
          </Link>
        </div>
      )}

      {/* Step 3: Competency + Integration */}
      {selectedWeek && !isOrientationWeek && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-bold text-gray-800 flex items-center gap-2">
            <span className="bg-blue-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">3</span>
            Kasanayang Pampagkatuto
          </h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
            <p className="text-xs font-semibold text-blue-600 mb-1">{selectedWeek.label}</p>
            <p className="text-sm text-gray-800 leading-relaxed">{selectedWeek.competency}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">Subject Integration (opsyonal)</p>
            <div className="flex flex-wrap gap-2">
              {INTEGRATIONS.map((s) => (
                <button key={s} onClick={() => toggleIntegration(s)}
                  className={`px-3 py-1.5 text-xs rounded-full border font-medium transition-colors ${integrations.includes(s) ? "bg-blue-700 text-white border-blue-700" : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          <button onClick={handleUnpack} disabled={loadingUnpack}
            className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loadingUnpack ? <><Loader2 className="w-4 h-4 animate-spin" /> Hinihimay...</> : <><BookOpen className="w-4 h-4" /> I-unpack sa 4 Sessions →</>}
          </button>
        </div>
      )}

      {/* Step 4: Session preview + Generate */}
      {unpackResult && (
        <div className="space-y-4">
          <h2 className="font-bold text-gray-800">
            4 Sessions — <span className="text-blue-700">{selectedWeek?.label}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-3">
            {unpackResult.sessions.map((s) => (
              <div key={s.day} className={`border-2 rounded-xl p-4 space-y-1 ${SESSION_COLORS[s.session_type] ?? "bg-gray-50 border-gray-300"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase opacity-70">Day {s.day}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 border border-current/20 font-medium">{s.session_type}</span>
                </div>
                <p className="font-bold text-sm">{s.title}</p>
                <p className="text-xs opacity-75 leading-relaxed">{s.focus}</p>
              </div>
            ))}
          </div>
          <button onClick={() => handleGenerateWeekly(unpackResult.sessions)} disabled={loadingGenerate}
            className="w-full bg-green-700 text-white py-3 rounded-xl font-bold text-sm hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-2">
            {loadingGenerate
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Ginagawa ang buong weekly plan... (1–2 minuto)</>
              : <><FileText className="w-4 h-4" /> Gumawa ng Buong Weekly ILAW Plan (All 4 Sessions) →</>
            }
          </button>
        </div>
      )}

      {/* Generated Weekly Plan */}
      {weeklyPlan && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-gray-900 text-lg">
              Weekly ILAW Plan — {weeklyPlan.subject} {weeklyPlan.week_label}
            </h2>
            <button onClick={handleExport} disabled={loadingExport}
              className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 transition-colors">
              {loadingExport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              I-download bilang DOCX
            </button>
          </div>

          {/* Competency & Resources */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-2">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wide">Learning Competency</p>
            <p className="text-sm text-gray-800">{weeklyPlan.learning_competency}</p>
            {weeklyPlan.learning_resources && (
              <>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mt-2">Learning Resources</p>
                <p className="text-sm text-gray-700">{weeklyPlan.learning_resources}</p>
              </>
            )}
          </div>

          {/* 4 Session cards */}
          <div className="grid md:grid-cols-2 gap-4">
            {weeklyPlan.sessions.map((s) => <SessionCard key={s.day} session={s} />)}
          </div>

          {/* Ways Forward */}
          <WaysForwardCard wf={weeklyPlan.ways_forward} />

          {/* AI Declaration */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-5 py-3 text-xs text-gray-500">
            <span className="font-semibold text-gray-700">Declaration of AI Use (DO 3, s. 2026):</span>{" "}
            {weeklyPlan.ai_declaration}
          </div>
        </div>
      )}
    </div>
  )
}
