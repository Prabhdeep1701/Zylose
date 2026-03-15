"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadialBarChart, RadialBar
} from "recharts";
import { Cpu, Activity, RefreshCw, Filter } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";

type MetricPoint = { time: string; cpu: number; memory: number; disk: number };
type ProcessRow = { pid: number; name: string; cpu: number; memory: number; status: "secure" | "warning" | "suspicious" };
type AgentTelemetry = {
  timestamp?: string;
  cpu?: { usage_pct?: number };
  memory?: { usage_pct?: number; used_gb?: number };
  disk?: { usage_pct?: number };
  processes?: Array<{ pid?: number; name?: string; cpu_pct?: number; memory_mb?: number }>;
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs font-mono" style={{
      background: "rgba(8,12,20,0.95)", border: "1px solid rgba(0,255,156,0.3)",
    }}>
      <p className="text-[#64748B] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}%</span></p>
      ))}
    </div>
  );
};

const GaugeChart = ({ value, color, label }: { value: number; color: string; label: string }) => {
  const data = [{ name: label, value, fill: color }];
  return (
    <div className="relative flex flex-col items-center">
      <ResponsiveContainer width={140} height={80}>
        <RadialBarChart cx="50%" cy="90%" innerRadius="60%" outerRadius="110%" startAngle={180} endAngle={0} data={data}>
          <RadialBar background={{ fill: "rgba(255,255,255,0.05)" }} dataKey="value" cornerRadius={4} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute bottom-2 text-center">
        <p className="text-xl font-bold" style={{ color }}>{value}%</p>
        <p className="text-[10px] text-[#64748B] font-mono">{label}</p>
      </div>
    </div>
  );
};

