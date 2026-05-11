import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    regions: [
      { id: "iad", activeSessions: 621, capacity: 0.68 },
      { id: "sfo", activeSessions: 388, capacity: 0.52 },
      { id: "ams", activeSessions: 275, capacity: 0.41 },
    ],
    workers: {
      ready: 164,
      draining: 5,
      quarantined: 1,
    },
    security: {
      csp: "strict",
      csrf: "enabled",
      websocketAuth: "signed-jwt",
      auditLogging: "enabled",
    },
  });
}
