import { NextResponse } from "next/server";
import { z } from "zod";

const createSessionSchema = z.object({
  workspaceId: z.string().min(1).default("private"),
  mode: z.enum(["temporary", "persistent", "developer"]).default("temporary"),
  region: z.enum(["iad", "sfo", "ams", "sin"]).default("iad"),
});

const sessions = [
  {
    id: "cx-78f2",
    workspaceId: "private",
    status: "streaming",
    region: "iad",
    browser: "chromium",
    createdAt: new Date(Date.now() - 2384 * 1000).toISOString(),
    expiresAt: new Date(Date.now() + 42 * 60 * 1000).toISOString(),
    isolation: {
      container: true,
      disposableStorage: true,
      cookiePartition: "workspace-private",
    },
    stream: {
      transport: "webrtc",
      fps: 60,
      latencyMs: 31,
      bitrateMbps: 8.4,
    },
  },
];

export async function GET() {
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = createSessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid session request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const now = new Date();
  const session = {
    id: `cx-${Math.random().toString(16).slice(2, 6)}`,
    workspaceId: parsed.data.workspaceId,
    status: "allocating",
    region: parsed.data.region,
    browser: "chromium",
    mode: parsed.data.mode,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
    isolation: {
      container: true,
      disposableStorage: parsed.data.mode !== "persistent",
      cookiePartition: `workspace-${parsed.data.workspaceId}`,
    },
    stream: {
      transport: "webrtc",
      fps: 0,
      latencyMs: null,
      bitrateMbps: null,
    },
  };

  return NextResponse.json({ session }, { status: 201 });
}
