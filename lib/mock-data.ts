// Mock data generators for Zylose dashboard

export type Severity = "critical" | "high" | "medium" | "low";
export type AlertStatus = "active" | "investigating" | "resolved" | "authorized";

export interface Alert {
  id: string;
  timestamp: string;
  type: string;
  severity: Severity;
  sourceIp: string;
  targetIp: string;
  status: AlertStatus;
  description: string;
  riskScore: number;
  port?: number;
  protocol?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG" | "CRITICAL";
  service: string;
  message: string;
  ip?: string;
  userId?: string;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  status: "secure" | "warning" | "suspicious";
}

export interface NetworkConnection {
  id: string;
  sourceIp: string;
  destIp: string;
  port: number;
  protocol: string;
  bytes: number;
  status: "normal" | "suspicious" | "blocked";
  country: string;
  lat: number;
  lng: number;
}

export function generateAlerts(count = 20): Alert[] {
  const types = [
    "DDoS Flood Attack", "SQL Injection Attempt", "Brute Force Auth",
    "Unrecognized MAC", "Malware Signature", "Port Scan", "XSS Attack",
    "CSRF Attempt", "RCE Exploit", "Data Exfiltration", "Privilege Escalation",
    "Ransomware Activity", "Phishing Attempt", "Zero-day Exploit"
  ];
  const statuses: AlertStatus[] = ["active", "investigating", "resolved", "authorized"];
  const severities: Severity[] = ["critical", "high", "medium", "low"];

  return Array.from({ length: count }, (_, i) => {
    const sev = severities[Math.floor(Math.random() * severities.length)];
    const now = new Date();
    now.setMinutes(now.getMinutes() - i * (Math.random() * 15 + 2));
    return {
      id: `ALT-${String(9000 + i).padStart(5, "0")}`,
      timestamp: now.toISOString(),
      type: types[Math.floor(Math.random() * types.length)],
      severity: sev,
      sourceIp: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      targetIp: `192.168.${Math.floor(Math.random()*5)}.${Math.floor(Math.random()*254)+1}`,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      description: `Suspicious ${types[Math.floor(Math.random() * types.length)].toLowerCase()} detected from external source`,
      riskScore: Math.floor(Math.random() * 100),
      port: [80, 443, 22, 3306, 5432, 6379, 8080, 8443][Math.floor(Math.random() * 8)],
      protocol: ["TCP", "UDP", "HTTP", "HTTPS"][Math.floor(Math.random() * 4)],
    };
  });
}

export function generateNetworkTraffic(points = 24) {
  const labels = Array.from({ length: points }, (_, i) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - (points - i) * 5);
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  });
  return labels.map((time, i) => ({
    time,
    inbound: Math.floor(800 + Math.sin(i * 0.5) * 400 + Math.random() * 300),
    outbound: Math.floor(500 + Math.cos(i * 0.4) * 200 + Math.random() * 200),
    threats: Math.floor(Math.random() * 15),
  }));
}

export function generateSystemMetrics(points = 30) {
  return Array.from({ length: points }, (_, i) => {
    const t = new Date();
    t.setSeconds(t.getSeconds() - (points - i) * 5);
    return {
      time: `${t.getMinutes().toString().padStart(2, "0")}:${t.getSeconds().toString().padStart(2, "0")}`,
      cpu: Math.round(20 + Math.sin(i * 0.3) * 15 + Math.random() * 20),
      memory: Math.round(55 + Math.sin(i * 0.2) * 10 + Math.random() * 12),
      disk: Math.round(40 + Math.random() * 5),
    };
  });
}

export function generateProcesses(): ProcessInfo[] {
  return [
    { pid: 42210, name: "SecurityGuard.exe", cpu: 12.4, memory: 4.2, status: "secure" },
    { pid: 31155, name: "PacketInterceptor", cpu: 8.1,  memory: 2.8, status: "secure" },
    { pid: 50221, name: "SentinelCore_API",  cpu: 0.2,  memory: 0.5, status: "secure" },
    { pid: 45661, name: "ddw43kd.exe",       cpu: 1.1,  memory: 3.8, status: "suspicious" },
    { pid: 22480, name: "NetworkMonitor",    cpu: 3.6,  memory: 1.2, status: "secure" },
    { pid: 18820, name: "cryptominer.sh",    cpu: 94.2, memory: 8.4, status: "suspicious" },
    { pid: 12040, name: "LogAggregator",     cpu: 0.9,  memory: 0.8, status: "secure" },
    { pid: 38820, name: "nginx",             cpu: 2.1,  memory: 1.5, status: "secure" },
    { pid: 55201, name: "unknown_proc",      cpu: 45.2, memory: 6.1, status: "suspicious" },
    { pid: 9920,  name: "postgres",          cpu: 5.4,  memory: 12.8, status: "warning" },
  ];
}

