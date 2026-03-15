"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Shield, Activity, AlertTriangle, Eye, Target
} from "lucide-react";
import StatCard from "@/components/StatCard";
import GlassCard from "@/components/GlassCard";
import SeverityBadge from "@/components/SeverityBadge";
import { type Alert, type LogEntry } from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/utils";

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

interface ThreatNodeProps {
  x: number;
  y: number;
  size: number;
  label: string;
  color: string;
}

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs font-mono" style={{
      background: "rgba(8,12,20,0.95)",
      border: "1px solid rgba(0,255,156,0.3)",
    }}>
      <p className="text-[#64748B] mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const ThreatNode = ({ x, y, size, label, color }: ThreatNodeProps) => (
  <motion.g>
    <motion.circle
      cx={x} cy={y} r={size}
      fill={`${color}22`} stroke={color} strokeWidth={1.5}
      animate={{ r: [size, size + 3, size] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
    {label && (
      <text x={x} y={y - size - 4} textAnchor="middle" fontSize={10} fill="#94A3B8">{label}</text>
    )}
  </motion.g>
);

export default function DashboardPage() {
  type TrafficPoint = { time: string; inbound: number; outbound: number; threats: number };
  type HeatmapRow = { region: string; low: number; medium: number; high: number; critical: number };
  type DashboardSummary = {
    totalThreatsNeutralized: number;
    activeHighPriorityAlerts: number;
    systemHealthScore: number;
    threatsDetectedToday: number;
    latestRiskScore: number;
  };

  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [traffic, setTraffic] = useState<TrafficPoint[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapRow[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    totalThreatsNeutralized: 0,
    activeHighPriorityAlerts: 0,
    systemHealthScore: 100,
    threatsDetectedToday: 0,
    latestRiskScore: 0,
  });

  const mapLevelToSeverity = (level: LogEntry["level"]): Alert["severity"] => {
    if (level === "CRITICAL" || level === "ERROR") return "critical";
    if (level === "WARN") return "high";
    if (level === "INFO") return "medium";
    return "low";
  };

  const mapLevelToStatus = (level: LogEntry["level"]): Alert["status"] => {
    if (level === "CRITICAL" || level === "ERROR") return "active";
    if (level === "WARN") return "investigating";
    if (level === "INFO") return "resolved";
    return "authorized";
  };

  const mapLevelToRisk = (level: LogEntry["level"]): number => {
    if (level === "CRITICAL") return 95;
    if (level === "ERROR") return 80;
    if (level === "WARN") return 65;
    if (level === "INFO") return 35;
    return 20;
  };

  const fetchLiveData = useCallback(async () => {
    try {
      const [logsResponse, agentResponse] = await Promise.all([
        fetch("/api/logs?limit=200", { cache: "no-store" }),
        fetch("/api/agent", { cache: "no-store" }),
      ]);

      if (!logsResponse.ok || !agentResponse.ok) return;

      const logsPayload: { logs?: LogEntry[] } = await logsResponse.json();
      const agentPayload: { data?: Array<{ timestamp?: string; riskScore?: number; network?: { bytes_recv?: number; bytes_sent?: number } }> } = await agentResponse.json();

      const logs = Array.isArray(logsPayload.logs) ? logsPayload.logs : [];
      const telemetry = Array.isArray(agentPayload.data) ? agentPayload.data : [];

      const incidentAlerts: Alert[] = logs.slice(0, 8).map((log) => ({
        id: log.id,
        timestamp: log.timestamp,
        type: `${log.level} - ${log.service}`,
        severity: mapLevelToSeverity(log.level),
        sourceIp: log.ip ?? "0.0.0.0",
        targetIp: "internal",
        status: mapLevelToStatus(log.level),
        description: log.message,
        riskScore: mapLevelToRisk(log.level),
        port: 443,
        protocol: "HTTPS",
      }));

      const trafficPoints: TrafficPoint[] = telemetry
        .slice()
        .reverse()
        .slice(-20)
        .map((entry) => {
          const date = entry.timestamp ? new Date(entry.timestamp) : new Date();
          return {
            time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
            inbound: Math.round((entry.network?.bytes_recv ?? 0) / 1024),
            outbound: Math.round((entry.network?.bytes_sent ?? 0) / 1024),
            threats: Math.max(0, Math.round((entry.riskScore ?? 0) / 10)),
          };
        });

      const groupedByService = logs.reduce<Record<string, HeatmapRow>>((acc, log) => {
        const key = log.service || "Unknown";
        if (!acc[key]) {
          acc[key] = { region: key, low: 0, medium: 0, high: 0, critical: 0 };
        }

        const severity = mapLevelToSeverity(log.level);
        if (severity === "critical") acc[key].critical += 1;
        if (severity === "high") acc[key].high += 1;
        if (severity === "medium") acc[key].medium += 1;
        if (severity === "low") acc[key].low += 1;
        return acc;
      }, {});

      const heatmapRows = Object.values(groupedByService)
        .sort((a, b) => (b.critical + b.high + b.medium + b.low) - (a.critical + a.high + a.medium + a.low))
        .slice(0, 6);

      const today = new Date();
      const sameDay = (iso: string) => {
        const d = new Date(iso);
        return d.getFullYear() === today.getFullYear()
          && d.getMonth() === today.getMonth()
          && d.getDate() === today.getDate();
      };

      const threatsToday = logs.filter((log) => sameDay(log.timestamp) && ["WARN", "ERROR", "CRITICAL"].includes(log.level)).length;
      const activeHigh = logs.filter((log) => ["WARN", "ERROR", "CRITICAL"].includes(log.level)).length;
      const neutralized = logs.filter((log) => ["INFO", "DEBUG"].includes(log.level)).length;
      const latestRisk = telemetry[0]?.riskScore ?? 0;
      const healthScore = Math.max(0, Math.min(100, Math.round(100 - latestRisk)));

      setAlerts(incidentAlerts);
      setTraffic(trafficPoints);
      setHeatmap(heatmapRows);
      setSummary({
        totalThreatsNeutralized: neutralized,
        activeHighPriorityAlerts: activeHigh,
        systemHealthScore: healthScore,
        threatsDetectedToday: threatsToday,
        latestRiskScore: latestRisk,
      });
    } catch {
      // Keep last successful state when backend is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void fetchLiveData();
    }, 0);
    const id = setInterval(() => {
      void fetchLiveData();
    }, 3000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [fetchLiveData]);

  const pieData = useMemo(() => {
    const critical = alerts.filter((a) => a.severity === "critical").length;
    const high = alerts.filter((a) => a.severity === "high").length;
    const medium = alerts.filter((a) => a.severity === "medium").length;
    const low = alerts.filter((a) => a.severity === "low").length;

    return [
      { name: "Critical", value: critical, color: "#EF4444" },
      { name: "High", value: high, color: "#F59E0B" },
      { name: "Medium", value: medium, color: "#3B82F6" },
      { name: "Low", value: low, color: "#00FF9C" },
    ];
  }, [alerts]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">
            Threat Command <span className="gradient-text-green">Center</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Real-time threat intelligence and system monitoring</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-[#05070D] bg-[#00FF9C] hover:bg-[#00CC7A] transition-all glow-green-sm"
        >
          <Eye className="w-4 h-4" />
          Full Threat Report
        </motion.button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Threats Neutralized"
          value={summary.totalThreatsNeutralized.toLocaleString()}
          subtext="Derived from INFO/DEBUG remediation logs"
          icon={<Shield className="w-4 h-4" />}
          trend={{ value: `${summary.totalThreatsNeutralized}`, positive: true }}
          color="green"
          delay={0}
        />
        <StatCard
          title="Active High-Priority Alerts"
          value={summary.activeHighPriorityAlerts.toLocaleString()}
          subtext="WARN/ERROR/CRITICAL in current feed"
          icon={<AlertTriangle className="w-4 h-4" />}
          trend={{ value: `${summary.activeHighPriorityAlerts}`, positive: false }}
          color="red"
          delay={0.1}
        />
        <StatCard
          title="System Health Score"
          value={`${summary.systemHealthScore}%`}
          subtext={`Based on live risk score: ${summary.latestRiskScore}`}
          icon={<Activity className="w-4 h-4" />}
          trend={{ value: `${summary.systemHealthScore}%`, positive: summary.systemHealthScore >= 70 }}
          color="blue"
          delay={0.2}
        />
        <StatCard
          title="Threats Detected Today"
          value={summary.threatsDetectedToday.toLocaleString()}
          subtext="Today only (WARN/ERROR/CRITICAL)"
          icon={<Target className="w-4 h-4" />}
          trend={{ value: `${summary.threatsDetectedToday}`, positive: false }}
          color="purple"
          delay={0.3}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Network Activity Chart */}
        <GlassCard
          className="lg:col-span-2"
          title="Network Activity"
          subtitle="Real-time inbound/outbound traffic"
          delay={0.2}
          headerRight={
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#00FF9C]" />Inbound</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" />Outbound</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#EF4444]" />Threats</span>
            </div>
          }
        >
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={traffic} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FF9C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00FF9C" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={4} />
                <YAxis tick={{ fill: "#475569", fontSize: 10, fontFamily: "monospace" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="inbound" stroke="#00FF9C" strokeWidth={2} fill="url(#inboundGrad)" name="Inbound" />
                <Area type="monotone" dataKey="outbound" stroke="#3B82F6" strokeWidth={2} fill="url(#outboundGrad)" name="Outbound" />
                <Line type="monotone" dataKey="threats" stroke="#EF4444" strokeWidth={1.5} dot={false} name="Threats" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Risk Heatmap */}
        <GlassCard title="Risk Heatmap" subtitle="Regional threat distribution" delay={0.3}>
          <div className="space-y-2">
            {heatmap.map((row, i) => {
              const total = row.low + row.medium + row.high + row.critical;
              const critPct = (row.critical / total) * 100;
              const highPct = (row.high / total) * 100;
              const medPct = (row.medium / total) * 100;
              const lowPct = (row.low / total) * 100;
              const riskLevel = critPct > 15 ? "Critical" : highPct > 20 ? "Moderate" : "Low Risk";
              const riskColor = critPct > 15 ? "#EF4444" : highPct > 20 ? "#F59E0B" : "#00FF9C";
              return (
                <motion.div
                  key={row.region}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.05 }}
                  className="group"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#94A3B8]">{row.region}</span>
                    <span className="text-[10px] font-semibold" style={{ color: riskColor }}>{riskLevel}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#0D1321] overflow-hidden flex">
                    <div style={{ width: `${critPct}%`, background: "#EF4444" }} className="h-full" />
                    <div style={{ width: `${highPct}%`, background: "#F59E0B" }} className="h-full" />
                    <div style={{ width: `${medPct}%`, background: "#3B82F6" }} className="h-full" />
                    <div style={{ width: `${lowPct}%`, background: "#00FF9C22" }} className="h-full" />
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Pie chart */}
          <div className="mt-4 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={35} outerRadius={55} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: "rgba(8,12,20,0.95)", border: "1px solid rgba(0,255,156,0.3)", borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Incident Logs */}
        <GlassCard
          className="lg:col-span-2"
          title="Recent Incident Logs"
          subtitle="Live threat feed"
          delay={0.35}
          headerRight={
            <a href="/alerts" className="text-xs text-[#00FF9C] hover:underline font-mono">View All</a>
          }
          noPadding
        >
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="border-b border-[rgba(0,255,156,0.08)]">
                  {["Timestamp", "Incident Type", "Source IP", "Level", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[#475569] font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert, i) => (
                  <motion.tr
                    key={alert.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.04 }}
                    className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,255,156,0.03)] transition-colors table-row-hover cursor-pointer"
                  >
                    <td className="px-4 py-3 text-[#64748B]">{formatTimestamp(alert.timestamp)}</td>
                    <td className="px-4 py-3 text-[#E2E8F0]">{alert.type}</td>
                    <td className="px-4 py-3 text-[#3B82F6]">{alert.sourceIp}</td>
                    <td className="px-4 py-3"><SeverityBadge severity={alert.severity} /></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        alert.status === "active" ? "bg-[rgba(239,68,68,0.1)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]" :
                        alert.status === "investigating" ? "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border border-[rgba(245,158,11,0.3)]" :
                        alert.status === "resolved" ? "bg-[rgba(0,255,156,0.1)] text-[#00FF9C] border border-[rgba(0,255,156,0.3)]" :
                        "bg-[rgba(100,116,139,0.1)] text-[#94A3B8] border border-[rgba(100,116,139,0.3)]"
                      }`}>
                        {alert.status.charAt(0).toUpperCase() + alert.status.slice(1)}
                      </span>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        {/* Threat Propagation */}
        <GlassCard title="Threat Propagation" subtitle="Active attack vectors" delay={0.4}>
          <div className="relative h-52">
            <svg width="100%" height="100%" viewBox="0 0 200 200">
              {/* Connection lines */}
              <line x1="100" y1="100" x2="40"  y2="40"  stroke="rgba(239,68,68,0.4)"   strokeWidth="1" strokeDasharray="4 2" />
              <line x1="100" y1="100" x2="160" y2="50"  stroke="rgba(239,68,68,0.4)"   strokeWidth="1" strokeDasharray="4 2" />
              <line x1="100" y1="100" x2="30"  y2="140" stroke="rgba(245,158,11,0.4)"  strokeWidth="1" strokeDasharray="4 2" />
              <line x1="100" y1="100" x2="170" y2="140" stroke="rgba(245,158,11,0.4)"  strokeWidth="1" strokeDasharray="4 2" />
              <line x1="100" y1="100" x2="100" y2="170" stroke="rgba(59,130,246,0.4)"  strokeWidth="1" strokeDasharray="4 2" />
              {/* Center node */}
              <ThreatNode x={100} y={100} size={12} color="#EF4444" label="" />
              {/* Outer nodes */}
              <ThreatNode x={40}  y={40}  size={8}  color="#EF4444" label="193.21" />
              <ThreatNode x={160} y={50}  size={6}  color="#F59E0B" label="85.12" />
              <ThreatNode x={30}  y={140} size={7}  color="#F59E0B" label="204.5" />
              <ThreatNode x={170} y={140} size={5}  color="#3B82F6" label="119.3" />
              <ThreatNode x={100} y={170} size={5}  color="#3B82F6" label="76.14" />
              {/* Center label */}
              <text x="100" y="104" textAnchor="middle" fontSize="9" fontFamily="monospace" fill="#EF4444">TARGET</text>
            </svg>

            {/* Legend */}
            <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-3 text-[10px] font-mono">
              <span className="text-[#EF4444]">● Critical nodes</span>
              <span className="text-[#F59E0B]">● Active</span>
              <span className="text-[#3B82F6]">● Monitored</span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { label: "Nodes", value: "47", color: "#EF4444" },
              { label: "Vectors", value: "12", color: "#F59E0B" },
              { label: "Blocked", value: "38", color: "#00FF9C" },
            ].map(s => (
              <div key={s.label} className="text-center p-2 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.05)]">
                <p className="text-base font-bold" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[10px] text-[#475569]">{s.label}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
