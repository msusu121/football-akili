// ============================================================
// FILE: components/LoginForm.tsx
// Full auth flow: Sign In · Register · Forgot Password · Reset
// Premium UI/UX — club-branded, mobile-first
// ============================================================

"use client";

import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import Image from "next/image";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "";
const ASSET_BASE =
  process.env.NEXT_PUBLIC_ASSET_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "";

function resolveAssetUrl(u?: string | null) {
  if (!u) return "";
  const url = String(u).trim();
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return "https:" + url;
  if (ASSET_BASE) {
    return ASSET_BASE.replace(/\/$/, "") + "/" + url.replace(/^\//, "");
  }
  return url;
}

type AuthMode = "login" | "register" | "forgot" | "reset";

interface LoginFormProps {
  logoUrl?: string;
  clubName?: string;
}

/* ── icons ── */
function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-500"
    >
      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

/* ── input wrapper ── */
function FloatingInput({
  id,
  label,
  icon,
  type = "text",
  value,
  onChange,
  required,
  minLength,
  placeholder,
  autoComplete,
  endAdornment,
}: {
  id: string;
  label: string;
  icon: ReactNode;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
  endAdornment?: ReactNode;
}) {
  return (
    <div className="relative">
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-3.5 text-neutral-400">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-neutral-200 bg-neutral-50/80 py-3 pl-11 pr-4 text-sm text-neutral-900 outline-none transition-all duration-200 placeholder:text-neutral-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          style={endAdornment ? { paddingRight: "2.75rem" } : undefined}
        />
        {endAdornment && <span className="absolute right-3">{endAdornment}</span>}
      </div>
    </div>
  );
}

function LogoBlock({
  resolvedLogo,
  displayName,
}: {
  resolvedLogo: string;
  displayName: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resolvedLogo]);

  if (!resolvedLogo || failed) {
    return (
      <div className="mb-4 flex h-36 w-36 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-800">
        <span className="text-2xl font-black text-white">MU</span>
      </div>
    );
  }

  return (
    <div className="relative mb-4 h-36 w-36 overflow-hidden rounded-2xl bg-white">
      <Image
        src={resolvedLogo}
        alt={displayName}
        fill
        sizes="144px"
        className="object-contain"
        priority
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export default function LoginForm({ logoUrl, clubName }: LoginFormProps) {
  const { login, register } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();

  const next = sp.get("next") || "/account";
  const token = sp.get("token") || sp.get("code") || "";

  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    setError(null);
    setForgotSent(false);
    setResetSuccess(false);
  }, [mode]);

  useEffect(() => {
    if (token) setMode("reset");
  }, [token]);

  const resolvedLogo = resolveAssetUrl(logoUrl);
  const displayName = clubName || "Mombasa United FC";

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "login") {
        await login(email, password);
        router.push(next);
        return;
      }

      if (mode === "register") {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setBusy(false);
          return;
        }

        await register(name.trim() || undefined, email, password);
        router.push(next);
        return;
      }

      if (mode === "forgot") {
        const base = API_BASE || "";
        const res = await fetch(`${base}/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to send reset email");
        }

        setForgotSent(true);
        return;
      }

      if (mode === "reset") {
        if (!token) {
          setError("Reset token is missing or invalid");
          setBusy(false);
          return;
        }

        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setBusy(false);
          return;
        }

        const base = API_BASE || "";
        const res = await fetch(`${base}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data?.message || "Failed to reset password");
        }

        setResetSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const headings: Record<AuthMode, { title: string; subtitle: string }> = {
    login: {
      title: "Welcome back",
      subtitle: "Sign in to your account",
    },
    register: {
      title: "Create account",
      subtitle: "Join the pride of the coast",
    },
    forgot: {
      title: "Forgot password?",
      subtitle: "Enter your email and we'll send a reset link",
    },
    reset: {
      title: "Reset password",
      subtitle: "Choose a new secure password",
    },
  };

  const { title, subtitle } = headings[mode];

  if (mode === "forgot" && forgotSent) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-8 text-center shadow-xl shadow-neutral-900/5">
          <div className="mb-4 flex justify-center">
            <CheckCircleIcon />
          </div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900">
            Check your email
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-semibold text-neutral-700">{email}</span>.
            <br />
            Check your inbox and spam folder.
          </p>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setForgotSent(false);
            }}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
          >
            <ArrowLeftIcon /> Back to sign in
          </button>
        </div>
      </div>
    );
  }

  if (mode === "reset" && resetSuccess) {
    return (
      <div className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-neutral-200/60 bg-white p-8 text-center shadow-xl shadow-neutral-900/5">
          <div className="mb-4 flex justify-center">
            <CheckCircleIcon />
          </div>
          <h2 className="mb-2 text-xl font-bold text-neutral-900">
            Password reset!
          </h2>
          <p className="mb-6 text-sm text-neutral-500">
            Your password has been updated successfully. You can now sign in.
          </p>
          <button
            type="button"
            onClick={() => setMode("login")}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="rounded-2xl border border-neutral-200/60 bg-white p-8 shadow-xl shadow-neutral-900/5">
        <div className="mb-8 flex flex-col items-center">
          <LogoBlock resolvedLogo={resolvedLogo} displayName={displayName} />
          <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900">
            {title}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <FloatingInput
              id="auth-name"
              label="Full Name"
              icon={<UserIcon />}
              value={name}
              onChange={setName}
              placeholder="John Doe"
              autoComplete="name"
            />
          )}

          {mode !== "reset" && (
            <FloatingInput
              id="auth-email"
              label="Email"
              icon={<MailIcon />}
              type="email"
              value={email}
              onChange={setEmail}
              required
              placeholder="you@example.com"
              autoComplete="email"
            />
          )}

          {(mode === "login" || mode === "register" || mode === "reset") && (
            <div>
              <FloatingInput
                id="auth-password"
                label={mode === "reset" ? "New Password" : "Password"}
                icon={<LockIcon />}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete={
                  mode === "register" || mode === "reset"
                    ? "new-password"
                    : "current-password"
                }
                endAdornment={
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="text-neutral-400 transition-colors hover:text-neutral-600"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                }
              />
              {(mode === "register" || mode === "reset") && (
                <p className="ml-1 mt-1.5 text-xs text-neutral-400">
                  Minimum 8 characters
                </p>
              )}
            </div>
          )}

          {(mode === "register" || mode === "reset") && (
            <FloatingInput
              id="auth-confirm"
              label="Confirm Password"
              icon={<LockIcon />}
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
              minLength={8}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          )}

          {mode === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setMode("forgot")}
                className="text-xs font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? (
              <>
                <Spinner />
                Please wait…
              </>
            ) : mode === "login" ? (
              "Sign in"
            ) : mode === "register" ? (
              "Create account"
            ) : mode === "forgot" ? (
              "Send reset link"
            ) : (
              "Reset password"
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === "login" && (
            <p className="text-neutral-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("register")}
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                Register
              </button>
            </p>
          )}

          {mode === "register" && (
            <p className="text-neutral-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setMode("login")}
                className="font-semibold text-blue-600 transition-colors hover:text-blue-700"
              >
                Sign in
              </button>
            </p>
          )}

          {(mode === "forgot" || mode === "reset") && (
            <button
              type="button"
              onClick={() => setMode("login")}
              className="inline-flex items-center gap-1.5 font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              <ArrowLeftIcon /> Back to sign in
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-neutral-200/60 bg-neutral-100 p-4 text-center">
        <a
          href="https://akilimatic.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold tracking-wide text-neutral-600 transition-colors hover:text-neutral-900"
        >
          Powered by <span className="font-bold text-neutral-800">Akilimatic</span>
        </a>
      </div>
    </div>
  );
}