import Link from "next/link"
import { BookOpen, ClipboardList, CalendarDays, Lightbulb, ArrowRight } from "lucide-react"

const FEATURES = [
  {
    href: "/lesson-planner",
    icon: <BookOpen className="w-7 h-7 text-blue-700" />,
    title: "ILAW Lesson Planner",
    description:
      "I-input ang isang BOW objective. Awtomatikong hahati sa 4 sessions at gagawa ng buong ILAW lesson plan na classroom-ready.",
    cta: "Mag-plano ngayon",
    color: "border-blue-200 hover:border-blue-400",
  },
  {
    href: "/diagnostic",
    icon: <ClipboardList className="w-7 h-7 text-green-700" />,
    title: "Diagnostic Tracker",
    description:
      "I-log ang Reading at Math levels ng bawat estudyante. May kasamang Health Assessment at BMI Calculator para sa BSYA.",
    cta: "Mag-assess ng estudyante",
    color: "border-green-200 hover:border-green-400",
  },
  {
    href: "/orientation",
    icon: <CalendarDays className="w-7 h-7 text-orange-600" />,
    title: "Orientation Week Templates",
    description:
      "5 handa nang ILAW plans para sa unang linggo: Values Formation, SEL, Wellbeing, Anti-Bullying, at Health Awareness.",
    cta: "Tingnan ang templates",
    color: "border-orange-200 hover:border-orange-400",
  },
]

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="text-center space-y-4 py-8">
        <div className="flex justify-center">
          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-widest">
            Para sa Mga Guro
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 leading-tight">
          DepEd ILAW Assistant
        </h1>
        <p className="text-gray-500 max-w-xl mx-auto text-base leading-relaxed">
          Ang unang AI-powered na kasangkapan para sa mga Filipino educator na nag-iimplementa ng{" "}
          <strong>ILAW framework</strong> at ang bagong <strong>4-session teaching week</strong>.
          Hindi na mahirap ang pagga-unpack ng BOW.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Link
            href="/lesson-planner"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors flex items-center gap-2"
          >
            Magsimula <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/orientation"
            className="border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-gray-100 transition-colors"
          >
            Orientation Week
          </Link>
        </div>
      </section>

      <section>
        <div className="flex items-center gap-2 mb-5">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          <h2 className="text-lg font-semibold text-gray-800">Mga Tampok</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={`group border-2 rounded-xl p-5 bg-white transition-all duration-200 flex flex-col gap-3 ${f.color}`}
            >
              <div>{f.icon}</div>
              <div>
                <h3 className="font-bold text-gray-900">{f.title}</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">{f.description}</p>
              </div>
              <span className="text-sm font-semibold text-blue-700 group-hover:underline mt-auto flex items-center gap-1">
                {f.cta} <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-blue-50 border border-blue-100 rounded-xl p-6 text-sm text-blue-900 leading-relaxed">
        <strong>Paano gumagana ang ILAW Unpacking:</strong> I-type ang isang broad na layunin mula sa iyong Budget of Work
        (halimbawa: &quot;Ang Kasaysayan ng Zamboanga&quot;). Awtomatikong hahati ng AI sa 4 angkop na sessions na
        sumusunod sa progression na: <em>Panimula → Deep Learning → Deep Learning 2 → Pagtataya</em>.
        Pagkatapos, piliin ang alinmang session para makuha ang buong ILAW lesson plan — na may step-by-step
        na pamamaraan, tiyak na aktibidad, at assessment tool.
      </section>
    </div>
  )
}
