import { Mail, MapPin, ExternalLink } from "lucide-react";

const LOGO_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900 text-zinc-300 border-t border-brand-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16">
          <div className="md:col-span-2">
            <a href="/" className="inline-flex items-baseline mb-4">
              <span className="text-2xl text-white" style={{ ...LOGO_FONT, fontWeight: 600 }}>
                Scholar<span className="text-amber-400" style={{ fontStyle: "italic", fontWeight: 500 }}>Bridge</span>
              </span>
            </a>
            <p className="text-sm leading-relaxed max-w-sm mb-6 text-zinc-400">
              Verified scholarship opportunities from government agencies and accredited universities. UK, USA, Germany, and Canada — every opportunity verified, every link direct.
            </p>
            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-6">
              <MapPin className="size-3.5" />
              <span>Ghana · Serving international students worldwide</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <a href="/contact" className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 transition-colors">
                <Mail className="size-3.5" />
                <span>Contact us</span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400 mb-5">Platform</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/scholarships" className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1 group">
                Browse scholarships
                <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a></li>
              <li><a href="/#how-it-works" className="text-zinc-400 hover:text-white transition-colors">How it works</a></li>
              <li><a href="/about" className="text-zinc-400 hover:text-white transition-colors">About us</a></li>
              <li><a href="/faq" className="text-zinc-400 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/destinations" className="text-zinc-400 hover:text-white transition-colors">Study destinations</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-amber-400 mb-5">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li><a href="/privacy" className="text-zinc-400 hover:text-white transition-colors">Privacy policy</a></li>
              <li><a href="/terms" className="text-zinc-400 hover:text-white transition-colors">Terms of use</a></li>
              <li><a href="/contact" className="text-zinc-400 hover:text-white transition-colors">Contact support</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-brand-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-500">
          <p>© {new Date().getFullYear()} ScholarBridge. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="/privacy" className="hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="/terms" className="hover:text-zinc-300 transition-colors">Terms</a>
            <a href="/contact" className="hover:text-zinc-300 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