export function generateLogs(count = 50): LogEntry[] {
  const services = ["AuthService", "NetworkMonitor", "ThreatEngine", "DataStore", "APIGateway", "WebServer", "MLEngine"];
  const messages = [
    "Connection established from external IP",
    "Authentication failed: invalid credentials",
    "Anomaly detected in network traffic pattern",
    "SSL certificate verification failed",
    "Database query timeout exceeded",
    "File integrity check completed",
    "Firewall rule applied successfully",
    "Suspicious process detected and quarantined",
    "Backup completed successfully",
    "Rate limit exceeded for API endpoint",
    "Memory allocation threshold warning",
    "DNS resolution failure for external host",
    "Intrusion prevention rule triggered",
    "User privilege escalation attempt blocked",
    "Malware signature match found in upload",
  ];
  const levels: LogEntry["level"][] = ["INFO", "WARN", "ERROR", "DEBUG", "CRITICAL"];
  const levelWeights = [0.4, 0.25, 0.2, 0.1, 0.05];

  return Array.from({ length: count }, (_, i) => {
    const now = new Date();
    now.setSeconds(now.getSeconds() - i * (Math.random() * 30 + 5));
    const r = Math.random();
    let levelIdx = 0;
    let cumulative = 0;
    for (let j = 0; j < levelWeights.length; j++) {
      cumulative += levelWeights[j];
      if (r < cumulative) { levelIdx = j; break; }
    }
    return {
      id: `LOG-${String(100000 + i).padStart(6, "0")}`,
      timestamp: now.toISOString(),
      level: levels[levelIdx],
      service: services[Math.floor(Math.random() * services.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      ip: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
      userId: Math.random() > 0.5 ? `usr_${Math.floor(Math.random() * 1000).toString().padStart(4, "0")}` : undefined,
    };
  });
}

export function generateHeatmapData() {
  const regions = [
    { region: "North America", low: 12, medium: 8, high: 3, critical: 1 },
    { region: "Europe",        low: 8,  medium: 5, high: 2, critical: 2 },
    { region: "Asia Pacific",  low: 20, medium: 12, high: 7, critical: 4 },
    { region: "South America", low: 6,  medium: 3, high: 1, critical: 0 },
    { region: "Africa",        low: 3,  medium: 2, high: 1, critical: 0 },
    { region: "Middle East",   low: 9,  medium: 6, high: 4, critical: 2 },
  ];
  return regions;
}

export function generateGeoThreats() {
  return [
    { id: "1", lat: 37.7749, lng: -122.4194, country: "USA", threats: 12, severity: "high" },
    { id: "2", lat: 51.5074, lng: -0.1278,   country: "UK",  threats: 8,  severity: "medium" },
    { id: "3", lat: 35.6762, lng: 139.6503,  country: "JPN", threats: 15, severity: "critical" },
    { id: "4", lat: 39.9042, lng: 116.4074,  country: "CHN", threats: 28, severity: "critical" },
    { id: "5", lat: 55.7558, lng: 37.6173,   country: "RUS", threats: 22, severity: "critical" },
    { id: "6", lat: -23.5505, lng: -46.6333, country: "BRA", threats: 5,  severity: "low" },
    { id: "7", lat: 28.6139, lng: 77.2090,   country: "IND", threats: 9,  severity: "medium" },
    { id: "8", lat: 1.3521,  lng: 103.8198,  country: "SGP", threats: 4,  severity: "low" },
    { id: "9", lat: 59.9311, lng: 30.3609,   country: "RUS", threats: 17, severity: "high" },
    { id: "10", lat: 48.8566, lng: 2.3522,   country: "FRA", threats: 6,  severity: "medium" },
  ];
}
