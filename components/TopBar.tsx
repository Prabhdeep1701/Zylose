"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Bell, Settings, User, Wifi, Shield } from "lucide-react";

export default function TopBar() {
  const [time, setTime] = useState(new Date(0)); // epoch avoids SSR mismatch
  const [search, setSearch] = useState("");

  useEffect(() => {
    // Set real time only on client
    setTime(new Date());
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = time.toLocaleTimeString("en-US", { hour12: false });
  const dateStr = time.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  return (
    <header className="h-[60px] flex items-center px-6 gap-4 bg-[#080C14] border-b border-[rgba(0,255,156,0.1)] flex-shrink-0">
      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search infrastructure or threat..."
          className="w-full h-9 pl-9 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,255,156,0.12)] rounded-lg text-sm text-[#94A3B8] placeholder-[#475569] focus:outline-none focus:border-[rgba(0,255,156,0.4)] focus:bg-[rgba(0,255,156,0.03)] transition-all"
        />
      </div>

      <div className="flex-1" />

      {/* Live status */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(0,255,156,0.15)] bg-[rgba(0,255,156,0.04)]">
        <span className="w-2 h-2 rounded-full bg-[#00FF9C] pulse-neon" />
        <span className="text-xs font-mono text-[#00FF9C]">LIVE</span>
      </div>

      {/* Network status */}
      <div className="hidden lg:flex items-center gap-1.5 text-[#94A3B8]">
        <Wifi className="w-4 h-4 text-[#00FF9C]" />
        <span className="text-xs font-mono">4.2 TB/s</span>
      </div>

      {/* Time */}
      <div className="hidden lg:flex flex-col items-end">
        <span className="text-sm font-mono font-bold text-[#E2E8F0]">{timeStr}</span>
        <span className="text-[10px] text-[#475569] font-mono">{dateStr}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-[rgba(0,255,156,0.1)]" />

      {/* Notification bell */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="relative w-9 h-9 rounded-lg border border-[rgba(0,255,156,0.12)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[#64748B] hover:text-[#00FF9C] hover:border-[rgba(0,255,156,0.3)] transition-all"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute -top-1 -right-1 w-4 h-4 text-[9px] font-bold bg-[#EF4444] text-white rounded-full flex items-center justify-center">8</span>
      </motion.button>

      {/* Settings */}
      <motion.button
        whileHover={{ scale: 1.05, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        className="w-9 h-9 rounded-lg border border-[rgba(0,255,156,0.12)] bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[#64748B] hover:text-[#00FF9C] hover:border-[rgba(0,255,156,0.3)] transition-all"
      >
        <Settings className="w-4 h-4" />
      </motion.button>

      {/* User avatar */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-2 cursor-pointer"
      >
        <div className="w-9 h-9 rounded-lg border border-[rgba(0,255,156,0.3)] bg-[rgba(0,255,156,0.08)] flex items-center justify-center glow-green-sm">
          <User className="w-4 h-4 text-[#00FF9C]" />
        </div>
        <div className="hidden lg:block">
          <p className="text-xs font-semibold text-[#E2E8F0] leading-tight">Admin Zero</p>
          <p className="text-[10px] text-[#00FF9C] font-mono">Level 5 Access</p>
        </div>
      </motion.div>
    </header>
  );
}
