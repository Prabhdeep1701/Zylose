"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: ReactNode;
  trend?: { value: string; positive?: boolean };
  color?: "green" | "blue" | "purple" | "red" | "yellow";
  glowColor?: string;
  delay?: number;
}

const colorMap = {
  green:  { border: "rgba(0,255,156,0.25)",   bg: "rgba(0,255,156,0.06)",   icon: "rgba(0,255,156,0.15)",  text: "#00FF9C",  glow: "rgba(0,255,156,0.2)" },
  blue:   { border: "rgba(59,130,246,0.25)",  bg: "rgba(59,130,246,0.06)",  icon: "rgba(59,130,246,0.15)", text: "#3B82F6",  glow: "rgba(59,130,246,0.2)" },
  purple: { border: "rgba(139,92,246,0.25)",  bg: "rgba(139,92,246,0.06)",  icon: "rgba(139,92,246,0.15)", text: "#8B5CF6",  glow: "rgba(139,92,246,0.2)" },
  red:    { border: "rgba(239,68,68,0.3)",    bg: "rgba(239,68,68,0.06)",   icon: "rgba(239,68,68,0.15)",  text: "#EF4444",  glow: "rgba(239,68,68,0.25)" },
  yellow: { border: "rgba(245,158,11,0.25)",  bg: "rgba(245,158,11,0.06)",  icon: "rgba(245,158,11,0.15)", text: "#F59E0B",  glow: "rgba(245,158,11,0.2)" },
};

export default function StatCard({ title, value, subtext, icon, trend, color = "green", delay = 0 }: StatCardProps) {
  const c = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -2, boxShadow: `0 8px 30px ${c.glow}` }}
      className="relative overflow-hidden rounded-xl p-5 cursor-default transition-all duration-300"
      style={{
        background: `linear-gradient(135deg, rgba(13,19,33,0.9), rgba(8,12,20,0.9))`,
        border: `1px solid ${c.border}`,
        boxShadow: `0 0 20px ${c.glow}`,
      }}
    >
      {/* Background gradient blob */}
      <div
        className="absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-2xl"
        style={{ background: c.text }}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#64748B]">{title}</p>
        </div>
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: c.icon, border: `1px solid ${c.border}` }}
        >
          <span style={{ color: c.text }}>{icon}</span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-end gap-3">
        <span
          className="text-3xl font-bold tracking-tight"
          style={{ color: c.text, textShadow: `0 0 20px ${c.glow}` }}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "mb-1 text-xs font-semibold px-1.5 py-0.5 rounded-md",
              trend.positive
                ? "text-[#00FF9C] bg-[rgba(0,255,156,0.1)]"
                : "text-[#EF4444] bg-[rgba(239,68,68,0.1)]"
            )}
          >
            {trend.value}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1.5 text-xs text-[#64748B]">{subtext}</p>
      )}

      {/* Bottom glow line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-0.5 opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${c.text}, transparent)` }}
      />
    </motion.div>
  );
}
