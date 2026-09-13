import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Package, Tag, MapPin, QrCode, ArrowRight, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ artefacts: 0, categories: 0, locations: 0, drafts: 0, qrCodes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ total: number }>("/artefacts?limit=1"),
      api.get<{ total: number }>("/artefacts?status=draft&limit=1"),
      api.get<{ categories: unknown[] }>("/categories"),
      api.get<{ locations: unknown[] }>("/locations"),
      api.get<{ qrCodes: unknown[] }>("/qr-codes"),
    ]).then(([all, drafts, cats, locs, qrs]) => {
      setStats({ artefacts: all.total, drafts: drafts.total, categories: cats.categories.length, locations: locs.locations.length, qrCodes: qrs.qrCodes.length });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    { label: "Artefacts", value: stats.artefacts, icon: <Package size={18} />, to: "/admin/artefacts", color: "#B8861E" },
    { label: "Categories", value: stats.categories, icon: <Tag size={18} />, to: "/admin/categories", color: "#5B21B6" },
    { label: "Locations", value: stats.locations, icon: <MapPin size={18} />, to: "/admin/locations", color: "#0F766E" },
    { label: "QR Codes", value: stats.qrCodes, icon: <QrCode size={18} />, to: "/admin/qr-codes", color: "#1E40AF" },
  ];

  return (
    <div style={{ padding: "40px 36px", maxWidth: 900, margin: "0 auto" }} className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: 6 }}>
          Welcome back
        </p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 400, color: "var(--text-primary)", lineHeight: 1.2 }}>
          {user?.name}
        </h1>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 32 }}>
        {statCards.map((card) => (
          <Link key={card.to} to={card.to} style={{ textDecoration: "none" }}>
            <div style={{
              background: "var(--surface)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)", padding: "20px 22px",
              transition: "all var(--transition)", cursor: "pointer",
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border-strong)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${card.color}14`, display: "flex", alignItems: "center", justifyContent: "center", color: card.color }}>
                  {card.icon}
                </div>
                <ArrowRight size={14} color="var(--text-tertiary)" />
              </div>
              <div style={{ fontSize: loading ? 22 : 28, fontWeight: 700, color: "var(--text-primary)", marginBottom: 3, fontVariantNumeric: "tabular-nums" }}>
                {loading ? "—" : card.value}
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-tertiary)", fontWeight: 500 }}>{card.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Drafts alert */}
      {stats.drafts > 0 && (
        <div style={{ marginBottom: 28, padding: "14px 18px", background: "var(--amber-bg)", border: "1px solid var(--amber-border)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "flex-start", gap: 12 }}>
          <AlertCircle size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--amber)", marginBottom: 2 }}>Unpublished artefacts</p>
            <p style={{ fontSize: 13, color: "#B45309", lineHeight: 1.5 }}>
              {stats.drafts} artefact{stats.drafts !== 1 ? "s are" : " is"} in draft and not visible to visitors.{" "}
              <Link to="/admin/artefacts" style={{ color: "var(--gold)", fontWeight: 500, textDecoration: "underline", textDecorationColor: "transparent" }}
                onMouseEnter={(e) => (e.currentTarget.style.textDecorationColor = "var(--gold)")}
                onMouseLeave={(e) => (e.currentTarget.style.textDecorationColor = "transparent")}
              >Review now →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div>
        <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-tertiary)", marginBottom: 14 }}>Quick actions</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          {[
            { to: "/admin/artefacts/new", label: "Add artefact", primary: true },
            { to: "/admin/categories", label: "Manage categories" },
            { to: "/admin/locations", label: "Manage locations" },
            { to: "/admin/qr-codes", label: "View QR codes" },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                padding: "11px 16px", borderRadius: "var(--radius-md)",
                fontSize: 13.5, fontWeight: 500, textDecoration: "none",
                transition: "all var(--transition)",
                ...(item.primary
                  ? { background: "linear-gradient(135deg, var(--gold), var(--gold-light))", color: "#fff", boxShadow: "0 2px 10px rgba(184,134,30,0.3)" }
                  : { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text-secondary)" }),
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
