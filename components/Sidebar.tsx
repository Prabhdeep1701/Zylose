"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Bell, Monitor, Activity, Network,
  FileText, Settings, Shield, ChevronLeft, ChevronRight,
  Zap, AlertTriangle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type LogEntry } from "@/lib/mock-data";

const navItems = [
  { href: "/dashboard",        label: "Dashboard",       icon: LayoutDashboard },
  { href: "/alerts",           label: "Alerts",          icon: Bell },
  { href: "/system",           label: "System Monitor",  icon: Monitor },
  { href: "/network",          label: "Network Activity", icon: Network },
  { href: "/logs",             label: "Logs",            icon: FileText },
  { href: "/settings",         label: "Settings",        icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [activeThreats, setActiveThreats] = useState(0);
  const [lastHourDelta, setLastHourDelta] = useState(0);

  const fetchThreatSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/logs?limit=500", { cache: "no-store" });
      if (!response.ok) return;

      const payload: { logs?: LogEntry[] } = await response.json();
      const logs = Array.isArray(payload.logs) ? payload.logs : [];

      const isActiveThreat = (level: LogEntry["level"]) => level === "CRITICAL" || level === "ERROR";

      const activeCount = logs.filter((log) => isActiveThreat(log.level)).length;

      const now = Date.now();
      const oneHourMs = 60 * 60 * 1000;
      const currentHour = logs.filter((log) => {
        const ts = new Date(log.timestamp).getTime();
        return isActiveThreat(log.level) && ts >= now - oneHourMs;
      }).length;
      const previousHour = logs.filter((log) => {
        const ts = new Date(log.timestamp).getTime();
        return isActiveThreat(log.level) && ts >= now - 2 * oneHourMs && ts < now - oneHourMs;
      }).length;

      setActiveThreats(activeCount);
      setLastHourDelta(currentHour - previousHour);
    } catch {
      // Keep last successful values when backend is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void fetchThreatSummary();
    }, 0);
    const id = setInterval(() => {
      void fetchThreatSummary();
    }, 3000);

    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [fetchThreatSummary]);

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="relative flex flex-col h-full bg-[#080C14] border-r border-[rgba(0,255,156,0.12)] overflow-hidden flex-shrink-0"
    >
      {/* Top brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-[rgba(0,255,156,0.1)]">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-[rgba(0,255,156,0.1)] border border-[rgba(0,255,156,0.4)] flex items-center justify-center glow-green-sm">
            <Shield className="w-5 h-5 text-[#00FF9C]" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#00FF9C] rounded-full pulse-neon" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <p className="font-bold text-base text-white leading-tight tracking-tight">Zylose</p>
              <p className="text-[10px] text-[#00FF9C] font-mono tracking-widest uppercase">Cyber Defense</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Status bar */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mt-3 px-3 py-2 rounded-lg bg-[rgba(0,255,156,0.05)] border border-[rgba(0,255,156,0.15)]"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3 h-3 text-[#00FF9C]" />
                <span className="text-[10px] text-[#94A3B8] font-mono">SYSTEM ONLINE</span>
              </div>
              <span className="text-[10px] text-[#00FF9C] font-mono font-bold">98.2%</span>
            </div>
            <div className="mt-1.5 h-1 bg-[#0D1321] rounded-full overflow-hidden">
              <div className="h-full w-[98.2%] bg-gradient-to-r from-[#00FF9C] to-[#22C55E] rounded-full" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Nav items */}
      <nav className="flex-1 px-2 pt-4 space-y-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          const badge = href === "/alerts" ? activeThreats : undefined;
          return (
            <Link key={href} href={href}>
              <motion.div
                whileHover={{ x: collapsed ? 0 : 4 }}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 group",
                  active
                    ? "bg-[rgba(0,255,156,0.08)] border border-[rgba(0,255,156,0.25)] text-[#00FF9C]"
                    : "text-[#64748B] hover:text-[#94A3B8] hover:bg-[rgba(255,255,255,0.03)] border border-transparent"
                )}
              >
                {active && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#00FF9C] rounded-r-full"
                    style={{ boxShadow: "0 0 8px #00FF9C, 0 0 16px rgba(0,255,156,0.4)" }}
                  />
                )}
                <div className="relative">
                  <Icon className={cn("w-4.5 h-4.5 flex-shrink-0", active && "drop-shadow-[0_0_6px_rgba(0,255,156,0.8)]")} style={{ width: 18, height: 18 }} />
                </div>
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={cn("text-sm font-medium flex-1 whitespace-nowrap", active ? "text-[#00FF9C]" : "")}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {badge !== undefined && !collapsed && (
                  <span className="ml-auto flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)] text-[#EF4444]">
                    {badge}
                  </span>
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Active threats indicator */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-3 mb-3 p-3 rounded-lg bg-[rgba(239,68,68,0.06)] border border-[rgba(239,68,68,0.2)]"
          >
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-3.5 h-3.5 text-[#EF4444]" />
              <span className="text-[10px] font-semibold text-[#EF4444] uppercase tracking-wider">Active Threats</span>
            </div>
            <p className="text-2xl font-bold text-[#EF4444] glow-text-red">{activeThreats}</p>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">
              {lastHourDelta >= 0 ? "↑" : "↓"} {Math.abs(lastHourDelta)} in last hour
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[76px] w-6 h-6 rounded-full bg-[#0B0F19] border border-[rgba(0,255,156,0.3)] flex items-center justify-center text-[#00FF9C] hover:glow-green-sm transition-all z-10"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </motion.aside>
  );
}
