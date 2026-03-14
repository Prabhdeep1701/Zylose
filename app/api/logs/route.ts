import { NextRequest, NextResponse } from "next/server";

// In-memory log store (replace with Supabase in production)
const logStore: object[] = [];

// Schema validation for incoming logs
function validateLogSchema(body: unknown): { valid: boolean; error?: string } {
  if (typeof body !== "object" || body === null) {
    return { valid: false, error: "Body must be a JSON object" };
  }
  const b = body as Record<string, unknown>;

  if (!b.level || typeof b.level !== "string") {
    return { valid: false, error: "Missing or invalid 'level' field" };
  }
  const validLevels = ["INFO", "WARN", "ERROR", "DEBUG", "CRITICAL"];
  if (!validLevels.includes((b.level as string).toUpperCase())) {
    return { valid: false, error: `Level must be one of: ${validLevels.join(", ")}` };
  }
  if (!b.message || typeof b.message !== "string") {
    return { valid: false, error: "Missing or invalid 'message' field" };
  }
  if (!b.service || typeof b.service !== "string") {
    return { valid: false, error: "Missing or invalid 'service' field" };
  }
  // Optional: ip validation
  if (b.ip && typeof b.ip === "string") {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipv4Regex.test(b.ip)) {
      return { valid: false, error: "Invalid IP address format" };
    }
  }
  return { valid: true };
}

// GET /api/logs — retrieve stored logs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level   = searchParams.get("level")?.toUpperCase();
  const service = searchParams.get("service");
  const limit   = Math.min(parseInt(searchParams.get("limit") ?? "100"), 1000);

  let data = [...logStore];

  if (level)   data = data.filter((l: any) => l.level === level);
  if (service) data = data.filter((l: any) => l.service === service);

  return NextResponse.json({
    success: true,
    count: data.length,
    logs: data.slice(-limit).reverse(),
  });
}

// POST /api/logs — ingest new log entry
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate schema
    const validation = validateLogSchema(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    // Sanitize and store
    const entry = {
      id: `LOG-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      level: (body.level as string).toUpperCase(),
      service: (body.service as string).slice(0, 64), // truncate long service names
      message: (body.message as string).slice(0, 2048),
      ip: body.ip ?? null,
      userId: body.userId ?? null,
      metadata: body.metadata ?? null,
    };

    logStore.push(entry);

    // Keep store bounded to 10,000 entries
    if (logStore.length > 10000) logStore.shift();

    return NextResponse.json({ success: true, id: entry.id }, { status: 201 });
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }
}
