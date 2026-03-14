"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerRight?: ReactNode;
  noPadding?: boolean;
  delay?: number;
  glowColor?: string;
}

export default function GlassCard({
  children,
  className = "",
  title,
  subtitle,
  headerRight,
  noPadding = false,
  delay = 0,
  glowColor = "rgba(0, 255, 156, 0.08)",
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={`relative rounded-xl overflow-hidden ${className}`}
      style={{
        background: "linear-gradient(135deg, rgba(13,19,33,0.8), rgba(8,12,20,0.9))",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(0,255,156,0.12)",
      }}
    >
      {/* Subtle top glow */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(0,255,156,0.3), transparent)" }}
      />

      {(title || headerRight) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(0,255,156,0.08)]">
          <div>
            {title && (
              <h3 className="text-sm font-semibold text-[#E2E8F0] flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-[#00FF9C] inline-block" style={{ boxShadow: "0 0 8px rgba(0,255,156,0.6)" }} />
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#475569] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerRight && (
            <div className="flex items-center gap-2">{headerRight}</div>
          )}
        </div>
      )}

      <div className={noPadding ? "" : "p-5"}>{children}</div>
    </motion.div>
  );
}
