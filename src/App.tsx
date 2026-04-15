import { Suspense, lazy, useEffect, useState } from "react";
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { LoginModal } from "./components/LoginModal";
import { GlobalLoader } from "./components/GlobalLoader";
import { ConnectionStatus } from "./components/ConnectionStatus";
import { PageTransitionLoader } from "./components/PageTransitionLoader";
import { useRouteLoading } from "./hooks/useRouteLoading";

const Reputation = lazy(
  () => import("./features/reputation/components/ReputationPage"),
);
const AdminUsers = lazy(() => import("./pages/AdminUsers"));
const AdminAnalytics = lazy(() => import("./pages/AdminAnalytics"));

// const Voting = lazy(() => import("./pages/Voting"));

// const Escrow = lazy(() => import("./pages/Escrow"));

// ---- Pages-based structure and routes (Previous) ─────────────────────────────────────────
// const Index = lazy(() => import("./pages/Index"));
// const Agreements = lazy(() => import("./pages/Agreements"));
// const AgreementDetails = lazy(() => import("./pages/AgreementDetails"));

// const Disputes = lazy(() => import("./pages/Disputes"));
// const DisputeDetails = lazy(() => import("./pages/DisputeDetails"));
// const Escrow = lazy(() => import("./pages/Escrow"));
// const EscrowDetails = lazy(() => import("./pages/EscrowDetails"));

// const Voting = lazy(() => import("./pages/Voting"));

// const Profile = lazy(() => import("./pages/Profile"));
// const UserProfile = lazy(() => import("./pages/UserProfile"));

// const NotFound = lazy(() => import("./pages/NotFound"));

// ---- Feature-based sructure and routes ─────────────────────────────────────────
const Index = lazy(() => import("./features/index"));

const Agreements = lazy(() => import("./features/agreements"));
const AgreementDetails = lazy(() => import("./features/agreementDetails"));

const Disputes = lazy(() => import("./features/disputes"));
const DisputeDetails = lazy(() => import("./features/disputeDetails"));

const Escrow = lazy(() => import("./features/escrow/Escrow"));
const EscrowDetails = lazy(() => import("./features/escrowDetails"));

const Voting = lazy(() => import("./features/voting/index"));

const Profile = lazy(() => import("./features/profile"));
const UserProfile = lazy(() => import("./features/userProfile"));

const NotFound = lazy(() => import("./pages/NotFound"));

// ─── Auto Login Modal ──────────────────────────────────────────

function AutoLoginModal() {
  const { isAuthenticated, isLoading, isAuthInitialized } = useAuth();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const isHomepage = location.pathname === "/";

    if (!isAuthInitialized) return;

    if (isHomepage && !isAuthenticated && !isLoading && !hasInteracted) {
      const timer = setTimeout(() => setShowModal(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [
    isAuthInitialized,
    isAuthenticated,
    isLoading,
    location.pathname,
    hasInteracted,
  ]);

  const handleClose = () => {
    setShowModal(false);
    setHasInteracted(true);
  };

  if (!showModal) return null;

  return <LoginModal isOpen={true} onClose={handleClose} />;
}

// ─── App Content ───────────────────────────────────────────────

function AppContent() {
  const { isAuthInitialized, isLoading: authLoading } = useAuth();
  const isRouteLoading = useRouteLoading();

  const showInitialLoader = !isAuthInitialized || authLoading;
  const showTransitionLoader = isRouteLoading && isAuthInitialized;

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />

      <ScrollToTop />
      <AutoLoginModal />
      <ConnectionStatus />

      {/* Full screen initial loader */}
      {showInitialLoader && <GlobalLoader />}

      {/* Small top transition loader */}
      {showTransitionLoader && <PageTransitionLoader />}

      <Suspense fallback={<GlobalLoader />}>
        <Routes>
          {/* ── Main App ───────────────────────────────── */}

          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />

            <Route path="agreements" element={<Agreements />} />
            <Route path="agreements/:id" element={<AgreementDetails />} />

            <Route path="disputes" element={<Disputes />} />
            <Route path="disputes/:id" element={<DisputeDetails />} />

            <Route path="voting" element={<Voting />} />

            <Route path="escrow" element={<Escrow />} />
            <Route path="escrow/:id" element={<EscrowDetails />} />

            <Route path="reputation" element={<Reputation />} />

            <Route path="profile" element={<Profile />} />
            <Route path="profile/:handle" element={<UserProfile />} />
          </Route>

          {/* ── Admin ─────────────────────────────────── */}

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminUsers />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="analytics" element={<AdminAnalytics />} />
          </Route>

          {/* ── Fallback ──────────────────────────────── */}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </TooltipProvider>
  );
}

// ─── Root ──────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
