import { NextRequest, NextResponse } from "next/server";

// ============================================================
// DSA-Based Analysis Engine
// ============================================================

// Sliding window spike detection
function detectSpikes(
  data: number[],
  windowSize: number,
  multiplier: number = 2.0
): { spikeDetected: boolean; spikePct: number } {
  if (data.length < windowSize + 1) return { spikeDetected: false, spikePct: 0 };

  const window = data.slice(-windowSize - 1, -1);
  const avg = window.reduce((s, v) => s + v, 0) / window.length;
  const latest = data[data.length - 1];
  const spikePct = avg > 0 ? ((latest - avg) / avg) * 100 : 0;

  return {
    spikeDetected: latest > avg * multiplier,
    spikePct: parseFloat(spikePct.toFixed(2)),
  };
}

// Hash-based frequency tracking for IP threat scoring
function computeIpFrequencyScore(
  sourceIp: string,
  requestCount: number,
  windowMinutes: number
): number {
  // Quick hash of the IP for deterministic scoring
  let hash = 0;
  for (const char of sourceIp) {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash |= 0;
  }
  const baseScore = Math.abs(hash) % 30;

  // Frequency-based penalty
  const ratePerMinute = requestCount / windowMinutes;
  const ratePenalty = Math.min(ratePerMinute * 2, 40);

  return Math.min(baseScore + ratePenalty, 70);
}

// Priority queue simulation (max-heap approach)
function prioritizeAlerts(alerts: RiskAlert[]): RiskAlert[] {
  return [...alerts].sort((a, b) => b.riskScore - a.riskScore);
}

// Graph-based threat mapping
function mapThreatConnections(
  sourceIp: string,
  targetIps: string[]
): Record<string, string[]> {
  const graph: Record<string, string[]> = {};
  graph[sourceIp] = targetIps;
  for (const t of targetIps) {
    if (!graph[t]) graph[t] = [];
    graph[t].push(sourceIp);
  }
  return graph;
}

// ============================================================
// Types
// ============================================================

interface AnalyzePayload {
  sourceIp?: string;
  targetIps?: string[];
  requestCount?: number;
  windowMinutes?: number;
  cpuUsage?: number;
  memoryUsage?: number;
  networkBytes?: number;
  trafficHistory?: number[];
  processes?: { name: string; cpu: number; memory: number }[];
}

interface RiskAlert {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  riskScore: number;
  message: string;
}

// ============================================================
// Anomaly detection (lightweight without sklearn)
// Uses statistical Z-score for anomaly scoring
// ============================================================

function isolationScore(value: number, baseline: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  const zScore = Math.abs(value - baseline) / stdDev;
  // Map z-score → 0..1 anomaly score
  return Math.min(1 / (1 + Math.exp(-zScore + 2)), 1);
}

function computeAnomalyScore(payload: AnalyzePayload): number {
  const cpuScore    = isolationScore(payload.cpuUsage    ?? 0, 40, 20);
  const memScore    = isolationScore(payload.memoryUsage ?? 0, 60, 15);
  const netScore    = isolationScore(payload.networkBytes ?? 0, 100_000, 50_000);
  return (cpuScore * 0.4 + memScore * 0.3 + netScore * 0.3) * 100;
}

