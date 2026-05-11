import type { InputEventEnvelope, StreamState } from "@veil/types";

export type StreamOffer = {
  sessionId: string;
  transport: "webrtc";
  sdp: string;
  iceServers: Array<{ urls: string | string[]; username?: string; credential?: string }>;
  expiresAt: string;
};

export type StreamFallbackFrame = {
  sessionId: string;
  sequence: number;
  encoding: "jpeg-delta" | "png-keyframe";
  width: number;
  height: number;
  data: ArrayBuffer;
};

export function buildInitialStreamState(sessionId: string): StreamState {
  return {
    sessionId,
    transport: "webrtc",
    fps: 0,
    latencyMs: 0,
    bitrateMbps: 0,
    codec: "h264",
  };
}

export function isInputEvent(value: unknown): value is InputEventEnvelope {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { type?: string; sessionId?: string };
  return (
    typeof candidate.sessionId === "string" &&
    ["mouse", "keyboard", "scroll", "clipboard"].includes(candidate.type ?? "")
  );
}
