"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  redirectUrl: string;
}

const SERIF = { fontFamily: "Fraunces, Georgia, ui-serif, serif" } as const;

export default function AuthModal({ isOpen, onClose, featureName, redirectUrl }: AuthModalProps) {
  
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, type: "spring", bounce: 0, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden pointer-events-auto relative"
            >
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-amber-600" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1 rounded-full">
                    Login Required
                  </span>
                </div>

                <h3 className="text-2xl text-slate-900 mb-3" style={SERIF}>
                  Member Exclusive
                </h3>
                
                <p className="text-slate-600 text-sm leading-relaxed font-light mb-8">
                  To access <span className="font-semibold text-slate-900">{featureName}</span>, you need to be signed in to your ScholarBridge account. Creating an account is completely free for students.
                </p>

                <div className="space-y-3">
                  <Link 
                    href={`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`}
                    onClick={onClose}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white hover:bg-slate-800 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200"
                  >
                    Log in to continue
                  </Link>
                  <Link 
                    href={`/auth/signup?redirect=${encodeURIComponent(redirectUrl)}`}
                    onClick={onClose}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors duration-200"
                  >
                    Create a free account <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
              
              <div className="border-t border-slate-50 bg-slate-50/50 p-4 text-center">
                <p className="text-xs text-slate-500 font-medium tracking-wide">
                  YOUR DATA IS PRIVATE AND SECURE
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
