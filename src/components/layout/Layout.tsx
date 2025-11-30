import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { LoginModal } from "../LoginModal";

export default function Layout() {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  // const { isAuthenticated } = useAuth();

  return (
    <main
      style={{ display: "block" }}
      className="text-foreground flex min-h-screen w-full bg-gradient-to-br from-gray-900 to-black"
    >
      {/* Desktop Sidebar */}
      <Sidebar
        expanded={expanded}
        setExpanded={setExpanded}
        onLoginClick={() => setShowLoginModal(true)}
      />

      {/* Mobile Sidebar (no nested aside) */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Drawer */}
          <Sidebar
            expanded={true}
            setExpanded={setExpanded}
            mobile
            setMobileOpen={setMobileOpen}
            onLoginClick={() => setShowLoginModal(true)}
          />
        </>
      )}

      {/* MAIN CONTENT */}
      <div
        className={`flex flex-1 flex-col transition-[margin,width] duration-300 ${
          expanded ? "md:ml-64" : "md:ml-16"
        } ml-0`}
      >
        {/* Topbar with hamburger */}
        <Topbar onMenuClick={() => setMobileOpen(!mobileOpen)} />

        {/* Page content */}
        <main className="px-4 pt-4 pb-10 transition-all duration-300 sm:px-6">
          <Outlet />
        </main>
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </main>
  );
}
