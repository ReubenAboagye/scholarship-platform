"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { signInAction, signInWithGoogleAction } from "@/app/auth/actions";

const SERIF_FONT = { fontFamily: "Fraunces, Georgia, ui-serif, serif" };

function BrandPanel() {
  return (
    <div className="relative hidden lg:flex lg:w-1/2 flex-col justify-center overflow-hidden bg-[#0B1120] text-white">
      {/* Large decorative background text */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <span
          className="text-[16rem] xl:text-[20rem] font-bold text-white/[0.025] leading-none tracking-tighter whitespace-nowrap"
          style={SERIF_FONT}
        >
          Login
        </span>
      </div>
      
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-transparent to-brand-800/10" />
    </div>
  );
}

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");

  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    formData.append("redirectTo", redirectTo);
    const result = await signInAction(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    window.location.href = result.redirectTo ?? "/dashboard";
  }

  async function handleGoogle() {
    const formData = new FormData();
    formData.append("redirectTo", redirectTo);
    formData.append("origin", window.location.origin);
    const result = await signInWithGoogleAction(formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
    }
  }

  return (
    <div className="flex w-full min-h-screen">
      <BrandPanel />

      <div className="flex w-full lg:w-1/2 flex-col justify-center items-center px-6 py-12 bg-white">
        <div className="w-full max-w-[360px]">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <a href="/" className="flex items-baseline">
              <span
                className="text-2xl tracking-tight text-slate-900"
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
          </div>

          {/* Heading */}
          <h1
            className="text-center text-lg font-medium text-slate-900 mb-8"
            style={SERIF_FONT}
          >
            Log in to ScholarBridge
          </h1>

          {error && (
            <div className="flex items-start gap-2.5 px-4 py-3 mb-5 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 animate-fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Honeypot field */}
            <div
              className="absolute -left-[9999px] -top-[9999px] w-0 h-0 overflow-hidden opacity-0"
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
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-white text-slate-900 text-sm placeholder:text-slate-400 outline-none transition-all focus:border-brand-600 focus:ring-1 focus:ring-brand-600 pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPass ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Log In"
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4">
            <a
              href="/auth/forgot-password"
              className="text-xs text-slate-500 hover:text-brand-700 transition-colors"
            >
              Forgot your password?
            </a>
            <a
              href="/auth/signup"
              className="text-xs text-slate-500 hover:text-brand-700 transition-colors"
            >
              Create an account
            </a>
          </div>

          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[11px] text-slate-400">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          <button
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 flex-shrink-0"
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full min-h-screen items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
