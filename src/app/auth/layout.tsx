import { GraduationCap } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="w-7 h-7 bg-blue-600 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[15px] text-slate-900 tracking-tight">
              Scholar<span className="text-blue-600">Match</span>
            </span>
          </Link>
          <span className="text-xs text-slate-400 hidden sm:block">AI-powered scholarship discovery</span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </main>

      <footer className="border-t border-slate-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} ScholarMatch · GenTech Solutions</span>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
            <a href="/terms"   className="hover:text-slate-600 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
