"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, User, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/client";

const SERIF_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

function SignupPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));

  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}` },
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
      },
    });
    if (authError) { setError(authError.message); setLoading(false); return; }
    setSuccess(true);
    setLoading(false);
  }

  const loginHref = redirectTo === "/dashboard"
    ? "/auth/login"
    : `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;

  if (success) {
    return (
      <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 text-center relative z-20">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100">
          <CheckCircle className="h-6 w-6 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-medium text-slate-900 tracking-tight" style={SERIF_FONT}>Check your email</h2>
        <p className="mt-3 text-sm text-slate-500 font-medium leading-relaxed">
          We sent a confirmation link to <span className="font-semibold text-slate-900">{email}</span>. Click it to activate your account.
        </p>
        <a href="/auth/login" className="mt-8 inline-block w-full py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-sm font-semibold text-white transition-all">
          Return to sign in
        </a>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 sm:p-10 relative z-20">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-medium text-slate-900 tracking-tight" style={SERIF_FONT}>Create an account</h1>
        <p className="mt-2 text-sm text-slate-500 font-medium">Free access to AI-powered scholarship matching</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 px-4 py-3 mb-6 bg-red-50/50 border border-red-100 rounded-xl text-sm text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button type="button" onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 text-sm font-semibold text-slate-700 transition-all duration-200 mb-6 group">
        <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0 group-hover:scale-105 transition-transform">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">or sign up with email</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="fullName" className="block text-xs font-semibold text-slate-700">Full name</label>
          <div className="relative">
            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input id="fullName" type="text" required autoComplete="name" autoFocus value={fullName}
              onChange={(e) => setFullName(e.target.value)} placeholder="Your full name"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 font-medium outline-none transition-all focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input id="email" type="email" required autoComplete="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 font-medium outline-none transition-all focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-xs font-semibold text-slate-700">Password</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input id="password" type={showPass ? "text" : "password"} required minLength={8}
              autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full pl-10 pr-12 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm placeholder:text-slate-400 font-medium outline-none transition-all focus:bg-white focus:border-slate-400 focus:ring-4 focus:ring-slate-100" />
            <button type="button" tabIndex={-1} onClick={() => setShowPass((v) => !v)}
              aria-label={showPass ? "Hide password" : "Show password"}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 hover:text-slate-700 transition-colors">
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading}
          className="w-full mt-2 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 flex items-center justify-center gap-2">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : "Create Account"}
        </button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm font-medium text-slate-500">
          Already have an account?{" "}
          <a href={loginHref} className="text-slate-900 hover:underline underline-offset-4 font-semibold transition-all">Sign in</a>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <SignupPageContent />
    </Suspense>
  );
}
