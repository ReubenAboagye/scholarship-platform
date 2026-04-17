import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="inline-flex items-center gap-1 mb-4">
              <span className="text-lg font-black text-white">Scholar</span>
              <span className="text-lg font-black text-brand-400">Match</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs mb-4">
              AI-powered scholarship discovery for ambitious international students. UK, USA, Germany, and Canada all in one place.
            </p>
            <p className="text-xs text-slate-500">
              Developed by <span className="text-slate-300 font-medium">GenTech Solutions</span> · Ghana
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/scholarships" className="hover:text-white transition-colors">Browse Scholarships</Link></li>
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <li><a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="/about" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/faq" className="hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-300 mb-4">Support</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-white transition-colors">Terms of Use</a></li>
              <li><a href="/destinations" className="hover:text-white transition-colors">Study Destinations</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} ScholarBridge AI by GenTech Solutions. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-white transition-colors">Terms of Use</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
