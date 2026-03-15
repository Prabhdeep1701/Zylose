"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Activity, Wifi, Shield, AlertTriangle, Download } from "lucide-react";
import GlassCard from "@/components/GlassCard";
import StatCard from "@/components/StatCard";

type GeoThreat = { id: string; lat: number; lng: number; country: string; threats: number; severity: "critical" | "high" | "medium" | "low" };
type TrafficPoint = { time: string; inbound: number; outbound: number; threats: number };
type TrafficRow = { source: string; dest: string; port: number; bytes: string; protocol: string; status: "normal" | "suspicious" | "blocked"; country: string; flag: string };
type AgentTelemetry = {
  timestamp?: string;
  riskScore?: number;
  network?: {
    bytes_recv?: number;
    bytes_sent?: number;
    active_connections?: number;
    connections?: Array<{ laddr?: string; raddr?: string; type?: string }>;
  };
};

function hashIpToCoords(ip: string): { lat: number; lng: number } {
  let hash = 0;
  for (const ch of ip) hash = ((hash << 5) - hash) + ch.charCodeAt(0);
  const normalized = Math.abs(hash);
  const lat = ((normalized % 14000) / 100) - 70;
  const lng = (((Math.floor(normalized / 97)) % 34000) / 100) - 170;
  return { lat, lng };
}

function parseEndpoint(endpoint: string | undefined): { ip: string; port: number } {
  if (!endpoint) return { ip: "0.0.0.0", port: 0 };
  const [ip, port] = endpoint.split(":");
  return { ip: ip || "0.0.0.0", port: Number(port || 0) };
}

