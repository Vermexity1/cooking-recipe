import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    stream: {
      preferredTransport: "webrtc",
      fallbackTransport: "websocket-delta-frames",
      codecs: ["h264", "vp9"],
      inputChannels: ["mouse", "keyboard", "touch", "clipboard", "drag-drop"],
      adaptiveProfiles: [
        { name: "quality", fps: 60, targetLatencyMs: 120 },
        { name: "balanced", fps: 45, targetLatencyMs: 160 },
        { name: "low-data", fps: 30, targetLatencyMs: 220 },
      ],
    },
  });
}
