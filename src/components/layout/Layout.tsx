import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export default function Layout() {
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex">
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
          <Sidebar expanded={true} setExpanded={setExpanded} mobile />
        </>
      )}

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 flex flex-col transition-[margin,width] duration-300 ${
          expanded ? "md:ml-64" : "md:ml-16"
        } ml-0`}
      >
        {/* Topbar with hamburger */}
        <Topbar onMenuClick={() => setMobileOpen(!mobileOpen)} />

        {/* Page content */}
        <main className="px-4 pb-10 pt-4 sm:px-6 transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
