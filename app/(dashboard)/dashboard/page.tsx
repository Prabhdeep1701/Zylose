"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import {
  Shield, Activity, AlertTriangle, Zap, TrendingUp,
  Eye, Clock, Target, Globe
} from "lucide-react";
import StatCard from "@/components/StatCard";
import GlassCard from "@/components/GlassCard";
import SeverityBadge from "@/components/SeverityBadge";
import {
  generateAlerts, generateNetworkTraffic, generateHeatmapData,
  type Alert
} from "@/lib/mock-data";
import { formatTimestamp } from "@/lib/utils";

// Custom tooltip for the charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-lg text-xs font-mono" style={{
      background: "rgba(8,12,20,0.95)",
      border: "1px solid rgba(0,255,156,0.3)",
    }}>
      <p className="text-[#64748B] mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </p>
      ))}
    </div>
  );
};

const ThreatNode = ({ x, y, size, label, color }: any) => (
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
  const [alerts, setAlerts]   = useState<Alert[]>([]);
  const [traffic, setTraffic] = useState<ReturnType<typeof generateNetworkTraffic>>([]);
  const [heatmap, setHeatmap] = useState<ReturnType<typeof generateHeatmapData>>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setAlerts(generateAlerts(8));
    setTraffic(generateNetworkTraffic(20));
    setHeatmap(generateHeatmapData());
    setMounted(true);
  }, []);

  const pieData = [
    { name: "Critical", value: 12, color: "#EF4444" },
    { name: "High",     value: 18, color: "#F59E0B" },
    { name: "Medium",   value: 24, color: "#3B82F6" },
    { name: "Low",      value: 34, color: "#00FF9C" },
  ];

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
          value="1,284"
          subtext="-16% vs last week"
          icon={<Shield className="w-4 h-4" />}
          trend={{ value: "-16%", positive: true }}
          color="green"
          delay={0}
        />
        <StatCard
          title="Active High-Priority Alerts"
          value="42"
          subtext="-6% threat reduction"
          icon={<AlertTriangle className="w-4 h-4" />}
          trend={{ value: "+3", positive: false }}
          color="red"
          delay={0.1}
        />
        <StatCard
          title="System Health Score"
          value="98%"
          subtext="Above normal integrity"
          icon={<Activity className="w-4 h-4" />}
          trend={{ value: "+2%", positive: true }}
          color="blue"
          delay={0.2}
        />
        <StatCard
          title="Threats Detected Today"
          value="1,204"
          subtext="Response: 98.2% integrity"
          icon={<Target className="w-4 h-4" />}
          trend={{ value: "+48", positive: false }}
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
