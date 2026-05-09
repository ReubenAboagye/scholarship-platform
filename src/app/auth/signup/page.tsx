"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { sanitizeRedirectPath } from "@/lib/auth/redirect";
import { getPasswordStrength } from "@/lib/auth/password";
import { signUpAction, signInWithGoogleAction } from "@/app/auth/actions";

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
      {/* Large decorative background text */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none select-none">
        <span
          className="text-[14rem] xl:text-[18rem] font-bold text-white/[0.025] leading-none tracking-tighter whitespace-nowrap"
          style={SERIF_FONT}
        >
          Join
        </span>
      </div>

      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-900/30 via-transparent to-brand-800/10" />
    </m.div>
    </LazyMotion>
  );
}

function SignupPageContent() {
  const searchParams = useSearchParams();
  const redirectTo = sanitizeRedirectPath(searchParams.get("redirectTo"));

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  async function handleGoogle() {
    setError(null);

    // Open popup immediately to avoid browser blocker
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    const popup = window.open(
      "about:blank",
      "oauthPopup",
      `width=${width},height=${height},left=${left},top=${top},popup=1`
    );

    if (!popup) {
      setError("Popup was blocked. Please allow popups for this site.");
      return;
    }

    const formData = new FormData();
    formData.append("redirectTo", redirectTo);
    formData.append("popup", "true");
    const result = await signInWithGoogleAction(formData);
    if (result.error || !result.url) {
      popup.close();
      setError(result.error ?? "Unable to start Google sign-in.");
      return;
    }

    popup.location.href = result.url;

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "oauth:success") {
        window.removeEventListener("message", handleMessage);
        window.location.href = e.data.destination ?? "/dashboard";
      } else if (e.data?.type === "oauth:error") {
        window.removeEventListener("message", handleMessage);
        setError("Authentication failed. Please try again.");
      }
    };
    window.addEventListener("message", handleMessage);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    formData.append("redirectTo", redirectTo);
    const result = await signUpAction(formData);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setSuccess(true);
    setLoading(false);
  }

  const loginHref = redirectTo === "/dashboard"
    ? "/auth/login"
    : `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`;

  if (success) {
    return (
      <LazyMotion features={domAnimation}>
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
              We sent a confirmation link to <span className="font-semibold text-zinc-900">{email}</span>. Click it to activate your account.
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
    </LazyMotion>
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
          {/* Logo */}
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

          {/* Heading */}
          <m.h1
            variants={item}
            className="text-center text-lg font-medium text-zinc-900 mb-8"
            style={SERIF_FONT}
          >
            Create your account
          </m.h1>

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
            {/* Honeypot field */}
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
                id="fullName"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                autoFocus
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full name"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 outline-none transition-all focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>

            <div>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 outline-none transition-all focus:border-brand-600 focus:ring-1 focus:ring-brand-600"
              />
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPass ? "text" : "password"}
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password (min. 8 characters)"
                className="w-full px-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-sm placeholder:text-zinc-400 outline-none transition-all focus:border-brand-600 focus:ring-1 focus:ring-brand-600 pr-10"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPass((v) => !v)}
                aria-label={showPass ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -tranzinc-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              >
                {showPass ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>

            {password && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const { score, color } = getPasswordStrength(password);
                    return (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-colors ${level <= score ? color : "bg-zinc-200"}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[11px] font-semibold text-zinc-500">
                  {getPasswordStrength(password).label}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 active:bg-brand-800 disabled:opacity-70 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </button>
          </m.form>

          <m.div variants={item} className="flex items-center justify-center mt-4">
            <a
              href={loginHref}
              className="text-xs text-zinc-500 hover:text-brand-700 transition-colors"
            >
              Already have an account? Sign in
            </a>
          </m.div>

          <m.div variants={item} className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-zinc-100" />
            <span className="text-[11px] text-zinc-400">or</span>
            <div className="flex-1 h-px bg-zinc-100" />
          </m.div>

          <m.button
            variants={item}
            type="button"
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-zinc-200 rounded-lg hover:bg-zinc-50 text-sm font-medium text-zinc-700 transition-colors"
          >
            <svg
              viewBox="0 0 24 24"
              className="size-4 flex-shrink-0"
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
          </m.button>
        </div>
      </m.div>
    </div>
  </LazyMotion>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex w-full min-h-screen items-center justify-center">
          <Loader2 className="size-8 animate-spin text-zinc-400" />
        </div>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
