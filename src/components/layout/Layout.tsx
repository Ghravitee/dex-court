import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export default function Layout() {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-background text-foreground flex min-h-screen w-full">
      {/* Desktop Sidebar */}
      <Sidebar expanded={expanded} setExpanded={setExpanded} />

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
    </div>
  );
}
