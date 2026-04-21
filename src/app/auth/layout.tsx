export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const LOGO_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="px-6 py-6 absolute top-0 w-full flex items-center justify-between z-10">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <a href="/" className="flex items-baseline">
            <span className="text-xl sm:text-2xl tracking-tight text-slate-900" style={{ ...LOGO_FONT, fontWeight: 600 }}>
              Scholar<span className="text-brand-600" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
            </span>
          </a>
          <span className="text-xs font-medium text-slate-500 hidden sm:block bg-white px-3 py-1.5 rounded-full border border-slate-200">
            AI-powered scholarship discovery
          </span>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 sm:px-6">
        {children}
      </main>

      <footer className="py-6 px-6 relative z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400 font-medium tracking-wide">
          <span>© {new Date().getFullYear()} ScholarBridge</span>
          <div className="flex items-center gap-6">
            <a href="/privacy" className="hover:text-slate-900 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-slate-900 transition-colors">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
