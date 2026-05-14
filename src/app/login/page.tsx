"use client";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    const sb = getSupabaseClient();

    if (mode === "signup") {
      const { error } = await sb.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setSuccessMsg("Check your email to confirm your account, then sign in.");
        setMode("signin");
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        // Middleware will redirect to / on next navigation
        window.location.href = "/";
      }
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-10">
          <p className="text-5xl mb-3">🤝</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Kept</h1>
          <p className="text-gray-500 text-sm mt-1">Make it. Keep it. Celebrate it.</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-7">
          <h2 className="text-lg font-bold text-gray-900 mb-6">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h2>

          {successMsg && (
            <div className="mb-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              {successMsg}
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-brand focus:outline-none focus:ring-2 focus:ring-teal-brand/20"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-teal-brand focus:outline-none focus:ring-2 focus:ring-teal-brand/20"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-brand text-white font-bold py-3.5 rounded-2xl shadow-sm disabled:opacity-60 active:scale-95 transition-transform mt-2"
            >
              {loading ? "…" : mode === "signin" ? "Sign in" : "Create account"}
            </button>
          </form>
        </div>

        {/* Toggle mode */}
        <p className="text-center text-sm text-gray-500 mt-6">
          {mode === "signin" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setSuccessMsg(null); }}
            className="font-semibold text-teal-brand"
          >
            {mode === "signin" ? "Sign up" : "Sign in"}
          </button>
        </p>
      </div>
    </div>
  );
}
