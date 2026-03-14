"use client";

import { cn, getSeverityClass } from "@/lib/utils";

interface SeverityBadgeProps {
  severity: string;
  className?: string;
}

export default function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  const badgeClass = getSeverityClass(severity);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider font-mono",
        badgeClass,
        className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {severity}
    </span>
  );
}
