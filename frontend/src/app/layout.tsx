import type { Metadata } from "next"
import { Geist } from "next/font/google"
import "./globals.css"
import Link from "next/link"
import { BookOpen, ClipboardList, CalendarDays } from "lucide-react"

const geist = Geist({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "DepEd ILAW Assistant",
  description: "AI-powered lesson planning toolkit for Filipino educators",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fil" style={{ colorScheme: "light" }}>
      <body className={`${geist.className} min-h-screen`} style={{ background: "#f9fafb", color: "#111827" }}>
        <header className="bg-blue-800 text-white shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
              <BookOpen className="w-5 h-5" />
              ILAW Assistant
            </Link>
            <nav className="flex gap-4 text-sm font-medium">
              <Link href="/lesson-planner" className="flex items-center gap-1 hover:text-blue-200 transition-colors">
                <BookOpen className="w-4 h-4" />
                Lesson Planner
              </Link>
              <Link href="/diagnostic" className="flex items-center gap-1 hover:text-blue-200 transition-colors">
                <ClipboardList className="w-4 h-4" />
                Diagnostic
              </Link>
              <Link href="/orientation" className="flex items-center gap-1 hover:text-blue-200 transition-colors">
                <CalendarDays className="w-4 h-4" />
                Orientation Week
              </Link>
            </nav>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="text-center text-xs text-gray-400 py-6">
          DepEd ILAW Assistant — Para sa mga guro ng Pilipinas
        </footer>
      </body>
    </html>
  )
}
