import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
// import Landing from "./pages/Landing";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* <Route path="/landing" element={<Landing />} /> */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="agreements" element={<Agreements />} />
              <Route path="disputes" element={<Disputes />} />
              <Route path="voting" element={<Voting />} />
              <Route path="escrow" element={<Escrow />} />
              <Route path="reputation" element={<Reputation />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