// Simple SVG world map visualization
function WorldMapViz({ threats }: { threats: GeoThreat[] }) {
  // Map lat/lng to SVG coordinates (simplified Mercator)
  const toSvg = (lat: number, lng: number) => ({
    x: ((lng + 180) / 360) * 800,
    y: ((90 - lat) / 180) * 400,
  });

  return (
    <div className="relative w-full overflow-hidden rounded-lg" style={{ background: "rgba(5,7,13,0.4)", border: "1px solid rgba(0,255,156,0.08)" }}>
      <svg viewBox="0 0 800 400" className="w-full opacity-90">
        {/* World map paths (simplified continents) */}
        <defs>
          <radialGradient id="mapGlow">
            <stop offset="0%" stopColor="rgba(0,255,156,0.1)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: 9 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={(i + 1) * 40} x2="800" y2={(i + 1) * 40}
            stroke="rgba(0,255,156,0.05)" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 17 }, (_, i) => (
          <line key={`v${i}`} x1={(i + 1) * 47} y1="0" x2={(i + 1) * 47} y2="400"
            stroke="rgba(0,255,156,0.05)" strokeWidth="0.5" />
        ))}

        {/* Simplified continent outlines */}
        {/* North America */}
        <path d="M120,80 L200,70 L220,90 L240,80 L260,100 L250,140 L230,160 L200,170 L180,155 L160,120 L130,110 Z"
          fill="none" stroke="rgba(0,255,156,0.2)" strokeWidth="1" />
        {/* South America */}
        <path d="M200,200 L240,190 L260,210 L265,240 L250,280 L230,300 L210,290 L195,260 L190,230 Z"
          fill="none" stroke="rgba(0,255,156,0.2)" strokeWidth="1" />
        {/* Europe */}
        <path d="M360,80 L410,70 L430,85 L420,110 L400,120 L375,115 L355,100 Z"
          fill="none" stroke="rgba(0,255,156,0.2)" strokeWidth="1" />
        {/* Africa */}
        <path d="M370,130 L410,120 L440,140 L445,180 L440,220 L420,250 L395,255 L375,230 L365,190 L360,155 Z"
          fill="none" stroke="rgba(0,255,156,0.2)" strokeWidth="1" />
        {/* Asia */}
        <path d="M430,70 L560,60 L620,80 L640,110 L620,140 L580,150 L530,140 L490,130 L450,110 L440,90 Z"
          fill="none" stroke="rgba(0,255,156,0.2)" strokeWidth="1" />
        {/* Australia */}
        <path d="M590,240 L640,230 L660,250 L650,280 L620,290 L595,275 Z"
          fill="none" stroke="rgba(0,255,156,0.2)" strokeWidth="1" />

        {/* Connection lines between threat origins and targets */}
        {threats.map((t) => {
          const pos = toSvg(t.lat, t.lng);
          const targetX = 400;
          const targetY = 200;
          const color = t.severity === "critical" ? "#EF4444" : t.severity === "high" ? "#F59E0B" : t.severity === "medium" ? "#3B82F6" : "#00FF9C";
          return (
            <g key={t.id}>
              <motion.line
                x1={pos.x} y1={pos.y} x2={targetX} y2={targetY}
                stroke={color} strokeWidth="0.8" strokeOpacity="0.3"
                strokeDasharray="4 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: Number(t.id) * 0.2, repeat: Infinity }}
              />
            </g>
          );
        })}

        {/* Threat nodes */}
        {threats.map((t) => {
          const pos = toSvg(t.lat, t.lng);
          const color = t.severity === "critical" ? "#EF4444" : t.severity === "high" ? "#F59E0B" : t.severity === "medium" ? "#3B82F6" : "#00FF9C";
          const size = t.threats > 20 ? 8 : t.threats > 10 ? 6 : 4;
          return (
            <g key={t.id}>
              <motion.circle
                cx={pos.x} cy={pos.y} r={size + 4}
                fill={`${color}15`}
                animate={{ r: [size + 4, size + 8, size + 4] }}
                transition={{ duration: 2, repeat: Infinity, delay: Number(t.id) * 0.3 }}
              />
              <circle cx={pos.x} cy={pos.y} r={size} fill={`${color}40`} stroke={color} strokeWidth="1.5" />
              <text x={pos.x} y={pos.y - size - 4} textAnchor="middle" fontSize="8" fill="#94A3B8" fontFamily="monospace">
                {t.country}
              </text>
            </g>
          );
        })}

        {/* Center (protected) node */}
        <motion.circle
          cx="400" cy="200" r="10"
          fill="rgba(0,255,156,0.15)" stroke="#00FF9C" strokeWidth="2"
          animate={{ r: [10, 14, 10] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <text x="400" y="218" textAnchor="middle" fontSize="8" fill="#00FF9C" fontFamily="monospace">SENTINEL</text>
      </svg>

      {/* Overlay info */}
      <div className="absolute top-3 left-3 text-[10px] font-mono text-[#475569]">
        LIVE GLOBAL TRAFFIC FLOW
      </div>
      <div className="absolute top-3 right-3 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00FF9C] pulse-neon" />
        <span className="text-[10px] font-mono text-[#00FF9C]">REAL-TIME</span>
      </div>
    </div>
  );
}

