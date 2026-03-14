"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, Download, RefreshCw, ChevronDown, Terminal } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import { generateLogs, type LogEntry } from "@/lib/mock-data";

const LOG_LEVELS = ["ALL", "INFO", "WARN", "ERROR", "DEBUG", "CRITICAL"] as const;
const LEVEL_COLORS: Record<string, string> = {
  INFO:     "#00FF9C",
  WARN:     "#F59E0B",
  ERROR:    "#EF4444",
  DEBUG:    "#64748B",
  CRITICAL: "#FF0080",
};
const LEVEL_BG: Record<string, string> = {
  INFO:     "rgba(0,255,156,0.08)",
  WARN:     "rgba(245,158,11,0.08)",
  ERROR:    "rgba(239,68,68,0.08)",
  DEBUG:    "rgba(100,116,139,0.08)",
  CRITICAL: "rgba(255,0,128,0.12)",
};

export default function LogsPage() {
  const [allLogs, setAllLogs] = useState<LogEntry[]>([]);
  const [search, setSearch]       = useState("");
  const [level, setLevel]         = useState<typeof LOG_LEVELS[number]>("ALL");
  const [service, setService]     = useState("ALL");
  const [viewMode, setViewMode]   = useState<"table" | "terminal">("table");
  const [showFilters, setShowFilters] = useState(true);
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setAllLogs(generateLogs(60));
  }, []);

  const services = useMemo(() => ["ALL", ...Array.from(new Set(allLogs.map(l => l.service)))], [allLogs]);

  const filtered = useMemo(() => {
    let data = [...allLogs];
    if (level !== "ALL")   data = data.filter(l => l.level === level);
    if (service !== "ALL") data = data.filter(l => l.service === service);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(l =>
        l.message.toLowerCase().includes(q) ||
        l.service.toLowerCase().includes(q) ||
        l.ip?.includes(q) ||
        l.userId?.includes(q)
      );
    }
    return data;
  }, [allLogs, level, service, search]);

  const levelCounts = useMemo(() => {
    const c: Record<string, number> = {};
    allLogs.forEach(l => { c[l.level] = (c[l.level] ?? 0) + 1; });
    return c;
  }, [allLogs]);

  const formatTimestamp = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")} ${d.toLocaleTimeString("en-US",{hour12:false})}`;
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
            System <span className="gradient-text-green">Logs</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1">
            {filtered.length} entries · {levelCounts["ERROR"] ?? 0} errors · {levelCounts["CRITICAL"] ?? 0} critical
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-[rgba(0,255,156,0.15)] bg-[rgba(0,0,0,0.3)]">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all ${viewMode === "table" ? "bg-[rgba(0,255,156,0.15)] text-[#00FF9C]" : "text-[#64748B]"}`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode("terminal")}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-1.5 ${viewMode === "terminal" ? "bg-[rgba(0,255,156,0.15)] text-[#00FF9C]" : "text-[#64748B]"}`}
            >
              <Terminal className="w-3 h-3" /> Terminal
            </button>
          </div>
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[rgba(0,255,156,0.2)] text-[#00FF9C] rounded-lg hover:bg-[rgba(0,255,156,0.05)] transition-all font-mono">
            <Download className="w-4 h-4" /> Export
          </button>
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-[#05070D] bg-[#00FF9C] hover:bg-[#00CC7A] rounded-lg transition-all glow-green-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>
      </motion.div>

      {/* Level summary */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {(["INFO", "WARN", "ERROR", "DEBUG", "CRITICAL"] as const).map((l, i) => (
          <motion.button
            key={l}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => setLevel(level === l ? "ALL" : l)}
            className={`p-3 rounded-xl text-center transition-all border ${
              level === l
                ? "border-current"
                : "border-transparent hover:border-[rgba(255,255,255,0.08)]"
            }`}
            style={{
              background: level === l ? LEVEL_BG[l] : "rgba(13,19,33,0.5)",
              borderColor: level === l ? LEVEL_COLORS[l] + "40" : undefined,
            }}
          >
            <p className="text-xl font-bold font-mono" style={{ color: LEVEL_COLORS[l] }}>
              {levelCounts[l] ?? 0}
            </p>
            <p className="text-[10px] font-mono text-[#64748B] mt-0.5">{l}</p>
          </motion.button>
        ))}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          onClick={() => setLevel("ALL")}
          className={`p-3 rounded-xl text-center border transition-all ${level === "ALL" ? "border-[rgba(0,255,156,0.4)] bg-[rgba(0,255,156,0.08)]" : "border-transparent hover:border-[rgba(255,255,255,0.08)]"}`}
          style={{ background: level === "ALL" ? undefined : "rgba(13,19,33,0.5)" }}
        >
          <p className="text-xl font-bold font-mono text-[#E2E8F0]">{allLogs.length}</p>
          <p className="text-[10px] font-mono text-[#64748B] mt-0.5">TOTAL</p>
        </motion.button>
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
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search log messages, IPs, services..."
            className="w-full h-9 pl-9 pr-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,255,156,0.12)] rounded-lg text-sm text-[#E2E8F0] placeholder-[#475569] font-mono focus:outline-none focus:border-[rgba(0,255,156,0.4)] transition-all"
          />
        </div>

        {/* Service filter */}
        <div className="relative">
          <select
            value={service}
            onChange={e => setService(e.target.value)}
            className="appearance-none h-9 pl-3 pr-8 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,255,156,0.15)] rounded-lg text-sm text-[#94A3B8] font-mono focus:outline-none focus:border-[rgba(0,255,156,0.4)] cursor-pointer"
          >
            {services.map(s => <option key={s} value={s} className="bg-[#0B0F19]">{s}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569] pointer-events-none" />
        </div>

        <div className="text-xs text-[#475569] font-mono ml-auto">
          {filtered.length} / {allLogs.length} entries
        </div>
      </motion.div>

      {/* Log viewer */}
      <AnimatePresence mode="wait">
        {viewMode === "table" ? (
          <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GlassCard noPadding delay={0.35}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[rgba(0,255,156,0.08)]">
                      {["Level", "Timestamp", "Service", "Message", "IP", "User"].map(h => (
                        <th key={h} className="text-left px-4 py-3 text-[#475569] font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((log, i) => (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.01 }}
                        className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,255,156,0.02)] transition-colors"
                        style={{ background: log.level === "CRITICAL" ? "rgba(255,0,128,0.04)" : log.level === "ERROR" ? "rgba(239,68,68,0.03)" : undefined }}
                      >
                        <td className="px-4 py-2.5">
                          <span
                            className="px-2 py-0.5 rounded text-[10px] font-bold"
                            style={{
                              background: LEVEL_BG[log.level],
                              color: LEVEL_COLORS[log.level],
                              border: `1px solid ${LEVEL_COLORS[log.level]}40`,
                            }}
                          >
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[#475569] whitespace-nowrap">{formatTimestamp(log.timestamp)}</td>
                        <td className="px-4 py-2.5 text-[#8B5CF6]">{log.service}</td>
                        <td className="px-4 py-2.5 text-[#E2E8F0] max-w-xs truncate">{log.message}</td>
                        <td className="px-4 py-2.5 text-[#3B82F6]">{log.ip ?? "—"}</td>
                        <td className="px-4 py-2.5 text-[#64748B]">{log.userId ?? "—"}</td>
                      </motion.tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-[#475569]">
                          <Terminal className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          <p>No logs matching current filters</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between px-4 py-3 border-t border-[rgba(0,255,156,0.08)]">
                <p className="text-xs text-[#475569] font-mono">Showing {filtered.length} entries</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, "..."].map((p, i) => (
                    <button key={i} className={`w-7 h-7 rounded text-xs font-mono ${p === 1 ? "bg-[rgba(0,255,156,0.15)] text-[#00FF9C] border border-[rgba(0,255,156,0.3)]" : "text-[#64748B] hover:text-[#94A3B8]"}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ) : (
          <motion.div key="terminal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div
              className="rounded-xl overflow-hidden"
              style={{ background: "#050708", border: "1px solid rgba(0,255,156,0.2)", boxShadow: "0 0 30px rgba(0,255,156,0.08)" }}
            >
              {/* Terminal header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(0,255,156,0.1)]" style={{ background: "#080C10" }}>
                <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                <div className="w-3 h-3 rounded-full bg-[#00FF9C]" />
                <span className="ml-3 text-xs font-mono text-[#475569]">sentinel-ai — log-viewer — 80×24</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] pulse-neon" />
                  <span className="text-[10px] font-mono text-[#00FF9C]">LIVE</span>
                </div>
              </div>
              {/* Terminal content */}
              <div
                ref={terminalRef}
                className="p-4 h-[500px] overflow-y-auto font-mono text-xs space-y-0.5"
                style={{ background: "#05070D" }}
              >
                <p className="text-[#00FF9C] mb-2">$ sentinel-log-viewer --tail 60 --colorize --all-services</p>
                {filtered.map((log, i) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.008 }}
                    className="flex gap-2 hover:bg-[rgba(255,255,255,0.02)] px-1 rounded leading-relaxed"
                  >
                    <span className="text-[#2D3748] flex-shrink-0">[{formatTimestamp(log.timestamp)}]</span>
                    <span className="flex-shrink-0 font-bold" style={{ color: LEVEL_COLORS[log.level] }}>[{log.level.padEnd(8)}]</span>
                    <span className="text-[#8B5CF6] flex-shrink-0">{log.service}:</span>
                    <span className="text-[#CBD5E1]">{log.message}</span>
                    {log.ip && <span className="text-[#3B82F6] flex-shrink-0">src={log.ip}</span>}
                    {log.userId && <span className="text-[#64748B] flex-shrink-0">user={log.userId}</span>}
                  </motion.div>
                ))}
                <div className="flex items-center gap-1 mt-2">
                  <span className="text-[#00FF9C]">$</span>
                  <span className="bg-[#00FF9C] w-2 h-4 inline-block animate-pulse" />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
