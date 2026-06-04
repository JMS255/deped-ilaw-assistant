"use client"

import { useState, useEffect } from "react"
import { getOrientationPlans, type OrientationPlan } from "@/lib/api"
import { CalendarDays, ChevronDown, ChevronUp, Printer, Loader2 } from "lucide-react"

const THEME_COLORS: Record<string, string> = {
  "Values Formation": "bg-purple-100 text-purple-800 border-purple-300",
  "Socio-Emotional Learning & Wellbeing": "bg-blue-100 text-blue-800 border-blue-300",
  "Anti-Bullying": "bg-red-100 text-red-800 border-red-300",
  "Classroom Management & Community Building": "bg-green-100 text-green-800 border-green-300",
  "Health & Wellbeing": "bg-rose-100 text-rose-800 border-rose-300",
}

function PlanCard({ plan }: { plan: OrientationPlan }) {
  const [open, setOpen] = useState<string | null>(null)

  const sections = [
    { key: "intention", label: "I — Intention (Layunin)", content: plan.intention },
    { key: "learning_experience", label: "L — Learning Experience (Karanasan sa Pagkatuto)", content: plan.learning_experience },
    { key: "assessment", label: "A — Assessment (Pagtataya)", content: plan.assessment },
    { key: "wrap_up", label: "W — Wrap-Up (Pagtatapos)", content: plan.wrap_up },
  ]

  const themeColor = THEME_COLORS[plan.theme] ?? "bg-gray-100 text-gray-800 border-gray-300"

  return (
    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
      <div className="px-5 py-4 border-b bg-gray-50 flex items-start justify-between gap-3">
        <div className="space-y-1">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${themeColor}`}>
            {plan.theme}
          </span>
          <h3 className="font-bold text-gray-900 text-base">Day {plan.day}: {plan.title}</h3>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1 bg-blue-700 hover:bg-blue-800 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors shrink-0"
        >
          <Printer className="w-3.5 h-3.5" /> I-print
        </button>
      </div>

      <div className="divide-y">
        {sections.map((s) => (
          <div key={s.key}>
            <button
              className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
              onClick={() => setOpen(open === s.key ? null : s.key)}
            >
              {s.label}
              {open === s.key ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
            </button>
            {open === s.key && (
              <div className="px-5 pb-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {s.content}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function OrientationPage() {
  const [plans, setPlans] = useState<OrientationPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<number | null>(null)

  useEffect(() => {
    getOrientationPlans()
      .then((data) => { setPlans(data); setActiveDay(data[0]?.day ?? null) })
      .catch((e) => setError(e instanceof Error ? e.message : "Hindi ma-load ang mga template."))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Orientation Week Templates</h1>
        <p className="text-gray-500 text-sm mt-1">5 handa nang ILAW lesson plans para sa unang linggo ng pasukan. Libre at ready-to-print.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Nilo-load ang mga template...
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!loading && plans.length > 0 && (
        <>
          {/* Day tabs */}
          <div className="flex gap-2 flex-wrap">
            {plans.map((p) => (
              <button
                key={p.day}
                onClick={() => setActiveDay(p.day)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                  activeDay === p.day
                    ? "bg-blue-700 text-white border-blue-700"
                    : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Day {p.day}
              </button>
            ))}
          </div>

          {/* Active plan */}
          {plans.filter((p) => p.day === activeDay).map((plan) => (
            <PlanCard key={plan.day} plan={plan} />
          ))}

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 text-sm text-blue-900 leading-relaxed">
            <strong>Tip:</strong> Ang mga template na ito ay angkop para sa lahat ng grade levels. I-customize ang pangalan ng klase at seksiyon bago i-print.
            Para sa mga may espesyal na pangangailangan (SPED, IP learners), makipag-ugnayan sa inyong Master Teacher para sa differentiated versions.
          </div>
        </>
      )}
    </div>
  )
}