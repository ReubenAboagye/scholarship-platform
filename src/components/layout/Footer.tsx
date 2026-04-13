import { GraduationCap } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="md:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <span className="text-xl font-black text-white">Scholar<span className="text-blue-400">Match</span></span>
            </a>
            <p className="text-sm leading-relaxed max-w-xs mb-4">
              AI-powered scholarship discovery for ambitious international students. UK, USA, Germany, and Canada — all in one place.
            </p>
            <p className="text-xs text-slate-500">Developed by <span className="text-slate-300 font-medium">GenTech Solutions</span> · Ghana</p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-4">Platform</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/scholarships"   className="hover:text-white transition-colors">Browse Scholarships</a></li>
              <li><a href="/#how-it-works"  className="hover:text-white transition-colors">How It Works</a></li>
              <li><a href="/about"          className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="/faq"            className="hover:text-white transition-colors">FAQ</a></li>
              <li><a href="/contact"        className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Destinations */}
          <div>
            <h4 className="text-sm font-bold text-slate-200 mb-4">Destinations</h4>
            <ul className="space-y-2.5 text-sm">
              <li><a href="/scholarships?country=UK"      className="hover:text-white transition-colors">🇬🇧 United Kingdom</a></li>
              <li><a href="/scholarships?country=USA"     className="hover:text-white transition-colors">🇺🇸 United States</a></li>
              <li><a href="/scholarships?country=Germany" className="hover:text-white transition-colors">🇩🇪 Germany</a></li>
              <li><a href="/scholarships?country=Canada"  className="hover:text-white transition-colors">🇨🇦 Canada</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <p>© {new Date().getFullYear()} ScholarMatch by GenTech Solutions. All rights reserved.</p>
          <div className="flex gap-5">
            <a href="/privacy" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="/terms"   className="hover:text-white transition-colors">Terms of Use</a>
            <a href="/contact" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
