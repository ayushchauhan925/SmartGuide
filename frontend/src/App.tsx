import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegister } from "@/components/visitor/ServiceWorkerRegister";

const Home = lazy(() => import("@/pages/Home"));
const Explore = lazy(() => import("@/pages/Explore"));
const Favorites = lazy(() => import("@/pages/Favorites"));
const Tours = lazy(() => import("@/pages/Tours"));
const TourDetail = lazy(() => import("@/pages/TourDetail"));
const Artefact = lazy(() => import("@/pages/Artefact"));
const Offline = lazy(() => import("@/pages/Offline"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const Dashboard = lazy(() => import("@/pages/admin/Dashboard"));
const Login = lazy(() => import("@/pages/admin/Login"));
const Activity = lazy(() => import("@/pages/admin/Activity"));
const Analytics = lazy(() => import("@/pages/admin/Analytics"));
const Feedback = lazy(() => import("@/pages/admin/Feedback"));
const Categories = lazy(() => import("@/pages/admin/Categories"));
const Locations = lazy(() => import("@/pages/admin/Locations"));
const Users = lazy(() => import("@/pages/admin/Users"));
const Settings = lazy(() => import("@/pages/admin/Settings"));
const AdminTours = lazy(() => import("@/pages/admin/Tours"));
const QrCodes = lazy(() => import("@/pages/admin/QrCodes"));
const QrPrint = lazy(() => import("@/pages/admin/QrPrint"));
const Artefacts = lazy(() => import("@/pages/admin/Artefacts"));
const ArtefactNew = lazy(() => import("@/pages/admin/ArtefactNew"));
const ArtefactDetail = lazy(() => import("@/pages/admin/ArtefactDetail"));
const ArtefactEdit = lazy(() => import("@/pages/admin/ArtefactEdit"));
const ArtefactAudio = lazy(() => import("@/pages/admin/ArtefactAudio"));
const ArtefactMedia = lazy(() => import("@/pages/admin/ArtefactMedia"));
const ArtefactQr = lazy(() => import("@/pages/admin/ArtefactQr"));
const ArtefactTranslations = lazy(() => import("@/pages/admin/ArtefactTranslations"));
const ArtefactHistory = lazy(() => import("@/pages/admin/ArtefactHistory"));

/** Scroll to top on navigation, except for same-page query changes (e.g. language switch). */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <ToastProvider>
        <Suspense fallback={null}>
        <Routes>
          {/* Visitor site */}
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/tours" element={<Tours />} />
          <Route path="/tours/:slug" element={<TourDetail />} />
          <Route path="/a/:uniquePublicId" element={<Artefact />} />
          <Route path="/offline" element={<Offline />} />

          {/* Admin */}
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/login" element={<Login />} />
          <Route path="/admin/activity" element={<Activity />} />
          <Route path="/admin/analytics" element={<Analytics />} />
          <Route path="/admin/feedback" element={<Feedback />} />
          <Route path="/admin/categories" element={<Categories />} />
          <Route path="/admin/locations" element={<Locations />} />
          <Route path="/admin/users" element={<Users />} />
          <Route path="/admin/settings" element={<Settings />} />
          <Route path="/admin/tours" element={<AdminTours />} />
          <Route path="/admin/qr-codes" element={<QrCodes />} />
          <Route path="/admin/qr-codes/print" element={<QrPrint />} />
          <Route path="/admin/artefacts" element={<Artefacts />} />
          <Route path="/admin/artefacts/new" element={<ArtefactNew />} />
          <Route path="/admin/artefacts/:id" element={<ArtefactDetail />} />
          <Route path="/admin/artefacts/:id/edit" element={<ArtefactEdit />} />
          <Route path="/admin/artefacts/:id/audio" element={<ArtefactAudio />} />
          <Route path="/admin/artefacts/:id/media" element={<ArtefactMedia />} />
          <Route path="/admin/artefacts/:id/qr" element={<ArtefactQr />} />
          <Route path="/admin/artefacts/:id/translations" element={<ArtefactTranslations />} />
          <Route path="/admin/artefacts/:id/history" element={<ArtefactHistory />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </ToastProvider>
      <ServiceWorkerRegister />
    </BrowserRouter>
  );
}
