"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { AlertCircle, ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  return (
    <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-white/60 bg-white/85 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-10">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-900/75">New Password</p>
        <h1 className="mt-4 text-3xl font-black tracking-[-0.04em] text-slate-950">Choose a new password</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Use a password you haven&apos;t used before for this account.
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
              <p className="font-semibold">Password updated</p>
              <p className="mt-1 text-emerald-900/80">You can now sign in with your new password.</p>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">New password</label>
            <div className="relative rounded-[1.25rem] border border-slate-200 bg-[#faf7f2] transition focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-100">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-[1.25rem] border-none bg-transparent py-4 pl-12 pr-4 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-800">Confirm password</label>
            <div className="relative rounded-[1.25rem] border border-slate-200 bg-[#faf7f2] transition focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-100">
              <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Re-enter password"
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
            {loading ? "Updating password..." : "Update password"}
          </button>
        </form>
      )}

      <Link href="/auth/login" className="mt-6 inline-flex text-sm font-semibold text-emerald-900 transition hover:text-emerald-950">
        Back to sign in
      </Link>
    </div>
  );
}
