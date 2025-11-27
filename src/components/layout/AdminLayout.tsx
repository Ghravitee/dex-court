// src/components/layout/AdminLayout.tsx
import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";
import { useAdminAccess } from "../../hooks/useAdmin";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth"; // Import useAuth to check loading state

export const AdminLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAdmin, isLoading: adminLoading } = useAdminAccess();
  const { isLoading: authLoading } = useAuth(); // Get auth loading state
  const location = useLocation();
  const [initialLoad, setInitialLoad] = useState(true);

  // Combined loading state - wait for both auth and admin checks
  const isLoading = authLoading || adminLoading;

  // Give the app time to initialize and load user data
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 1500); // Wait 1.5 seconds for everything to load

    return () => clearTimeout(timer);
  }, []);

  // Show loading state during initial app load or when auth is loading
  if (initialLoad || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-300" />
          <span className="text-cyan-300">Loading admin panel...</span>
        </div>
      </div>
    );
  }

  // Only redirect if we're absolutely sure the user is not an admin
  if (!isAdmin) {
    console.warn("🔐 Admin access denied - redirecting to home");
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location,
          message: "Admin access required",
          attemptedPath: location.pathname,
        }}
      />
    );
  }

  return (
    <main className="flex min-h-screen w-full bg-gradient-to-br from-gray-900 to-black text-white">
      {/* Desktop Admin Sidebar */}
      <AdminSidebar />

      {/* Mobile Admin Sidebar */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Sidebar Drawer */}
          <div className="fixed top-0 left-0 z-50 h-full w-64 md:hidden">
            <AdminSidebar mobile onClose={() => setMobileOpen(false)} />
          </div>
        </>
      )}

      {/* MAIN CONTENT */}
      <div className="flex flex-1 flex-col md:ml-64">
        {/* Admin Topbar */}
        <AdminTopbar onMenuClick={() => setMobileOpen(!mobileOpen)} />

        {/* Page content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </main>
  );
};
