"use client";

import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#05070D] cyber-grid overflow-hidden">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-96 h-96 bg-[rgba(0,255,156,0.03)] rounded-full blur-[100px]" />
        <div className="absolute bottom-[-5%] right-[15%] w-80 h-80 bg-[rgba(59,130,246,0.04)] rounded-full blur-[100px]" />
        <div className="absolute top-[40%] right-[30%] w-64 h-64 bg-[rgba(139,92,246,0.03)] rounded-full blur-[80px]" />
      </div>

      <Sidebar />

      <div className="flex flex-col flex-1 min-w-0 relative z-10">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
