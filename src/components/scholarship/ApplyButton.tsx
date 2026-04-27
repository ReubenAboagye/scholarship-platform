"use client";

import { useState, useEffect } from "react";
import { ExternalLink, X, LogIn, UserPlus, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// ─────────────────────────────────────────────────────────────
// ApplyButton — gated outbound click for the public scholarship
// detail page.
//
// If `loggedIn` is true, the button is a plain link to /go/[id]
// which is the server-side redirect that fires the match event
// and forwards to the external URL.
//
// If `loggedIn` is false, the click opens a modal with two CTAs:
// sign in or create account. Both carry a `?redirectTo=/go/[id]`
// param so the user lands on the gated redirect after auth, which
// then sends them out to the application URL.
//
// We could fall back to a server-side redirect on logged-out
// click (the route handles that case too), but the modal provides
// the *why* — without it a logged-out user clicks Apply, lands on
// a login screen, and may not understand why. The modal explains
// the trade and feels intentional rather than gatekeeping.
// ─────────────────────────────────────────────────────────────

type ApplyButtonProps = {
  /** Scholarship UUID or slug. Either works against /go/[id]. */
  scholarshipId: string;
  /**
   * Whether the current user is authenticated. Resolved on the
   * server (the parent page already loads `user`) and passed in
   * to avoid a second auth round-trip on the client.
   */
  loggedIn: boolean;
  /** Visual variant. Hero is full-bleed, card is the sidebar. */
  variant?: "hero" | "card";
  /** Optional override label (defaults to "Apply Now"). */
  label?: string;
  className?: string;
};

const SIGNUP_PITCH = [
  "Save scholarships and pick them back up later",
  "Track your applications and never miss a deadline",
  "Get matched to opportunities you're eligible for",
];

const SERIF_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

export default function ApplyButton({
  scholarshipId,
  loggedIn,
  variant = "card",
  label   = "Apply Now",
  className,
}: ApplyButtonProps) {
  const [open, setOpen] = useState(false);

  // Lock background scroll while the modal is open. Restored on
  // close or unmount. Pure cosmetic — without this, mobile users
  // can scroll the page underneath the modal.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Esc to dismiss.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const goPath  = `/go/${scholarshipId}`;
  const loginQs = `redirectTo=${encodeURIComponent(goPath)}`;

  // Visual styles match the original Apply button on the public
  // detail page so swapping it in doesn't change the layout.
  const baseClass =
    variant === "hero"
      ? "inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-lg transition-colors"
      : "flex items-center justify-center gap-2 w-full py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold transition-colors text-sm rounded-xl shadow-md active:scale-95";

  // Logged-in path: just a link. Server route handles event logging
  // and the external redirect — keeps us out of the URL on the
  // client side, which is good for both UX and analytics.
  if (loggedIn) {
    return (
      <a href={goPath} className={`${baseClass} ${className ?? ""}`}>
        {label} <ExternalLink className={variant === "hero" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${baseClass} ${className ?? ""}`}
      >
        {label} <ExternalLink className={variant === "hero" ? "w-3.5 h-3.5" : "w-4 h-4"} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{    opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4"
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-labelledby="apply-modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1,    y: 0  }}
              exit={{    opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              className="bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] max-w-[480px] w-full relative rounded-sm overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-1.5 w-full bg-gradient-to-r from-slate-900 via-blue-800 to-slate-900" />

              <div className="p-8 pb-6">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="absolute right-6 top-6 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="mb-6 pr-8">
                  <h2 id="apply-modal-title" className="text-2xl text-slate-900 tracking-tight font-semibold" style={SERIF_FONT}>
                    Authentication Required
                  </h2>
                  <div className="w-12 h-1 bg-gradient-to-r from-blue-700 to-blue-500 mt-4 mb-4" />
                  <p className="text-sm text-slate-600 font-medium leading-relaxed">
                    Access to the official application portal is restricted. Please authenticate your identity to proceed securely with your application.
                  </p>
                </div>

                <div className="bg-slate-50/80 border border-slate-200/60 p-5 mb-8 rounded-sm shadow-inner">
                  <p className="text-sm font-semibold text-slate-800 mb-4">Authentication provides access to:</p>
                  <ul className="space-y-3.5">
                    {SIGNUP_PITCH.map((line) => (
                      <li key={line} className="flex items-start gap-3.5 text-sm text-slate-700 font-medium">
                        <div className="mt-1.5 w-1.5 h-1.5 bg-blue-600 rounded-sm shadow-sm flex-shrink-0" />
                        <span className="leading-tight">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <a
                    href={`/auth/login?${loginQs}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg rounded-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </a>
                  <a
                    href={`/auth/signup?${loginQs}`}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-3 border border-slate-300 hover:border-blue-600 hover:text-blue-700 bg-white hover:bg-blue-50 text-slate-800 font-medium text-sm transition-all rounded-sm"
                  >
                    <UserPlus className="w-4 h-4" />
                    Create Account
                  </a>
                </div>
              </div>
              
              <div className="px-8 py-4 bg-gradient-to-r from-slate-100 to-slate-50 border-t border-slate-200 flex items-center gap-2.5 text-slate-500">
                <Shield className="w-4 h-4 text-slate-400" />
                <p className="text-[13px] font-medium">
                  Official portal. All data is protected and strictly confidential.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
