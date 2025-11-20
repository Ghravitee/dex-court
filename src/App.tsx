// src/App.tsx - Updated version
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";

import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Layout from "./components/layout/Layout";
import Agreements from "./pages/Agreements";
import Disputes from "./pages/Disputes";
import Voting from "./pages/Voting";
import Escrow from "./pages/Escrow";
import Reputation from "./pages/Reputation";
import Profile from "./pages/Profile";
import AgreementDetails from "./pages/AgreementDetails";
import EscrowDetails from "./pages/EscrowDetails";
import UserProfile from "./pages/UserProfile";
import { ScrollToTop } from "./components/ScrollToTop";
import DisputeDetails from "./pages/DisputeDetails";
import { AuthProvider } from "./context/AuthContext";
import { useAuth } from "./hooks/useAuth";
import Web3Vote from "./pages/Web3Vote";
import Web3Escrow from "./pages/Web3Escrow";
import { useEffect, useState } from "react";
import { LoginModal } from "./components/LoginModal";

// Auto Login Modal Component
function AutoLoginModal() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    // Only show modal on homepage for unauthenticated users who haven't interacted yet
    const isHomepage = location.pathname === "/";

    if (isHomepage && !isAuthenticated && !isLoading && !hasInteracted) {
      // Small delay to ensure the page is loaded
      const timer = setTimeout(() => {
        setShowModal(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, isLoading, location.pathname, hasInteracted]);

  const handleClose = () => {
    setShowModal(false);
    setHasInteracted(true);
  };

  if (showModal) {
    return <LoginModal isOpen={true} onClose={handleClose} />;
  }

  return null;
}

function AppContent() {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AutoLoginModal />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Index />} />
            <Route path="agreements" element={<Agreements />} />
            <Route path="agreements/:id" element={<AgreementDetails />} />
            <Route path="web3vote" element={<Web3Vote />} />
            <Route path="web3escrow" element={<Web3Escrow />} />
            <Route path="disputes" element={<Disputes />} />
            <Route path="/disputes/:id" element={<DisputeDetails />} />
            <Route path="voting" element={<Voting />} />
            <Route path="escrow" element={<Escrow />} />
            <Route path="/escrow/:id" element={<EscrowDetails />} />
            <Route path="reputation" element={<Reputation />} />
            <Route path="profile" element={<Profile />} />
            <Route path="profile/:handle" element={<UserProfile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
