import Link from "next/link";
import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="font-black text-lg text-white">
                Scholar<span className="text-brand-400">Match</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs">
              AI-powered scholarship discovery for ambitious students seeking international higher education opportunities.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/scholarships" className="hover:text-white transition-colors">Browse Scholarships</Link></li>
              <li><Link href="/#how-it-works" className="hover:text-white transition-colors">How It Works</Link></li>
              <li><Link href="/auth/signup" className="hover:text-white transition-colors">Create Account</Link></li>
              <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
            </ul>
          </div>

          {/* Countries */}
          <div>
            <h4 className="text-sm font-semibold text-slate-200 mb-3">Destinations</h4>
            <ul className="space-y-2 text-sm">
              {[
                { flag: "🇬🇧", name: "United Kingdom" },
                { flag: "🇺🇸", name: "United States" },
                { flag: "🇩🇪", name: "Germany" },
                { flag: "🇨🇦", name: "Canada" },
              ].map((c) => (
                <li key={c.name}>
                  <Link
                    href={`/scholarships?country=${c.name === "United Kingdom" ? "UK" : c.name === "United States" ? "USA" : c.name}`}
                    className="hover:text-white transition-colors"
                  >
                    {c.flag} {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} ScholarMatch. Developed by <span className="text-slate-300">GenTech Solutions</span>.</p>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-white transition-colors">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
