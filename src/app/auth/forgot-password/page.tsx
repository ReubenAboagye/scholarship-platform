"use client";

import { useState, type FormEvent } from "react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { AlertCircle, ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { resetPasswordAction } from "@/app/auth/actions";

const SERIF_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } },
};

function BrandPanel() {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className="relative hidden lg:flex lg:w-1/2 flex-col justify-center overflow-hidden bg-[#0B1120] text-white"
    >
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <span
          className="text-[14rem] xl:text-[18rem] font-bold text-white/[0.025] leading-none tracking-tighter whitespace-nowrap"
          style={SERIF_FONT}
        >
          Reset
        </span>
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-transparent to-brand-800/10" />
      </m.div>
    </LazyMotion>
  );
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(event.currentTarget as HTMLFormElement);
    const result = await resetPasswordAction(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="flex w-full min-h-screen">
        <BrandPanel />
        <m.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
          className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 bg-white"
        >
          <div className="w-full max-w-[360px] text-center">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
              <CheckCircle className="h-6 w-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-medium text-zinc-900 tracking-tight" style={SERIF_FONT}>
              Check your email
            </h2>
            <p className="mt-3 text-sm text-zinc-500 font-medium leading-relaxed">
              If an account exists for <span className="font-semibold text-zinc-900">{email}</span>, we&apos;ve sent a password reset link. Use the most recent email only.
            </p>
            <a
              href="/auth/login"
              className="mt-8 inline-block w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm font-medium text-white transition-colors"
            >
              Return to sign in
            </a>
          </div>
        </m.div>
      </div>
    );
  }

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex w-full min-h-screen">
        <BrandPanel />

        <m.div
        variants={container}
        initial="hidden"
        animate="show"
        className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 bg-white"
      >
        <div className="w-full max-w-[360px]">
          <m.div variants={item} className="flex justify-center mb-6">
            <a href="/" className="flex items-baseline">
              <span
                className="text-2xl tracking-tight text-zinc-900"
                style={{ ...SERIF_FONT, fontWeight: 600 }}
              >
                Scholar
                <span
                  className="text-brand-600"
                  style={{ fontStyle: "italic", fontWeight: 500 }}
                >
                  Bridge
                </span>
              </span>
            </a>
          </m.div>

          <m.h1
            variants={item}
            className="text-center text-lg font-medium text-zinc-900"
            style={SERIF_FONT}
          >
            Reset your password
          </m.h1>
          <m.p variants={item} className="text-center text-xs text-zinc-500 mt-2 mb-8">
            Enter your email and we&apos;ll send you a secure reset link.
          </m.p>

          {error && (
            <m.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700"
            >
              <AlertCircle className="size-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </m.div>
          )}

          <m.form onSubmit={handleSubmit} variants={item} className="space-y-3.5">
            <div
              className="absolute -left-[9999px] -top-[9999px] size-0 overflow-hidden opacity-0"
              aria-hidden="true"
            >
              <input
                type="text"
                name="website"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 outline-none transition-all focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Sending link...
                </span>
              ) : (
                "Send reset link"
              )}
            </button>
          </m.form>

          <m.div variants={item} className="flex items-center justify-center mt-6">
            <a
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-brand-700 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              Back to sign in
            </a>
          </m.div>
        </div>
      </m.div>
    </div>
  </LazyMotion>
  );
}
