const LOGO_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <a href="/" className="inline-flex items-baseline mb-4">
              <span className="text-2xl text-white" style={{ ...LOGO_FONT, fontWeight: 600 }}>
                Scholar<span className="text-brand-300" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
              </span>
            </a>
            <p className="text-sm leading-relaxed max-w-sm mb-4 text-slate-400">
              Scholarship discovery for ambitious international students. UK, USA, Germany, and Canada — every opportunity verified, every link direct.
            </p>
            <p className="text-xs text-slate-500">
              Developed by <span className="text-slate-300 font-medium">GenTech Solutions</span> · Ghana
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 mb-4">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/scholarships" className="hover:text-white transition-colors">Browse scholarships</a></li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <li><a href="/#how-it-works" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About us</a></li>
              <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-300 mb-4">Support</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of use</a></li>
              <li><a href="/destinations" className="hover:text-white transition-colors">Study destinations</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-slate-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} ScholarBridge by GenTech Solutions. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