// ============================================================
// POST /api/analyze
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzePayload = await request.json();

    // Input validation
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid request body" }, { status: 400 });
    }

    const alerts: RiskAlert[] = [];

    // --- 1. CPU Usage analysis ---
    const cpu = body.cpuUsage ?? 0;
    if (cpu > 90) {
      alerts.push({ type: "CPU_SPIKE",    severity: "critical", riskScore: 95, message: `CPU usage critically high: ${cpu}%` });
    } else if (cpu > 75) {
      alerts.push({ type: "CPU_HIGH",     severity: "high",     riskScore: 70, message: `CPU usage elevated: ${cpu}%` });
    }

    // --- 2. Memory analysis ---
    const mem = body.memoryUsage ?? 0;
    if (mem > 90) {
      alerts.push({ type: "MEMORY_SPIKE", severity: "critical", riskScore: 88, message: `Memory usage critically high: ${mem}%` });
    } else if (mem > 80) {
      alerts.push({ type: "MEMORY_HIGH",  severity: "high",     riskScore: 65, message: `Memory usage elevated: ${mem}%` });
    }

    // --- 3. Sliding window spike detection on traffic ---
    const history = body.trafficHistory ?? [];
    if (history.length >= 5) {
      const { spikeDetected, spikePct } = detectSpikes(history, 5, 1.8);
      if (spikeDetected) {
        alerts.push({
          type: "TRAFFIC_SPIKE",
          severity: spikePct > 300 ? "critical" : "high",
          riskScore: Math.min(50 + spikePct * 0.1, 100),
          message: `Traffic spike of ${spikePct.toFixed(1)}% detected above windowed average`,
        });
      }
    }

    // --- 4. IP frequency scoring ---
    const sourceIp     = body.sourceIp ?? "";
    const reqCount     = body.requestCount ?? 0;
    const windowMins   = body.windowMinutes ?? 1;
    let ipRiskScore    = 0;

    if (sourceIp && reqCount > 0) {
      ipRiskScore = computeIpFrequencyScore(sourceIp, reqCount, windowMins);
      if (ipRiskScore > 50) {
        alerts.push({
          type: "IP_FREQUENCY_ANOMALY",
          severity: ipRiskScore > 65 ? "high" : "medium",
          riskScore: ipRiskScore,
          message: `IP ${sourceIp} showing high request frequency: ${reqCount} req/${windowMins}min`,
        });
      }
    }

    // --- 5. Process anomaly detection ---
    const processes = body.processes ?? [];
    for (const proc of processes) {
      if (proc.cpu > 80) {
        alerts.push({
          type: "PROCESS_CPU_ANOMALY",
          severity: "high",
          riskScore: 75,
          message: `Process '${proc.name}' consuming ${proc.cpu}% CPU — potential cryptominer or malware`,
        });
      }
    }

    // --- 6. Graph-based threat mapping ---
    const threatGraph = sourceIp && body.targetIps?.length
      ? mapThreatConnections(sourceIp, body.targetIps)
      : {};

    // --- 7. ML-style anomaly score (statistical) ---
    const mlAnomalyScore = computeAnomalyScore(body);

    // --- 8. Combine DSA + ML scores ---
    const dsaScore = alerts.length > 0
      ? Math.max(...alerts.map(a => a.riskScore))
      : 0;
    const combinedRiskScore = parseFloat(
      Math.min(dsaScore * 0.6 + mlAnomalyScore * 0.4, 100).toFixed(1)
    );

    // --- Priority queue ranking ---
    const rankedAlerts = prioritizeAlerts(alerts);

    return NextResponse.json({
      success: true,
      analysis: {
        combinedRiskScore,
        dsaScore: parseFloat(dsaScore.toFixed(1)),
        mlAnomalyScore: parseFloat(mlAnomalyScore.toFixed(1)),
        riskLevel:
          combinedRiskScore >= 80 ? "CRITICAL" :
          combinedRiskScore >= 60 ? "HIGH" :
          combinedRiskScore >= 40 ? "MEDIUM" :
          combinedRiskScore >= 20 ? "LOW" : "NORMAL",
        alertsCount: rankedAlerts.length,
        alerts: rankedAlerts,
        threatGraph: Object.keys(threatGraph).length > 0 ? threatGraph : undefined,
        recommendations:
          combinedRiskScore >= 80 ? ["Immediate isolation recommended", "Escalate to CIRT team"] :
          combinedRiskScore >= 60 ? ["Increase monitoring frequency", "Review firewall rules"] :
          combinedRiskScore >= 40 ? ["Log for forensic analysis", "Monitor next 15 minutes"] :
          ["Continue standard monitoring"],
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        version: "1.0.0",
        engine: "SentinelAI-DSA+ML",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Analysis failed — invalid payload" },
      { status: 400 }
    );
  }
}
