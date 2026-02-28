"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function LoginForm() {
  const { login, register } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const next = sp.get("next") || "/";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (mode === "login" ? "Sign in" : "Create account"), [mode]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name.trim() || undefined, email, password);
      router.push(next);
    } catch (err: any) {
      setError(err?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-3xl border border-line bg-card p-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
          className="text-sm text-muted hover:text-white"
          type="button"
        >
          {mode === "login" ? "New here? Register" : "Already have an account? Sign in"}
        </button>
      </div>

      <form onSubmit={submit} className="mt-6 grid gap-4">
        {mode === "register" ? (
          <div>
            <label className="text-sm text-muted">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-line bg-black/30 px-4 py-3 outline-none focus:border-brand/60"
              placeholder="Your name"
            />
          </div>
        ) : null}

        <div>
          <label className="text-sm text-muted">Email</label>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-black/30 px-4 py-3 outline-none focus:border-brand/60"
            placeholder="you@example.com"
            type="email"
            required
          />
        </div>

        <div>
          <label className="text-sm text-muted">Password</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-2 w-full rounded-2xl border border-line bg-black/30 px-4 py-3 outline-none focus:border-brand/60"
            placeholder="••••••••"
            type="password"
            required
            minLength={8}
          />
          <div className="mt-2 text-xs text-muted">Minimum 8 characters.</div>
        </div>

        {error ? <div className="text-sm text-red-300">{error}</div> : null}

        <button
          disabled={busy}
          className="mt-2 w-full rounded-full bg-brand text-black font-semibold py-3 disabled:opacity-60"
        >
          {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-line bg-black/20 p-4 text-sm text-muted">
        <div className="font-semibold text-white">Seeded admin (dev)</div>
        <div className="mt-2">Email: <span className="text-white">admin@club.local</span></div>
        <div>Password: <span className="text-white">Admin@123</span></div>
      </div>
    </div>
  );
}
