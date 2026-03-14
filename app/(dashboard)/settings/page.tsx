"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Bell, Database, Cpu, Globe, Key, Save, Eye, EyeOff } from "lucide-react";
import GlassCard from "@/components/GlassCard";

const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${checked ? "bg-[rgba(0,255,156,0.3)] border border-[rgba(0,255,156,0.5)]" : "bg-[rgba(255,255,255,0.08)] border border-[rgba(255,255,255,0.1)]"}`}
  >
    <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-all duration-300 ${checked ? "translate-x-5 bg-[#00FF9C]" : "bg-[#475569]"}`}
      style={checked ? { boxShadow: "0 0 8px rgba(0,255,156,0.6)" } : {}} />
  </button>
);

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    realTimeAlerts: true,
    emailNotifications: false,
    autoBlock: true,
    mlDetection: true,
    deepPacketInspection: true,
    geoBlocking: false,
    logRetention: "30",
    scanInterval: "5",
    alertThreshold: "75",
    supabaseUrl: "",
    supabaseKey: "",
  });
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const toggle = (key: keyof typeof settings) =>
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">Platform <span className="gradient-text-green">Settings</span></h1>
          <p className="text-sm text-[#64748B] mt-1">Configure your SentinelAI security platform</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all glow-green-sm ${
            saved ? "bg-[#22C55E] text-white" : "bg-[#00FF9C] text-[#05070D]"
          }`}
        >
          <Save className="w-4 h-4" />
          {saved ? "Saved!" : "Save Changes"}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Detection Settings */}
        <GlassCard title="Detection & Response" delay={0.1}>
          <div className="space-y-4">
            {[
              { label: "Real-time Alerts",          desc: "Instant notifications for critical threats",    key: "realTimeAlerts" as const,        icon: <Bell className="w-4 h-4" /> },
              { label: "Auto-Block Threats",         desc: "Automatically block detected malicious IPs",   key: "autoBlock" as const,             icon: <Shield className="w-4 h-4" /> },
              { label: "ML Anomaly Detection",       desc: "Use Isolation Forest for anomaly scoring",     key: "mlDetection" as const,           icon: <Cpu className="w-4 h-4" /> },
              { label: "Deep Packet Inspection",     desc: "Inspect packet payloads for threats",          key: "deepPacketInspection" as const,  icon: <Globe className="w-4 h-4" /> },
              { label: "Geographic IP Blocking",     desc: "Block connections from high-risk regions",     key: "geoBlocking" as const,           icon: <Globe className="w-4 h-4" /> },
            ].map(({ label, desc, key, icon }) => (
              <div key={key} className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)] last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[rgba(0,255,156,0.08)] border border-[rgba(0,255,156,0.15)] flex items-center justify-center text-[#00FF9C]">
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#E2E8F0]">{label}</p>
                    <p className="text-xs text-[#475569]">{desc}</p>
                  </div>
                </div>
                <ToggleSwitch checked={Boolean(settings[key])} onChange={() => toggle(key)} />
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Notification Settings */}
        <GlassCard title="Notifications & Alerts" delay={0.15}>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.04)]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.15)] flex items-center justify-center text-[#3B82F6]">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#E2E8F0]">Email Notifications</p>
                  <p className="text-xs text-[#475569]">Send alerts to admin email</p>
                </div>
              </div>
              <ToggleSwitch checked={settings.emailNotifications} onChange={() => toggle("emailNotifications")} />
            </div>

            {/* Alert threshold */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-[#64748B] uppercase tracking-wider">Alert Risk Threshold</label>
              <div className="flex items-center gap-3">
                <input
                  type="range" min={0} max={100}
                  value={settings.alertThreshold}
                  onChange={e => setSettings(prev => ({ ...prev, alertThreshold: e.target.value }))}
                  className="flex-1 accent-[#00FF9C] cursor-pointer"
                />
                <span className="text-sm font-mono font-bold text-[#00FF9C] w-10 text-right">{settings.alertThreshold}</span>
              </div>
              <p className="text-xs text-[#475569]">Alerts fire when risk score exceeds this threshold</p>
            </div>

            {/* Scan interval */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-[#64748B] uppercase tracking-wider">Agent Scan Interval (seconds)</label>
              <div className="flex items-center gap-2">
                {["5", "10", "30", "60"].map(v => (
                  <button
                    key={v}
                    onClick={() => setSettings(prev => ({ ...prev, scanInterval: v }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      settings.scanInterval === v
                        ? "bg-[rgba(0,255,156,0.15)] border border-[rgba(0,255,156,0.4)] text-[#00FF9C]"
                        : "border border-[rgba(255,255,255,0.08)] text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                  >
                    {v}s
                  </button>
                ))}
              </div>
            </div>

            {/* Log retention */}
            <div className="space-y-2">
              <label className="text-xs font-mono text-[#64748B] uppercase tracking-wider">Log Retention Period</label>
              <div className="flex items-center gap-2">
                {["7", "14", "30", "90"].map(v => (
                  <button
                    key={v}
                    onClick={() => setSettings(prev => ({ ...prev, logRetention: v }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      settings.logRetention === v
                        ? "bg-[rgba(0,255,156,0.15)] border border-[rgba(0,255,156,0.4)] text-[#00FF9C]"
                        : "border border-[rgba(255,255,255,0.08)] text-[#64748B] hover:text-[#94A3B8]"
                    }`}
                  >
                    {v}d
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Database Config */}
        <GlassCard title="Database Configuration" subtitle="Supabase connection settings" delay={0.2}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-[#64748B] uppercase tracking-wider mb-2">Supabase Project URL</label>
              <input
                type="url"
                value={settings.supabaseUrl}
                onChange={e => setSettings(prev => ({ ...prev, supabaseUrl: e.target.value }))}
                placeholder="https://your-project.supabase.co"
                className="w-full h-10 px-4 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,255,156,0.12)] rounded-lg text-sm text-[#E2E8F0] placeholder-[#475569] font-mono focus:outline-none focus:border-[rgba(0,255,156,0.4)] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[#64748B] uppercase tracking-wider mb-2">Service Role Key</label>
              <div className="relative">
                <input
                  type={showKey ? "text" : "password"}
                  value={settings.supabaseKey}
                  onChange={e => setSettings(prev => ({ ...prev, supabaseKey: e.target.value }))}
                  placeholder="eyJhbGciOiJIUzI1NiIs..."
                  className="w-full h-10 pl-4 pr-12 bg-[rgba(255,255,255,0.03)] border border-[rgba(0,255,156,0.12)] rounded-lg text-sm text-[#E2E8F0] placeholder-[#475569] font-mono focus:outline-none focus:border-[rgba(0,255,156,0.4)] transition-all"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button className="w-full h-9 rounded-lg text-xs font-mono text-[#00FF9C] border border-[rgba(0,255,156,0.3)] hover:bg-[rgba(0,255,156,0.05)] transition-all">
              Test Connection
            </button>
          </div>
        </GlassCard>

        {/* Agent Config */}
        <GlassCard title="Python Agent Configuration" subtitle="System telemetry agent settings" delay={0.25}>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-[rgba(0,255,156,0.05)] border border-[rgba(0,255,156,0.15)]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-[#00FF9C]">Agent Status</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#00FF9C] pulse-neon" />
                  <span className="text-xs font-mono text-[#00FF9C]">RUNNING</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-[#64748B]">
                <div>Version: <span className="text-[#94A3B8]">1.2.4</span></div>
                <div>PID: <span className="text-[#94A3B8]">42210</span></div>
                <div>Interval: <span className="text-[#00FF9C]">{settings.scanInterval}s</span></div>
                <div>Uptime: <span className="text-[#94A3B8]">2d 14h</span></div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-mono text-[#64748B] uppercase tracking-wider">Metrics to Collect</label>
              {[
                { label: "CPU Usage", active: true },
                { label: "Memory / RAM", active: true },
                { label: "Running Processes", active: true },
                { label: "Network Connections", active: true },
                { label: "Disk I/O", active: false },
              ].map(({ label, active }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <span className="text-sm text-[#94A3B8]">{label}</span>
                  <div className={`w-2 h-2 rounded-full ${active ? "bg-[#00FF9C]" : "bg-[#475569]"}`} />
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button className="flex-1 h-9 rounded-lg text-xs font-mono text-[#EF4444] border border-[rgba(239,68,68,0.3)] hover:bg-[rgba(239,68,68,0.05)] transition-all">
                Stop Agent
              </button>
              <button className="flex-1 h-9 rounded-lg text-xs font-mono text-[#00FF9C] border border-[rgba(0,255,156,0.3)] hover:bg-[rgba(0,255,156,0.05)] transition-all">
                Restart Agent
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
