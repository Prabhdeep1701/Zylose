"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter, Search, ChevronDown, ChevronUp, RefreshCw, Download,
  AlertTriangle, Shield, Clock, Globe, ChevronRight
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import SeverityBadge from "@/components/SeverityBadge";
import { generateAlerts, type Alert } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/utils";

const SEVERITIES = ["all", "critical", "high", "medium", "low"] as const;
const STATUSES   = ["all", "active", "investigating", "resolved", "authorized"] as const;

export default function AlertsPage() {
  const [allAlerts, setAllAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    setAllAlerts(generateAlerts(30));
  }, []);
  const [search, setSearch] = useState("");
  const [severity, setSeverity] = useState<typeof SEVERITIES[number]>("all");
  const [status, setStatus]     = useState<typeof STATUSES[number]>("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sortField, setSortField] = useState<keyof Alert>("timestamp");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let data = [...allAlerts];
    if (severity !== "all") data = data.filter(a => a.severity === severity);
    if (status   !== "all") data = data.filter(a => a.status   === status);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(a =>
        a.type.toLowerCase().includes(q) ||
        a.sourceIp.includes(q) ||
        a.targetIp.includes(q) ||
        a.id.toLowerCase().includes(q)
      );
    }
    data.sort((a, b) => {
      const av = a[sortField] ?? "";
      const bv = b[sortField] ?? "";
      const cmp = String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return data;
  }, [allAlerts, severity, status, search, sortField, sortDir]);

  const handleSort = useCallback((field: keyof Alert) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }, [sortField]);

  const counts = useMemo(() => ({
    critical: allAlerts.filter(a => a.severity === "critical").length,
    high:     allAlerts.filter(a => a.severity === "high").length,
    medium:   allAlerts.filter(a => a.severity === "medium").length,
    low:      allAlerts.filter(a => a.severity === "low").length,
    active:   allAlerts.filter(a => a.status   === "active").length,
  }), [allAlerts]);

  const SortIcon = ({ field }: { field: keyof Alert }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 opacity-30" />;
    return sortDir === "asc" ? <ChevronUp className="w-3 h-3 text-[#00FF9C]" /> : <ChevronDown className="w-3 h-3 text-[#00FF9C]" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Incident <span className="gradient-text-green">Command Center</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {counts.active} active threats · {allAlerts.length} total incidents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(0,255,156,0.2)] text-[#00FF9C] text-sm hover:bg-[rgba(0,255,156,0.05)] transition-all">
            <Download className="w-4 h-4" /> Export
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-[#05070D] bg-[#00FF9C] hover:bg-[#00CC7A] transition-all glow-green-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </motion.button>
        </div>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "Critical", count: counts.critical, color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.25)" },
          { label: "High",     count: counts.high,     color: "#F59E0B", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)" },
          { label: "Medium",   count: counts.medium,   color: "#3B82F6", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)" },
          { label: "Low",      count: counts.low,      color: "#00FF9C", bg: "rgba(0,255,156,0.08)",  border: "rgba(0,255,156,0.25)" },
          { label: "Active",   count: counts.active,   color: "#8B5CF6", bg: "rgba(139,92,246,0.08)", border: "rgba(139,92,246,0.25)" },
        ].map((c, i) => (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="p-4 rounded-xl flex items-center justify-between"
            style={{ background: c.bg, border: `1px solid ${c.border}` }}
          >
            <div>
              <p className="text-xs text-[#64748B] font-mono uppercase">{c.label}</p>
              <p className="text-2xl font-bold mt-0.5" style={{ color: c.color }}>{c.count}</p>
            </div>
            <AlertTriangle className="w-5 h-5 opacity-50" style={{ color: c.color }} />
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-3 items-center p-4 rounded-xl"
        style={{ background: "rgba(13,19,33,0.6)", border: "1px solid rgba(0,255,156,0.1)" }}
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search alerts, IPs, types..."
            className="w-full h-9 pl-9 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,255,156,0.12)] rounded-lg text-sm text-[#E2E8F0] placeholder-[#475569] focus:outline-none focus:border-[rgba(0,255,156,0.4)] transition-all"
          />
        </div>

        {/* Severity filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-[#475569]" />
          {SEVERITIES.map(s => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                severity === s
                  ? "bg-[rgba(0,255,156,0.15)] border border-[rgba(0,255,156,0.4)] text-[#00FF9C]"
                  : "border border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8] hover:border-[rgba(255,255,255,0.12)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-all ${
                status === s
                  ? "bg-[rgba(59,130,246,0.15)] border border-[rgba(59,130,246,0.4)] text-[#3B82F6]"
                  : "border border-[rgba(255,255,255,0.06)] text-[#64748B] hover:text-[#94A3B8]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Alerts Table */}
      <GlassCard noPadding delay={0.35}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="border-b border-[rgba(0,255,156,0.08)]">
                {([
                  { label: "ID",         field: "id" as keyof Alert },
                  { label: "Timestamp",  field: "timestamp" as keyof Alert },
                  { label: "Type",       field: "type" as keyof Alert },
                  { label: "Severity",   field: "severity" as keyof Alert },
                  { label: "Source IP",  field: "sourceIp" as keyof Alert },
                  { label: "Target IP",  field: "targetIp" as keyof Alert },
                  { label: "Risk Score", field: "riskScore" as keyof Alert },
                  { label: "Status",     field: "status" as keyof Alert },
                  { label: "",           field: null },
                ] as const).map(({ label, field }) => (
                  <th
                    key={label}
                    onClick={() => field && handleSort(field)}
                    className={`text-left px-4 py-3 text-[#475569] font-semibold uppercase tracking-wider text-[10px] ${field ? "cursor-pointer hover:text-[#94A3B8]" : ""}`}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      {field && <SortIcon field={field} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filtered.map((alert, i) => (
                  <>
                    <motion.tr
                      key={alert.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.02 }}
                      onClick={() => setExpanded(expanded === alert.id ? null : alert.id)}
                      className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,255,156,0.03)] transition-colors cursor-pointer"
                    >
                      <td className="px-4 py-3 text-[#00FF9C]">{alert.id}</td>
                      <td className="px-4 py-3 text-[#64748B]">{formatTimestamp(alert.timestamp)}</td>
                      <td className="px-4 py-3 text-[#E2E8F0]">{alert.type}</td>
                      <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                      <td className="px-4 py-3 text-[#3B82F6]">{alert.sourceIp}</td>
                      <td className="px-4 py-3 text-[#94A3B8]">{alert.targetIp}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 bg-[#0D1321] rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${alert.riskScore}%`,
                                background: alert.riskScore > 75 ? "#EF4444" : alert.riskScore > 50 ? "#F59E0B" : "#3B82F6",
                              }}
                            />
                          </div>
                          <span className={alert.riskScore > 75 ? "text-[#EF4444]" : alert.riskScore > 50 ? "text-[#F59E0B]" : "text-[#3B82F6]"}>
                            {alert.riskScore}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          alert.status === "active"        ? "bg-[rgba(239,68,68,0.1)]  text-[#EF4444] border-[rgba(239,68,68,0.3)]" :
                          alert.status === "investigating" ? "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]" :
                          alert.status === "resolved"      ? "bg-[rgba(0,255,156,0.1)]  text-[#00FF9C] border-[rgba(0,255,156,0.3)]" :
                            "bg-[rgba(100,116,139,0.1)] text-[#94A3B8] border-[rgba(100,116,139,0.3)]"
                        }`}>
                          {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <ChevronRight className={`w-4 h-4 text-[#475569] transition-transform ${expanded === alert.id ? "rotate-90" : ""}`} />
                      </td>
                    </motion.tr>

                    {/* Expanded row */}
                    <AnimatePresence>
                      {expanded === alert.id && (
                        <motion.tr
                          key={`${alert.id}-expanded`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan={9} className="px-4 py-4 bg-[rgba(0,255,156,0.02)] border-b border-[rgba(0,255,156,0.08)]">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div>
                                <p className="text-[#475569] uppercase mb-1">Description</p>
                                <p className="text-[#E2E8F0]">{alert.description}</p>
                              </div>
                              <div>
                                <p className="text-[#475569] uppercase mb-1">Protocol</p>
                                <p className="text-[#00FF9C]">{alert.protocol}</p>
                              </div>
                              <div>
                                <p className="text-[#475569] uppercase mb-1">Port</p>
                                <p className="text-[#3B82F6]">{alert.port}</p>
                              </div>
                              <div className="flex gap-2">
                                <button className="px-3 py-1.5 rounded-lg text-xs border border-[rgba(239,68,68,0.3)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-all">
                                  Block IP
                                </button>
                                <button className="px-3 py-1.5 rounded-lg text-xs border border-[rgba(0,255,156,0.3)] text-[#00FF9C] hover:bg-[rgba(0,255,156,0.1)] transition-all">
                                  Investigate
                                </button>
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </>
                ))}
              </AnimatePresence>

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#475569]">
                    <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p>No alerts matching current filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(0,255,156,0.08)]">
          <p className="text-xs text-[#475569] font-mono">
            Showing {filtered.length} of {allAlerts.length} alerts
          </p>
          <div className="flex items-center gap-1">
            {[1, 2, 3].map(p => (
              <button key={p} className={`w-7 h-7 rounded text-xs font-mono ${p === 1 ? "bg-[rgba(0,255,156,0.15)] text-[#00FF9C] border border-[rgba(0,255,156,0.3)]" : "text-[#64748B] hover:text-[#94A3B8]"}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
