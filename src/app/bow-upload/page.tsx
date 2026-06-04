"use client"

import { useState } from "react"
import { Upload, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"

const GRADES = ["Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","Grade 8","Grade 9","Grade 10"]
const FORMAT_TYPES = [
  { value: "ap", label: "Standard AP Format", description: "Araling Panlipunan, Filipino, Science, Math — simple Week | Competency table" },
  { value: "gmrc", label: "GMRC Format", description: "GMRC, ESP — grouped week ranges with separate competency rows" },
]

export default function BOWUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [subjectKey, setSubjectKey] = useState("")
  const [grade, setGrade] = useState("Grade 5")
  const [formatType, setFormatType] = useState("ap")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ weeks_parsed: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload() {
    if (!file || !subjectKey.trim()) return
    setLoading(true)
    setError(null)
    setResult(null)

    const form = new FormData()
    form.append("file", file)
    form.append("subject_key", subjectKey)
    form.append("grade", grade)
    form.append("format_type", formatType)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"}/api/bow/upload`, {
        method: "POST",
        body: form,
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail ?? "Upload failed")
      }
      const data = await res.json()
      setResult(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <Link href="/lesson-planner" className="text-xs text-blue-700 hover:underline">← Bumalik sa Lesson Planner</Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">Mag-upload ng Bagong BOW</h1>
        <p className="text-sm text-gray-500 mt-1">I-upload ang kahit anong DepEd BOW PDF at awtomatiko itong ma-pa-parse.</p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Pangalan ng Asignatura</label>
          <input
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="e.g. Araling Panlipunan, Filipino, Science"
            value={subjectKey}
            onChange={(e) => setSubjectKey(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">Grade Level</label>
          <select
            className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
          >
            {GRADES.map((g) => <option key={g}>{g}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Format ng PDF</label>
          <div className="space-y-2">
            {FORMAT_TYPES.map((f) => (
              <button
                key={f.value}
                onClick={() => setFormatType(f.value)}
                className={`w-full text-left border-2 rounded-lg p-3 transition-colors ${
                  formatType === f.value ? "border-blue-700 bg-blue-50" : "border-gray-200 hover:border-blue-300"
                }`}
              >
                <p className="text-sm font-semibold text-gray-900">{f.label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">BOW PDF File</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              {file ? (
                <span className="text-sm font-medium text-blue-700">{file.name}</span>
              ) : (
                <span className="text-sm text-gray-500">I-click para pumili ng PDF</span>
              )}
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 flex items-center gap-2 text-sm text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span>Na-parse ng matagumpay! <strong>{result.weeks_parsed} weeks</strong> ang nakuha.</span>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || !file || !subjectKey.trim()}
          className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
        >
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ina-upload at pina-parse...</> : <><Upload className="w-4 h-4" /> I-upload at I-parse</>}
        </button>
      </div>
    </div>
  )
}
