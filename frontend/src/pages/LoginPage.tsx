import { useState, FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ApiError } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: "0 0 42%",
        position: "relative",
        overflow: "hidden",
        display: "none",
      }}
        className="login-left-panel"
      >
        {/* Background image */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(160deg, #1a1209 0%, #2d1f0a 40%, #1a1209 100%)",
        }} />
        {/* Decorative gold orb */}
        <div style={{
          position: "absolute", top: "-80px", right: "-80px",
          width: "360px", height: "360px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(184,134,30,0.25) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "80px", left: "-40px",
          width: "280px", height: "280px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(184,134,30,0.12) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Content */}
        <div style={{
          position: "relative", zIndex: 1,
          display: "flex", flexDirection: "column",
          justifyContent: "space-between",
          height: "100%", padding: "48px 44px",
        }}>
          {/* Logo top-left */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px",
              background: "linear-gradient(135deg, #B8861E, #D4A840)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 600, color: "#F7F5F0", letterSpacing: "0.01em" }}>SmartGuide</span>
          </div>

          {/* Bottom testimonial */}
          <div>
            {/* Artwork / illustration strip */}
            <div style={{
              width: "100%", height: "220px", borderRadius: "16px",
              background: "linear-gradient(135deg, rgba(184,134,30,0.15) 0%, rgba(184,134,30,0.05) 100%)",
              border: "1px solid rgba(184,134,30,0.2)",
              marginBottom: "40px",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                <circle cx="40" cy="40" r="36" stroke="rgba(184,134,30,0.4)" strokeWidth="1.5"/>
                <path d="M25 40 Q40 20 55 40 Q40 60 25 40Z" fill="rgba(184,134,30,0.2)" stroke="rgba(184,134,30,0.5)" strokeWidth="1.5"/>
                <circle cx="40" cy="40" r="6" fill="rgba(184,134,30,0.6)"/>
                <path d="M40 10 L40 74 M10 40 L70 40" stroke="rgba(184,134,30,0.2)" strokeWidth="1"/>
              </svg>
            </div>

            <blockquote style={{ margin: 0 }}>
              <p style={{
                fontSize: "18px", fontWeight: 400, lineHeight: "1.6",
                color: "#F0EBE3", marginBottom: "20px",
                fontFamily: "'Playfair Display', serif",
              }}>
                "Bringing history to life — every artefact tells a story worth sharing."
              </p>
              <footer>
                <div style={{ fontSize: "13px", fontWeight: 600, color: "#D4A840" }}>SmartGuide Platform</div>
                <div style={{ fontSize: "12px", color: "#7A6E62", marginTop: "2px" }}>Museum & Library Information System</div>
              </footer>
            </blockquote>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#FFFFFF",
        padding: "40px 24px",
      }}>
        <div style={{ width: "100%", maxWidth: "380px" }}>

          {/* Heading */}
          <div style={{ marginBottom: "36px" }}>
            <h1 style={{
              fontSize: "26px", fontWeight: 700, color: "#111827",
              marginBottom: "8px", letterSpacing: "-0.02em",
            }}>
              Welcome Back
            </h1>
            <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: "1.5" }}>
              Sign in to your SmartGuide account to manage your collection.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: "20px", padding: "12px 14px",
              background: "#FEF2F2", border: "1px solid #FECACA",
              borderRadius: "8px", fontSize: "13.5px", color: "#DC2626",
              display: "flex", alignItems: "center", gap: "8px",
            }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="#DC2626">
                <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm-.75 4a.75.75 0 011.5 0v3a.75.75 0 01-1.5 0V5zm.75 6.5a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={submit}>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{
                display: "block", fontSize: "13px", fontWeight: 500,
                color: "#374151", marginBottom: "6px",
              }}>
                Email address
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus placeholder="you@example.com"
                style={{
                  width: "100%", padding: "10px 14px",
                  border: "1.5px solid #E5E7EB", borderRadius: "8px",
                  fontSize: "14px", color: "#111827",
                  outline: "none", transition: "border-color 0.15s",
                  background: "#FAFAFA", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "#B8861E"}
                onBlur={e => e.target.style.borderColor = "#E5E7EB"}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "#374151" }}>
                  Password
                </label>
              </div>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  style={{
                    width: "100%", padding: "10px 42px 10px 14px",
                    border: "1.5px solid #E5E7EB", borderRadius: "8px",
                    fontSize: "14px", color: "#111827",
                    outline: "none", transition: "border-color 0.15s",
                    background: "#FAFAFA", boxSizing: "border-box",
                  }}
                  onFocus={e => e.target.style.borderColor = "#B8861E"}
                  onBlur={e => e.target.style.borderColor = "#E5E7EB"}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: "12px", top: "50%",
                    transform: "translateY(-50%)",
                    background: "none", border: "none", cursor: "pointer",
                    color: "#9CA3AF", display: "flex", padding: "2px",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", padding: "11px",
                background: loading ? "#D1B060" : "#B8861E",
                color: "#fff", border: "none", borderRadius: "8px",
                fontSize: "14px", fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "background 0.15s, box-shadow 0.15s",
                boxShadow: loading ? "none" : "0 2px 8px rgba(184,134,30,0.35)",
                letterSpacing: "0.01em",
                marginTop: "24px",
              }}
              onMouseEnter={e => { if (!loading) (e.target as HTMLButtonElement).style.background = "#A07418"; }}
              onMouseLeave={e => { if (!loading) (e.target as HTMLButtonElement).style.background = "#B8861E"; }}
            >
              {loading ? "Signing in…" : "Log in"}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display: "flex", alignItems: "center", gap: "12px",
            margin: "28px 0", color: "#D1D5DB", fontSize: "12px",
          }}>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
            <span style={{ color: "#9CA3AF" }}>or</span>
            <div style={{ flex: 1, height: "1px", background: "#E5E7EB" }} />
          </div>

          {/* System info */}
          <p style={{
            textAlign: "center", fontSize: "12px", color: "#9CA3AF", lineHeight: "1.6",
          }}>
            SmartGuide · Museum &amp; Library Information System<br />
            <span style={{ color: "#D1D5DB" }}>Secure admin access only</span>
          </p>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (min-width: 768px) {
          .login-left-panel { display: flex !important; }
        }
        input::placeholder { color: #9CA3AF; }
        input:-webkit-autofill { -webkit-box-shadow: 0 0 0 40px #FAFAFA inset !important; -webkit-text-fill-color: #111827 !important; }
      `}</style>
    </div>
  );
}
