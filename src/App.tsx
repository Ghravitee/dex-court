import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";

import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { AuthProvider } from "./context/AuthContext"; // Import the AuthProvider
// import Web3Int from "./pages/Web3Int";
import Web3Vote from "./pages/Web3Vote";
import Web3Escrow from "./pages/Web3Escrow";
// import DebugAuth from "./pages/DebugAuth";

export default function App() {
  return (
    <AuthProvider>
      {" "}
      {/* Wrap everything with AuthProvider */}
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* <DebugAuth /> */}
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* <Route path="/landing" element={<Landing />} /> */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="agreements" element={<Agreements />} />
              <Route path="agreements/:id" element={<AgreementDetails />} />
              {/* <Route path="web3" element={<Web3Int />} /> */}
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
    </AuthProvider>
  );
}
