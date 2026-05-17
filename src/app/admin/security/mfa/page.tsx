"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  LockKeyhole,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { LazyMotion, domAnimation, m } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

type AalLevel = "aal1" | "aal2" | null;

type MfaFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type?: string;
  status?: string;
  created_at?: string;
};

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

const inputClass =
  "w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 placeholder:text-zinc-400";

function qrSrc(svg: string): string {
  if (svg.startsWith("data:")) return svg;
  const b64 = typeof window !== "undefined" ? btoa(svg) : Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${b64}`;
}

function formatFactorName(factor: MfaFactor, index: number): string {
  return factor.friendly_name || `Authenticator app ${index + 1}`;
}

export default function AdminMfaPage() {
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [currentLevel, setCurrentLevel] = useState<AalLevel>(null);
  const [nextLevel, setNextLevel] = useState<AalLevel>(null);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [selectedFactorId, setSelectedFactorId] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [enrollmentCode, setEnrollmentCode] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const verifiedFactors = useMemo(
    () => factors.filter((f) => f.status === "verified" || !f.status),
    [factors]
  );
  const unverifiedFactors = useMemo(
    () => factors.filter((f) => f.status === "unverified"),
    [factors]
  );

  const selectedFactor = verifiedFactors.find((f) => f.id === selectedFactorId);
  const isAal2 = currentLevel === "aal2";

  const loadStatus = useCallback(async () => {
    const supabase = createClient();
    setLoading(true);
    setError(null);

    const [{ data: aalData, error: aalError }, { data: factorData, error: factorError }] =
      await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);

    if (aalError || factorError) {
      setError(aalError?.message ?? factorError?.message ?? "Unable to load MFA status.");
      setLoading(false);
      return;
    }

    const allFactors = (factorData?.all ?? []) as MfaFactor[];
    setCurrentLevel((aalData?.currentLevel ?? null) as AalLevel);
    setNextLevel((aalData?.nextLevel ?? null) as AalLevel);
    setFactors(allFactors);
    setSelectedFactorId((existing) =>
      existing && allFactors.some((f) => f.id === existing)
        ? existing
        : allFactors.find((f) => f.status === "verified" || !f.status)?.id ?? ""
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  function nextFriendlyName(existing: MfaFactor[]): string {
    const base = "ScholarBridge Admin";
    const names = new Set(existing.map((f) => f.friendly_name ?? ""));
    if (!names.has(base)) return base;
    let i = 2;
    while (names.has(`${base} ${i}`)) i++;
    return `${base} ${i}`;
  }

  async function startEnrollment() {
    const supabase = createClient();
    setWorking(true);
    setError(null);
    setSuccess(null);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: nextFriendlyName(factors),
      issuer: "ScholarBridge",
    });

    if (error || !data || data.type !== "totp") {
      setError(error?.message ?? "Unable to start MFA enrollment.");
      setWorking(false);
      return;
    }

    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    });
    setEnrollmentCode("");
    setWorking(false);
  }

  async function verifyEnrollment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!enrollment) return;

    const code = enrollmentCode.trim();
    if (code.length < 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    const supabase = createClient();
    setWorking(true);
    setError(null);
    setSuccess(null);

    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });
    if (challenge.error || !challenge.data) {
      setError(challenge.error?.message ?? "Unable to create MFA challenge.");
      setWorking(false);
      return;
    }

    const result = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code,
    });

    if (result.error) {
      setError(result.error.message);
      setWorking(false);
      return;
    }

    setSuccess("MFA is enabled and this session has been verified.");
    setEnrollment(null);
    setEnrollmentCode("");
    await loadStatus();
    setWorking(false);
  }

  async function verifyCurrentSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const code = verifyCode.trim();
    if (!selectedFactorId || code.length < 6) {
      setError("Choose a factor and enter the 6-digit code.");
      return;
    }

    const supabase = createClient();
    setWorking(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: selectedFactorId,
      code,
    });

    if (error) {
      setError(error.message);
      setWorking(false);
      return;
    }

    setVerifyCode("");
    setSuccess("Session verified. You can now complete sensitive admin actions.");
    await loadStatus();
    setWorking(false);
  }

  async function unenrollFactor(factorId: string) {
    const supabase = createClient();
    setWorking(true);
    setError(null);
    setSuccess(null);

    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setError(error.message);
      setWorking(false);
      return;
    }

    setSuccess("Factor removed.");
    setEnrollment(null);
    await loadStatus();
    setWorking(false);
  }

  async function copySecret() {
    if (!enrollment?.secret) return;
    await navigator.clipboard.writeText(enrollment.secret);
    setSuccess("Secret copied. Keep it private.");
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[1100px] mx-auto space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-5">
          <div className="space-y-1">
            <h1
              className="text-3xl font-medium text-zinc-900"
              style={{ fontFamily: "Fraunces, Georgia, ui-serif, serif" }}
            >
              Multi-Factor Authentication
            </h1>
            <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-[0.2em]">
              Secure sensitive administrator actions
            </p>
          </div>
          <button
            onClick={() => void loadStatus()}
            disabled={loading || working}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 font-medium rounded-lg text-xs uppercase tracking-wider transition-all hover:bg-zinc-50 disabled:opacity-50"
          >
            <RefreshCw className={`size-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Status
          </button>
        </div>

        {(error || success) && (
          <div
            className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
              error
                ? "bg-red-50 border-red-200 text-red-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            {error ? <AlertCircle className="size-4 mt-0.5" /> : <CheckCircle2 className="size-4 mt-0.5" />}
            <span className="font-medium">{error ?? success}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-5">
          <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className={`size-11 rounded-xl flex items-center justify-center ${isAal2 ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                {isAal2 ? <ShieldCheck className="size-5" /> : <LockKeyhole className="size-5" />}
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-900">Session Security</h2>
                <p className="text-sm text-zinc-500 mt-1">
                  Role changes require an AAL2 session. Verify with an authenticator app before changing admin privileges.
                </p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Loader2 className="size-4 animate-spin" />
                Loading MFA status...
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Current Level</p>
                  <p className={`text-lg font-semibold mt-1 ${isAal2 ? "text-emerald-700" : "text-amber-700"}`}>
                    {currentLevel?.toUpperCase() ?? "Unknown"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Next Level</p>
                  <p className="text-lg font-semibold text-zinc-900 mt-1">
                    {nextLevel?.toUpperCase() ?? "None"}
                  </p>
                </div>
              </div>
            )}

            <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-sm font-semibold text-blue-900">How to use this page</p>
              <p className="text-xs text-blue-800/80 mt-1">
                First enroll an authenticator app. After enrollment, verify this session whenever Supabase reports AAL1.
              </p>
            </div>

            {!loading && verifiedFactors.length > 0 && (
              <div className="space-y-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Enrolled Factors</p>
                <div className="space-y-2">
                  {verifiedFactors.map((factor, index) => (
                    <div key={factor.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 truncate">{formatFactorName(factor, index)}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{factor.factor_type?.toUpperCase() ?? "TOTP"} · Verified</p>
                      </div>
                      <button
                        onClick={() => void unenrollFactor(factor.id)}
                        disabled={working}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-[10px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="size-3" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
                {verifiedFactors.length === 1 && (
                  <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Removing your only factor will block sensitive admin actions until you re-enroll.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="bg-white border border-zinc-200 rounded-2xl shadow-sm p-6">
            {isAal2 ? (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">MFA Verified</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      Your current session is AAL2. You can now return to Users and complete the role change.
                    </p>
                  </div>
                </div>
                <a
                  href="/admin/users"
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                >
                  Return to Users
                </a>
              </div>
            ) : enrollment ? (
              <form onSubmit={verifyEnrollment} className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-zinc-50 text-zinc-500 flex items-center justify-center">
                    <Smartphone className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">Complete MFA Setup</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      Scan the QR code, then enter the 6-digit code from your authenticator app.
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <QrCode className="size-4 text-zinc-500" />
                    <p className="text-sm font-semibold text-zinc-900">Scan this QR code</p>
                  </div>
                  <img
                    src={qrSrc(enrollment.qrCode)}
                    alt="Authenticator app QR code"
                    className="mx-auto size-48 rounded-lg bg-white p-3 border border-zinc-200"
                  />
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-2">
                    Manual setup secret
                  </p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-zinc-50 border border-zinc-200 px-3 py-2 text-xs font-mono text-zinc-700 break-all">
                      {enrollment.secret}
                    </code>
                    <button
                      type="button"
                      onClick={() => void copySecret()}
                      className="shrink-0 inline-flex items-center justify-center size-9 rounded-lg border border-zinc-200 text-zinc-500 hover:bg-zinc-50 transition-colors"
                      aria-label="Copy secret"
                    >
                      <Copy className="size-4" />
                    </button>
                  </div>
                </div>

                <label className="block">
                  <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                    First verification code
                  </span>
                  <input
                    value={enrollmentCode}
                    onChange={(e) => setEnrollmentCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="123456"
                    className={inputClass}
                  />
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEnrollment(null); setEnrollmentCode(""); setError(null); }}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-50 transition-colors"
                  >
                    <X className="size-3.5" />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={working || enrollmentCode.length < 6}
                    className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {working && <Loader2 className="size-3.5 animate-spin" />}
                    Verify & Enable MFA
                  </button>
                </div>
              </form>
            ) : unverifiedFactors.length > 0 ? (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Smartphone className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">Complete Setup</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      This setup was not completed. Remove it and start a new enrollment.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {unverifiedFactors.map((factor, index) => (
                    <div key={factor.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                      <div>
                        <p className="text-sm font-semibold text-zinc-900">{formatFactorName(factor, index)}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Status: unverified</p>
                      </div>
                      <button
                        onClick={() => void unenrollFactor(factor.id)}
                        disabled={working}
                        className="shrink-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Remove
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => void startEnrollment()}
                  disabled={working}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {working && <Loader2 className="size-3.5 animate-spin" />}
                  New Enrollment
                </button>
              </div>
            ) : verifiedFactors.length > 0 ? (
              <form onSubmit={verifyCurrentSession} className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <KeyRound className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">Verify Current Session</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      Enter a TOTP code from your authenticator app to upgrade this session to AAL2.
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Authenticator factor
                    </span>
                    <select
                      value={selectedFactorId}
                      onChange={(e) => setSelectedFactorId(e.target.value)}
                      className={inputClass}
                    >
                      {verifiedFactors.map((factor, index) => (
                        <option key={factor.id} value={factor.id}>
                          {formatFactorName(factor, index)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
                      Verification code
                    </span>
                    <input
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="123456"
                      className={inputClass}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={working || !selectedFactor || verifyCode.length < 6}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {working && <Loader2 className="size-3.5 animate-spin" />}
                  Verify Session
                </button>
              </form>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  <div className="size-11 rounded-xl bg-zinc-50 text-zinc-500 flex items-center justify-center">
                    <Smartphone className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-900">Enroll Authenticator App</h2>
                    <p className="text-sm text-zinc-500 mt-1">
                      Connect Google Authenticator, Authy, 1Password, or any TOTP-compatible app.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => void startEnrollment()}
                  disabled={working}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-900 text-white rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {working && <Loader2 className="size-3.5 animate-spin" />}
                  Start MFA Setup
                </button>
              </div>
            )}
          </section>
        </div>
      </m.div>
    </LazyMotion>
  );
}
