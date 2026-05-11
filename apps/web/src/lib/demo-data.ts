export type DemoTab = {
  id: string;
  title: string;
  url: string;
  status: "active" | "loading" | "idle";
};

export const seedTabs: DemoTab[] = [
  {
    id: "tab-overview",
    title: "Secure workspace",
    url: "https://start.veil.local/workspace",
    status: "active",
  },
  {
    id: "tab-research",
    title: "Research vault",
    url: "https://docs.veil.local/privacy-model",
    status: "idle",
  },
  {
    id: "tab-admin",
    title: "Fleet health",
    url: "https://admin.veil.local/sessions",
    status: "loading",
  },
];

export const workspaces = [
  { name: "Private", sessions: 3, tone: "cyan" },
  { name: "Research", sessions: 8, tone: "emerald" },
  { name: "Testing", sessions: 2, tone: "amber" },
];

export const bookmarks = [
  { title: "Security playbook", url: "veil://vault/security", tag: "Policy" },
  { title: "Container pool", url: "veil://admin/pools", tag: "Ops" },
  { title: "Privacy dashboard", url: "veil://privacy", tag: "User" },
];

export const historyItems = [
  { title: "DNS over HTTPS status", time: "09:44", risk: "clean" },
  { title: "WebRTC relay negotiation", time: "09:38", risk: "clean" },
  { title: "Disposable profile cleanup", time: "09:26", risk: "sealed" },
];

export const privacyControls = [
  { label: "Cookie vault", value: "Isolated", accent: "text-cyan-200" },
  { label: "Tracker rules", value: "42k active", accent: "text-emerald-200" },
  { label: "Session storage", value: "Ephemeral", accent: "text-amber-200" },
  { label: "Permissions", value: "Ask every time", accent: "text-rose-200" },
];

export const adminMetrics = [
  { label: "Active sessions", value: "1,284", delta: "+12%", tone: "cyan" },
  { label: "CPU reserve", value: "38%", delta: "-6%", tone: "emerald" },
  { label: "Network egress", value: "8.7 Gb/s", delta: "+4%", tone: "amber" },
  { label: "Abuse alerts", value: "3", delta: "review", tone: "rose" },
];

export const sessionTimeline = [
  { step: "Create", status: "done" },
  { step: "Boot", status: "done" },
  { step: "Connect", status: "done" },
  { step: "Stream", status: "active" },
  { step: "Suspend", status: "idle" },
  { step: "Destroy", status: "armed" },
];

export const architectureNodes = [
  { name: "Edge router", detail: "Vercel HTTPS edge + signed worker handoff" },
  { name: "API control plane", detail: "Fastify, Zod, JWT rotation, audit log" },
  { name: "Session broker", detail: "Redis queue with region-aware placement" },
  { name: "Browser worker", detail: "Playwright Chromium in a disposable container" },
  { name: "Stream relay", detail: "WebRTC primary with WebSocket frame fallback" },
  { name: "Data plane", detail: "PostgreSQL, encrypted preferences, cleanup jobs" },
];

export const commandGroups = [
  "Open command center",
  "Launch incognito container",
  "Switch to Research workspace",
  "Clear disposable storage",
  "Open admin health",
  "Toggle low bandwidth mode",
  "Export audit trail",
];
