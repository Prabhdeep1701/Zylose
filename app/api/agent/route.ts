import { NextRequest, NextResponse } from "next/server";

// Agent data telemetry endpoint
const agentDataStore: object[] = [];

// POST /api/agent — receive system telemetry from Python agent
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
    }

    const b = body as Record<string, unknown>;

    // Basic schema validation
    const required = ["agentId", "timestamp"];
    for (const field of required) {
      if (!b[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Store telemetry (bounded)
    const entry = {
      ...b,
      receivedAt: new Date().toISOString(),
    };
    agentDataStore.push(entry);
    if (agentDataStore.length > 5000) agentDataStore.shift();

    return NextResponse.json({ success: true, stored: true }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }
}

// GET /api/agent — retrieve latest agent telemetry
export async function GET() {
  const latest = agentDataStore.slice(-10).reverse();
  return NextResponse.json({ success: true, count: agentDataStore.length, data: latest });
}
