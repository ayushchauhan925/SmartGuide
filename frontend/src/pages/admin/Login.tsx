import { useNavigate } from "react-router-dom";
import { useState, FormEvent } from "react";
import { Eye, EyeOff, BookOpen } from "lucide-react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

export default function LoginPage() {
  useDocumentTitle("Sign in — SmartGuide Admin");
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error?.message ?? "Invalid email or password"); return; }
      navigate("/admin");
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left atmospheric panel ─────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative flex-col overflow-hidden"
        style={{ background: "linear-gradient(155deg, #1a1713 0%, #0f0e0d 50%, #161311 100%)" }}
      >
        {/* Architectural grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.9) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
          }}
        />
        {/* Corner frame decoration */}
        <div className="absolute top-10 left-10 h-20 w-20 border-l border-t border-[#D4A840]/25" />
        <div className="absolute top-10 right-10 h-20 w-20 border-r border-t border-[#D4A840]/25" />
        <div className="absolute bottom-10 left-10 h-20 w-20 border-l border-b border-[#D4A840]/25" />
        <div className="absolute bottom-10 right-10 h-20 w-20 border-r border-b border-[#D4A840]/25" />
        {/* Subtle warm glow */}
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-[#C0952C]/8 blur-[80px]" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 p-10">
          <div className="h-8 w-8 rounded-lg bg-stone-800/80 border border-white/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-[#D4A840]" strokeWidth={2} />
          </div>
          <span className="text-sm font-bold text-stone-200 tracking-tight">
            Smart<span className="text-[#D4A840]">Guide</span>
          </span>
        </div>

        {/* Hero content */}
        <div className="relative z-10 flex flex-1 flex-col justify-center px-10 pb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#D4A840]/60 mb-6">
            Museum & Library Platform
          </p>
          <h1 className="font-display text-4xl xl:text-[2.85rem] font-bold text-stone-100 leading-tight mb-5">
            Preserve history.
            <br />
            <span className="text-stone-500">Connect people.</span>
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed max-w-[30ch]">
            Manage your collection, create audio guides, and deliver rich visitor experiences — all from one place.
          </p>

          {/* Features */}
          <div className="mt-10 space-y-2.5">
            {[
              "Digital artefact catalogues with rich media",
              "Audio guide creation and management",
              "QR code generation and visitor tracking",
              "Real-time collection analytics",
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="h-px w-4 bg-[#D4A840]/40" />
                <span className="text-xs text-stone-600">{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10 px-10 py-8 border-t border-white/[0.05]">
          <p className="text-stone-600 text-xs italic leading-relaxed">
            &ldquo;The museum is a place where one runs the risk of being changed.&rdquo;
          </p>
          <p className="mt-1.5 text-stone-700 text-[11px]">— Robert Smithson</p>
        </div>

        {/* Bottom edge line */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#D4A840]/20 to-transparent" />
      </div>

      {/* ── Right form panel ──────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#FAFAF8] px-6 py-12 sm:px-10">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-10">
          <BookOpen className="h-4.5 w-4.5 text-[#D4A840]" />
          <span className="text-sm font-bold text-stone-800">
            Smart<span className="text-[#D4A840]">Guide</span>
          </span>
        </div>

        <div className="w-full max-w-[22rem]">
          <div className="mb-8">
            <h2 className="font-display text-2xl font-bold text-stone-900 mb-1.5">
              Welcome back
            </h2>
            <p className="text-sm text-stone-500">
              Sign in to your admin account
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4" noValidate>
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="admin@museum.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c0952c] focus:border-[#c0952c]"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-[11px] font-semibold uppercase tracking-wider text-stone-500"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full rounded-lg border border-stone-300 bg-white px-3.5 py-2.5 pr-11 text-sm text-stone-900 placeholder:text-stone-400 transition-colors focus:outline-none focus:ring-2 focus:ring-[#c0952c] focus:border-[#c0952c]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 transition-colors"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 rounded-lg bg-stone-900 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 active:bg-stone-950 transition-colors focus:outline-none focus:ring-2 focus:ring-stone-900 focus:ring-offset-2 focus:ring-offset-[#FAFAF8] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8 rounded-xl border border-stone-200 bg-stone-50 p-4">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 mb-2.5">
              Demo credentials
            </p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Email</span>
                <code className="text-stone-700 font-mono">admin@smartguide.demo</code>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Password</span>
                <code className="text-stone-700 font-mono">admin1234</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
