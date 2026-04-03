import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
// import Agreements from "./pages/Agreements";
// import AgreementDetails from "./pages/AgreementDetails";
// import Disputes from "./pages/Disputes";
// import DisputeDetails from "./pages/DisputeDetails";
import Voting from "./pages/Voting";
import Escrow from "./pages/Escrow";
import Reputation from "./pages/Reputation";
//
import EscrowDetails from "./pages/EscrowDetails";
// import UserProfile from "./pages/UserProfile";
import { ScrollToTop } from "./components/ScrollToTop";

import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import { useEffect, useState } from "react";
import { LoginModal } from "./components/LoginModal";
import { AdminLayout } from "./components/layout/AdminLayout";
import AdminUsers from "./pages/AdminUsers";
import AdminAnalytics from "./pages/AdminAnalytics";
// import Web3Escrow from "./pages/h2copy";
import { GlobalLoader } from "./components/GlobalLoader";
import { PageTransitionLoader } from "./components/PageTransitionLoader";
import { useRouteLoading } from "./hooks/useRouteLoading";
import { ConnectionStatus } from "./components/ConnectionStatus";

// Feature-based page replacements (new architecture)
import Index from "./features/index";
import Profile from "./features/profile";
import UserProfile from "./features/userProfile";
import Agreements from "./features/agreements";
import AgreementDetails from "./features/agreementDetails";
import Disputes from "./features/disputes";
import DisputeDetails from "./features/disputeDetails";

// ─── Auto Login Modal ─────────────────────────────────────────────────────────
// Shows a login prompt 3 seconds after landing on the homepage
// if the user is unauthenticated and hasn't dismissed it yet.

function AutoLoginModal() {
  const { isAuthenticated, isLoading, isAuthInitialized } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const isHomepage = location.pathname === "/";

    // Wait for auth state to settle before deciding whether to prompt
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
    setHasInteracted(true); // Suppress re-triggering for the rest of the session
  };

  if (!showModal) return null;
  return <LoginModal isOpen={true} onClose={handleClose} />;
}

// ─── App Content ──────────────────────────────────────────────────────────────
// Rendered inside AuthProvider + BrowserRouter.
// Handles global UI chrome (loaders, toasts, connection status) and all routes.

function AppContent() {
  const { isAuthInitialized, isLoading: authLoading } = useAuth();
  const isRouteLoading = useRouteLoading();

  // Full-screen loader on first mount until auth state is known
  const showInitialLoader = !isAuthInitialized || authLoading;
  // Slim top bar during subsequent route transitions
  const showTransitionLoader = isRouteLoading && isAuthInitialized;

  return (
    <TooltipProvider>
      {/* Toast providers — Radix (Toaster) and Sonner run side-by-side */}
      <Toaster />
      <Sonner />

      <ScrollToTop />
      <AutoLoginModal />
      <ConnectionStatus />

      {showInitialLoader && <GlobalLoader />}
      {showTransitionLoader && <PageTransitionLoader />}

      <Routes>
        {/* ── Main app shell ───────────────────────────────────────────────── */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Index />} />

          <Route path="agreements" element={<Agreements />} />
          <Route path="agreements/:id" element={<AgreementDetails />} />

          <Route path="disputes" element={<Disputes />} />
          <Route path="disputes/:id" element={<DisputeDetails />} />

          <Route path="voting" element={<Voting />} />

          <Route path="escrow" element={<Escrow />} />
          <Route path="escrow/:id" element={<EscrowDetails />} />
          {/* TODO: remove or rename once Web3Escrow is promoted */}

          <Route path="reputation" element={<Reputation />} />

          <Route path="profile" element={<Profile />} />
          <Route path="profile/:handle" element={<UserProfile />} />
        </Route>

        {/* ── Admin shell ──────────────────────────────────────────────────── */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminUsers />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>

        {/* ── Fallback ─────────────────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </TooltipProvider>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}
