"use client";

import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-900/75">Account Recovery</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">Reset your password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Enter your account email and we&apos;ll send a secure reset link.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-[1.25rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success ? (
        <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-semibold">Reset link sent</p>
              <p className="mt-1 text-emerald-900/80">
                Check <span className="font-semibold">{email}</span> for the next step. Use the most recent email only.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Email address</label>
            <div className="relative rounded-[1.25rem] border border-slate-200 bg-[#faf7f2] transition focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-100">
              <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-[1.25rem] border-none bg-transparent py-4 pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-[1.35rem] bg-emerald-900 px-5 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(6,78,59,0.18)] transition hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            {loading ? "Sending link..." : "Send reset link"}
          </button>
        </form>
      )}

      <a href="/auth/login" className="mt-6 inline-flex text-sm font-semibold text-emerald-900 transition hover:text-emerald-950">
        Back to sign in
      </a>
    </div>
  );
}