export default function NetworkActivityPage() {
  const [threats, setThreats] = useState<GeoThreat[]>([]);
  const [traffic, setTraffic] = useState<TrafficPoint[]>([]);
  const [trafficRows, setTrafficRows] = useState<TrafficRow[]>([]);
  const [liveConnections, setLiveConnections] = useState(8492);
  const [selectedThreat, setSelectedThreat] = useState<string | null>(null);

  const fetchNetworkData = useCallback(async () => {
    try {
      const response = await fetch("/api/agent", { cache: "no-store" });
      if (!response.ok) return;
      const payload: { data?: AgentTelemetry[] } = await response.json();
      const telemetry = Array.isArray(payload.data) ? payload.data : [];

      const points: TrafficPoint[] = telemetry
        .slice()
        .reverse()
        .slice(-12)
        .map((entry) => {
          const date = entry.timestamp ? new Date(entry.timestamp) : new Date();
          return {
            time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`,
            inbound: Math.round((entry.network?.bytes_recv ?? 0) / 1024),
            outbound: Math.round((entry.network?.bytes_sent ?? 0) / 1024),
            threats: Math.round((entry.riskScore ?? 0) / 10),
          };
        });

      const latest = telemetry[0];
      setLiveConnections(latest?.network?.active_connections ?? 0);

      const connections = latest?.network?.connections ?? [];
      const rows: TrafficRow[] = connections.slice(0, 12).map((conn) => {
        const source = parseEndpoint(conn.raddr);
        const dest = parseEndpoint(conn.laddr);
        const riskScore = latest?.riskScore ?? 0;
        return {
          source: source.ip,
          dest: dest.ip,
          port: source.port,
          bytes: `${Math.max(0.1, ((latest?.network?.bytes_recv ?? 0) / 1024 / 1024 / Math.max(connections.length, 1))).toFixed(1)} MB`,
          protocol: conn.type ?? "TCP",
          status: riskScore > 80 ? "blocked" : riskScore > 50 ? "suspicious" : "normal",
          country: "Unknown",
          flag: "🏳",
        };
      });

      const grouped = rows.reduce<Record<string, number>>((acc, row) => {
        acc[row.source] = (acc[row.source] ?? 0) + 1;
        return acc;
      }, {});

      const mappedThreats: GeoThreat[] = Object.entries(grouped).map(([ip, count], index) => {
        const coords = hashIpToCoords(ip);
        return {
          id: String(index + 1),
          country: ip,
          lat: coords.lat,
          lng: coords.lng,
          threats: count,
          severity: count >= 6 ? "critical" : count >= 4 ? "high" : count >= 2 ? "medium" : "low",
        };
      });

      setTraffic(points);
      setTrafficRows(rows);
      setThreats(mappedThreats);
    } catch {
      // Keep last successful state when backend is temporarily unavailable.
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(() => {
      void fetchNetworkData();
    }, 0);
    const id = setInterval(() => {
      void fetchNetworkData();
    }, 3000);
    return () => {
      clearTimeout(initial);
      clearInterval(id);
    };
  }, [fetchNetworkData]);

  const trafficLog = useMemo(() => trafficRows, [trafficRows]);

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
            Network <span className="gradient-text-green">Activity</span>
          </h1>
          <p className="text-sm text-[#64748B] mt-1">Global threat intelligence · Live connection monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-2 text-sm border border-[rgba(0,255,156,0.2)] text-[#00FF9C] rounded-lg hover:bg-[rgba(0,255,156,0.05)] transition-all font-mono">
            <Download className="w-4 h-4" /> PCAP Export
          </button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Connections"     value={liveConnections.toLocaleString()} icon={<Wifi className="w-4 h-4" />}        trend={{ value: "+450", positive: false }} color="green"  delay={0} />
        <StatCard title="Blocked Requests"      value="450"   icon={<Shield className="w-4 h-4" />}       trend={{ value: "-12", positive: true }}  color="blue"   delay={0.1} />
        <StatCard title="Critical Incidents"    value="14"    icon={<AlertTriangle className="w-4 h-4" />} trend={{ value: "+2",  positive: false }} color="red"    delay={0.2} />
        <StatCard title="Response Integrity"    value="98.2%" icon={<Activity className="w-4 h-4" />}      trend={{ value: "+0.1%", positive: true }} color="purple" delay={0.3} />
      </div>

      {/* World Map + Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* World Map */}
        <GlassCard
          className="lg:col-span-2"
          title="Live Global Traffic Flow"
          subtitle="Real-time threat origin mapping"
          delay={0.2}
          headerRight={
            <div className="flex items-center gap-2 text-[10px] font-mono">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#EF4444]" />Critical</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#F59E0B]" />High</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#3B82F6]" />Medium</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#00FF9C]" />Low</span>
            </div>
          }
        >
          <WorldMapViz threats={threats} />
        </GlassCard>

        {/* Threat Watchlist */}
        <GlassCard title="Threat Intelligence" subtitle="Active threat actors" delay={0.3} noPadding>
          <div className="divide-y divide-[rgba(0,255,156,0.06)]">
            {threats.slice(0, 6).map((t, i) => {
              const color = t.severity === "critical" ? "#EF4444" : t.severity === "high" ? "#F59E0B" : t.severity === "medium" ? "#3B82F6" : "#00FF9C";
              return (
                <motion.div
                  key={t.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  onClick={() => setSelectedThreat(selectedThreat === t.id ? null : t.id)}
                  className="px-4 py-3 cursor-pointer hover:bg-[rgba(0,255,156,0.03)] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                      <span className="text-xs font-mono text-[#E2E8F0]">{t.country}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color }}>{t.threats}</span>
                      <span className="text-[10px] text-[#475569]">threats</span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {selectedThreat === t.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 text-[10px] font-mono text-[#64748B] space-y-0.5 pl-4"
                      >
                        <p>Severity: <span style={{ color }}>{t.severity.toUpperCase()}</span></p>
                        <p>Lat: {t.lat.toFixed(4)}°  Lng: {t.lng.toFixed(4)}°</p>
                        <button className="mt-1 px-2 py-0.5 rounded border border-[rgba(239,68,68,0.3)] text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)]">
                          Block Region
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-[rgba(0,255,156,0.08)]">
            <button className="w-full py-2 text-xs font-mono text-[#00FF9C] border border-[rgba(0,255,156,0.2)] rounded-lg hover:bg-[rgba(0,255,156,0.05)] transition-all">
              Geo-Intelligence Analysis →
            </button>
          </div>
        </GlassCard>
      </div>

      {/* Traffic Chart + Live Log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bandwidth Chart */}
        <GlassCard title="Bandwidth Distribution" subtitle="Traffic by period" delay={0.35}>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={traffic} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="time" tick={{ fill: "#475569", fontSize: 9, fontFamily: "monospace" }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: "#475569", fontSize: 9 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: "rgba(8,12,20,0.95)", border: "1px solid rgba(0,255,156,0.3)", borderRadius: 8, fontSize: 11 }} />
                <Bar dataKey="inbound"  fill="#00FF9C" opacity={0.8} radius={[2, 2, 0, 0]} name="Inbound" />
                <Bar dataKey="outbound" fill="#3B82F6" opacity={0.8} radius={[2, 2, 0, 0]} name="Outbound" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Live Traffic Log */}
        <GlassCard title="Live New Traffic Log" subtitle="Real-time connection feed" delay={0.4} noPadding headerRight={
          <button className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-mono border border-[rgba(0,255,156,0.2)] text-[#00FF9C] rounded-lg hover:bg-[rgba(0,255,156,0.05)]">
            <Download className="w-3 h-3" /> Export
          </button>
        }>
          <table className="w-full text-[10px] font-mono">
            <thead>
              <tr className="border-b border-[rgba(0,255,156,0.08)]">
                {["", "Source IP", "Dest", "Port", "Bytes", "Status"].map(h => (
                  <th key={h} className="text-left px-3 py-2.5 text-[#475569] uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {trafficLog.map((row, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-[rgba(255,255,255,0.03)] hover:bg-[rgba(0,255,156,0.02)]"
                >
                  <td className="px-3 py-2.5">{row.flag}</td>
                  <td className="px-3 py-2.5 text-[#3B82F6]">{row.source}</td>
                  <td className="px-3 py-2.5 text-[#94A3B8]">{row.dest}</td>
                  <td className="px-3 py-2.5 text-[#64748B]">{row.port}</td>
                  <td className="px-3 py-2.5 text-[#64748B]">{row.bytes}</td>
                  <td className="px-3 py-2.5">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                      row.status === "blocked"    ? "bg-[rgba(239,68,68,0.1)]  text-[#EF4444] border-[rgba(239,68,68,0.3)]" :
                      row.status === "suspicious" ? "bg-[rgba(245,158,11,0.1)] text-[#F59E0B] border-[rgba(245,158,11,0.3)]" :
                      "bg-[rgba(0,255,156,0.1)]  text-[#00FF9C] border-[rgba(0,255,156,0.3)]"
                    }`}>
                      {row.status.toUpperCase()}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </GlassCard>
      </div>
    </div>
  );
}
