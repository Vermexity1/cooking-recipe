export type SessionMode = "temporary" | "persistent" | "developer";
export type SessionStatus =
  | "allocating"
  | "booting"
  | "streaming"
  | "suspended"
  | "destroying"
  | "destroyed"
  | "failed";

export type BrowserSession = {
  id: string;
  userId: string;
  workspaceId: string;
  mode: SessionMode;
  status: SessionStatus;
  region: string;
  workerId?: string;
  createdAt: string;
  expiresAt: string;
  isolation: IsolationPolicy;
};

export type IsolationPolicy = {
  container: true;
  disposableStorage: boolean;
  cookiePartition: string;
  memoryMb: number;
  cpuShares: number;
  egressPolicy: "standard" | "restricted" | "blocked";
};

export type BrowserTab = {
  id: string;
  sessionId: string;
  title: string;
  url: string;
  faviconUrl?: string;
  active: boolean;
  loading: boolean;
};

export type StreamTransport = "webrtc" | "websocket-delta-frames";

export type StreamState = {
  sessionId: string;
  transport: StreamTransport;
  fps: number;
  latencyMs: number;
  bitrateMbps: number;
  codec: "h264" | "vp9" | "av1";
};

export type InputEventEnvelope =
  | {
      type: "mouse";
      sessionId: string;
      x: number;
      y: number;
      button?: "left" | "middle" | "right";
      pressed?: boolean;
    }
  | {
      type: "keyboard";
      sessionId: string;
      key: string;
      code: string;
      modifiers: string[];
      pressed: boolean;
    }
  | {
      type: "scroll";
      sessionId: string;
      deltaX: number;
      deltaY: number;
    }
  | {
      type: "clipboard";
      sessionId: string;
      text: string;
      direction: "local-to-remote" | "remote-to-local";
    };

export type AuditEvent = {
  id: string;
  actorId: string;
  action: string;
  targetId: string;
  ipHash: string;
  createdAt: string;
  metadata: Record<string, string | number | boolean | null>;
};
