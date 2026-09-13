import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ToastContainer } from "@/components/ui/Toast";
import {
  LayoutDashboard, Package, Tag, MapPin, QrCode,
  Users, FileText, LogOut, Menu, X, ChevronLeft, ChevronRight,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
  { to: "/admin/artefacts", label: "Artefacts", icon: <Package size={16} /> },
  { to: "/admin/categories", label: "Categories", icon: <Tag size={16} /> },
  { to: "/admin/locations", label: "Locations", icon: <MapPin size={16} /> },
  { to: "/admin/qr-codes", label: "QR Codes", icon: <QrCode size={16} /> },
  { to: "/admin/users", label: "Users", icon: <Users size={16} />, adminOnly: true },
  { to: "/admin/audit-logs", label: "Audit Logs", icon: <FileText size={16} />, adminOnly: true },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");
  const initials = user?.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const sidebarW = collapsed ? 60 : 220;

  const NavItems = ({ onClick }: { onClick?: () => void }) => (
    <nav style={{ flex: 1, padding: collapsed ? "8px 6px" : "8px 10px", overflowY: "auto" }}>
      {!collapsed && (
        <div style={{ fontSize: "10px", fontWeight: 600, color: "#3A3530", letterSpacing: "0.1em", textTransform: "uppercase", padding: "6px 10px 8px" }}>
          Menu
        </div>
      )}
      {visibleItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/admin"}
          onClick={onClick}
          title={collapsed ? item.label : undefined}
          style={({ isActive }) => ({
            display: "flex", alignItems: "center",
            gap: collapsed ? 0 : "10px",
            justifyContent: collapsed ? "center" : "flex-start",
            padding: collapsed ? "10px" : "9px 10px",
            marginBottom: "2px", borderRadius: "8px",
            fontSize: "13.5px", fontWeight: isActive ? 500 : 400,
            color: isActive ? "var(--sidebar-text-active)" : "var(--sidebar-text)",
            background: isActive ? "var(--sidebar-active)" : "transparent",
            textDecoration: "none", transition: "background 0.12s, color 0.12s",
            overflow: "hidden",
          })}
        >
          <span style={{ flexShrink: 0, opacity: 0.9 }}>{item.icon}</span>
          {!collapsed && <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <style>{`
        @media (max-width: 767px) {
          .desktop-sidebar { display: none !important; }
          .mobile-content-pad { padding-top: 54px !important; }
        }
        @media (min-width: 768px) {
          .mobile-topbar { display: none !important; }
        }
        .nav-item:hover { background: var(--sidebar-hover) !important; color: #C4B99A !important; }
      `}</style>

      {/* Desktop sidebar */}
      <div className="desktop-sidebar" style={{
        width: sidebarW, flexShrink: 0, position: "sticky", top: 0, height: "100vh",
        background: "var(--sidebar)", display: "flex", flexDirection: "column",
        borderRight: "1px solid var(--sidebar-border)",
        transition: "width 0.22s cubic-bezier(0.4,0,0.2,1)",
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{
          height: 60, display: "flex", alignItems: "center",
          padding: collapsed ? "0" : "0 16px 0 18px",
          justifyContent: collapsed ? "center" : "space-between",
          borderBottom: "1px solid var(--sidebar-border)", flexShrink: 0,
        }}>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "#F0EDE8", letterSpacing: "0.01em" }}>
                SmartGuide
              </div>
              <div style={{ fontSize: "10px", color: "#3A3530", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Museum System
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            style={{
              width: 28, height: 28, borderRadius: "7px", flexShrink: 0,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)",
              color: "#6B6359", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              transition: "all 0.15s",
            }}
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        </div>

        <NavItems />

        {/* User footer */}
        <div style={{ padding: collapsed ? "10px 6px" : "10px 10px 16px", borderTop: "1px solid var(--sidebar-border)", flexShrink: 0 }}>
          {!collapsed && (
            <div style={{ display: "flex", alignItems: "center", gap: "9px", padding: "7px 8px", marginBottom: "2px" }}>
              <div style={{
                width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--gold), var(--gold-light))",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "11px", fontWeight: 700, color: "#fff",
              }}>{initials}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "12.5px", fontWeight: 500, color: "#D0C8BE", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user?.name}</div>
                <div style={{ fontSize: "10.5px", color: "#4A4440", textTransform: "capitalize" }}>{user?.role}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            title={collapsed ? "Sign out" : undefined}
            style={{
              display: "flex", alignItems: "center", gap: collapsed ? 0 : "8px",
              justifyContent: collapsed ? "center" : "flex-start",
              width: "100%", padding: collapsed ? "9px" : "8px 8px",
              borderRadius: "8px", background: "none", border: "none",
              color: "#4A4440", cursor: "pointer", fontSize: "13px",
              transition: "all 0.12s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = "#9C8E82"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#4A4440"; }}
          >
            <LogOut size={15} />
            {!collapsed && "Sign out"}
          </button>
        </div>
      </div>

      {/* Mobile top bar */}
      <div className="mobile-topbar" style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 54,
        background: "var(--sidebar)", borderBottom: "1px solid var(--sidebar-border)",
        display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between",
      }}>
        <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "#F0EDE8" }}>SmartGuide</span>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ background: "none", border: "none", color: "#9C8E82", cursor: "pointer", padding: "4px", display: "flex" }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(2px)" }} onClick={() => setMobileOpen(false)} />
          <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 250, background: "var(--sidebar)", display: "flex", flexDirection: "column", animation: "slideIn 0.2s ease" }}>
            <div style={{ height: 54, display: "flex", alignItems: "center", padding: "0 16px", justifyContent: "space-between", borderBottom: "1px solid var(--sidebar-border)" }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "16px", color: "#F0EDE8" }}>SmartGuide</span>
              <button onClick={() => setMobileOpen(false)} style={{ background: "none", border: "none", color: "#6B6359", cursor: "pointer" }}><X size={18} /></button>
            </div>
            <NavItems onClick={() => setMobileOpen(false)} />
            <div style={{ padding: "10px 10px 20px", borderTop: "1px solid var(--sidebar-border)" }}>
              <button onClick={handleLogout} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%", padding: "9px 10px", borderRadius: "8px", background: "none", border: "none", color: "#6B6359", cursor: "pointer", fontSize: "13px" }}>
                <LogOut size={14} /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="mobile-content-pad" style={{ flex: 1, minWidth: 0 }}>
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  );
}