export default function SystemMonitorPage() {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [processes, setProcesses] = useState<ProcessRow[]>([]);
  const [filter, setFilter] = useState<"all" | "secure" | "warning" | "suspicious">("all");

  const fetchSystemData = useCallback(async () => {
    try {
      const response = await fetch("/api/agent", { cache: "no-store" });
      if (!response.ok) return;
      const payload: { data?: AgentTelemetry[] } = await response.json();
      const telemetry = Array.isArray(payload.data) ? payload.data : [];

      const nextMetrics = telemetry
        .slice()
        .reverse()
        .slice(-30)
        .map((entry) => {
          const date = entry.timestamp ? new Date(entry.timestamp) : new Date();
          return {
            time: `${String(date.getMinutes()).padStart(2, "0")}:${String(date.getSeconds()).padStart(2, "0")}`,
            cpu: Math.round(entry.cpu?.usage_pct ?? 0),
            memory: Math.round(entry.memory?.usage_pct ?? 0),
            disk: Math.round(entry.disk?.usage_pct ?? 0),
          };
        });

      const latest = telemetry[0];
      const nextProcesses: ProcessRow[] = (latest?.processes ?? []).slice(0, 15).map((proc) => {
        const cpu = proc.cpu_pct ?? 0;
        return {
          pid: proc.pid ?? 0,
          name: proc.name ?? "unknown",
          cpu,
          memory: ((proc.memory_mb ?? 0) / 1024),
          status: cpu > 70 ? "suspicious" : cpu > 35 ? "warning" : "secure",
        };
      });

      setMetrics(nextMetrics);
      setProcesses(nextProcesses);
    } catch {
      // Keep last successful state when backend is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void fetchSystemData();
    }, 0);
    const id = setInterval(() => {
      void fetchSystemData();
    }, 3000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [fetchSystemData]);

  const latest = metrics[metrics.length - 1];

  const filteredProcs = useMemo(() =>
    filter === "all" ? processes : processes.filter(p => p.status === filter),
    [processes, filter]
  );

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
            System <span className="gradient-text-green">Performance</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Real-time resource monitoring · Auto-refresh every 3s</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[rgba(0,255,156,0.2)] bg-[rgba(0,255,156,0.05)]">
            <span className="w-2 h-2 rounded-full bg-[#00FF9C] pulse-neon" />
            <span className="text-xs text-[#00FF9C] font-mono">LIVE MONITORING</span>
          </div>
          <span className="text-xs text-[#475569] font-mono">Admin Zero</span>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Network Uptime" value="99.998%" icon={<Activity className="w-4 h-4" />} color="green" delay={0} />
        <StatCard title="Active Threats" value="0"      icon={<Activity className="w-4 h-4" />} color="blue"   delay={0.1} subtext="CPU Health: OPTIMAL" />
        <StatCard title="CPU Health"     value="OPTIMAL" icon={<Cpu className="w-4 h-4" />}    color="green"  delay={0.2} />
        <StatCard title="Bandwidth"      value="4.2 TB/s" icon={<Activity className="w-4 h-4" />} color="purple" delay={0.3} />
      </div>

      {/* Gauges + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Gauge cards */}
        <GlassCard title="Resource Overview" subtitle="Current utilization" delay={0.2}>
          <div className="flex justify-around items-center mt-2">
            <GaugeChart value={latest?.cpu ?? 34}    color="#00FF9C" label="CPU" />
            <GaugeChart value={latest?.memory ?? 64} color="#3B82F6" label="MEM" />
            <GaugeChart value={latest?.disk ?? 42}   color="#8B5CF6" label="DISK" />
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs font-mono">
            <div className="py-2 rounded-lg bg-[rgba(0,255,156,0.05)] border border-[rgba(0,255,156,0.1)]">
              <p className="text-[#00FF9C] font-bold">{latest?.cpu ?? 34}%</p>
              <p className="text-[#475569]">CPU Usage</p>
            </div>
            <div className="py-2 rounded-lg bg-[rgba(59,130,246,0.05)] border border-[rgba(59,130,246,0.1)]">
              <p className="text-[#3B82F6] font-bold">{(((latest?.memory ?? 64) / 100) * 128).toFixed(1)} GB</p>
              <p className="text-[#475569]">Memory</p>
            </div>
            <div className="py-2 rounded-lg bg-[rgba(139,92,246,0.05)] border border-[rgba(139,92,246,0.1)]">
              <p className="text-[#8B5CF6] font-bold">{latest?.disk ?? 42}%</p>
              <p className="text-[#475569]">Disk I/O</p>
            </div>
          </div>
        </GlassCard>

        {/* CPU Chart */}
        <GlassCard title="CPU Usage (%)" subtitle="30-second window" delay={0.25} headerRight={
          <span className="text-xs font-mono text-[#00FF9C]">{latest?.cpu ?? 34}%</span>
        }>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#00FF9C" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00FF9C" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={9} />
                <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="cpu" stroke="#00FF9C" strokeWidth={2} fill="url(#cpuGrad)" name="CPU" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Memory Chart */}
        <GlassCard title="Memory Allocation (GB)" subtitle="128 GB total" delay={0.3} headerRight={
          <span className="text-xs font-mono text-[#3B82F6]">{(((latest?.memory ?? 64) / 100) * 128).toFixed(1)} GB</span>
        }>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="memGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={9} />
                <YAxis domain={[0, 100]} tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="memory" stroke="#3B82F6" strokeWidth={2} fill="url(#memGrad)" name="Memory" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Running Processes */}
      <GlassCard
        title="Running Processes"
        subtitle="Security-classified process list"
        delay={0.35}
        noPadding
        headerRight={
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#475569]" />
            {(["all", "secure", "warning", "suspicious"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono uppercase transition-all ${
                  filter === f
                    ? "bg-[rgba(0,255,156,0.15)] border border-[rgba(0,255,156,0.4)] text-[#00FF9C]"
                    : "border border-transparent text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {f}
              </button>
            ))}
            <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[rgba(0,255,156,0.2)] text-[#00FF9C] text-[10px] font-mono hover:bg-[rgba(0,255,156,0.05)]">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
        }
      >
        <table className="w-full text-xs font-mono">
          <thead>
            <tr className="border-b border-[rgba(0,255,156,0.08)]">
              {["PID", "Process Name", "CPU %", "Memory", "Security Status", "Action"].map(h => (
                <th key={h} className="text-left px-4 py-3 text-[#475569] font-semibold uppercase tracking-wider text-[10px]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredProcs.map((proc, i) => (
              <motion.tr
                key={proc.pid}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,255,156,0.03)] transition-colors"
              >
                <td className="px-4 py-3 text-[#64748B]">{proc.pid}</td>
                <td className="px-4 py-3 text-[#E2E8F0] flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    proc.status === "secure"     ? "bg-[#00FF9C]" :
                    proc.status === "warning"    ? "bg-[#F59E0B]" :
                    "bg-[#EF4444]"
                  }`} />
                  {proc.name}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 bg-[#0D1321] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(proc.cpu, 100)}%`,
                          background: proc.cpu > 70 ? "#EF4444" : proc.cpu > 40 ? "#F59E0B" : "#00FF9C",
                        }}
                      />
                    </div>
                    <span className={proc.cpu > 70 ? "text-[#EF4444]" : proc.cpu > 40 ? "text-[#F59E0B]" : "text-[#00FF9C]"}>
                      {proc.cpu}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#94A3B8]">{proc.memory.toFixed(1)} GB</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                    proc.status === "secure"     ? "bg-[rgba(0,255,156,0.1)]  text-[#00FF9C] border-[rgba(0,255,156,0.3)]" :
                    proc.status === "warning"    ? "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]" :
                    "bg-[rgba(239,68,68,0.1)]  text-[#EF4444] border-[rgba(239,68,68,0.3)]"
                  }`}>
                    {proc.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {proc.status === "suspicious" && (
                    <button className="px-2.5 py-1 text-[10px] rounded-lg border border-[rgba(239,68,68,0.4)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-all font-bold">
                      QUARANTINE
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-[rgba(0,255,156,0.08)]">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgba(0,255,156,0.2)] text-[#00FF9C] text-xs font-mono hover:bg-[rgba(0,255,156,0.05)] transition-all">
            + Export Report
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
