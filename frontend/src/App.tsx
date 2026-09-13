import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";

// Pages
import LoginPage from "@/pages/LoginPage";
import VisitorPage from "@/pages/VisitorPage";
import AdminLayout from "@/pages/admin/AdminLayout";
import DashboardPage from "@/pages/admin/DashboardPage";
import ArtefactsPage from "@/pages/admin/ArtefactsPage";
import ArtefactNewPage from "@/pages/admin/ArtefactNewPage";
import ArtefactDetailPage from "@/pages/admin/ArtefactDetailPage";
import ArtefactEditPage from "@/pages/admin/ArtefactEditPage";
import ArtefactQrPage from "@/pages/admin/ArtefactQrPage";
import CategoriesPage from "@/pages/admin/CategoriesPage";
import LocationsPage from "@/pages/admin/LocationsPage";
import QrCodesPage from "@/pages/admin/QrCodesPage";
import UsersPage from "@/pages/admin/UsersPage";
import AuditLogsPage from "@/pages/admin/AuditLogsPage";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/admin" replace /> : <LoginPage />} />
      <Route path="/a/:uniquePublicId" element={<VisitorPage />} />
      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="artefacts" element={<ArtefactsPage />} />
        <Route path="artefacts/new" element={<ArtefactNewPage />} />
        <Route path="artefacts/:id" element={<ArtefactDetailPage />} />
        <Route path="artefacts/:id/edit" element={<ArtefactEditPage />} />
        <Route path="artefacts/:id/qr" element={<ArtefactQrPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="locations" element={<LocationsPage />} />
        <Route path="qr-codes" element={<QrCodesPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
