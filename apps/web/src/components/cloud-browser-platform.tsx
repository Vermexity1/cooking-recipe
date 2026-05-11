"use client";

import type {
  CSSProperties,
  FormEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Bluetooth,
  BookMarked,
  Bookmark,
  Boxes,
  Calculator,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Cloud,
  CloudSun,
  Code2,
  Command,
  Cpu,
  Download,
  ExternalLink,
  EyeOff,
  FileText,
  FilePlus,
  FileUp,
  Fingerprint,
  Folder,
  FolderPlus,
  GitBranch,
  Globe2,
  Grid3X3,
  History,
  Image as ImageIcon,
  Inbox,
  Keyboard,
  Layers3,
  ListTodo,
  Lock,
  Mail,
  Map,
  MapPin,
  Maximize2,
  Menu,
  Mic,
  Minus,
  Minimize2,
  MonitorUp,
  MousePointer2,
  Network,
  Pause,
  Paintbrush,
  Package,
  Palette,
  Play,
  Plus,
  Power,
  Radio,
  RefreshCw,
  Save,
  Search,
  Send,
  Settings,
  Shield,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Square,
  StickyNote,
  TerminalSquare,
  Trash2,
  UserRound,
  Wrench,
  Wifi,
  X,
  Zap,
  ZoomIn,
  ZoomOut,
  Volume2,
} from "lucide-react";
import {
  adminMetrics,
  architectureNodes,
  bookmarks as seedBookmarks,
  historyItems as seedHistoryItems,
  privacyControls,
  workspaces,
} from "@/lib/demo-data";
import DebianAudacityApp from "@/components/apps/installed/AudacityApp";
import DebianBlenderApp from "@/components/apps/installed/BlenderApp";
import DebianFirefoxApp from "@/components/apps/installed/FirefoxApp";
import DebianGimpApp from "@/components/apps/installed/GIMPApp";
import DebianInkscapeApp from "@/components/apps/installed/InkscapeApp";
import DebianLibreOfficeApp from "@/components/apps/installed/LibreOfficeApp";
import DebianSteamApp from "@/components/apps/installed/SteamApp";
import DebianThunderbirdApp from "@/components/apps/installed/ThunderbirdApp";
import DebianTransmissionApp from "@/components/apps/installed/TransmissionApp";
import DebianVlcApp from "@/components/apps/installed/VLCApp";
import DebianVSCodeApp from "@/components/apps/installed/VSCodeApp";

export type BrowserAccount = {
  id: string;
  username: string;
  email: string;
  inviteHash: string;
};

type BrowserTab = {
  id: string;
  title: string;
  url: string;
  status: "active" | "loading" | "idle";
  kind: "start" | "search" | "site";
  query?: string;
  history: string[];
  historyIndex: number;
  reloadKey: number;
};

type BookmarkItem = {
  title: string;
  url: string;
  tag: string;
};

type HistoryItem = {
  title: string;
  time: string;
  risk: string;
  url?: string;
};

type DownloadItem = {
  id: string;
  name: string;
  size: string;
  status: "ready" | "queued" | "scanned";
};

type PanelView =
  | "search"
  | "bookmarks"
  | "history"
  | "downloads"
  | "sessions"
  | "privacy"
  | "ops"
  | "settings";

type PrivacyPreset = "Balanced" | "Strict" | "Disposable";
type BandwidthMode = "Adaptive" | "Low data" | "Battery saver";
type SessionState = "live" | "suspended" | "destroyed";
type OsAppId =
  | "browser"
  | "files"
  | "terminal"
  | "settings"
  | "vm"
  | "monitor"
  | "notepad"
  | "calculator"
  | "paint"
  | "photos"
  | "media"
  | "calendar"
  | "clock"
  | "mail"
  | "weather"
  | "maps"
  | "tasks"
  | "security"
  | "network"
  | "store"
  | "code"
  | "sticky"
  | "recorder"
  | "camera"
  | "control"
  | "firefox"
  | "libreoffice"
  | "gimp"
  | "vlc"
  | "blender"
  | "inkscape"
  | "audacity"
  | "thunderbird"
  | "transmission"
  | "steam";
type WallpaperChoice = "obsidian" | "aurora" | "grid" | "solar";

type OsWindow = {
  id: OsAppId;
  title: string;
  icon: LucideIcon;
  x: number;
  y: number;
  width: number;
  height: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
};

type FileSystemItem = {
  id: string;
  name: string;
  kind: "folder" | "file";
  content?: string;
  dataUrl?: string;
  location?: FileLocation;
  mimeType?: string;
  size: string;
  modified: string;
};

type FileLocation = "Home" | "Desktop" | "Downloads" | "VM Snapshots" | "Secure Vault";
type FileDraft = Omit<FileSystemItem, "id"> & { id?: string };
type BrowserScrollCommand = { id: number; deltaX: number; deltaY: number };

const startUrl = "veil://new-tab";
const browserZoomMin = 0.5;
const browserZoomMax = 2;
const browserZoomStep = 0.1;
const browserScrollStep = 720;

const defaultTabs: BrowserTab[] = [
  {
    id: "tab-home",
    title: "Veil Search",
    url: startUrl,
    status: "active",
    kind: "start",
    history: [startUrl],
    historyIndex: 0,
    reloadKey: 0,
  },
];

const sidebarItems: Array<{
  id: PanelView;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "search", label: "Search", icon: Search },
  { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
  { id: "history", label: "History", icon: History },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "sessions", label: "Sessions", icon: Boxes },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "ops", label: "Ops", icon: Activity },
  { id: "settings", label: "Settings", icon: Settings },
];

const quickLinks = [
  { title: "MDN Web Docs", url: "https://developer.mozilla.org", tag: "Docs" },
  { title: "Wikipedia", url: "https://www.wikipedia.org", tag: "Reference" },
  { title: "Next.js", url: "https://nextjs.org", tag: "Build" },
  { title: "Render", url: "https://render.com", tag: "Free host" },
];

const searchTemplates = [
  {
    title: "Privacy preserving browser architecture",
    url: "https://developer.mozilla.org/en-US/docs/Web/Security",
    body: "Security references, permission boundaries, and modern browser platform guidance.",
  },
  {
    title: "Next.js App Router documentation",
    url: "https://nextjs.org/docs/app",
    body: "Routing, server components, route handlers, and production deployment notes.",
  },
  {
    title: "WebRTC real-time communication",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API",
    body: "Peer connections, streams, media tracks, and low latency data channels.",
  },
  {
    title: "Cloud container isolation",
    url: "https://docs.docker.com/engine/security/",
    body: "Container hardening concepts, resource limits, and runtime isolation guidance.",
  },
];

const lifecycleBase = [
  "Create container",
  "Boot Chromium",
  "Attach profile",
  "Negotiate stream",
  "Route input",
  "Sync clipboard",
  "Watch activity",
  "Expire storage",
  "Destroy worker",
  "Write audit event",
];

const fileLocations: FileLocation[] = [
  "Home",
  "Desktop",
  "Downloads",
  "VM Snapshots",
  "Secure Vault",
];

const osApps: Array<{
  id: OsAppId;
  title: string;
  subtitle: string;
  icon: LucideIcon;
}> = [
  { id: "browser", title: "Veil Browser", subtitle: "Full screen cloud browser", icon: Globe2 },
  { id: "files", title: "File Explorer", subtitle: "Files, editor, images, models", icon: Folder },
  { id: "terminal", title: "Terminal", subtitle: "Command shell", icon: TerminalSquare },
  { id: "settings", title: "Settings", subtitle: "Wallpaper, accent, system controls", icon: Settings },
  { id: "vm", title: "Virtual Machine", subtitle: "Cloud VM launcher", icon: Cpu },
  { id: "monitor", title: "Task Manager", subtitle: "CPU, memory, network", icon: Activity },
  { id: "notepad", title: "Notepad", subtitle: "Quick text editor", icon: FileText },
  { id: "calculator", title: "Calculator", subtitle: "Standard calculator", icon: Calculator },
  { id: "paint", title: "Paint", subtitle: "Canvas sketchpad", icon: Paintbrush },
  { id: "photos", title: "Photos", subtitle: "Image gallery", icon: ImageIcon },
  { id: "media", title: "Media Player", subtitle: "Audio and video playlist", icon: Play },
  { id: "calendar", title: "Calendar", subtitle: "Month and events", icon: CalendarDays },
  { id: "clock", title: "Clock", subtitle: "Timer and stopwatch", icon: Clock3 },
  { id: "mail", title: "Mail", subtitle: "Draft inbox", icon: Mail },
  { id: "weather", title: "Weather", subtitle: "Forecast board", icon: CloudSun },
  { id: "maps", title: "Maps", subtitle: "Open map viewer", icon: Map },
  { id: "tasks", title: "To Do", subtitle: "Checklist and planner", icon: ListTodo },
  { id: "security", title: "Security", subtitle: "Privacy and device status", icon: ShieldCheck },
  { id: "network", title: "Network", subtitle: "Connection controls", icon: Network },
  { id: "store", title: "App Store", subtitle: "Install local tools", icon: ShoppingBag },
  { id: "code", title: "Code Editor", subtitle: "Edit code files", icon: Code2 },
  { id: "sticky", title: "Sticky Notes", subtitle: "Pinned notes", icon: StickyNote },
  { id: "recorder", title: "Recorder", subtitle: "Voice memo mock", icon: Mic },
  { id: "camera", title: "Camera", subtitle: "Camera permission console", icon: Camera },
  { id: "control", title: "Control Panel", subtitle: "Classic system settings", icon: Wrench },
  { id: "firefox", title: "Firefox", subtitle: "Clean direct web app", icon: Globe2 },
  { id: "libreoffice", title: "LibreOffice", subtitle: "Document writer", icon: FileText },
  { id: "gimp", title: "GIMP", subtitle: "Image editor workspace", icon: Paintbrush },
  { id: "vlc", title: "VLC", subtitle: "Local media player", icon: Play },
  { id: "blender", title: "Blender", subtitle: "3D scene studio", icon: Boxes },
  { id: "inkscape", title: "Inkscape", subtitle: "Vector drawing board", icon: Palette },
  { id: "audacity", title: "Audacity", subtitle: "Audio recorder and mixer", icon: Mic },
  { id: "thunderbird", title: "Thunderbird", subtitle: "Mail client", icon: Mail },
  { id: "transmission", title: "Transmission", subtitle: "Download manager", icon: Download },
  { id: "steam", title: "Steam", subtitle: "Game library", icon: ShoppingBag },
];

const desktopPinnedApps: OsAppId[] = [
  "browser",
  "files",
  "terminal",
  "vm",
  "code",
  "settings",
];

const dockPinnedApps: OsAppId[] = [
  "browser",
  "files",
  "terminal",
  "vm",
  "code",
  "settings",
];

const appDefaults: Record<
  OsAppId,
  Omit<OsWindow, "id" | "title" | "icon" | "z" | "minimized" | "maximized">
> = {
  browser: { x: 270, y: 86, width: 980, height: 690 },
  vm: { x: 320, y: 112, width: 900, height: 640 },
  terminal: { x: 340, y: 150, width: 760, height: 430 },
  files: { x: 260, y: 126, width: 820, height: 560 },
  settings: { x: 330, y: 112, width: 760, height: 620 },
  monitor: { x: 380, y: 146, width: 720, height: 500 },
  notepad: { x: 250, y: 118, width: 720, height: 560 },
  calculator: { x: 420, y: 130, width: 380, height: 520 },
  paint: { x: 220, y: 118, width: 900, height: 640 },
  photos: { x: 280, y: 116, width: 820, height: 600 },
  media: { x: 300, y: 136, width: 760, height: 520 },
  calendar: { x: 320, y: 116, width: 760, height: 580 },
  clock: { x: 380, y: 126, width: 620, height: 520 },
  mail: { x: 260, y: 116, width: 840, height: 600 },
  weather: { x: 340, y: 132, width: 700, height: 520 },
  maps: { x: 240, y: 102, width: 900, height: 640 },
  tasks: { x: 360, y: 124, width: 620, height: 560 },
  security: { x: 330, y: 116, width: 760, height: 560 },
  network: { x: 340, y: 126, width: 700, height: 520 },
  store: { x: 270, y: 112, width: 860, height: 620 },
  code: { x: 250, y: 108, width: 920, height: 640 },
  sticky: { x: 420, y: 132, width: 520, height: 520 },
  recorder: { x: 430, y: 150, width: 520, height: 440 },
  camera: { x: 360, y: 128, width: 680, height: 500 },
  control: { x: 300, y: 120, width: 760, height: 560 },
  firefox: { x: 270, y: 86, width: 980, height: 690 },
  libreoffice: { x: 250, y: 108, width: 920, height: 640 },
  gimp: { x: 230, y: 104, width: 920, height: 650 },
  vlc: { x: 300, y: 130, width: 780, height: 540 },
  blender: { x: 250, y: 96, width: 920, height: 650 },
  inkscape: { x: 260, y: 108, width: 860, height: 620 },
  audacity: { x: 300, y: 124, width: 840, height: 560 },
  thunderbird: { x: 270, y: 106, width: 880, height: 620 },
  transmission: { x: 330, y: 126, width: 760, height: 520 },
  steam: { x: 260, y: 96, width: 900, height: 650 },
};

const initialFiles: FileSystemItem[] = [
  {
    id: "file-1",
    name: "Browser Session Notes.md",
    kind: "file",
    content:
      "# Browser Session Notes\n\n- Full screen browser mode\n- Disposable cloud workspace\n- File editor and preview tools\n",
    size: "18 KB",
    modified: "Today",
    location: "Desktop",
  },
  {
    id: "file-2",
    name: "Downloads",
    kind: "folder",
    size: "4 items",
    modified: "Today",
    location: "Downloads",
  },
  {
    id: "file-3",
    name: "VM Snapshots",
    kind: "folder",
    size: "2 images",
    modified: "Yesterday",
    location: "VM Snapshots",
  },
  {
    id: "file-4",
    name: "security-profile.json",
    kind: "file",
    content: '{\n  "privacy": "strict",\n  "storage": "isolated",\n  "cleanup": true\n}\n',
    size: "6 KB",
    modified: "Today",
    location: "Secure Vault",
  },
  {
    id: "file-5",
    name: "hello-world.ts",
    kind: "file",
    content:
      'export function greet(name: string) {\n  return `Hello, ${name}`;\n}\n\nconsole.log(greet("VeilOS"));\n',
    size: "2 KB",
    modified: "Today",
    location: "Desktop",
  },
  {
    id: "file-6",
    name: "neon-grid.obj",
    kind: "file",
    content:
      "o NeonCube\nv -1 -1 -1\nv 1 -1 -1\nv 1 1 -1\nv -1 1 -1\nv -1 -1 1\nv 1 -1 1\nv 1 1 1\nv -1 1 1\nf 1 2 3 4\nf 5 8 7 6\nf 1 5 6 2\nf 2 6 7 3\nf 3 7 8 4\nf 5 1 4 8\n",
    mimeType: "model/obj",
    size: "3 KB",
    modified: "Today",
    location: "VM Snapshots",
  },
];

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function formatTimer(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return [hours, minutes, secs]
    .map((value) => value.toString().padStart(2, "0"))
    .join(":");
}

function nowTime() {
  return new Intl.DateTimeFormat("en", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
}

function estimateFileSize(file: Pick<FileSystemItem, "content" | "dataUrl" | "size">) {
  if (file.size) {
    return file.size;
  }

  const bytes = (file.dataUrl ?? file.content ?? "").length;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function downloadWorkspaceFile(file: FileSystemItem) {
  if (typeof document === "undefined" || file.kind === "folder") {
    return;
  }

  const href =
    file.dataUrl ??
    URL.createObjectURL(
      new Blob([file.content ?? ""], {
        type: file.mimeType ?? "text/plain;charset=utf-8",
      }),
    );
  const link = document.createElement("a");
  link.href = href;
  link.download = file.name;
  link.click();
}

function isLikelyUrl(value: string) {
  return value.includes(".") && !value.includes(" ");
}

function titleFromUrl(url: string) {
  if (url === startUrl) {
    return "Veil Search";
  }

  if (url.startsWith("veil://search")) {
    const query = new URL(url.replace("veil://", "https://veil.local/")).searchParams.get(
      "q",
    );
    return query ? `Search: ${query}` : "Search results";
  }

  try {
    const host = new URL(url).hostname.replace("www.", "");
    const [name] = host.split(".");
    return name ? name.replace(/-/g, " ") : "Web page";
  } catch {
    return "Web page";
  }
}

function resolveNavigation(value: string): Pick<
  BrowserTab,
  "kind" | "query" | "title" | "url"
> {
  const trimmed = value.trim();

  if (!trimmed || trimmed === startUrl) {
    return {
      kind: "start",
      title: "Veil Search",
      url: startUrl,
    };
  }

  if (trimmed.startsWith("veil://search")) {
    const query = new URL(trimmed.replace("veil://", "https://veil.local/")).searchParams.get(
      "q",
    );
    return {
      kind: "search",
      query: query ?? "",
      title: query ? `Search: ${query}` : "Search results",
      url: trimmed,
    };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return {
      kind: "site",
      title: titleFromUrl(trimmed),
      url: trimmed,
    };
  }

  if (isLikelyUrl(trimmed)) {
    const url = `https://${trimmed}`;
    return {
      kind: "site",
      title: titleFromUrl(url),
      url,
    };
  }

  return {
    kind: "search",
    query: trimmed,
    title: `Search: ${trimmed}`,
    url: `veil://search?q=${encodeURIComponent(trimmed)}`,
  };
}

function requiresCloudRenderer(url: string) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return [
      "github.com",
      "tiktok.com",
      "x.com",
      "twitter.com",
      "youtube.com",
      "accounts.google.com",
      "discord.com",
      "reddit.com",
      "notion.so",
    ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function clampBrowserZoom(value: number) {
  return Math.min(
    browserZoomMax,
    Math.max(browserZoomMin, Math.round(value * 100) / 100),
  );
}

function tabAddress(tab: BrowserTab) {
  if (tab.kind === "start") {
    return "";
  }

  if (tab.kind === "search") {
    return tab.query ?? "";
  }

  return tab.url;
}

function createTab(seed?: Partial<BrowserTab>): BrowserTab {
  const id = `tab-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
  return {
    id,
    title: "Veil Search",
    url: startUrl,
    status: "active",
    kind: "start",
    history: [startUrl],
    historyIndex: 0,
    reloadKey: 0,
    ...seed,
  };
}

function createHistoryItem(title: string, url?: string): HistoryItem {
  return {
    title,
    time: nowTime(),
    risk: "clean",
    url,
  };
}

function wallpaperClass(wallpaper: WallpaperChoice) {
  if (wallpaper === "aurora") {
    return "bg-[radial-gradient(circle_at_20%_20%,rgba(20,184,166,0.34),transparent_30%),radial-gradient(circle_at_80%_18%,rgba(244,114,182,0.22),transparent_28%),linear-gradient(135deg,#020617,#050505_52%,#111827)]";
  }

  if (wallpaper === "grid") {
    return "bg-[linear-gradient(rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(135deg,#050505,#101010)] bg-[size:54px_54px,54px_54px,100%_100%]";
  }

  if (wallpaper === "solar") {
    return "bg-[radial-gradient(circle_at_22%_72%,rgba(251,191,36,0.28),transparent_28%),radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.16),transparent_22%),linear-gradient(135deg,#080808,#17120a)]";
  }

  return "bg-[radial-gradient(circle_at_18%_12%,rgba(255,255,255,0.08),transparent_26%),linear-gradient(135deg,#151a22,#0d1117_52%,#05070a)]";
}

function windowTitle(appId: OsAppId) {
  return osApps.find((app) => app.id === appId)?.title ?? "Window";
}

function appIcon(appId: OsAppId) {
  return osApps.find((app) => app.id === appId)?.icon ?? Square;
}

function fitWindowToViewport(
  bounds: Omit<OsWindow, "id" | "title" | "icon" | "z" | "minimized" | "maximized">,
) {
  if (typeof window === "undefined") {
    return bounds;
  }

  const width = Math.min(bounds.width, Math.max(280, window.innerWidth - 24));
  const height = Math.min(bounds.height, Math.max(320, window.innerHeight - 118));
  const maxX = Math.max(8, window.innerWidth - width - 12);
  const maxY = Math.max(58, window.innerHeight - height - 58);

  return {
    ...bounds,
    height,
    width,
    x: Math.min(maxX, Math.max(8, bounds.x)),
    y: Math.min(maxY, Math.max(58, bounds.y)),
  };
}

export function CloudBrowserPlatform({ account }: { account?: BrowserAccount }) {
  const [windows, setWindows] = useState<OsWindow[]>([]);
  const [nextZ, setNextZ] = useState(20);
  const [wallpaper, setWallpaper] = useState<WallpaperChoice>("obsidian");
  const [accent, setAccent] = useState("#ffffff");
  const [volume, setVolume] = useState(64);
  const [brightness, setBrightness] = useState(92);
  const [files, setFiles] = useState<FileSystemItem[]>(initialFiles);
  const [fileToOpenId, setFileToOpenId] = useState(files[0]?.id ?? "");
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "VeilOS boot complete.",
    "Type help for available commands.",
  ]);
  const [vmUrl, setVmUrl] = useState("https://www.tiktok.com");
  const [clock, setClock] = useState(() => nowTime());

  useEffect(() => {
    window.scrollTo({ left: 0, top: 0 });
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setClock(nowTime()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const applyVolume = () => {
      document.querySelectorAll("audio, video").forEach((element) => {
        const mediaElement = element as HTMLMediaElement;
        mediaElement.volume = Math.max(0, Math.min(1, volume / 100));
        mediaElement.muted = volume === 0;
      });
    };

    applyVolume();
    const observer = new MutationObserver(applyVolume);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [volume]);

  const focusWindow = (id: OsAppId) => {
    setNextZ((value) => value + 1);
    setWindows((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, z: nextZ + 1, minimized: false }
          : item,
      ),
    );
  };

  const openApp = (id: OsAppId) => {
    setNextZ((value) => value + 1);
    setWindows((items) => {
      const existing = items.find((item) => item.id === id);
      if (existing) {
        return items.map((item) =>
          item.id === id
            ? {
                ...item,
                z: nextZ + 1,
                minimized: false,
              }
            : item,
        );
      }

      return [
        ...items,
        {
          id,
          title: windowTitle(id),
          icon: appIcon(id),
          ...fitWindowToViewport(appDefaults[id]),
          z: nextZ + 1,
          minimized: false,
          maximized: false,
        },
      ];
    });
  };

  const saveFileToWorkspace = (file: FileDraft) => {
    const id = file.id ?? `file-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`;
    const nextFile: FileSystemItem = {
      ...file,
      id,
      kind: file.kind ?? "file",
      location: file.location ?? "Desktop",
      modified: file.modified ?? "Now",
      size: estimateFileSize(file),
    };
    setFiles((items) => [nextFile, ...items.filter((item) => item.id !== id)]);
    setFileToOpenId(id);
    return id;
  };

  const createFile = () => {
    const id = saveFileToWorkspace({
      name: `New Note ${files.length + 1}.txt`,
      kind: "file",
      content: "",
      location: "Desktop",
      mimeType: "text/plain",
      size: "1 KB",
      modified: "Now",
    });
    setFileToOpenId(id);
  };

  const openDesktopFile = (id: string) => {
    setFileToOpenId(id);
    openApp("files");
  };

  const closeWindow = (id: OsAppId) => {
    setWindows((items) => items.filter((item) => item.id !== id));
  };

  const minimizeWindow = (id: OsAppId) => {
    setWindows((items) =>
      items.map((item) =>
        item.id === id ? { ...item, minimized: true } : item,
      ),
    );
  };

  const toggleMaximize = (id: OsAppId) => {
    setWindows((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, maximized: !item.maximized, minimized: false }
          : item,
      ),
    );
  };

  const updateWindow = (id: OsAppId, patch: Partial<OsWindow>) => {
    setWindows((items) =>
      items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const runOsCommand = (rawCommand: string) => {
    const command = rawCommand.trim().toLowerCase();
    if (!command) {
      return;
    }

    setTerminalLines((items) => [...items, `> ${rawCommand}`]);

    if (command === "help") {
      setTerminalLines((items) => [
        ...items,
        "Commands: help, apps, open browser, open vm, open files, open settings, clear, wallpaper aurora, wallpaper grid, wallpaper solar",
      ]);
      return;
    }

    if (command === "apps") {
      setTerminalLines((items) => [
        ...items,
        `Apps: ${osApps.map((app) => app.title).join(", ")}`,
      ]);
      return;
    }

    if (command.startsWith("open ")) {
      const target = command.replace("open ", "");
      const app = osApps.find(
        (candidate) =>
          candidate.id === target || candidate.title.toLowerCase().includes(target),
      );
      if (app) {
        openApp(app.id);
        setTerminalLines((items) => [...items, `Opened ${app.title}.`]);
      } else {
        setTerminalLines((items) => [...items, `No app named ${target}.`]);
      }
      return;
    }

    if (command.startsWith("wallpaper ")) {
      const nextWallpaper = command.replace("wallpaper ", "") as WallpaperChoice;
      if (["obsidian", "aurora", "grid", "solar"].includes(nextWallpaper)) {
        setWallpaper(nextWallpaper);
        setTerminalLines((items) => [...items, `Wallpaper set to ${nextWallpaper}.`]);
      }
      return;
    }

    if (command === "clear") {
      setTerminalLines(["Terminal cleared."]);
      return;
    }

    setTerminalLines((items) => [...items, "Unknown command. Type help."]);
  };

  return (
    <main
      className={cn(
        "fixed inset-0 h-screen overflow-hidden text-white",
        wallpaperClass(wallpaper),
      )}
        style={{ "--veil-accent": accent } as CSSProperties}
    >
      <div
        className="pointer-events-none absolute inset-0 z-[2100] bg-black transition-opacity"
        style={{ opacity: Math.max(0, (100 - brightness) / 135) }}
      />
      <div className="pointer-events-none absolute inset-0 z-[2101] bg-white mix-blend-screen transition-opacity" style={{ opacity: Math.max(0, (brightness - 100) / 180) }} />
      <OsMenuBar
        account={account}
        brightness={brightness}
        clock={clock}
        onOpenApp={openApp}
        onPower={() => {
          window.localStorage.removeItem("veil-private-beta-account");
          window.location.reload();
        }}
        volume={volume}
      />
      <DesktopHome files={files} onOpenApp={openApp} onOpenFile={openDesktopFile} />

      <AnimatePresence>
        {windows.map((windowItem) =>
          windowItem.minimized ? null : (
            <WindowFrame
              key={windowItem.id}
              windowItem={windowItem}
              onClose={() => closeWindow(windowItem.id)}
              onFocus={() => focusWindow(windowItem.id)}
              onMaximize={() => toggleMaximize(windowItem.id)}
              onMinimize={() => minimizeWindow(windowItem.id)}
              onUpdate={(patch) => updateWindow(windowItem.id, patch)}
            >
              <OsAppContent
                accent={accent}
                account={account}
                appId={windowItem.id}
                files={files}
                onAccent={setAccent}
                brightness={brightness}
                onCreateFile={createFile}
                onDeleteFile={(id) =>
                  setFiles((items) => items.filter((item) => item.id !== id))
                }
                onImportFiles={(nextFiles) =>
                  setFiles((items) => [...nextFiles, ...items])
                }
                onOpenApp={openApp}
                onRunCommand={runOsCommand}
                onSaveFile={saveFileToWorkspace}
                onBrightness={setBrightness}
                onUpdateFile={(id, patch) =>
                  setFiles((items) =>
                    items.map((item) =>
                      item.id === id ? { ...item, ...patch } : item,
                    ),
                  )
                }
                onVmUrl={setVmUrl}
                onVolume={setVolume}
                onWallpaper={setWallpaper}
                terminalLines={terminalLines}
                selectedFileId={fileToOpenId}
                vmUrl={vmUrl}
                volume={volume}
                wallpaper={wallpaper}
              />
            </WindowFrame>
          ),
        )}
      </AnimatePresence>

      <OsDock clock={clock} onOpenApp={openApp} windows={windows} />
    </main>
  );
}

function OsMenuBar({
  account,
  brightness,
  clock,
  onOpenApp,
  onPower,
  volume,
}: {
  account?: BrowserAccount;
  brightness: number;
  clock: string;
  onOpenApp: (id: OsAppId) => void;
  onPower: () => void;
  volume: number;
}) {
  return (
    <div className="absolute inset-x-0 top-0 z-[200] grid h-9 grid-cols-[1fr_auto_1fr] items-center border-b border-white/10 bg-[#0b0d11]/86 px-3 text-sm shadow-[0_12px_40px_rgba(0,0,0,0.32)] backdrop-blur-2xl">
      <div className="flex min-w-0 items-center gap-2">
        <button
          className="rounded-md px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-white/10"
          onClick={() => onOpenApp("browser")}
          type="button"
        >
          VeilOS
        </button>
        <div className="hidden items-center gap-1 sm:flex">
          {[0, 1, 2].map((item) => (
            <span
              className={cn(
                "block size-1.5 rounded-full",
                item === 0 ? "bg-white" : "bg-white/28",
              )}
              key={item}
            />
          ))}
        </div>
      </div>
      <button
        className="rounded-md px-3 py-1 font-mono text-xs text-slate-200 transition hover:bg-white/10"
        onClick={() => onOpenApp("clock")}
        type="button"
      >
        {clock}
      </button>
      <div className="flex min-w-0 items-center justify-end gap-1.5">
        <button
          aria-label="Open cloud browser"
          className="hidden items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-300 transition hover:bg-white/10 hover:text-white md:flex"
          onClick={() => onOpenApp("browser")}
          type="button"
        >
          <ShieldCheck className="size-3.5 text-emerald-300" />
          Cloud
        </button>
        <button
          aria-label="Open network settings"
          className="grid size-7 place-items-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
          onClick={() => onOpenApp("network")}
          type="button"
        >
          <Wifi className="size-3.5" />
        </button>
        <button
          aria-label={`Volume ${volume}%`}
          className="hidden size-7 place-items-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white sm:grid"
          onClick={() => onOpenApp("control")}
          type="button"
        >
          <Volume2 className="size-3.5" />
        </button>
        <button
          aria-label={`Brightness ${brightness}%`}
          className="hidden rounded-md px-2 py-1 font-mono text-[11px] text-slate-300 transition hover:bg-white/10 hover:text-white sm:block"
          onClick={() => onOpenApp("control")}
          type="button"
        >
          {brightness}%
        </button>
        <span className="max-w-28 truncate rounded-md px-2 py-1 text-xs font-medium text-white/90">
          @{account?.username ?? "guest"}
        </span>
        <button
          aria-label="Sign out"
          className="grid size-7 place-items-center rounded-md text-slate-300 transition hover:bg-white/10 hover:text-white"
          onClick={onPower}
          type="button"
        >
          <Power className="size-3.5" />
        </button>
      </div>
    </div>
  );
}

function DesktopHome({
  files,
  onOpenApp,
  onOpenFile,
}: {
  files: FileSystemItem[];
  onOpenApp: (id: OsAppId) => void;
  onOpenFile: (id: string) => void;
}) {
  const desktopFiles = files.filter((file) => file.kind === "file").slice(0, 12);
  const pinnedApps = desktopPinnedApps
    .map((id) => osApps.find((app) => app.id === id))
    .filter((app): app is (typeof osApps)[number] => Boolean(app));

  return (
    <div className="absolute inset-0 z-0 overflow-hidden px-4 pb-24 pt-12 sm:px-6">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent_52%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 text-center lg:block">
        <p className="text-[11vw] font-semibold leading-none tracking-[0.02em] text-white/[0.028]">
          VeilOS
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.48em] text-white/18">
          secure cloud desktop
        </p>
      </div>
      <div className="relative grid max-h-[calc(100vh-9rem)] w-fit grid-cols-2 gap-x-2 gap-y-3 overflow-y-auto pr-2 sm:grid-cols-3 lg:grid-cols-1">
        {pinnedApps.map((app) => (
          <button
            className="group flex w-24 flex-col items-center gap-2 rounded-lg border border-transparent p-2 text-center transition hover:border-white/10 hover:bg-white/[0.075]"
            key={app.id}
            onDoubleClick={() => onOpenApp(app.id)}
            onClick={() => onOpenApp(app.id)}
            type="button"
          >
            <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-black/38 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur transition group-hover:bg-white group-hover:text-black">
              <app.icon className="size-6" />
            </span>
            <span className="line-clamp-2 min-h-8 max-w-full rounded bg-black/22 px-1.5 py-0.5 text-xs font-medium leading-4 text-white shadow-sm backdrop-blur">
              {app.title}
            </span>
          </button>
        ))}
        <button
          className="group flex w-24 flex-col items-center gap-2 rounded-lg border border-transparent p-2 text-center transition hover:border-white/10 hover:bg-white/[0.075]"
          onClick={() => onOpenApp("store")}
          type="button"
        >
          <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-black/38 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur transition group-hover:bg-white group-hover:text-black">
            <Grid3X3 className="size-6" />
          </span>
          <span className="line-clamp-2 min-h-8 max-w-full rounded bg-black/22 px-1.5 py-0.5 text-xs font-medium leading-4 text-white shadow-sm backdrop-blur">
            All Apps
          </span>
        </button>
      </div>
      <div className="absolute right-5 top-20 hidden max-h-[calc(100vh-9rem)] w-40 grid-cols-1 gap-3 overflow-y-auto pr-1 lg:grid">
        {desktopFiles.map((file) => {
          const previewType = filePreviewType(file);
          const Icon =
            previewType === "image"
              ? ImageIcon
              : previewType === "media"
                ? Play
                : previewType === "model"
                  ? Boxes
                  : FileText;
          return (
            <button
              className="group flex flex-col items-center gap-2 rounded-lg border border-transparent p-2 text-center transition hover:border-white/10 hover:bg-white/[0.075]"
              key={file.id}
              onClick={() => onOpenFile(file.id)}
              type="button"
            >
              <span className="grid size-12 place-items-center rounded-xl border border-white/10 bg-black/38 shadow-[0_12px_32px_rgba(0,0,0,0.3)] backdrop-blur transition group-hover:bg-white group-hover:text-black">
                <Icon className="size-6" />
              </span>
              <span className="line-clamp-2 max-w-full rounded bg-black/22 px-1.5 py-0.5 text-xs font-medium leading-4 text-white shadow-sm backdrop-blur">
                {file.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OsDock({
  clock,
  onOpenApp,
  windows,
}: {
  clock: string;
  onOpenApp: (id: OsAppId) => void;
  windows: OsWindow[];
}) {
  const [startOpen, setStartOpen] = useState(false);
  const pinnedApps = dockPinnedApps;
  const visibleWindows = windows.filter((item) => !item.minimized);

  return (
    <>
      <AnimatePresence>
        {startOpen && (
          <motion.div
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="absolute bottom-20 left-3 z-[220] flex max-h-[min(560px,calc(100vh-6rem))] w-[min(520px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-2xl border border-white/12 bg-[#08090d]/96 shadow-[0_30px_120px_rgba(0,0,0,0.62)] backdrop-blur-2xl"
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
          >
            <div className="shrink-0 border-b border-white/10 p-3">
              <div className="flex items-center gap-3">
                <span className="grid size-9 place-items-center rounded-xl bg-white text-black">
                  <Grid3X3 className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">VeilOS Start</p>
                  <p className="text-xs text-slate-400">
                    Apps, files, settings, and cloud tools
                  </p>
                </div>
              </div>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-1 overflow-y-auto p-2 sm:grid-cols-2">
              {osApps.map((app) => (
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/10"
                  key={app.id}
                  onClick={() => {
                    onOpenApp(app.id);
                    setStartOpen(false);
                  }}
                  type="button"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/[0.09] text-white">
                    <app.icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {app.title}
                    </span>
                    <span className="block truncate text-xs text-slate-400">
                      {app.subtitle}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav
        aria-label="VeilOS taskbar"
        className="absolute bottom-3 left-1/2 z-[210] flex h-14 max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-2 overflow-x-auto rounded-2xl border border-white/12 bg-[#0b0d11]/82 px-2 shadow-[0_18px_80px_rgba(0,0,0,0.54)] backdrop-blur-2xl"
      >
        <button
          aria-label="Open Start menu"
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-xl transition",
            startOpen
              ? "bg-[var(--veil-accent)] text-black"
              : "bg-white/[0.08] text-white hover:bg-[var(--veil-accent)] hover:text-black",
          )}
          onClick={() => setStartOpen((value) => !value)}
          type="button"
        >
          <Grid3X3 className="size-5" />
        </button>
        <div className="flex items-center gap-1.5">
          {pinnedApps.map((id) => {
            const app = osApps.find((item) => item.id === id);
            if (!app) {
              return null;
            }
            const open = windows.some((item) => item.id === app.id);
            return (
              <button
                aria-label={app.title}
                className={cn(
                  "relative grid size-10 shrink-0 place-items-center rounded-xl transition hover:bg-white hover:text-black",
                  open
                    ? "bg-[var(--veil-accent)] text-black"
                    : "bg-white/[0.07] text-white hover:bg-[var(--veil-accent)]",
                )}
                key={app.id}
                onClick={() => onOpenApp(app.id)}
                title={app.title}
                type="button"
              >
                <app.icon className="size-5" />
                {open && (
                  <span className="absolute bottom-1 size-1 rounded-full bg-[var(--veil-accent)]" />
                )}
              </button>
            );
          })}
        </div>
        <div className="hidden h-8 w-px shrink-0 bg-white/10 md:block" />
        <div className="hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
          {windows.slice(0, 5).map((item) => (
            <button
              className={cn(
                "relative grid size-10 shrink-0 place-items-center rounded-xl transition",
                item.minimized
                  ? "bg-white/[0.035] text-slate-500 hover:bg-white/10"
                  : "bg-white/[0.08] text-white hover:bg-white/14",
              )}
              key={item.id}
              onClick={() => onOpenApp(item.id)}
              title={item.title}
              type="button"
            >
              <item.icon className="size-4 shrink-0" />
              {!item.minimized && (
                <span className="absolute bottom-1 size-1 rounded-full bg-white" />
              )}
            </button>
          ))}
          {visibleWindows.length === 0 && (
            <span className="px-2 text-xs text-slate-500">Ready</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-300">
          <button
            aria-label="Open network settings"
            className="hidden size-9 place-items-center rounded-xl bg-white/[0.07] transition hover:bg-white hover:text-black sm:grid"
            onClick={() => onOpenApp("network")}
            type="button"
          >
            <Wifi className="size-4" />
          </button>
          <button
            aria-label="Open cloud VM"
            className="hidden size-9 place-items-center rounded-xl bg-white/[0.07] transition hover:bg-white hover:text-black sm:grid"
            onClick={() => onOpenApp("vm")}
            type="button"
          >
            <Cloud className="size-4" />
          </button>
          <button
            className="rounded-lg bg-white/[0.07] px-2.5 py-2 font-mono transition hover:bg-white hover:text-black"
            onClick={() => onOpenApp("clock")}
            type="button"
          >
            {clock}
          </button>
        </div>
      </nav>
    </>
  );
}

function WindowFrame({
  children,
  onClose,
  onFocus,
  onMaximize,
  onMinimize,
  onUpdate,
  windowItem,
}: {
  children: ReactNode;
  onClose: () => void;
  onFocus: () => void;
  onMaximize: () => void;
  onMinimize: () => void;
  onUpdate: (patch: Partial<OsWindow>) => void;
  windowItem: OsWindow;
}) {
  const startDrag = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (windowItem.maximized) {
      return;
    }

    event.preventDefault();
    onFocus();
    const startX = event.clientX;
    const startY = event.clientY;
    const original = { x: windowItem.x, y: windowItem.y };

    const onMove = (moveEvent: MouseEvent) => {
      const maxX = Math.max(8, window.innerWidth - windowItem.width - 12);
      const maxY = Math.max(58, window.innerHeight - windowItem.height - 58);
      onUpdate({
        x: Math.min(maxX, Math.max(8, original.x + moveEvent.clientX - startX)),
        y: Math.min(maxY, Math.max(58, original.y + moveEvent.clientY - startY)),
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const startResize = (event: ReactMouseEvent<HTMLElement>, direction: string) => {
    event.preventDefault();
    event.stopPropagation();
    onFocus();
    const startX = event.clientX;
    const startY = event.clientY;
    const original = {
      height: windowItem.height,
      width: windowItem.width,
      x: windowItem.x,
      y: windowItem.y,
    };

    const onMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      const maxWidth = Math.max(280, window.innerWidth - 16);
      const maxHeight = Math.max(300, window.innerHeight - 112);
      const minTop = 40;
      const maxBottom = window.innerHeight - 76;
      let nextWidth = original.width;
      let nextHeight = original.height;
      let nextX = original.x;
      let nextY = original.y;

      if (direction.includes("e")) {
        nextWidth = Math.min(maxWidth, Math.max(280, original.width + deltaX));
      }

      if (direction.includes("s")) {
        nextHeight = Math.min(
          maxHeight,
          Math.max(300, original.height + deltaY),
        );
      }

      if (direction.includes("w")) {
        nextWidth = Math.min(maxWidth, Math.max(280, original.width - deltaX));
        nextX = Math.min(
          original.x + original.width - nextWidth,
          original.x + original.width - 280,
        );
      }

      if (direction.includes("n")) {
        nextHeight = Math.min(maxHeight, Math.max(300, original.height - deltaY));
        nextY = Math.min(
          original.y + original.height - nextHeight,
          original.y + original.height - 300,
        );
      }

      nextX = Math.max(8, Math.min(nextX, window.innerWidth - nextWidth - 8));
      nextY = Math.max(minTop, Math.min(nextY, maxBottom - nextHeight));

      onUpdate({
        height: nextHeight,
        maximized: false,
        width: nextWidth,
        x: nextX,
        y: nextY,
      });
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const Icon = windowItem.icon;
  const style: CSSProperties = windowItem.maximized
    ? {
        borderRadius: 0,
        inset: 0,
        zIndex: 1500 + windowItem.z,
      }
    : {
        height: windowItem.height,
        left: windowItem.x,
        maxHeight: "calc(100vh - 112px)",
        maxWidth: "calc(100vw - 16px)",
        top: windowItem.y,
        width: windowItem.width,
        zIndex: windowItem.z,
      };

  return (
    <motion.section
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "absolute flex min-h-0 min-w-[280px] flex-col overflow-hidden border border-white/10 bg-[#101217]/96 shadow-[0_22px_80px_rgba(0,0,0,0.56)] backdrop-blur-2xl",
        windowItem.maximized ? "rounded-none border-0" : "rounded-lg",
      )}
      exit={{ opacity: 0, scale: 0.96 }}
      initial={{ opacity: 0, scale: 0.96 }}
      onMouseDown={onFocus}
      style={style}
    >
      <div
        className={cn(
          "flex h-9 shrink-0 cursor-move items-center justify-between border-b border-white/10 bg-[#151922] px-2",
          windowItem.maximized && "h-8",
        )}
        onMouseDown={startDrag}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-md bg-white/[0.08] text-white">
            <Icon className="size-3.5" />
          </span>
          <span className="truncate text-xs font-semibold text-slate-100">
            {windowItem.title}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            aria-label={`Minimize ${windowItem.title}`}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              onMinimize();
            }}
            type="button"
          >
            <Minimize2 className="size-4" />
          </button>
          <button
            aria-label={`Maximize ${windowItem.title}`}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={(event) => {
              event.stopPropagation();
              onMaximize();
            }}
            type="button"
          >
            <Maximize2 className="size-4" />
          </button>
          <button
            aria-label={`Close ${windowItem.title}`}
            className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-rose-400/20 hover:text-rose-100"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      {!windowItem.maximized && (
        <>
          <div aria-hidden className="absolute inset-x-2 top-0 h-1.5 cursor-n-resize" onMouseDown={(event) => startResize(event, "n")} />
          <div aria-hidden className="absolute inset-x-2 bottom-0 h-1.5 cursor-s-resize" onMouseDown={(event) => startResize(event, "s")} />
          <div aria-hidden className="absolute inset-y-2 right-0 w-1.5 cursor-e-resize" onMouseDown={(event) => startResize(event, "e")} />
          <div aria-hidden className="absolute inset-y-2 left-0 w-1.5 cursor-w-resize" onMouseDown={(event) => startResize(event, "w")} />
          <div aria-hidden className="absolute right-0 top-0 size-4 cursor-ne-resize" onMouseDown={(event) => startResize(event, "ne")} />
          <div aria-hidden className="absolute left-0 top-0 size-4 cursor-nw-resize" onMouseDown={(event) => startResize(event, "nw")} />
          <div aria-hidden className="absolute bottom-0 right-0 size-5 cursor-nwse-resize" onMouseDown={(event) => startResize(event, "se")} />
          <div aria-hidden className="absolute bottom-0 left-0 size-5 cursor-nesw-resize" onMouseDown={(event) => startResize(event, "sw")} />
          <button
            aria-label={`Resize ${windowItem.title}`}
            className="absolute bottom-1 right-1 grid size-6 cursor-nwse-resize place-items-center rounded-md text-slate-500 hover:bg-white/10 hover:text-white"
            onMouseDown={(event) => startResize(event, "se")}
            type="button"
          >
            <Square className="size-2.5" />
          </button>
        </>
      )}
    </motion.section>
  );
}

function OsAppContent({
  accent,
  account,
  appId,
  brightness,
  files,
  onAccent,
  onBrightness,
  onCreateFile,
  onDeleteFile,
  onImportFiles,
  onOpenApp,
  onRunCommand,
  onSaveFile,
  onUpdateFile,
  onVolume,
  onVmUrl,
  onWallpaper,
  selectedFileId,
  terminalLines,
  vmUrl,
  volume,
  wallpaper,
}: {
  accent: string;
  account?: BrowserAccount;
  appId: OsAppId;
  brightness: number;
  files: FileSystemItem[];
  onAccent: (value: string) => void;
  onBrightness: (value: number) => void;
  onCreateFile: () => void;
  onDeleteFile: (id: string) => void;
  onImportFiles: (files: FileSystemItem[]) => void;
  onOpenApp: (id: OsAppId) => void;
  onRunCommand: (command: string) => void;
  onSaveFile: (file: FileDraft) => string;
  onUpdateFile: (id: string, patch: Partial<FileSystemItem>) => void;
  onVolume: (value: number) => void;
  onVmUrl: (url: string) => void;
  onWallpaper: (wallpaper: WallpaperChoice) => void;
  selectedFileId: string;
  terminalLines: string[];
  vmUrl: string;
  volume: number;
  wallpaper: WallpaperChoice;
}) {
  if (appId === "browser") {
    return <BrowserWorkspaceApp account={account} />;
  }

  if (appId === "terminal") {
    return (
      <OsTerminal lines={terminalLines} onOpenApp={onOpenApp} onRun={onRunCommand} />
    );
  }

  if (appId === "files") {
    return (
      <FilesApp
        files={files}
        onCreateFile={onCreateFile}
        onDeleteFile={onDeleteFile}
        onImportFiles={onImportFiles}
        onSaveFile={onSaveFile}
        selectedFileId={selectedFileId}
        onUpdateFile={onUpdateFile}
      />
    );
  }

  if (appId === "settings") {
    return (
      <OsSettings
        accent={accent}
        onAccent={onAccent}
        onWallpaper={onWallpaper}
        wallpaper={wallpaper}
      />
    );
  }

  if (appId === "vm") {
    return <VirtualMachineApp onVmUrl={onVmUrl} vmUrl={vmUrl} />;
  }

  if (appId === "monitor") {
    return <SystemMonitorApp />;
  }

  if (appId === "code") {
    return (
      <DebianAppShell>
        <DebianVSCodeApp />
      </DebianAppShell>
    );
  }

  if (appId === "notepad") {
    return (
      <TextEditorApp
        codeMode={false}
        files={files}
        onSaveFile={onSaveFile}
        onUpdateFile={onUpdateFile}
      />
    );
  }

  if (appId === "calculator") {
    return <CalculatorApp />;
  }

  if (appId === "paint") {
    return <PaintApp onSaveFile={onSaveFile} />;
  }

  if (appId === "photos") {
    return <PhotosApp files={files} onOpenFiles={() => onOpenApp("files")} />;
  }

  if (appId === "media") {
    return <MediaPlayerApp files={files} />;
  }

  if (appId === "calendar" || appId === "clock") {
    return <TimeSuiteApp mode={appId} />;
  }

  if (appId === "tasks" || appId === "sticky") {
    return <NotesTasksApp mode={appId} />;
  }

  if (appId === "mail") {
    return <MailApp />;
  }

  if (appId === "weather") {
    return <WeatherApp />;
  }

  if (appId === "maps") {
    return <MapsApp />;
  }

  if (appId === "security") {
    return <SecurityCenterApp />;
  }

  if (appId === "network") {
    return <NetworkApp />;
  }

  if (appId === "store") {
    return <StoreApp onOpenApp={onOpenApp} />;
  }

  if (appId === "recorder") {
    return <RecorderApp onSaveFile={onSaveFile} />;
  }

  if (appId === "camera") {
    return <CameraApp onSaveFile={onSaveFile} />;
  }

  if (appId === "control") {
    return (
      <ControlPanelApp
        accent={accent}
        brightness={brightness}
        onAccent={onAccent}
        onBrightness={onBrightness}
        onVolume={onVolume}
        volume={volume}
      />
    );
  }

  if (appId === "firefox") {
    return (
      <DebianAppShell>
        <DebianFirefoxApp />
      </DebianAppShell>
    );
  }

  if (appId === "libreoffice") {
    return (
      <DebianAppShell>
        <DebianLibreOfficeApp onClose={() => undefined} />
      </DebianAppShell>
    );
  }

  if (appId === "gimp") {
    return (
      <DebianAppShell>
        <DebianGimpApp />
      </DebianAppShell>
    );
  }

  if (appId === "inkscape") {
    return (
      <DebianAppShell>
        <DebianInkscapeApp />
      </DebianAppShell>
    );
  }

  if (appId === "vlc") {
    return (
      <DebianAppShell>
        <DebianVlcApp />
      </DebianAppShell>
    );
  }

  if (appId === "blender") {
    return (
      <DebianAppShell>
        <DebianBlenderApp />
      </DebianAppShell>
    );
  }

  if (appId === "audacity") {
    return (
      <DebianAppShell>
        <DebianAudacityApp />
      </DebianAppShell>
    );
  }

  if (appId === "thunderbird") {
    return (
      <DebianAppShell>
        <DebianThunderbirdApp />
      </DebianAppShell>
    );
  }

  if (appId === "transmission") {
    return (
      <DebianAppShell>
        <DebianTransmissionApp />
      </DebianAppShell>
    );
  }

  if (appId === "steam") {
    return (
      <DebianAppShell>
        <DebianSteamApp />
      </DebianAppShell>
    );
  }

  return <UtilityApp appId={appId} />;
}

function DebianAppShell({ children }: { children: ReactNode }) {
  return <div className="h-full min-h-0 overflow-hidden">{children}</div>;
}

// Keep the original Veil fallback apps in the bundle for quick rollback while
// the Debian apps are mounted as the active implementations above.
void [
  FirefoxStyleApp,
  LibreOfficeApp,
  CreativeStudioApp,
  VlcStyleApp,
  BlenderStyleApp,
  AudacityStyleApp,
  ThunderbirdStyleApp,
  TransmissionStyleApp,
  SteamStyleApp,
  VSCodeStyleApp,
];

function FirefoxStyleApp({
  onOpenCloudBrowser,
}: {
  onOpenCloudBrowser: () => void;
}) {
  const [draft, setDraft] = useState("https://www.wikipedia.org");
  const [url, setUrl] = useState("https://www.wikipedia.org");
  const directUrl = draft.startsWith("http://") || draft.startsWith("https://")
    ? draft
    : `https://${draft}`;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101217] text-white">
      <form
        className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#151922] p-2"
        onSubmit={(event) => {
          event.preventDefault();
          setUrl(directUrl);
        }}
      >
        <Globe2 className="size-4 text-orange-300" />
        <input
          className="min-h-9 min-w-0 flex-1 rounded-lg border border-white/10 bg-black/30 px-3 text-sm outline-none"
          onChange={(event) => setDraft(event.target.value)}
          value={draft}
        />
        <button className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black" type="submit">
          Go
        </button>
        <button
          className="rounded-lg border border-white/10 px-3 py-2 text-xs text-slate-200 transition hover:bg-white/10"
          onClick={onOpenCloudBrowser}
          type="button"
        >
          Cloud
        </button>
      </form>
      <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-2">
        {["https://developer.mozilla.org", "https://www.wikipedia.org", "https://example.com"].map((item) => (
          <button
            className="truncate rounded-lg bg-white/[0.06] px-3 py-2 text-left text-xs text-slate-300 transition hover:bg-white/10 hover:text-white"
            key={item}
            onClick={() => {
              setDraft(item);
              setUrl(item);
            }}
            type="button"
          >
            {item.replace("https://", "")}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 bg-white">
        <iframe
          className="h-full w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
          src={url}
          title="Firefox direct browser"
        />
      </div>
    </div>
  );
}

function LibreOfficeApp({ onSaveFile }: { onSaveFile: (file: FileDraft) => string }) {
  const [title, setTitle] = useState("Untitled Document");
  const [content, setContent] = useState(
    "Project notes\n\nWrite a document here, format it with the controls, and save it into the VeilOS file system.",
  );
  const [fontSize, setFontSize] = useState(16);
  const [align, setAlign] = useState<"left" | "center" | "right">("left");
  const [saved, setSaved] = useState("Not saved");

  const save = () => {
    const name = `${title.trim() || "Document"}.md`;
    onSaveFile({
      content: `# ${title}\n\n${content}`,
      kind: "file",
      location: "Home",
      mimeType: "text/markdown",
      modified: "Now",
      name,
      size: `${Math.max(1, Math.round(content.length / 1024))} KB`,
    });
    setSaved(`Saved ${name}`);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f4f1ea] text-[#1f2933]">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-black/10 bg-[#ebe6dc] p-2">
        <input
          className="h-9 min-w-48 rounded-md border border-black/10 bg-white px-3 text-sm font-semibold outline-none"
          onChange={(event) => setTitle(event.target.value)}
          value={title}
        />
        <button className="rounded-md bg-[#1f2933] px-3 py-2 text-xs font-semibold text-white" onClick={save} type="button">
          Save
        </button>
        <button className="rounded-md border border-black/10 px-3 py-2 text-xs" onClick={() => setContent("")} type="button">
          New
        </button>
        <select className="h-9 rounded-md border border-black/10 bg-white px-2 text-xs" onChange={(event) => setFontSize(Number(event.target.value))} value={fontSize}>
          {[14, 16, 18, 22, 28].map((size) => <option key={size}>{size}</option>)}
        </select>
        {(["left", "center", "right"] as const).map((item) => (
          <button
            className={cn("rounded-md px-3 py-2 text-xs", align === item ? "bg-[#1f2933] text-white" : "border border-black/10")}
            key={item}
            onClick={() => setAlign(item)}
            type="button"
          >
            {item}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-600">{saved}</span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto min-h-full max-w-3xl rounded-sm bg-white p-8 shadow-[0_16px_60px_rgba(0,0,0,0.16)]">
          <textarea
            className="h-[720px] w-full resize-none border-0 bg-transparent leading-8 outline-none"
            onChange={(event) => setContent(event.target.value)}
            style={{ fontSize, textAlign: align }}
            value={content}
          />
        </div>
      </div>
      <div className="flex shrink-0 items-center justify-between border-t border-black/10 bg-[#ebe6dc] px-3 py-1.5 text-xs text-slate-600">
        <span>{content.trim().split(/\s+/).filter(Boolean).length} words</span>
        <span>Writer compatible workspace</span>
      </div>
    </div>
  );
}

function CreativeStudioApp({
  mode,
  onSaveFile,
}: {
  mode: "gimp" | "inkscape";
  onSaveFile: (file: FileDraft) => string;
}) {
  const isVector = mode === "inkscape";
  const [tool, setTool] = useState(isVector ? "Bezier" : "Brush");
  const [color, setColor] = useState("#38bdf8");
  const [size, setSize] = useState(34);
  const [objects, setObjects] = useState<Array<{ color: string; id: number; size: number; tool: string; x: number; y: number }>>([
    { color: "#38bdf8", id: 1, size: 70, tool: isVector ? "Circle" : "Brush", x: 42, y: 34 },
    { color: "#f97316", id: 2, size: 48, tool: isVector ? "Star" : "Smudge", x: 62, y: 58 },
  ]);

  const addObject = () => {
    setObjects((items) => [
      ...items,
      {
        color,
        id: Date.now(),
        size,
        tool,
        x: 18 + Math.random() * 64,
        y: 18 + Math.random() * 58,
      },
    ]);
  };

  const exportArt = () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560"><rect width="900" height="560" fill="#111827"/>${objects.map((item) => `<circle cx="${item.x * 9}" cy="${item.y * 5.6}" r="${item.size}" fill="${item.color}" opacity="0.76"/>`).join("")}</svg>`;
    onSaveFile({
      content: svg,
      kind: "file",
      location: "Desktop",
      mimeType: "image/svg+xml",
      modified: "Now",
      name: `${isVector ? "inkscape" : "gimp"}-artwork.svg`,
      size: `${Math.max(1, Math.round(svg.length / 1024))} KB`,
    });
  };

  return (
    <div className="grid h-full min-h-0 bg-[#101217] text-white md:grid-cols-[220px_minmax(0,1fr)_190px]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-[#151922] p-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{isVector ? "vector tools" : "image tools"}</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {(isVector ? ["Select", "Bezier", "Circle", "Text", "Node", "Fill"] : ["Brush", "Erase", "Crop", "Smudge", "Text", "Filter"]).map((item) => (
            <button
              className={cn("rounded-lg px-3 py-2 text-xs transition", tool === item ? "bg-white text-black" : "bg-white/[0.06] text-slate-300 hover:bg-white/10")}
              key={item}
              onClick={() => setTool(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
        <label className="mt-5 block text-xs text-slate-400">Color</label>
        <input className="mt-2 h-10 w-full rounded-lg bg-transparent" onChange={(event) => setColor(event.target.value)} type="color" value={color} />
        <label className="mt-5 block text-xs text-slate-400">Size {size}</label>
        <input className="mt-2 w-full" max={100} min={8} onChange={(event) => setSize(Number(event.target.value))} type="range" value={size} />
        <button className="mt-5 w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black" onClick={addObject} type="button">
          Add object
        </button>
        <button className="mt-2 w-full rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-200" onClick={exportArt} type="button">
          Export SVG
        </button>
      </aside>
      <main className="relative min-h-0 overflow-hidden bg-[#0b0f16] p-5">
        <div className="relative h-full rounded-lg border border-white/10 bg-[linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%),linear-gradient(45deg,rgba(255,255,255,0.05)_25%,transparent_25%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:32px_32px] bg-[position:0_0,16px_16px]">
          {objects.map((item) => (
            <button
              className="absolute rounded-full shadow-[0_0_40px_currentColor] transition hover:scale-110"
              key={item.id}
              onClick={() => setObjects((items) => items.filter((candidate) => candidate.id !== item.id))}
              style={{
                background: item.color,
                height: item.size,
                left: `${item.x}%`,
                top: `${item.y}%`,
                transform: "translate(-50%, -50%)",
                width: item.size,
              }}
              title="Click to remove"
              type="button"
            />
          ))}
        </div>
      </main>
      <aside className="min-h-0 overflow-y-auto border-l border-white/10 bg-[#151922] p-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">layers</p>
        <div className="mt-3 space-y-2">
          {objects.map((item, index) => (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-3 text-xs" key={item.id}>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full" style={{ background: item.color }} />
                <span className="font-semibold">Layer {index + 1}</span>
              </div>
              <p className="mt-1 text-slate-500">{item.tool}, {item.size}px</p>
            </div>
          ))}
        </div>
      </aside>
    </div>
  );
}

function VlcStyleApp({ files }: { files: FileSystemItem[] }) {
  const mediaFiles = files.filter((file) => filePreviewType(file) === "media");
  const [selectedId, setSelectedId] = useState(mediaFiles[0]?.id ?? "");
  const selected = mediaFiles.find((file) => file.id === selectedId) ?? mediaFiles[0];
  const [speed, setSpeed] = useState(1);

  return (
    <div className="grid h-full min-h-0 bg-[#111] text-white md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-[#1b1b1b] p-3">
        <div className="flex items-center gap-2 text-orange-300">
          <Play className="size-5" />
          <p className="font-semibold">VLC playlist</p>
        </div>
        <div className="mt-4 space-y-2">
          {mediaFiles.map((file) => (
            <button
              className={cn("w-full rounded-lg px-3 py-2 text-left text-sm", selected?.id === file.id ? "bg-orange-400 text-black" : "bg-white/[0.06] text-slate-300")}
              key={file.id}
              onClick={() => setSelectedId(file.id)}
              type="button"
            >
              <span className="block truncate">{file.name}</span>
              <span className="text-xs opacity-60">{file.size}</span>
            </button>
          ))}
          {!mediaFiles.length && <p className="text-sm text-slate-500">Add audio or video in Files to play it here.</p>}
        </div>
      </aside>
      <main className="flex min-h-0 flex-col">
        <div className="grid min-h-0 flex-1 place-items-center bg-black p-4">
          {selected?.dataUrl || selected?.content ? (
            selected.mimeType?.startsWith("audio") ? (
              <audio className="w-full max-w-xl" controls src={selected.dataUrl ?? selected.content} />
            ) : (
              <video className="max-h-full w-full max-w-4xl rounded-lg bg-black" controls src={selected.dataUrl ?? selected.content} />
            )
          ) : (
            <div className="text-center text-slate-500">
              <Play className="mx-auto size-16 text-orange-300" />
              <p className="mt-3">No media loaded</p>
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-white/10 bg-[#1b1b1b] p-3 text-sm">
          <span className="text-slate-400">Speed {speed.toFixed(1)}x</span>
          <input max={2} min={0.5} onChange={(event) => setSpeed(Number(event.target.value))} step={0.1} type="range" value={speed} />
          <span className="ml-auto truncate text-slate-500">{selected?.name ?? "Playlist empty"}</span>
        </div>
      </main>
    </div>
  );
}

function BlenderStyleApp({ onSaveFile }: { onSaveFile: (file: FileDraft) => string }) {
  const [rotation, setRotation] = useState(28);
  const [scale, setScale] = useState(1);
  const [material, setMaterial] = useState("#f97316");
  const [objects, setObjects] = useState(["Cube", "Camera", "Light"]);

  const saveScene = () => {
    const scene = JSON.stringify({ material, objects, rotation, scale }, null, 2);
    onSaveFile({
      content: scene,
      kind: "file",
      location: "Desktop",
      mimeType: "application/json",
      modified: "Now",
      name: "blender-scene.json",
      size: `${Math.max(1, Math.round(scene.length / 1024))} KB`,
    });
  };

  return (
    <div className="grid h-full min-h-0 bg-[#1c1f24] text-white md:grid-cols-[220px_minmax(0,1fr)_220px]">
      <aside className="border-r border-white/10 bg-[#252a31] p-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">outliner</p>
        <div className="mt-3 space-y-2">
          {objects.map((item) => (
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 text-sm" key={item}>
              <Boxes className="size-4 text-orange-300" />
              {item}
            </div>
          ))}
        </div>
        <button className="mt-4 w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-black" onClick={() => setObjects((items) => [...items, `Mesh ${items.length}`])} type="button">
          Add mesh
        </button>
      </aside>
      <main className="grid place-items-center overflow-hidden bg-[radial-gradient(circle_at_50%_40%,rgba(249,115,22,0.18),transparent_34%),#111318]">
        <div className="grid size-56 place-items-center rounded-[2rem] border border-white/10 shadow-[0_0_90px_rgba(249,115,22,0.22)]" style={{ perspective: 800 }}>
          <div
            className="size-32 rounded-xl shadow-[inset_18px_18px_40px_rgba(255,255,255,0.22),0_22px_70px_rgba(0,0,0,0.5)]"
            style={{
              background: material,
              transform: `rotateX(${rotation}deg) rotateY(${rotation * 1.6}deg) scale(${scale})`,
              transformStyle: "preserve-3d",
            }}
          />
        </div>
      </main>
      <aside className="border-l border-white/10 bg-[#252a31] p-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">properties</p>
        <label className="mt-4 block text-xs text-slate-400">Rotation {rotation} deg</label>
        <input className="mt-2 w-full" max={90} min={0} onChange={(event) => setRotation(Number(event.target.value))} type="range" value={rotation} />
        <label className="mt-4 block text-xs text-slate-400">Scale {scale.toFixed(1)}</label>
        <input className="mt-2 w-full" max={1.8} min={0.5} onChange={(event) => setScale(Number(event.target.value))} step={0.1} type="range" value={scale} />
        <label className="mt-4 block text-xs text-slate-400">Material</label>
        <input className="mt-2 h-10 w-full" onChange={(event) => setMaterial(event.target.value)} type="color" value={material} />
        <button className="mt-5 w-full rounded-lg bg-orange-400 px-3 py-2 text-sm font-semibold text-black" onClick={saveScene} type="button">
          Save scene
        </button>
      </aside>
    </div>
  );
}

function AudacityStyleApp({ onSaveFile }: { onSaveFile: (file: FileDraft) => string }) {
  const [tracks, setTracks] = useState([
    { gain: 72, id: 1, mute: false, name: "Voice" },
    { gain: 48, id: 2, mute: false, name: "Music bed" },
  ]);
  const project = JSON.stringify(tracks, null, 2);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101827] text-white">
      <div className="flex shrink-0 items-center gap-2 border-b border-white/10 bg-[#182235] p-2">
        <button className="rounded-lg bg-red-500 px-3 py-2 text-xs font-semibold text-white" onClick={() => setTracks((items) => [...items, { gain: 55, id: Date.now(), mute: false, name: `Track ${items.length + 1}` }])} type="button">
          Record track
        </button>
        <button className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black" onClick={() => onSaveFile({ content: project, kind: "file", location: "Desktop", mimeType: "application/json", modified: "Now", name: "audacity-project.json", size: "2 KB" })} type="button">
          Save project
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tracks.map((track) => (
          <div className="mb-3 rounded-xl border border-white/10 bg-white/[0.04] p-3" key={track.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{track.name}</p>
              <button className={cn("rounded-md px-2 py-1 text-xs", track.mute ? "bg-amber-300 text-black" : "bg-white/10")} onClick={() => setTracks((items) => items.map((item) => item.id === track.id ? { ...item, mute: !item.mute } : item))} type="button">
                {track.mute ? "Muted" : "Mute"}
              </button>
            </div>
            <div className="mt-3 flex h-20 items-center gap-1 overflow-hidden rounded-lg bg-black/35 px-2">
              {Array.from({ length: 56 }, (_, index) => (
                <span
                  className="w-1 rounded-full bg-cyan-300"
                  key={index}
                  style={{ height: `${8 + Math.abs(Math.sin(index * 0.55 + track.id)) * track.gain}%`, opacity: track.mute ? 0.25 : 1 }}
                />
              ))}
            </div>
            <label className="mt-3 flex items-center gap-3 text-xs text-slate-400">
              Gain
              <input className="flex-1" max={100} min={0} onChange={(event) => setTracks((items) => items.map((item) => item.id === track.id ? { ...item, gain: Number(event.target.value) } : item))} type="range" value={track.gain} />
              {track.gain}%
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThunderbirdStyleApp() {
  const [selected, setSelected] = useState(0);
  const [draft, setDraft] = useState("Thanks for the update. I will review this and follow up shortly.");
  const messages = [
    { from: "team@veil.local", subject: "Cloud runner status", body: "All remote browser workers are healthy and accepting sessions." },
    { from: "friend@example.com", subject: "Site access test", body: "I tried the site from another device. Please make sure it is reachable from the public URL or LAN address." },
    { from: "ops@veil.local", subject: "Security summary", body: "Invite keys remain one-account only. Audit logs are enabled." },
  ];
  const message = messages[selected];

  return (
    <div className="grid h-full min-h-0 bg-[#111827] text-white md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-[#182235] p-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">inbox</p>
        <div className="mt-3 space-y-2">
          {messages.map((item, index) => (
            <button className={cn("w-full rounded-lg px-3 py-3 text-left text-sm", selected === index ? "bg-blue-400 text-black" : "bg-white/[0.06] text-slate-300")} key={item.subject} onClick={() => setSelected(index)} type="button">
              <span className="block truncate font-semibold">{item.subject}</span>
              <span className="block truncate text-xs opacity-70">{item.from}</span>
            </button>
          ))}
        </div>
      </aside>
      <main className="flex min-h-0 flex-col">
        <div className="border-b border-white/10 p-4">
          <p className="text-xl font-semibold">{message.subject}</p>
          <p className="mt-1 text-sm text-slate-400">{message.from}</p>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 text-sm leading-7 text-slate-200">
          {message.body}
        </div>
        <div className="border-t border-white/10 p-3">
          <textarea className="h-24 w-full rounded-lg border border-white/10 bg-black/30 p-3 text-sm outline-none" onChange={(event) => setDraft(event.target.value)} value={draft} />
          <div className="mt-2 flex justify-end">
            <button className="rounded-lg bg-blue-400 px-4 py-2 text-sm font-semibold text-black" type="button">
              Send
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function TransmissionStyleApp() {
  const [items, setItems] = useState([
    { down: "4.2 MB/s", id: 1, name: "debian-live.iso", progress: 68, status: "Downloading" },
    { down: "0 KB/s", id: 2, name: "browser-worker-image.tar", progress: 100, status: "Seeding" },
  ]);
  const [draft, setDraft] = useState("https://example.com/file.iso");

  useEffect(() => {
    const timer = window.setInterval(() => {
      setItems((current) =>
        current.map((item) =>
          item.progress >= 100
            ? item
            : { ...item, progress: Math.min(100, item.progress + 1), status: item.progress + 1 >= 100 ? "Complete" : item.status },
        ),
      );
    }, 1400);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f6f7f9] text-[#20242a]">
      <form className="flex shrink-0 gap-2 border-b border-black/10 bg-white p-3" onSubmit={(event) => { event.preventDefault(); setItems((current) => [{ down: "Waiting", id: Date.now(), name: draft.split("/").pop() || "download", progress: 0, status: "Queued" }, ...current]); }}>
        <input className="min-h-10 min-w-0 flex-1 rounded-lg border border-black/10 px-3 text-sm outline-none" onChange={(event) => setDraft(event.target.value)} value={draft} />
        <button className="rounded-lg bg-[#2f6fed] px-4 text-sm font-semibold text-white" type="submit">Add</button>
      </form>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {items.map((item) => (
          <div className="mb-3 rounded-xl border border-black/10 bg-white p-4 shadow-sm" key={item.id}>
            <div className="flex items-center justify-between gap-3">
              <p className="font-semibold">{item.name}</p>
              <span className="text-xs text-slate-500">{item.status}</span>
            </div>
            <div className="mt-3 h-2 rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#2f6fed]" style={{ width: `${item.progress}%` }} />
            </div>
            <div className="mt-2 flex justify-between text-xs text-slate-500">
              <span>{item.progress}%</span>
              <span>{item.down}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SteamStyleApp() {
  const games = [
    { genre: "Builder", name: "Cloud Colony", progress: 74 },
    { genre: "Puzzle", name: "Packet Runner", progress: 42 },
    { genre: "Arcade", name: "Neon Drift", progress: 91 },
  ];
  const [active, setActive] = useState(games[0].name);

  return (
    <div className="grid h-full min-h-0 bg-[#0d1520] text-white md:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-[#101b2a] p-3">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">library</p>
        <div className="mt-3 space-y-2">
          {games.map((game) => (
            <button className={cn("w-full rounded-lg px-3 py-3 text-left", active === game.name ? "bg-cyan-300 text-black" : "bg-white/[0.06] text-slate-300")} key={game.name} onClick={() => setActive(game.name)} type="button">
              <span className="block font-semibold">{game.name}</span>
              <span className="text-xs opacity-70">{game.genre}</span>
            </button>
          ))}
        </div>
      </aside>
      <main className="min-h-0 overflow-y-auto p-5">
        {games.filter((game) => game.name === active).map((game) => (
          <div key={game.name}>
            <div className="rounded-2xl bg-[radial-gradient(circle_at_18%_18%,rgba(34,211,238,0.35),transparent_34%),linear-gradient(135deg,#172554,#020617)] p-8">
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-200">{game.genre}</p>
              <h2 className="mt-3 text-4xl font-semibold">{game.name}</h2>
              <button className="mt-6 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-black" type="button">
                Play
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.05] p-4">
              <div className="flex justify-between text-sm">
                <span>Achievements</span>
                <span>{game.progress}%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: `${game.progress}%` }} />
              </div>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

const vscodeThemes = {
  "One Dark": {
    accent: "#528bff",
    bg: "#282c34",
    editor: "#282c34",
    line: "#4b5263",
    sidebar: "#21252b",
    text: "#abb2bf",
  },
  "GitHub Dark": {
    accent: "#58a6ff",
    bg: "#0d1117",
    editor: "#0d1117",
    line: "#484f58",
    sidebar: "#161b22",
    text: "#c9d1d9",
  },
  Monokai: {
    accent: "#66d9e8",
    bg: "#272822",
    editor: "#272822",
    line: "#75715e",
    sidebar: "#1e1f1c",
    text: "#f8f8f2",
  },
};

const languageColors: Record<string, string> = {
  css: "#563d7c",
  html: "#e34c26",
  js: "#f7df1e",
  json: "#facc15",
  jsx: "#61dafb",
  md: "#60a5fa",
  py: "#3572a5",
  sh: "#89e051",
  ts: "#3178c6",
  tsx: "#61dafb",
  txt: "#9a9996",
};

function fileExt(name: string) {
  return name.includes(".") ? name.split(".").pop()?.toLowerCase() ?? "txt" : "txt";
}

function languageColor(name: string) {
  return languageColors[fileExt(name)] ?? "#9a9996";
}

function vscodeEscapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightVscodeCode(value: string, ext: string) {
  let output = vscodeEscapeHtml(value);
  if (["js", "jsx", "ts", "tsx"].includes(ext)) {
    output = output
      .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|async|await|new|this|null|undefined|true|false|try|catch|finally|throw)\b/g, '<span style="color:#c678dd">$1</span>')
      .replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span style="color:#98c379">$1</span>')
      .replace(/(\/\/[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>')
      .replace(/\b(\d+)\b/g, '<span style="color:#d19a66">$1</span>');
  }
  if (ext === "py") {
    output = output
      .replace(/\b(def|class|import|from|return|if|elif|else|for|while|True|False|None|print|try|except)\b/g, '<span style="color:#c678dd">$1</span>')
      .replace(/(#[^\n]*)/g, '<span style="color:#5c6370;font-style:italic">$1</span>');
  }
  if (ext === "json") {
    output = output
      .replace(/("[^"]+"):/g, '<span style="color:#e06c75">$1</span>:')
      .replace(/\b(true|false|null)\b/g, '<span style="color:#d19a66">$1</span>');
  }
  return output;
}

function runCodeSnippet(content: string, ext: string) {
  const output: string[] = [];
  const log = (...values: unknown[]) => output.push(values.map(String).join(" "));

  if (["js", "jsx", "ts", "tsx"].includes(ext)) {
    try {
      Function("console", `"use strict";\n${content}`)({
        error: log,
        info: log,
        log,
        warn: log,
      });
      return output.length ? output : ["(completed with no output)"];
    } catch (error) {
      return [`Error: ${error instanceof Error ? error.message : String(error)}`];
    }
  }

  if (ext === "py") {
    content.split("\n").forEach((line) => {
      const match = line.match(/^\s*print\((.*)\)\s*$/);
      if (match) {
        output.push(match[1].replace(/^['"]|['"]$/g, ""));
      }
    });
    return output.length ? output : ["Python simulation completed with no output."];
  }

  if (ext === "sh") {
    return content
      .split("\n")
      .filter((line) => line.trim() && !line.trim().startsWith("#"))
      .map((line) => `$ ${line.trim()}`);
  }

  return [`Cannot run .${ext} files. Supported: js, ts, py, sh.`];
}

function VSCodeStyleApp({
  files,
  onSaveFile,
  onUpdateFile,
}: {
  files: FileSystemItem[];
  onSaveFile: (file: FileDraft) => string;
  onUpdateFile: (id: string, patch: Partial<FileSystemItem>) => void;
}) {
  const editableFiles = files.filter(
    (file) => file.kind === "file" && filePreviewType(file) === "text",
  );
  const [themeName, setThemeName] = useState<keyof typeof vscodeThemes>("One Dark");
  const theme = vscodeThemes[themeName];
  const [sidebar, setSidebar] = useState<"explorer" | "search" | "git" | "extensions">("explorer");
  const [showSidebar, setShowSidebar] = useState(true);
  const [openIds, setOpenIds] = useState<string[]>(
    editableFiles[0]?.id ? [editableFiles[0].id] : [],
  );
  const [activeId, setActiveId] = useState(editableFiles[0]?.id ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [modified, setModified] = useState<Record<string, boolean>>({});
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "VS Code terminal ready. Commands: help, ls, cat <file>, run, new <name>, clear",
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newFileName, setNewFileName] = useState("");
  const activeFile = editableFiles.find((file) => file.id === activeId);
  const openFiles = openIds
    .map((id) => editableFiles.find((file) => file.id === id))
    .filter((file): file is FileSystemItem => Boolean(file));
  const content = activeFile ? drafts[activeFile.id] ?? activeFile.content ?? "" : "";
  const ext = activeFile ? fileExt(activeFile.name) : "txt";
  const canRun = ["js", "jsx", "ts", "tsx", "py", "sh"].includes(ext);
  const grouped = fileLocations.map((location) => ({
    files: editableFiles.filter((file) => (file.location ?? "Home") === location),
    location,
  }));
  const searchResults = searchQuery
    ? editableFiles.filter((file) =>
        `${file.name} ${file.content ?? ""}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()),
      )
    : [];

  const openFile = (id: string) => {
    setOpenIds((items) => (items.includes(id) ? items : [...items, id]));
    setActiveId(id);
  };

  const closeFile = (id: string) => {
    setOpenIds((items) => {
      const next = items.filter((item) => item !== id);
      if (activeId === id) {
        setActiveId(next[next.length - 1] ?? "");
      }
      return next;
    });
  };

  const saveActive = () => {
    if (!activeFile) {
      return;
    }
    onUpdateFile(activeFile.id, {
      content,
      modified: "Now",
      size: `${Math.max(1, Math.round(content.length / 1024))} KB`,
    });
    setModified((items) => ({ ...items, [activeFile.id]: false }));
    setTerminalLines((items) => [...items, `Saved ${activeFile.name}`]);
  };

  const createFile = () => {
    const name = newFileName.trim() || "untitled.js";
    const id = onSaveFile({
      content: "",
      kind: "file",
      location: "Home",
      mimeType: name.endsWith(".json") ? "application/json" : "text/plain",
      modified: "Now",
      name,
      size: "1 KB",
    });
    setNewFileName("");
    setOpenIds((items) => [...items, id]);
    setActiveId(id);
  };

  const runActive = () => {
    if (!activeFile) {
      return;
    }
    setTerminalOpen(true);
    setTerminalLines((items) => [
      ...items,
      `$ run ${activeFile.name}`,
      ...runCodeSnippet(content, ext),
    ]);
  };

  const runTerminal = () => {
    const command = terminalInput.trim();
    if (!command) {
      return;
    }
    setTerminalInput("");
    if (command === "clear") {
      setTerminalLines([]);
      return;
    }
    if (command === "help") {
      setTerminalLines((items) => [...items, "$ help", "Commands: help, ls, cat <file>, run, new <name>, clear"]);
      return;
    }
    if (command === "ls") {
      setTerminalLines((items) => [...items, "$ ls", ...editableFiles.map((file) => file.name)]);
      return;
    }
    if (command.startsWith("cat ")) {
      const name = command.replace("cat ", "");
      const file = editableFiles.find((item) => item.name === name);
      setTerminalLines((items) => [...items, `$ ${command}`, file?.content ?? "File not found"]);
      return;
    }
    if (command.startsWith("new ")) {
      const name = command.replace("new ", "").trim();
      if (name) {
        const id = onSaveFile({
          content: "",
          kind: "file",
          location: "Home",
          mimeType: "text/plain",
          modified: "Now",
          name,
          size: "1 KB",
        });
        setOpenIds((items) => [...items, id]);
        setActiveId(id);
      }
      return;
    }
    if (command === "run") {
      runActive();
      return;
    }
    setTerminalLines((items) => [...items, `$ ${command}`, "Command not found"]);
  };

  return (
    <div
      className="flex h-full min-h-0 flex-col text-sm"
      style={{ background: theme.bg, color: theme.text }}
    >
      <div className="flex h-8 shrink-0 items-center border-b border-white/10 bg-[#3c3c3c]">
        {["File", "Edit", "View", "Run", "Terminal", "Help"].map((item) => (
          <button
            className="h-full px-3 text-xs text-slate-200 transition hover:bg-white/10"
            key={item}
            onClick={item === "Run" ? runActive : item === "Terminal" ? () => setTerminalOpen((value) => !value) : undefined}
            type="button"
          >
            {item}
          </button>
        ))}
        <div className="ml-auto flex h-full items-center gap-1 pr-2">
          <select
            className="h-6 rounded bg-black/25 px-2 text-xs text-white outline-none"
            onChange={(event) => setThemeName(event.target.value as keyof typeof vscodeThemes)}
            value={themeName}
          >
            {Object.keys(vscodeThemes).map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button className="grid size-7 place-items-center rounded hover:bg-white/10" onClick={saveActive} title="Save" type="button">
            <Save className="size-4" />
          </button>
          <button
            className="grid size-7 place-items-center rounded hover:bg-white/10 disabled:opacity-35"
            disabled={!canRun}
            onClick={runActive}
            title="Run"
            type="button"
          >
            <Play className="size-4" />
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-11 shrink-0 flex-col items-center gap-2 bg-[#333] py-2">
          {[
            { icon: Folder, id: "explorer", label: "Explorer" },
            { icon: Search, id: "search", label: "Search" },
            { icon: GitBranch, id: "git", label: "Source Control" },
            { icon: Package, id: "extensions", label: "Extensions" },
          ].map((item) => (
            <button
              className={cn(
                "grid size-9 place-items-center rounded text-slate-400 transition hover:bg-white/10 hover:text-white",
                showSidebar && sidebar === item.id && "border-l-2 border-white text-white",
              )}
              key={item.id}
              onClick={() => {
                setShowSidebar(sidebar !== item.id || !showSidebar);
                setSidebar(item.id as typeof sidebar);
              }}
              title={item.label}
              type="button"
            >
              <item.icon className="size-5" />
            </button>
          ))}
          <button className="mt-auto grid size-9 place-items-center rounded text-slate-400 hover:bg-white/10 hover:text-white" type="button">
            <Settings className="size-5" />
          </button>
        </div>

        {showSidebar && (
          <aside
            className="flex w-64 shrink-0 flex-col border-r border-white/10"
            style={{ background: theme.sidebar }}
          >
            <div className="flex h-9 items-center justify-between px-3 text-[11px] uppercase tracking-widest text-slate-400">
              <span>{sidebar}</span>
              {sidebar === "explorer" && (
                <div className="flex gap-1">
                  <button className="grid size-6 place-items-center rounded hover:bg-white/10" onClick={createFile} type="button">
                    <FilePlus className="size-4" />
                  </button>
                  <button className="grid size-6 place-items-center rounded hover:bg-white/10" type="button">
                    <FolderPlus className="size-4" />
                  </button>
                </div>
              )}
            </div>
            {sidebar === "explorer" && (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex gap-1 p-2">
                  <input
                    className="min-w-0 flex-1 rounded bg-black/25 px-2 py-1 text-xs outline-none"
                    onChange={(event) => setNewFileName(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        createFile();
                      }
                    }}
                    placeholder="new-file.js"
                    value={newFileName}
                  />
                  <button className="rounded bg-white px-2 text-xs font-semibold text-black" onClick={createFile} type="button">
                    New
                  </button>
                </div>
                <p className="px-3 py-1 text-[11px] uppercase text-slate-500">Open editors</p>
                {openFiles.map((file) => (
                  <button
                    className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-white/10", activeId === file.id && "bg-white/10 text-white")}
                    key={file.id}
                    onClick={() => setActiveId(file.id)}
                    type="button"
                  >
                    <span className="size-2 rounded-full" style={{ background: languageColor(file.name) }} />
                    <span className="min-w-0 flex-1 truncate">{file.name}</span>
                    {modified[file.id] && <span className="text-amber-300">*</span>}
                    <X className="size-3 opacity-60" onClick={(event) => { event.stopPropagation(); closeFile(file.id); }} />
                  </button>
                ))}
                <p className="px-3 py-1 text-[11px] uppercase text-slate-500">Files</p>
                {grouped.map((group) =>
                  group.files.length ? (
                    <div key={group.location}>
                      <p className="px-3 py-1 text-[11px] text-slate-500">{group.location}</p>
                      {group.files.map((file) => (
                        <button
                          className="flex w-full items-center gap-2 px-5 py-1.5 text-left text-xs hover:bg-white/10"
                          key={file.id}
                          onClick={() => openFile(file.id)}
                          type="button"
                        >
                          <span className="size-2 rounded-full" style={{ background: languageColor(file.name) }} />
                          <span className="truncate">{file.name}</span>
                        </button>
                      ))}
                    </div>
                  ) : null,
                )}
              </div>
            )}
            {sidebar === "search" && (
              <div className="min-h-0 flex-1 overflow-y-auto p-2">
                <input
                  className="w-full rounded bg-black/25 px-2 py-2 text-xs outline-none"
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search files"
                  value={searchQuery}
                />
                <div className="mt-3 space-y-1">
                  {searchResults.map((file) => (
                    <button className="w-full rounded px-2 py-2 text-left text-xs hover:bg-white/10" key={file.id} onClick={() => openFile(file.id)} type="button">
                      <span className="block truncate text-white">{file.name}</span>
                      <span className="block truncate text-slate-500">{file.location}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {sidebar === "git" && (
              <div className="p-3 text-xs">
                <p className="text-slate-400">Branch: <span className="text-amber-300">main</span></p>
                <p className="mt-2 text-slate-400">Modified files: {Object.values(modified).filter(Boolean).length}</p>
              </div>
            )}
            {sidebar === "extensions" && (
              <div className="space-y-2 p-3 text-xs">
                {["ESLint", "Prettier", "Tailwind CSS", "Python", "GitLens"].map((item) => (
                  <div className="rounded bg-white/[0.06] p-2" key={item}>
                    <p className="font-semibold text-white">{item}</p>
                    <p className="text-slate-500">Installed</p>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-9 shrink-0 overflow-x-auto border-b border-white/10 bg-[#252526]">
            {openFiles.map((file) => (
              <button
                className={cn("flex min-w-28 max-w-52 items-center gap-2 border-t-2 px-3 text-left text-xs", activeId === file.id ? "border-[var(--vscode-accent)] bg-black/20 text-white" : "border-transparent text-slate-400 hover:bg-white/5")}
                key={file.id}
                onClick={() => setActiveId(file.id)}
                style={{ "--vscode-accent": theme.accent } as CSSProperties}
                type="button"
              >
                <span className="size-2 rounded-full" style={{ background: languageColor(file.name) }} />
                <span className="min-w-0 flex-1 truncate">{file.name}</span>
                {modified[file.id] && <span className="text-amber-300">*</span>}
                <X className="size-3 opacity-60" onClick={(event) => { event.stopPropagation(); closeFile(file.id); }} />
              </button>
            ))}
          </div>

          {activeFile ? (
            <div className="relative flex min-h-0 flex-1 overflow-hidden font-mono text-[13px]" style={{ background: theme.editor }}>
              <div className="w-12 shrink-0 overflow-hidden py-3 pr-2 text-right text-xs leading-6" style={{ color: theme.line }}>
                {content.split("\n").map((_, index) => (
                  <div key={`${activeFile.id}-line-${index}`}>{index + 1}</div>
                ))}
              </div>
              <div className="relative min-w-0 flex-1">
                <pre
                  className="pointer-events-none absolute inset-0 overflow-auto p-3 leading-6"
                  dangerouslySetInnerHTML={{ __html: `${highlightVscodeCode(content, ext)}\n` }}
                />
                <textarea
                  className="absolute inset-0 resize-none overflow-auto bg-transparent p-3 font-mono leading-6 text-transparent caret-white outline-none"
                  onChange={(event) => {
                    setDrafts((items) => ({ ...items, [activeFile.id]: event.target.value }));
                    setModified((items) => ({ ...items, [activeFile.id]: true }));
                  }}
                  spellCheck={false}
                  value={content}
                />
              </div>
            </div>
          ) : (
            <div className="grid min-h-0 flex-1 place-items-center text-center text-slate-500">
              <div>
                <Code2 className="mx-auto size-16 opacity-70" />
                <p className="mt-4 text-lg text-slate-300">Open or create a file</p>
              </div>
            </div>
          )}

          {terminalOpen && (
            <div className="flex h-48 shrink-0 flex-col border-t border-white/10 bg-[#1e1e1e]">
              <div className="flex h-8 items-center gap-2 border-b border-white/10 px-3 text-xs text-slate-400">
                <TerminalSquare className="size-4" />
                TERMINAL
                <button className="ml-auto rounded px-2 py-1 hover:bg-white/10" onClick={() => setTerminalLines([])} type="button">Clear</button>
                <button className="rounded px-2 py-1 hover:bg-white/10" onClick={() => setTerminalOpen(false)} type="button">Close</button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-2 font-mono text-xs leading-5">
                {terminalLines.map((line, index) => (
                  <div className={line.startsWith("Error") ? "text-rose-300" : "text-slate-300"} key={`${line}-${index}`}>{line}</div>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-white/10 px-2 py-1 font-mono text-xs">
                <span className="text-emerald-300">~/workspace $</span>
                <input
                  className="min-w-0 flex-1 bg-transparent text-white outline-none"
                  onChange={(event) => setTerminalInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      runTerminal();
                    }
                  }}
                  value={terminalInput}
                />
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="flex h-6 shrink-0 items-center gap-3 px-3 text-[11px] text-white" style={{ background: theme.accent }}>
        <GitBranch className="size-3" />
        <span>main</span>
        <span className="ml-auto">{activeFile ? `${activeFile.name} · ${ext.toUpperCase()} · ${content.split("\n").length} lines` : "No file"}</span>
        <button className="flex items-center gap-1" onClick={() => setTerminalOpen((value) => !value)} type="button">
          <TerminalSquare className="size-3" />
          Terminal
        </button>
      </div>
    </div>
  );
}

function TextEditorApp({
  codeMode,
  files,
  onSaveFile,
  onUpdateFile,
}: {
  codeMode: boolean;
  files: FileSystemItem[];
  onSaveFile: (file: FileDraft) => string;
  onUpdateFile: (id: string, patch: Partial<FileSystemItem>) => void;
}) {
  const editableFiles = files.filter(
    (file) => file.kind === "file" && filePreviewType(file) === "text",
  );
  const [selectedId, setSelectedId] = useState(editableFiles[0]?.id ?? "");
  const selectedFile =
    editableFiles.find((file) => file.id === selectedId) ?? editableFiles[0];
  const [content, setContent] = useState(selectedFile?.content ?? "");
  const [output, setOutput] = useState<string[]>([
    codeMode ? "JavaScript runner ready." : "Notepad autosave ready.",
  ]);

  useEffect(() => {
    const timeout = window.setTimeout(
      () => setContent(selectedFile?.content ?? ""),
      0,
    );
    return () => window.clearTimeout(timeout);
  }, [selectedFile?.content, selectedFile?.id]);

  const save = () => {
    if (!selectedFile) {
      return;
    }

    onUpdateFile(selectedFile.id, {
      content,
      modified: "Now",
      size: `${Math.max(1, Math.round(content.length / 1024))} KB`,
    });
    setOutput((items) => [`Saved ${selectedFile.name}`, ...items].slice(0, 12));
  };

  const saveAs = () => {
    const extension = selectedFile?.name.includes(".")
      ? selectedFile.name.slice(selectedFile.name.lastIndexOf("."))
      : codeMode
        ? ".js"
        : ".txt";
    const baseName = selectedFile?.name.replace(/\.[^.]+$/, "") || (codeMode ? "script" : "note");
    const name = `${baseName} copy${extension}`;
    const id = onSaveFile({
      name,
      kind: "file",
      content,
      mimeType: codeMode ? "text/javascript" : "text/plain",
      modified: "Now",
      size: `${Math.max(1, Math.round(content.length / 1024))} KB`,
    });
    setSelectedId(id);
    setOutput((items) => [`Saved as ${name}`, ...items].slice(0, 12));
  };

  const download = () => {
    if (!selectedFile) {
      return;
    }
    downloadWorkspaceFile({
      ...selectedFile,
      content,
      name: selectedFile.name,
      size: `${Math.max(1, Math.round(content.length / 1024))} KB`,
    });
  };

  const runCode = () => {
    const logs: string[] = [];
    const runnerConsole = {
      error: (...values: unknown[]) => logs.push(`error: ${values.map(String).join(" ")}`),
      log: (...values: unknown[]) => logs.push(values.map(String).join(" ")),
      warn: (...values: unknown[]) => logs.push(`warn: ${values.map(String).join(" ")}`),
    };

    try {
      const result = Function(
        "console",
        `"use strict";\n${content}`,
      )(runnerConsole);
      if (result !== undefined) {
        logs.push(`return: ${String(result)}`);
      }
      setOutput([`> node ${selectedFile?.name ?? "scratch.js"}`, ...(logs.length ? logs : ["completed without output"])]);
    } catch (error) {
      setOutput([
        `> node ${selectedFile?.name ?? "scratch.js"}`,
        error instanceof Error ? error.message : String(error),
      ]);
    }
  };

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 bg-white/[0.035] p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          {codeMode ? "code files" : "notes"}
        </p>
        <div className="mt-4 space-y-2">
          {editableFiles.map((file) => (
            <button
              className={cn(
                "w-full rounded-2xl px-3 py-3 text-left text-sm transition",
                selectedFile?.id === file.id
                  ? "bg-white text-black"
                  : "bg-white/[0.06] text-slate-300 hover:bg-white/10 hover:text-white",
              )}
              key={file.id}
              onClick={() => setSelectedId(file.id)}
              type="button"
            >
              <span className="block truncate font-semibold">{file.name}</span>
              <span className="mt-1 block text-xs opacity-60">{file.size}</span>
            </button>
          ))}
        </div>
      </aside>
      <section className="flex min-h-0 flex-col">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 p-4">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              {codeMode ? "code editor" : "notepad"}
            </p>
            <h2 className="truncate text-xl font-semibold">
              {selectedFile?.name ?? "No file selected"}
            </h2>
          </div>
          <div className="flex gap-2">
            {codeMode && (
              <button
                className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100"
                disabled={!selectedFile}
                onClick={runCode}
                type="button"
              >
                Run
              </button>
            )}
            <button
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200"
              disabled={!selectedFile}
              onClick={saveAs}
              type="button"
            >
              Save as
            </button>
            <button
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-slate-200"
              disabled={!selectedFile}
              onClick={download}
              type="button"
            >
              Download
            </button>
            <button
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
              disabled={!selectedFile}
              onClick={save}
              type="button"
            >
              Save
            </button>
          </div>
        </div>
        <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)]">
          <textarea
            className="min-h-[320px] resize-none bg-[#050505] p-5 font-mono text-sm leading-6 text-slate-100 outline-none"
            onChange={(event) => setContent(event.target.value)}
            spellCheck={!codeMode}
            value={content}
          />
          <div className="grid min-h-0 border-l border-white/10 lg:grid-rows-[minmax(0,1fr)_220px]">
            <div className="min-h-0 overflow-auto bg-[#090b10] p-5">
              <p className="mb-3 text-xs uppercase tracking-[0.22em] text-slate-500">
                {codeMode ? "syntax preview" : "formatted preview"}
              </p>
              <pre
                className="min-h-full whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/35 p-4 font-mono text-sm leading-6 text-slate-200"
                dangerouslySetInnerHTML={{
                  __html: codeMode ? highlightCode(content) : escapeHtml(content),
                }}
              />
            </div>
            <div className="min-h-0 overflow-y-auto border-t border-white/10 bg-black p-4 font-mono text-xs leading-6 text-emerald-100">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-slate-500">terminal</span>
                <button
                  className="rounded-lg border border-white/10 px-2 py-1 text-[11px] text-slate-300"
                  onClick={() => setOutput(["Terminal cleared."])}
                  type="button"
                >
                  clear
                </button>
              </div>
              {output.map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightCode(value: string) {
  return escapeHtml(value)
    .replace(
      /\b(const|let|var|function|return|if|else|for|while|class|new|try|catch|await|async|import|export|from|type|interface)\b/g,
      '<span class="text-sky-300">$1</span>',
    )
    .replace(
      /\b(true|false|null|undefined|console|Math|Date|Array|Object|String|Number)\b/g,
      '<span class="text-violet-300">$1</span>',
    )
    .replace(/(".*?"|'.*?'|`.*?`)/g, '<span class="text-emerald-300">$1</span>')
    .replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="text-amber-300">$1</span>')
    .replace(/(\/\/.*)$/gm, '<span class="text-slate-500">$1</span>');
}

function CalculatorApp() {
  const [expression, setExpression] = useState("");
  const [result, setResult] = useState("0");
  const [memory, setMemory] = useState(0);
  const [history, setHistory] = useState<Array<{ expression: string; result: string }>>([]);
  const keys = [
    "sin",
    "cos",
    "tan",
    "sqrt",
    "7",
    "8",
    "9",
    "/",
    "4",
    "5",
    "6",
    "*",
    "1",
    "2",
    "3",
    "-",
    "0",
    ".",
    "=",
    "+",
  ];

  const evaluate = (value = expression) => {
    try {
      const normalized = value
        .replaceAll("pi", String(Math.PI))
        .replaceAll("e", String(Math.E));
      const nextResult = Number(Function("Math", `"use strict";return (${normalized || "0"})`)(Math));
      const formatted = Number.isFinite(nextResult)
        ? String(Math.round((nextResult + Number.EPSILON) * 1e10) / 1e10)
        : "Error";
      setResult(formatted);
      if (value.trim()) {
        setHistory((items) => [{ expression: value, result: formatted }, ...items].slice(0, 8));
      }
      return formatted;
    } catch {
      setResult("Error");
      return "Error";
    }
  };

  const wrapFunction = (fn: string) => {
    const value = expression || result || "0";
    if (fn === "sqrt") {
      setExpression(`Math.sqrt(${value})`);
      return;
    }

    setExpression(`Math.${fn}((${value}) * Math.PI / 180)`);
  };

  const press = (key: string) => {
    if (["sin", "cos", "tan", "sqrt"].includes(key)) {
      wrapFunction(key);
      return;
    }

    if (key === "=") {
      evaluate();
      return;
    }

    setExpression((value) => `${value}${key}`);
  };

  const utilityKeys: Array<{ action: () => void; label: string }> = [
    {
      action: () => {
        setExpression("");
        setResult("0");
      },
      label: "C",
    },
    { action: () => setExpression((value) => value.slice(0, -1)), label: "BACK" },
    { action: () => setExpression((value) => `${value}pi`), label: "pi" },
    { action: () => setExpression((value) => `${value}e`), label: "e" },
    { action: () => setMemory(0), label: "MC" },
    { action: () => setExpression((value) => `${value}${memory}`), label: "MR" },
    { action: () => setMemory((value) => value + Number(result || 0)), label: "M+" },
    { action: () => void navigator.clipboard?.writeText(result), label: "COPY" },
  ];

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white lg:grid-cols-[minmax(0,1fr)_190px]">
      <section className="flex min-h-0 flex-col p-5">
        <div className="rounded-3xl border border-white/10 bg-black/40 p-5 text-right">
          <p className="min-h-7 truncate font-mono text-sm text-slate-500">
            {expression || "0"}
          </p>
          <p className="mt-2 truncate font-mono text-5xl font-semibold">{result}</p>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {utilityKeys.map(({ action, label }) => (
            <button
              className="min-h-11 rounded-2xl border border-white/10 bg-white/[0.055] text-sm font-semibold text-slate-200 transition hover:bg-white hover:text-black"
              key={label}
              onClick={action}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-3 grid min-h-0 flex-1 grid-cols-4 gap-2">
          {keys.map((key) => (
            <button
              className={cn(
                "rounded-2xl border border-white/10 text-xl font-semibold transition hover:bg-white hover:text-black",
                key === "="
                  ? "bg-[var(--veil-accent)] text-black"
                  : ["sin", "cos", "tan", "sqrt"].includes(key)
                    ? "bg-sky-300/12 text-sky-100"
                    : "bg-white/[0.07] text-white",
              )}
              key={key}
              onClick={() => press(key)}
              type="button"
            >
              {key}
            </button>
          ))}
        </div>
      </section>
      <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">History</h3>
          <button
            className="rounded-xl border border-white/10 px-2 py-1 text-xs text-slate-300"
            onClick={() => setHistory([])}
            type="button"
          >
            Clear
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {history.map((item, index) => (
            <button
              className="w-full rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:bg-white hover:text-black"
              key={`${item.expression}-${index}`}
              onClick={() => {
                setExpression(item.expression);
                setResult(item.result);
              }}
              type="button"
            >
              <p className="truncate font-mono text-xs opacity-60">{item.expression}</p>
              <p className="mt-1 truncate font-mono text-sm font-semibold">{item.result}</p>
            </button>
          ))}
          {!history.length && <EmptyState text="No calculations yet." />}
        </div>
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/30 p-3">
          <p className="text-xs text-slate-500">Memory</p>
          <p className="mt-1 truncate font-mono text-lg">{memory}</p>
        </div>
      </aside>
    </div>
  );
}
function PaintApp({ onSaveFile }: { onSaveFile: (file: FileDraft) => string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const historyRef = useRef<ImageData[]>([]);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [tool, setTool] = useState<"brush" | "circle" | "eraser" | "line" | "rect" | "text">("brush");
  const [color, setColor] = useState("#111827");
  const [fillColor, setFillColor] = useState("#ffffff");
  const [brush, setBrush] = useState(8);
  const [drawing, setDrawing] = useState(false);
  const [text, setText] = useState("Text");

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const pointFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    if (!canvas || !rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const pushHistory = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    historyRef.current = [
      context.getImageData(0, 0, canvas.width, canvas.height),
      ...historyRef.current,
    ].slice(0, 20);
  };

  const drawStroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const context = canvasRef.current?.getContext("2d");
    if (!context) {
      return;
    }

    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = brush;
    context.strokeStyle = tool === "eraser" ? "#ffffff" : color;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  };

  const startDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const point = pointFromEvent(event);
    pushHistory();
    startPointRef.current = point;
    lastPointRef.current = point;
    setDrawing(true);
    event.currentTarget.setPointerCapture(event.pointerId);

    if (tool === "text") {
      const context = canvasRef.current?.getContext("2d");
      if (context) {
        context.fillStyle = color;
        context.font = `${Math.max(16, brush * 4)}px ui-sans-serif, system-ui`;
        context.fillText(text, point.x, point.y);
      }
      setDrawing(false);
    }
  };

  const moveDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !drawing || (tool !== "brush" && tool !== "eraser")) {
      return;
    }

    const point = pointFromEvent(event);
    const last = lastPointRef.current ?? point;
    drawStroke(last, point);
    lastPointRef.current = point;
  };

  const finishDraw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing) {
      return;
    }

    const context = canvasRef.current?.getContext("2d");
    const start = startPointRef.current;
    const end = pointFromEvent(event);
    setDrawing(false);

    if (!context || !start) {
      return;
    }

    context.lineWidth = brush;
    context.strokeStyle = color;
    context.fillStyle = fillColor;

    if (tool === "line") {
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    }

    if (tool === "rect") {
      const width = end.x - start.x;
      const height = end.y - start.y;
      context.fillRect(start.x, start.y, width, height);
      context.strokeRect(start.x, start.y, width, height);
    }

    if (tool === "circle") {
      const radius = Math.hypot(end.x - start.x, end.y - start.y);
      context.beginPath();
      context.arc(start.x, start.y, radius, 0, Math.PI * 2);
      context.fill();
      context.stroke();
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) {
      return;
    }

    pushHistory();
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    const [last, ...rest] = historyRef.current;
    if (!canvas || !context || !last) {
      return;
    }

    context.putImageData(last, 0, 0);
    historyRef.current = rest;
  };

  const download = () => {
    const href = canvasRef.current?.toDataURL("image/png");
    if (!href) {
      return;
    }

    const link = document.createElement("a");
    link.href = href;
    link.download = "veil-paint.png";
    link.click();
  };

  const saveToFiles = () => {
    const href = canvasRef.current?.toDataURL("image/png");
    if (!href) {
      return;
    }

    onSaveFile({
      name: `Paint ${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`,
      kind: "file",
      content: href,
      dataUrl: href,
      mimeType: "image/png",
      modified: "Now",
      size: `${Math.max(1, Math.round(href.length / 1024))} KB`,
    });
  };

  const paintTools: Array<{ id: typeof tool; icon: LucideIcon; label: string }> = [
    { id: "brush", icon: Paintbrush, label: "Brush" },
    { id: "eraser", icon: Trash2, label: "Eraser" },
    { id: "line", icon: Minus, label: "Line" },
    { id: "rect", icon: Square, label: "Rectangle" },
    { id: "circle", icon: Radio, label: "Circle" },
    { id: "text", icon: FileText, label: "Text" },
  ];

  return (
    <div className="flex h-full flex-col bg-[#08090d] text-white">
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-white/10 p-4">
        <div className="flex flex-wrap gap-2">
          {paintTools.map(({ id, icon: ToolIcon, label }) => (
            <button
              className={cn(
                "grid size-10 place-items-center rounded-2xl border transition",
                tool === id
                  ? "border-white bg-white text-black"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10",
              )}
              key={id}
              onClick={() => setTool(id)}
              title={label}
              type="button"
            >
              <ToolIcon className="size-4" />
            </button>
          ))}
        </div>
        <input
          aria-label="Stroke color"
          className="h-10 w-14 rounded-xl bg-transparent"
          onChange={(event) => setColor(event.target.value)}
          type="color"
          value={color}
        />
        <input
          aria-label="Fill color"
          className="h-10 w-14 rounded-xl bg-transparent"
          onChange={(event) => setFillColor(event.target.value)}
          type="color"
          value={fillColor}
        />
        <input
          aria-label="Brush size"
          className="accent-white"
          max={42}
          min={2}
          onChange={(event) => setBrush(Number(event.target.value))}
          type="range"
          value={brush}
        />
        <span className="font-mono text-xs text-slate-400">{brush}px</span>
        {tool === "text" && (
          <input
            className="h-10 rounded-2xl border border-white/10 bg-black/35 px-3 text-sm outline-none"
            onChange={(event) => setText(event.target.value)}
            placeholder="Text"
            value={text}
          />
        )}
        <button
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm"
          onClick={undo}
          type="button"
        >
          Undo
        </button>
        <button
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm"
          onClick={clear}
          type="button"
        >
          Clear canvas
        </button>
        <button
          className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
          onClick={saveToFiles}
          type="button"
        >
          Save to Files
        </button>
        <button
          className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm"
          onClick={download}
          type="button"
        >
          Download
        </button>
      </div>
      <canvas
        className="min-h-0 flex-1 touch-none cursor-crosshair bg-white"
        height={900}
        onPointerCancel={() => setDrawing(false)}
        onPointerDown={startDraw}
        onPointerLeave={() => setDrawing(false)}
        onPointerMove={moveDraw}
        onPointerUp={finishDraw}
        ref={canvasRef}
        width={1600}
      />
    </div>
  );
}

function PhotosApp({
  files,
  onOpenFiles,
}: {
  files: FileSystemItem[];
  onOpenFiles: () => void;
}) {
  const images = files.filter((file) => filePreviewType(file) === "image");
  const [selected, setSelected] = useState(images[0]?.id ?? "");
  const image = images.find((file) => file.id === selected) ?? images[0];

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white md:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">gallery</p>
            <h2 className="text-xl font-semibold">Photos</h2>
          </div>
          <button
            className="rounded-xl border border-white/10 px-3 py-2 text-xs text-slate-300"
            onClick={onOpenFiles}
            type="button"
          >
            Files
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {images.map((file) => (
            <button
              className={cn(
                "w-full truncate rounded-2xl border px-3 py-3 text-left text-sm hover:bg-white/10",
                image?.id === file.id
                  ? "border-white/30 bg-white/[0.12]"
                  : "border-white/10 bg-white/[0.06]",
              )}
              key={file.id}
              onClick={() => setSelected(file.id)}
              type="button"
            >
              {file.name}
            </button>
          ))}
          {images.length === 0 && (
            <p className="text-sm leading-6 text-slate-500">
              Import images in File Explorer to view them here.
            </p>
          )}
        </div>
      </aside>
      <section className="grid min-h-0 place-items-center p-5">
        {image ? (
          <div className="w-full max-w-5xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-xl font-semibold">{image.name}</h3>
                <p className="text-sm text-slate-500">
                  {image.size} / {image.modified}
                </p>
              </div>
              <button
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
                onClick={() => downloadWorkspaceFile(image)}
                type="button"
              >
                Download
              </button>
            </div>
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={image.name} className="max-h-[70vh] w-full object-contain" src={image.dataUrl ?? image.content} />
            </div>
          </div>
        ) : (
          <ImageIcon className="size-16 text-slate-700" />
        )}
      </section>
    </div>
  );
}

function TimeSuiteApp({ mode }: { mode: "calendar" | "clock" }) {
  const [now, setNow] = useState(new Date());
  const [seconds, setSeconds] = useState(300);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!running) {
      return;
    }

    const interval = window.setInterval(
      () => setSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => window.clearInterval(interval);
  }, [running]);

  if (mode === "calendar") {
    const days = Array.from({ length: 35 }, (_, index) => index + 1);
    return (
      <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
        <h2 className="text-3xl font-semibold">
          {now.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h2>
        <div className="mt-6 grid grid-cols-7 gap-2">
          {days.map((day) => (
            <button
              className={cn(
                "aspect-square rounded-2xl border border-white/10 bg-white/[0.05] text-sm",
                day === now.getDate() && "bg-white text-black",
              )}
              key={day}
              type="button"
            >
              {day <= 31 ? day : ""}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full place-items-center bg-[#08090d] p-6 text-white">
      <div className="text-center">
        <p className="font-mono text-6xl font-semibold">
          {now.toLocaleTimeString()}
        </p>
        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.06] p-6">
          <p className="font-mono text-5xl">{formatTimer(seconds)}</p>
          <div className="mt-5 flex justify-center gap-3">
            <button className="rounded-2xl bg-white px-5 py-3 text-black" onClick={() => setRunning((value) => !value)} type="button">
              {running ? "Pause" : "Start"}
            </button>
            <button className="rounded-2xl border border-white/10 px-5 py-3" onClick={() => setSeconds(300)} type="button">
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function NotesTasksApp({ mode }: { mode: "tasks" | "sticky" }) {
  const [items, setItems] = useState<
    Array<{ color: string; done: boolean; due: string; id: string; text: string }>
  >([
    {
      color: "#facc15",
      done: false,
      due: "Today",
      id: "task-1",
      text: "Polish OS shell",
    },
    {
      color: "#7dd3fc",
      done: false,
      due: "Next",
      id: "task-2",
      text: "Deploy preview",
    },
    {
      color: "#86efac",
      done: true,
      due: "Done",
      id: "task-3",
      text: "Connect cloud worker",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [due, setDue] = useState("Today");
  const [color, setColor] = useState("#facc15");
  const completed = items.filter((item) => item.done).length;

  const addItem = () => {
    const text = draft.trim();
    if (!text) {
      return;
    }

    setItems((value) => [
      { color, done: false, due, id: `item-${Date.now()}`, text },
      ...value,
    ]);
    setDraft("");
  };

  const updateItem = (
    id: string,
    patch: Partial<{ color: string; done: boolean; due: string; text: string }>,
  ) => {
    setItems((value) => value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            {mode === "tasks" ? "planner" : "notes"}
          </p>
          <h2 className="mt-2 text-3xl font-semibold">
            {mode === "tasks" ? "To Do" : "Sticky Notes"}
          </h2>
        </div>
        {mode === "tasks" && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm">
            {completed}/{items.length} complete
          </div>
        )}
      </div>
      <form
        className="mt-5 grid gap-2 md:grid-cols-[minmax(0,1fr)_120px_70px_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          addItem();
        }}
      >
        <input
          className="h-12 min-w-0 rounded-2xl border border-white/10 bg-white/[0.06] px-4 outline-none"
          onChange={(event) => setDraft(event.target.value)}
          placeholder={mode === "tasks" ? "Add task" : "Write a note"}
          value={draft}
        />
        <input
          className="h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 outline-none"
          onChange={(event) => setDue(event.target.value)}
          placeholder="Due"
          value={due}
        />
        <input
          aria-label="Note color"
          className="h-12 w-full rounded-2xl bg-transparent"
          onChange={(event) => setColor(event.target.value)}
          type="color"
          value={color}
        />
        <button className="rounded-2xl bg-white px-5 font-semibold text-black" type="submit">
          Add
        </button>
      </form>

      {mode === "tasks" ? (
        <div className="mt-5 grid gap-3">
          {items.map((item) => (
            <div
              className="grid gap-3 rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-4 md:grid-cols-[auto_minmax(0,1fr)_110px_auto]"
              key={item.id}
            >
              <input
                checked={item.done}
                className="mt-3 size-5 accent-white"
                onChange={(event) => updateItem(item.id, { done: event.target.checked })}
                type="checkbox"
              />
              <input
                className={cn(
                  "h-11 min-w-0 rounded-2xl border border-white/10 bg-black/25 px-3 outline-none",
                  item.done && "text-slate-500 line-through",
                )}
                onChange={(event) => updateItem(item.id, { text: event.target.value })}
                value={item.text}
              />
              <input
                className="h-11 rounded-2xl border border-white/10 bg-black/25 px-3 text-sm outline-none"
                onChange={(event) => updateItem(item.id, { due: event.target.value })}
                value={item.due}
              />
              <button
                className="rounded-2xl border border-white/10 px-4 text-sm text-slate-300"
                onClick={() => setItems((value) => value.filter((candidate) => candidate.id !== item.id))}
                type="button"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article
              className="min-h-48 rounded-[1.35rem] border border-black/10 p-4 text-black shadow-[0_18px_48px_rgba(0,0,0,0.28)]"
              key={item.id}
              style={{ backgroundColor: item.color }}
            >
              <textarea
                className="h-28 w-full resize-none bg-transparent text-sm leading-6 outline-none placeholder:text-black/45"
                onChange={(event) => updateItem(item.id, { text: event.target.value })}
                value={item.text}
              />
              <div className="mt-3 flex items-center justify-between gap-2">
                <input
                  aria-label="Sticky note color"
                  className="h-9 w-14 rounded-xl bg-transparent"
                  onChange={(event) => updateItem(item.id, { color: event.target.value })}
                  type="color"
                  value={item.color}
                />
                <button
                  className="rounded-xl bg-black/12 px-3 py-2 text-xs font-semibold"
                  onClick={() =>
                    setItems((value) => value.filter((candidate) => candidate.id !== item.id))
                  }
                  type="button"
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function MediaPlayerApp({ files }: { files: FileSystemItem[] }) {
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [current, setCurrent] = useState<{
    name: string;
    url: string;
    type: string;
  } | null>(null);
  const [playlist, setPlaylist] = useState<
    Array<{ name: string; url: string; type: string }>
  >([]);
  const workspaceMedia = files
    .filter((file) => filePreviewType(file) === "media")
    .map((file) => ({
      name: file.name,
      type: file.mimeType ?? (/\.(mp3|wav|ogg)$/i.test(file.name) ? "audio/webm" : "video/webm"),
      url: file.dataUrl ?? file.content ?? "",
    }))
    .filter((item) => item.url);
  const combinedPlaylist = [...workspaceMedia, ...playlist];

  const importMedia = (fileList: FileList | null) => {
    if (!fileList?.length) {
      return;
    }

    const items = Array.from(fileList)
      .filter((file) => file.type.startsWith("audio/") || file.type.startsWith("video/"))
      .map((file) => ({
        name: file.name,
        type: file.type,
        url: URL.createObjectURL(file),
      }));

    if (!items.length) {
      return;
    }

    setPlaylist((value) => [...items, ...value]);
    setCurrent(items[0]);
  };

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              media
            </p>
            <h2 className="text-2xl font-semibold">Player</h2>
          </div>
          <button
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
            onClick={() => uploadRef.current?.click()}
            type="button"
          >
            Import
          </button>
        </div>
        <input
          accept="audio/*,video/*"
          className="hidden"
          multiple
          onChange={(event) => importMedia(event.target.files)}
          ref={uploadRef}
          type="file"
        />
        <div className="mt-5 space-y-2">
          {combinedPlaylist.map((item) => (
            <button
              className={cn(
                "w-full rounded-2xl border p-3 text-left text-sm transition",
                current?.url === item.url
                  ? "border-white/30 bg-white text-black"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10",
              )}
              key={item.url}
              onClick={() => setCurrent(item)}
              type="button"
            >
              <span className="block truncate font-semibold">{item.name}</span>
              <span className="mt-1 block text-xs opacity-60">
                {item.type || "media file"}
              </span>
            </button>
          ))}
          {!combinedPlaylist.length && (
            <p className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm leading-6 text-slate-400">
              Import an audio or video file to play it here.
            </p>
          )}
        </div>
      </aside>
      <section className="grid min-h-0 place-items-center p-5">
        <div className="w-full max-w-4xl rounded-[1.5rem] border border-white/10 bg-black/45 p-5">
          {current?.type.startsWith("video/") ? (
            <video
              className="max-h-[68vh] w-full rounded-2xl bg-black"
              controls
              src={current.url}
            />
          ) : current ? (
            <div className="grid min-h-[320px] place-items-center rounded-2xl border border-white/10 bg-white/[0.04] p-6">
              <div className="w-full max-w-xl text-center">
                <Radio className="mx-auto size-16 text-white" />
                <h3 className="mt-5 truncate text-2xl font-semibold">{current.name}</h3>
                <audio className="mt-8 w-full" controls src={current.url} />
              </div>
            </div>
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-2xl border border-dashed border-white/15 text-slate-500">
              <Radio className="size-16" />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MailApp() {
  const [messages, setMessages] = useState([
    {
      id: "m1",
      from: "ops@velvet-pantry.local",
      subject: "Cloud worker health report",
      body: "All browser worker pools are ready for disposable session allocation.",
      unread: true,
    },
    {
      id: "m2",
      from: "security@velvet-pantry.local",
      subject: "Invite key claimed",
      body: "A verification key was linked to an account and stored in the audit log.",
      unread: false,
    },
  ]);
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? "");
  const [compose, setCompose] = useState({ to: "", subject: "", body: "" });
  const selected = messages.find((message) => message.id === selectedId) ?? messages[0];

  const sendMessage = () => {
    if (!compose.to.trim() || !compose.subject.trim()) {
      return;
    }

    const next = {
      id: `sent-${Date.now()}`,
      from: `you -> ${compose.to.trim()}`,
      subject: compose.subject.trim(),
      body: compose.body.trim() || "No message body.",
      unread: false,
    };
    setMessages((value) => [next, ...value]);
    setSelectedId(next.id);
    setCompose({ to: "", subject: "", body: "" });
  };

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white lg:grid-cols-[280px_minmax(0,1fr)_320px]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3">
          <Inbox className="size-5" />
          <h2 className="text-xl font-semibold">Inbox</h2>
        </div>
        <div className="space-y-2">
          {messages.map((message) => (
            <button
              className={cn(
                "w-full rounded-2xl border p-3 text-left transition",
                selected?.id === message.id
                  ? "border-white/30 bg-white text-black"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10",
              )}
              key={message.id}
              onClick={() => {
                setSelectedId(message.id);
                setMessages((items) =>
                  items.map((item) =>
                    item.id === message.id ? { ...item, unread: false } : item,
                  ),
                );
              }}
              type="button"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-semibold">{message.subject}</span>
                {message.unread && <span className="size-2 rounded-full bg-emerald-300" />}
              </div>
              <p className="mt-1 truncate text-xs opacity-60">{message.from}</p>
            </button>
          ))}
        </div>
      </aside>
      <section className="min-h-0 overflow-y-auto p-6">
        {selected ? (
          <article className="mx-auto max-w-3xl">
            <p className="text-sm text-slate-500">{selected.from}</p>
            <h2 className="mt-2 text-3xl font-semibold">{selected.subject}</h2>
            <p className="mt-6 rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-5 leading-7 text-slate-200">
              {selected.body}
            </p>
          </article>
        ) : (
          <EmptyState text="Select a message." />
        )}
      </section>
      <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-4">
        <h3 className="text-xl font-semibold">Compose</h3>
        <input
          className="mt-4 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 outline-none"
          onChange={(event) => setCompose((value) => ({ ...value, to: event.target.value }))}
          placeholder="To"
          value={compose.to}
        />
        <input
          className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 outline-none"
          onChange={(event) =>
            setCompose((value) => ({ ...value, subject: event.target.value }))
          }
          placeholder="Subject"
          value={compose.subject}
        />
        <textarea
          className="mt-3 h-48 w-full resize-none rounded-2xl border border-white/10 bg-black/35 p-4 outline-none"
          onChange={(event) => setCompose((value) => ({ ...value, body: event.target.value }))}
          placeholder="Message"
          value={compose.body}
        />
        <button
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-white text-sm font-semibold text-black"
          onClick={sendMessage}
          type="button"
        >
          <Send className="size-4" />
          Send draft
        </button>
      </aside>
    </div>
  );
}

function WeatherApp() {
  const [city, setCity] = useState("New York");
  const [unit, setUnit] = useState<"F" | "C">("F");
  const base = city
    .split("")
    .reduce((total, letter) => total + letter.charCodeAt(0), 0);
  const tempF = 58 + (base % 31);
  const temp = unit === "F" ? tempF : Math.round((tempF - 32) * (5 / 9));
  const forecast = ["Now", "1 PM", "3 PM", "5 PM", "Tonight"].map((label, index) => ({
    label,
    temp: temp + index - 2,
    condition: ["Clear", "Breezy", "Clouds", "Light rain", "Clear"][index],
  }));

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              weather
            </p>
            <h2 className="mt-2 text-4xl font-semibold">{city}</h2>
          </div>
          <div className="flex gap-2">
            <input
              className="h-11 rounded-2xl border border-white/10 bg-white/[0.06] px-4 outline-none"
              onChange={(event) => setCity(event.target.value || "Local")}
              placeholder="City"
              value={city}
            />
            <button
              className="h-11 rounded-2xl bg-white px-4 text-sm font-semibold text-black"
              onClick={() => setUnit((value) => (value === "F" ? "C" : "F"))}
              type="button"
            >
              {unit}
            </button>
          </div>
        </div>
        <section className="mt-6 rounded-[1.7rem] border border-white/10 bg-white/[0.055] p-6">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <CloudSun className="size-16 text-white" />
              <p className="mt-5 font-mono text-7xl font-semibold">{temp}°</p>
              <p className="mt-2 text-slate-400">Feels private, fast, and breezy.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {["Humidity 42%", "Wind 8 mph", "UV 3"].map((metric) => (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4" key={metric}>
                  <p className="text-sm text-slate-300">{metric}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="mt-5 grid gap-3 sm:grid-cols-5">
          {forecast.map((item) => (
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4" key={item.label}>
              <p className="text-sm text-slate-400">{item.label}</p>
              <p className="mt-3 font-mono text-3xl font-semibold">{item.temp}°</p>
              <p className="mt-2 text-sm text-slate-300">{item.condition}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapsApp() {
  const locations = [
    { name: "New York", lat: 40.7128, lon: -74.006 },
    { name: "San Francisco", lat: 37.7749, lon: -122.4194 },
    { name: "London", lat: 51.5072, lon: -0.1276 },
    { name: "Tokyo", lat: 35.6762, lon: 139.6503 },
  ];
  const [selected, setSelected] = useState(locations[0]);
  const delta = 0.06;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${selected.lon - delta}%2C${selected.lat - delta}%2C${selected.lon + delta}%2C${selected.lat + delta}&layer=mapnik&marker=${selected.lat}%2C${selected.lon}`;

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="min-h-0 overflow-y-auto border-r border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3">
          <MapPin className="size-5" />
          <h2 className="text-xl font-semibold">Maps</h2>
        </div>
        <div className="space-y-2">
          {locations.map((location) => (
            <button
              className={cn(
                "w-full rounded-2xl border p-3 text-left text-sm transition",
                selected.name === location.name
                  ? "border-white/30 bg-white text-black"
                  : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10",
              )}
              key={location.name}
              onClick={() => setSelected(location)}
              type="button"
            >
              <span className="block font-semibold">{location.name}</span>
              <span className="mt-1 block font-mono text-xs opacity-60">
                {location.lat.toFixed(3)}, {location.lon.toFixed(3)}
              </span>
            </button>
          ))}
        </div>
      </aside>
      <section className="min-h-0">
        <iframe className="h-full w-full bg-white" src={src} title={`Map of ${selected.name}`} />
      </section>
    </div>
  );
}

function SecurityCenterApp() {
  const [settings, setSettings] = useState([
    { label: "Invite-key sign in", enabled: true },
    { label: "Disposable session cleanup", enabled: true },
    { label: "Iframe permission lockdown", enabled: true },
    { label: "Audit event logging", enabled: true },
  ]);
  const [events, setEvents] = useState(["Security Center opened", "All checks green"]);

  const toggle = (label: string) => {
    setSettings((items) =>
      items.map((item) =>
        item.label === label ? { ...item, enabled: !item.enabled } : item,
      ),
    );
    setEvents((items) => [`${nowTime()} toggled ${label}`, ...items].slice(0, 8));
  };

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-emerald-300 text-black">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              security
            </p>
            <h2 className="text-3xl font-semibold">Lockdown Center</h2>
          </div>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.8fr]">
          <section className="grid gap-3">
            {settings.map((item) => (
              <button
                className="flex items-center justify-between gap-4 rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-4 text-left"
                key={item.label}
                onClick={() => toggle(item.label)}
                type="button"
              >
                <span>
                  <span className="block font-semibold">{item.label}</span>
                  <span className="mt-1 block text-sm text-slate-500">
                    Click to toggle this protection layer.
                  </span>
                </span>
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-semibold",
                    item.enabled
                      ? "bg-emerald-300 text-black"
                      : "bg-white/10 text-slate-300",
                  )}
                >
                  {item.enabled ? "On" : "Off"}
                </span>
              </button>
            ))}
          </section>
          <section className="rounded-[1.35rem] border border-white/10 bg-black/35 p-4">
            <h3 className="text-xl font-semibold">Audit log</h3>
            <div className="mt-4 space-y-2 font-mono text-xs text-slate-400">
              {events.map((event) => (
                <p className="rounded-xl bg-white/[0.05] px-3 py-2" key={event}>
                  {event}
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function NetworkApp() {
  const [latency, setLatency] = useState<number | null>(null);
  const [status, setStatus] = useState("Idle");
  const [publicIp, setPublicIp] = useState("Checking...");
  const [dnsTime, setDnsTime] = useState<number | null>(null);
  const connection =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & {
          connection?: {
            downlink?: number;
            effectiveType?: string;
            rtt?: number;
            saveData?: boolean;
            type?: string;
          };
        }).connection;

  useEffect(() => {
    void fetch("https://api.ipify.org?format=json", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ ip?: string }>)
      .then((payload) => setPublicIp(payload.ip ?? "Unavailable"))
      .catch(() => setPublicIp("Unavailable"));
  }, []);

  const testNetwork = async () => {
    const started = performance.now();
    setStatus("Testing");
    try {
      await fetch("/api/admin/health", { cache: "no-store" });
      setLatency(Math.round(performance.now() - started));
      setStatus("Online");
    } catch {
      setStatus("Request failed");
    }

    const dnsStarted = performance.now();
    try {
      await fetch("https://cloudflare-dns.com/dns-query?name=example.com&type=A", {
        cache: "no-store",
        headers: { accept: "application/dns-json" },
      });
      setDnsTime(Math.round(performance.now() - dnsStarted));
    } catch {
      setDnsTime(null);
    }
  };

  const openWifiSettings = () => {
    window.location.href = "ms-settings:network-wifi";
  };

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              network
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Connection Center</h2>
          </div>
          <button
            className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black"
            onClick={() => void testNetwork()}
            type="button"
          >
            Run test
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Browser", typeof navigator !== "undefined" && navigator.onLine ? "Online" : "Offline"],
            ["API", status],
            ["Latency", latency === null ? "--" : `${latency} ms`],
            ["DNS test", dnsTime === null ? "--" : `${dnsTime} ms`],
            ["Public IP", publicIp],
            ["Link", connection?.effectiveType ?? "Browser hidden"],
            ["Downlink", connection?.downlink ? `${connection.downlink} Mbps` : "Unknown"],
            ["RTT", connection?.rtt ? `${connection.rtt} ms` : "Unknown"],
          ].map(([label, value]) => (
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-5" key={label}>
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-3 break-words font-mono text-xl font-semibold">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-black/35 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-semibold">Adapters</h3>
            <button
              className="rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:bg-white hover:text-black"
              onClick={openWifiSettings}
              type="button"
            >
              Open OS Wi-Fi settings
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: Wifi,
                label: "Wi-Fi",
                value:
                  connection?.type === "wifi"
                    ? "Wi-Fi link reported"
                    : "SSID hidden by browser",
              },
              {
                icon: Bluetooth,
                label: "Bluetooth",
                value: "Native adapter access blocked",
              },
              {
                icon: Cloud,
                label: "Cloud relay",
                value: status === "Online" ? "Reachable" : "Run test",
              },
            ].map((item) => (
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4" key={item.label}>
                <item.icon className="size-5" />
                <p className="mt-3 font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-slate-500">{item.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-xs leading-5 text-slate-400">
            Browsers do not expose Wi-Fi network names or allow switching networks
            from a website. The button above asks Windows to open its Wi-Fi panel
            when the browser permits protocol links.
          </p>
        </div>
      </div>
    </div>
  );
}

function StoreApp({ onOpenApp }: { onOpenApp: (id: OsAppId) => void }) {
  const featured = osApps.filter((app) =>
    [
      "paint",
      "media",
      "camera",
      "recorder",
      "code",
      "vm",
      "maps",
      "weather",
      "libreoffice",
      "gimp",
      "vlc",
      "blender",
      "inkscape",
      "audacity",
      "thunderbird",
      "transmission",
      "steam",
      "firefox",
    ].includes(app.id),
  );
  const [installed, setInstalled] = useState<Record<string, boolean>>({
    camera: true,
    media: true,
    paint: true,
  });

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">store</p>
        <h2 className="mt-2 text-4xl font-semibold">App Store</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featured.map((app) => {
            const isInstalled = installed[app.id];
            return (
              <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-5" key={app.id}>
                <div className="flex items-center gap-3">
                  <div className="grid size-12 place-items-center rounded-2xl bg-white text-black">
                    <app.icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{app.title}</h3>
                    <p className="truncate text-sm text-slate-500">{app.subtitle}</p>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <button
                    className="flex-1 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
                    onClick={() =>
                      isInstalled
                        ? onOpenApp(app.id)
                        : setInstalled((value) => ({ ...value, [app.id]: true }))
                    }
                    type="button"
                  >
                    {isInstalled ? "Open" : "Install"}
                  </button>
                  {isInstalled && (
                    <button
                      className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-300"
                      onClick={() => setInstalled((value) => ({ ...value, [app.id]: false }))}
                      type="button"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type RecorderMode = "audio" | "camera" | "screen";

function RecorderApp({ onSaveFile }: { onSaveFile: (file: FileDraft) => string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [mode, setMode] = useState<RecorderMode>("audio");
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [permissionReady, setPermissionReady] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [clips, setClips] = useState<
    Array<{ createdAt: string; kind: RecorderMode; name: string; url: string }>
  >([]);
  const [error, setError] = useState("");

  const modeOptions: Array<{
    detail: string;
    icon: LucideIcon;
    id: RecorderMode;
    label: string;
  }> = [
    { detail: "Microphone only", icon: Mic, id: "audio", label: "Audio" },
    { detail: "Camera and microphone", icon: Camera, id: "camera", label: "Video" },
    { detail: "Screen capture", icon: MonitorUp, id: "screen", label: "Screen" },
  ];

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setPermissionReady(false);
  };

  useEffect(() => {
    if (!recording) {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recording]);

  useEffect(
    () => () => {
      if (recorderRef.current && recorderRef.current.state !== "inactive") {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  const requestPermission = async () => {
    setError("");
    setPermissionReady(false);
    stopTracks();

    if (!navigator.mediaDevices) {
      setError("Media devices are unavailable in this browser context.");
      return null;
    }

    try {
      const stream =
        mode === "screen"
          ? await navigator.mediaDevices.getDisplayMedia({
              audio: true,
              video: true,
            })
          : await navigator.mediaDevices.getUserMedia({
              audio: true,
              video:
                mode === "camera"
                  ? {
                      facingMode: "user",
                      frameRate: { ideal: 30 },
                      height: { ideal: 720 },
                      width: { ideal: 1280 },
                    }
                  : false,
            });

      streamRef.current = stream;
      if (videoRef.current && mode !== "audio") {
        videoRef.current.srcObject = stream;
      }
      setPermissionReady(true);
      return stream;
    } catch (permissionError) {
      setError(
        permissionError instanceof Error
          ? permissionError.message
          : "Permission was blocked or the device is unavailable.",
      );
      return null;
    }
  };

  const start = async () => {
    setError("");
    const stream = streamRef.current ?? (await requestPermission());
    if (!stream) {
      return;
    }

    try {
      chunksRef.current = [];
      const mimeCandidates =
        mode === "audio"
          ? ["audio/webm;codecs=opus", "audio/webm"]
          : ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
      const mimeType =
        mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate)) ?? "";
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mimeType || (mode === "audio" ? "audio/webm" : "video/webm"),
        });
        const name = `${mode === "audio" ? "Audio" : mode === "screen" ? "Screen" : "Video"} ${new Date()
          .toISOString()
          .slice(0, 19)
          .replace(/[:T]/g, "-")}.webm`;
        setClips((value) => [
          {
            createdAt: new Date().toLocaleTimeString([], {
              hour: "numeric",
              minute: "2-digit",
            }),
            kind: mode,
            name,
            url: URL.createObjectURL(blob),
          },
          ...value,
        ]);
        const reader = new FileReader();
        reader.onload = () => {
          onSaveFile({
            name,
            kind: "file",
            content: String(reader.result ?? ""),
            dataUrl: String(reader.result ?? ""),
            mimeType: mode === "audio" ? "audio/webm" : "video/webm",
            modified: "Now",
            size: `${Math.max(1, Math.round(blob.size / 1024))} KB`,
          });
        };
        reader.readAsDataURL(blob);
        setElapsed(0);
        setPaused(false);
      };

      recorder.start();
      recorderRef.current = recorder;
      setRecording(true);
    } catch (recordError) {
      setError(recordError instanceof Error ? recordError.message : "Recording could not start.");
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    stopTracks();
    setRecording(false);
    setPaused(false);
  };

  const togglePause = () => {
    const recorder = recorderRef.current;
    if (!recorder) {
      return;
    }

    if (recorder.state === "recording") {
      recorder.pause();
      setPaused(true);
    } else if (recorder.state === "paused") {
      recorder.resume();
      setPaused(false);
    }
  };

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-0 flex-col p-5">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">recorder</p>
            <h2 className="text-3xl font-semibold">Studio Recorder</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {modeOptions.map((option) => (
              <button
                aria-pressed={mode === option.id}
                className={cn(
                  "flex h-11 items-center gap-2 rounded-2xl border px-3 text-sm transition",
                  mode === option.id
                    ? "border-white bg-white text-black"
                    : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/10",
                )}
                disabled={recording}
                key={option.id}
                onClick={() => {
                  setMode(option.id);
                  stopTracks();
                }}
                type="button"
              >
                <option.icon className="size-4" />
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid min-h-0 flex-1 place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
          {mode === "audio" ? (
            <div className="text-center">
              <div
                className={cn(
                  "mx-auto grid size-36 place-items-center rounded-full border",
                  recording
                    ? "border-rose-300/50 bg-rose-300/15 text-rose-200 shadow-[0_0_70px_rgba(251,113,133,0.25)]"
                    : "border-white/10 bg-white/[0.06] text-white",
                )}
              >
                <Mic className="size-16" />
              </div>
              <p className="mt-5 font-mono text-4xl font-semibold">
                {formatTimer(elapsed)}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {permissionReady
                  ? "Microphone is ready."
                  : "Press Allow device to trigger the browser permission popup."}
              </p>
            </div>
          ) : (
            <div className="relative h-full w-full">
              <video
                autoPlay
                className="h-full w-full object-contain"
                muted
                playsInline
                ref={videoRef}
              />
              {!permissionReady && (
                <div className="absolute inset-0 grid place-items-center bg-black">
                  <div className="max-w-sm text-center">
                    {mode === "screen" ? (
                      <MonitorUp className="mx-auto size-16 text-slate-400" />
                    ) : (
                      <Camera className="mx-auto size-16 text-slate-400" />
                    )}
                    <p className="mt-4 text-sm leading-6 text-slate-400">
                      Press Allow device and choose the camera, microphone, or screen
                      source in the native browser popup.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex shrink-0 flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-slate-400">
            {modeOptions.find((option) => option.id === mode)?.detail}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200"
              disabled={recording}
              onClick={() => void requestPermission()}
              type="button"
            >
              Allow device
            </button>
            {recording && (
              <button
                className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-slate-200"
                onClick={togglePause}
                type="button"
              >
                {paused ? "Resume" : "Pause"}
              </button>
            )}
            <button
              className={cn(
                "flex items-center gap-2 rounded-2xl px-5 py-2 text-sm font-semibold",
                recording ? "bg-rose-300 text-black" : "bg-white text-black",
              )}
              onClick={() => (recording ? stop() : void start())}
              type="button"
            >
              {recording ? <Pause className="size-4" /> : <Play className="size-4" />}
              {recording ? "Stop" : "Record"}
            </button>
          </div>
        </div>
        {error && (
          <p className="mt-3 rounded-2xl border border-rose-300/20 bg-rose-300/10 px-3 py-2 text-sm text-rose-100">
            {error}
          </p>
        )}
      </section>
      <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-4">
        <h3 className="text-xl font-semibold">Recordings</h3>
        <div className="mt-4 space-y-3">
          {clips.map((clip) => (
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4" key={clip.url}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{clip.name}</p>
                  <p className="text-xs text-slate-500">{clip.createdAt}</p>
                </div>
                <a
                  className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-black"
                  download={`${clip.name.toLowerCase().replaceAll(" ", "-")}.webm`}
                  href={clip.url}
                >
                  <Download className="size-4" />
                </a>
              </div>
              {clip.kind === "audio" ? (
                <audio className="w-full" controls src={clip.url} />
              ) : (
                <video className="max-h-44 w-full rounded-xl bg-black" controls src={clip.url} />
              )}
            </div>
          ))}
          {!clips.length && <EmptyState text="No recordings yet." />}
        </div>
      </aside>
    </div>
  );
}

function CameraApp({ onSaveFile }: { onSaveFile: (file: FileDraft) => string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [active, setActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("user");
  const [grid, setGrid] = useState(true);
  const [mirror, setMirror] = useState(true);
  const [timer, setTimer] = useState<0 | 3 | 5>(0);
  const [countdown, setCountdown] = useState(0);
  const [photos, setPhotos] = useState<Array<{ name: string; url: string }>>([]);
  const [error, setError] = useState("");

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setActive(false);
  };

  const startCamera = async (requestedFacingMode = facingMode) => {
    setError("");
    stopCamera();

    if (!navigator.mediaDevices) {
      setError("Camera APIs are unavailable in this browser context.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: requestedFacingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setActive(true);
    } catch (permissionError) {
      setError(
        permissionError instanceof Error
          ? permissionError.message
          : "Camera permission was blocked or no camera is available.",
      );
    }
  };

  const captureNow = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!video || !canvas || !context) {
      return;
    }

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    if (mirror && facingMode === "user") {
      context.translate(canvas.width, 0);
      context.scale(-1, 1);
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/png");
    const name = `Camera ${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.png`;
    onSaveFile({
      name,
      kind: "file",
      content: dataUrl,
      dataUrl,
      mimeType: "image/png",
      modified: "Now",
      size: `${Math.max(1, Math.round(dataUrl.length / 1024))} KB`,
    });
    setPhotos((value) => [{ name, url: dataUrl }, ...value]);
  };

  const capture = () => {
    if (!timer) {
      captureNow();
      return;
    }

    setCountdown(timer);
    let next = timer;
    const interval = window.setInterval(() => {
      next -= 1;
      setCountdown(next);
      if (next <= 0) {
        window.clearInterval(interval);
        captureNow();
      }
    }, 1000);
  };

  const switchCamera = () => {
    const nextFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextFacingMode);
    if (active) {
      void startCamera(nextFacingMode);
    }
  };

  useEffect(() => () => stopCamera(), []);

  return (
    <div className="grid h-full min-h-0 bg-[#08090d] text-white lg:grid-cols-[minmax(0,1fr)_260px]">
      <section className="flex min-h-0 flex-col p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">camera</p>
            <h2 className="text-3xl font-semibold">Camera</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black"
              onClick={() => (active ? stopCamera() : void startCamera())}
              type="button"
            >
              {active ? "Stop" : "Start"}
            </button>
            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200 disabled:opacity-40"
              disabled={!active}
              onClick={capture}
              type="button"
            >
              Capture
            </button>
            <button
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-slate-200"
              onClick={switchCamera}
              type="button"
            >
              Switch
            </button>
          </div>
        </div>
        <div className="relative grid min-h-0 flex-1 place-items-center overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
          <video
            autoPlay
            className={cn(
              "h-full w-full object-contain",
              mirror && facingMode === "user" && "-scale-x-100",
            )}
            muted
            playsInline
            ref={videoRef}
          />
          {grid && active && (
            <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, index) => (
                <span className="border border-white/10" key={index} />
              ))}
            </div>
          )}
          {countdown > 0 && (
            <div className="absolute grid size-28 place-items-center rounded-full border border-white/20 bg-black/70 font-mono text-5xl font-semibold">
              {countdown}
            </div>
          )}
          {!active && (
            <div className="absolute inset-0 grid place-items-center bg-black text-center text-slate-500">
              <div className="max-w-sm p-6">
                <Camera className="mx-auto size-16" />
                <p className="mt-3 text-sm leading-6">
                  Press Start, then allow camera access in the browser popup to
                  preview video and capture photos.
                </p>
              </div>
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            aria-pressed={grid}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm",
              grid ? "border-white bg-white text-black" : "border-white/10 text-slate-200",
            )}
            onClick={() => setGrid((value) => !value)}
            type="button"
          >
            Grid
          </button>
          <button
            aria-pressed={mirror}
            className={cn(
              "rounded-2xl border px-4 py-2 text-sm",
              mirror ? "border-white bg-white text-black" : "border-white/10 text-slate-200",
            )}
            onClick={() => setMirror((value) => !value)}
            type="button"
          >
            Mirror
          </button>
          {[0, 3, 5].map((value) => (
            <button
              aria-pressed={timer === value}
              className={cn(
                "rounded-2xl border px-4 py-2 text-sm",
                timer === value
                  ? "border-white bg-white text-black"
                  : "border-white/10 text-slate-200",
              )}
              key={value}
              onClick={() => setTimer(value as 0 | 3 | 5)}
              type="button"
            >
              {value ? `${value}s` : "No timer"}
            </button>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-rose-200">{error}</p>}
        <canvas className="hidden" ref={canvasRef} />
      </section>
      <aside className="min-h-0 overflow-y-auto border-l border-white/10 p-4">
        <h3 className="text-xl font-semibold">Captures</h3>
        <div className="mt-4 grid gap-3">
          {photos.map((photo, index) => (
            <a
              className="overflow-hidden rounded-2xl border border-white/10 bg-white"
              download={photo.name}
              href={photo.url}
              key={`${photo.name}-${index}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={photo.name} className="w-full object-cover" src={photo.url} />
            </a>
          ))}
          {!photos.length && <EmptyState text="No photos captured yet." />}
        </div>
      </aside>
    </div>
  );
}

function ControlPanelApp({
  accent,
  brightness,
  onAccent,
  onBrightness,
  onVolume,
  volume,
}: {
  accent: string;
  brightness: number;
  onAccent: (value: string) => void;
  onBrightness: (value: number) => void;
  onVolume: (value: number) => void;
  volume: number;
}) {
  const [toggles, setToggles] = useState({
    bluetooth: true,
    focus: false,
    storage: true,
  });

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">control panel</p>
        <h2 className="mt-2 text-4xl font-semibold">System Controls</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {[
            {
              detail: "Controls all media elements inside VeilOS.",
              icon: Volume2,
              label: "Volume",
              min: 0,
              set: onVolume,
              value: volume,
            },
            {
              detail: "Applies a real display dimmer over the whole OS workspace.",
              icon: MonitorUp,
              label: "Brightness",
              min: 35,
              set: onBrightness,
              value: brightness,
            },
          ].map((item) => (
            <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-5" key={item.label}>
              <div className="mb-4 flex items-center gap-3">
                <item.icon className="size-5" />
                <h3 className="text-xl font-semibold">{item.label}</h3>
              </div>
              <input
                className="w-full accent-white"
                max={100}
                min={item.min}
                onChange={(event) => item.set(Number(event.target.value))}
                type="range"
                value={item.value}
              />
              <p className="mt-3 font-mono text-2xl">{item.value}%</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{item.detail}</p>
            </section>
          ))}
          <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-5">
            <h3 className="text-xl font-semibold">Quick toggles</h3>
            <div className="mt-4 grid gap-2">
              {Object.entries(toggles).map(([key, value]) => (
                <button
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/30 p-3 capitalize"
                  key={key}
                  onClick={() => setToggles((items) => ({ ...items, [key]: !value }))}
                  type="button"
                >
                  {key}
                  <span className={cn("rounded-full px-3 py-1 text-xs", value ? "bg-white text-black" : "bg-white/10 text-slate-300")}>
                    {value ? "On" : "Off"}
                  </span>
                </button>
              ))}
            </div>
          </section>
          <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.055] p-5">
            <h3 className="text-xl font-semibold">Accent color</h3>
            <input
              aria-label="Accent color"
              className="mt-4 h-14 w-full rounded-2xl bg-transparent"
              onChange={(event) => onAccent(event.target.value)}
              type="color"
              value={accent}
            />
          </section>
        </div>
      </div>
    </div>
  );
}

function UtilityApp({ appId }: { appId: OsAppId }) {
  const app = osApps.find((item) => item.id === appId);
  const [enabled, setEnabled] = useState(true);
  const [draft, setDraft] = useState("");
  const Icon = app?.icon ?? Square;

  if (appId === "maps") {
    return (
      <div className="flex h-full flex-col bg-[#08090d] text-white">
        <div className="shrink-0 border-b border-white/10 p-4">
          <h2 className="text-2xl font-semibold">Maps</h2>
          <p className="mt-1 text-sm text-slate-400">OpenStreetMap preview.</p>
        </div>
        <iframe className="min-h-0 flex-1 bg-white" src="https://www.openstreetmap.org/export/embed.html?bbox=-74.02%2C40.70%2C-73.93%2C40.78&layer=mapnik" title="Map viewer" />
      </div>
    );
  }

  if (appId === "mail") {
    return (
      <div className="grid h-full min-h-0 bg-[#08090d] text-white md:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-r border-white/10 p-4">
          {["Inbox", "Drafts", "Sent", "Archive"].map((folder) => (
            <button className="mb-2 w-full rounded-2xl bg-white/[0.06] px-3 py-3 text-left text-sm" key={folder} type="button">
              {folder}
            </button>
          ))}
        </aside>
        <section className="flex min-h-0 flex-col p-5">
          <h2 className="text-2xl font-semibold">New message</h2>
          <input className="mt-4 h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 outline-none" placeholder="To" />
          <input className="mt-3 h-12 rounded-2xl border border-white/10 bg-white/[0.06] px-4 outline-none" placeholder="Subject" />
          <textarea className="mt-3 min-h-0 flex-1 resize-none rounded-2xl border border-white/10 bg-black/40 p-4 outline-none" onChange={(event) => setDraft(event.target.value)} placeholder="Draft email" value={draft} />
        </section>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="flex items-center gap-4">
        <div className="grid size-14 place-items-center rounded-2xl bg-white text-black">
          <Icon className="size-6" />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
            system app
          </p>
          <h2 className="text-3xl font-semibold">{app?.title}</h2>
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <button
          className={cn(
            "rounded-3xl border p-5 text-left transition",
            enabled
              ? "border-white/20 bg-white text-black"
              : "border-white/10 bg-white/[0.06] text-white",
          )}
          onClick={() => setEnabled((value) => !value)}
          type="button"
        >
          <p className="text-lg font-semibold">{enabled ? "Enabled" : "Disabled"}</p>
          <p className="mt-2 text-sm opacity-70">Toggle this app state.</p>
        </button>
        <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5">
          <p className="text-lg font-semibold">Custom value</p>
          <input
            className="mt-4 h-12 w-full rounded-2xl border border-white/10 bg-black/40 px-4 outline-none"
            onChange={(event) => setDraft(event.target.value)}
            placeholder={`Change ${app?.title}`}
            value={draft}
          />
        </div>
      </div>
    </div>
  );
}

function OsTerminal({
  lines,
  onOpenApp,
  onRun,
}: {
  lines: string[];
  onOpenApp: (id: OsAppId) => void;
  onRun: (command: string) => void;
}) {
  const [command, setCommand] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRun(command);
    setCommand("");
  };

  return (
    <div className="flex h-full flex-col bg-black text-emerald-100">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 bg-white/[0.04] px-4 py-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/70">
            shell
          </p>
          <h2 className="text-lg font-semibold text-white">VeilOS Terminal</h2>
        </div>
        <div className="flex gap-2">
          {(["browser", "files", "vm"] as OsAppId[]).map((app) => (
            <button
              className="rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-slate-200 transition hover:bg-white hover:text-black"
              key={app}
              onClick={() => onOpenApp(app)}
              type="button"
            >
              open {app}
            </button>
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-5 font-mono text-xs leading-6">
        {lines.map((line, index) => (
          <p key={`${line}-${index}`}>{line}</p>
        ))}
      </div>
      <form
        className="flex shrink-0 items-center gap-2 border-t border-white/10 p-4"
        onSubmit={submit}
      >
        <span className="font-mono text-xs text-slate-500">veil$</span>
        <input
          className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 font-mono text-sm text-white outline-none"
          onChange={(event) => setCommand(event.target.value)}
          placeholder="help"
          value={command}
        />
        <button
          className="h-11 rounded-xl bg-white px-4 text-sm font-semibold text-black"
          type="submit"
        >
          Run
        </button>
      </form>
    </div>
  );
}

function FilesApp({
  files,
  onCreateFile,
  onDeleteFile,
  onImportFiles,
  onSaveFile,
  selectedFileId,
  onUpdateFile,
}: {
  files: FileSystemItem[];
  onCreateFile: () => void;
  onDeleteFile: (id: string) => void;
  onImportFiles: (files: FileSystemItem[]) => void;
  onSaveFile: (file: FileDraft) => string;
  selectedFileId: string;
  onUpdateFile: (id: string, patch: Partial<FileSystemItem>) => void;
}) {
  const [selectedId, setSelectedId] = useState(files[0]?.id ?? "");
  const [activeLocation, setActiveLocation] = useState<FileLocation>("Home");
  const [dragging, setDragging] = useState(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const selectedFile = files.find((file) => file.id === selectedId) ?? files[0];
  const [draftName, setDraftName] = useState(selectedFile?.name ?? "");
  const [draftContent, setDraftContent] = useState(selectedFile?.content ?? "");

  useEffect(() => {
    if (!selectedFile) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setDraftName(selectedFile.name);
      setDraftContent(selectedFile.content ?? "");
    }, 0);
    return () => window.clearTimeout(timeout);
  }, [selectedFile]);

  useEffect(() => {
    if (selectedFileId) {
      const timeout = window.setTimeout(() => setSelectedId(selectedFileId), 0);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [selectedFileId]);

  const selectedType = filePreviewType(selectedFile);
  const saveSelected = () => {
    if (!selectedFile || selectedFile.kind === "folder") {
      return;
    }

    onUpdateFile(selectedFile.id, {
      content: draftContent,
      modified: "Now",
      name: draftName || selectedFile.name,
      size: `${Math.max(1, Math.round(draftContent.length / 1024))} KB`,
    });
  };

  const visibleFiles = files.filter((file) => {
    if (activeLocation === "Home") {
      return true;
    }

    return (file.location ?? "Desktop") === activeLocation;
  });

  const importFiles = async (fileList: FileList | null, location = activeLocation) => {
    if (!fileList?.length) {
      return;
    }

    const nextFiles = await Promise.all(
      Array.from(fileList).map(async (file) => {
        const dataUrl = file.type.startsWith("image/") || file.type.startsWith("audio/") || file.type.startsWith("video/")
          ? await readBrowserFile(file, "dataUrl")
          : undefined;
        const content = file.type.startsWith("text/") || /\.(obj|txt|md|json|js|ts|tsx|css|html)$/i.test(file.name)
          ? await readBrowserFile(file, "text")
          : "";

        return {
          id: `import-${file.name}-${file.lastModified}`,
          name: file.name,
          kind: "file" as const,
          content,
          dataUrl,
          location: location === "Home" ? "Desktop" : location,
          mimeType: file.type || undefined,
          modified: "Now",
          size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
        };
      }),
    );

    onImportFiles(nextFiles);
    setSelectedId(nextFiles[0]?.id ?? selectedId);
  };

  const moveFileToLocation = (id: string, location: FileLocation) => {
    if (location === "Home") {
      return;
    }

    onUpdateFile(id, { location, modified: "Now" });
    setActiveLocation(location);
    setSelectedId(id);
  };

  const handleDrop = (event: React.DragEvent<HTMLElement>, location = activeLocation) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    const fileId = event.dataTransfer.getData("text/veil-file-id");
    if (fileId) {
      moveFileToLocation(fileId, location);
      return;
    }

    void importFiles(event.dataTransfer.files, location);
  };

  const duplicateSelected = () => {
    if (!selectedFile || selectedFile.kind === "folder") {
      return;
    }

    const extension = selectedFile.name.includes(".")
      ? selectedFile.name.slice(selectedFile.name.lastIndexOf("."))
      : "";
    const baseName = extension
      ? selectedFile.name.slice(0, -extension.length)
      : selectedFile.name;
    const id = onSaveFile({
      ...selectedFile,
      id: undefined,
      name: `${baseName} copy${extension}`,
      modified: "Now",
    });
    setSelectedId(id);
  };

  return (
    <div
      className={cn(
        "grid h-full min-h-0 bg-[#08090d] text-white md:grid-cols-[240px_minmax(0,1fr)]",
        dragging && "outline outline-2 outline-white/35",
      )}
      onDragEnter={() => setDragging(true)}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) {
          setDragging(false);
        }
      }}
      onDrop={handleDrop}
    >
      <aside className="hidden min-h-0 overflow-y-auto border-r border-white/10 bg-white/[0.035] p-4 md:block">
        <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
          locations
        </p>
        <div className="mt-4 space-y-2">
          {fileLocations.map(
            (location) => {
              const count =
                location === "Home"
                  ? files.length
                  : files.filter((file) => (file.location ?? "Desktop") === location).length;
              return (
              <button
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-2xl px-3 py-3 text-left text-sm transition hover:bg-white/10 hover:text-white",
                  activeLocation === location
                    ? "bg-white text-black"
                    : "text-slate-300",
                )}
                key={location}
                onClick={() => setActiveLocation(location)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, location)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Folder className="size-4" />
                  <span className="truncate">{location}</span>
                </span>
                <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px]">
                  {count}
                </span>
              </button>
            );},
          )}
        </div>
        <div className="mt-4 rounded-2xl border border-dashed border-white/15 bg-black/25 p-4 text-sm leading-6 text-slate-400">
          Drag files here from your computer, or drag workspace files onto a
          location.
        </div>
      </aside>
      <section className="flex min-h-0 flex-col">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              files
            </p>
            <h2 className="text-2xl font-semibold">Workspace</h2>
            <p className="mt-1 text-sm text-slate-500">{activeLocation}</p>
          </div>
          <button
            className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-slate-200"
            onClick={() => {
              if (activeLocation === "Home") {
                onCreateFile();
                return;
              }

              const id = onSaveFile({
                name: `New Note ${files.length + 1}.txt`,
                kind: "file",
                content: "",
                location: activeLocation,
                mimeType: "text/plain",
                modified: "Now",
                size: "1 KB",
              });
              setSelectedId(id);
            }}
            type="button"
          >
            New file
          </button>
          <button
            className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white transition hover:bg-white hover:text-black"
            onClick={() => uploadRef.current?.click()}
            type="button"
          >
            Import
          </button>
          <input
            className="hidden"
            multiple
            onChange={(event) => void importFiles(event.target.files)}
            ref={uploadRef}
            type="file"
          />
        </div>
        <div className="grid min-h-0 flex-1 md:grid-cols-[270px_minmax(0,1fr)]">
          <div className="min-h-0 overflow-y-auto p-5">
            <div className="grid gap-3">
              {visibleFiles.map((file) => (
                <button
                  className={cn(
                    "rounded-2xl border p-3 text-left transition",
                    selectedFile?.id === file.id
                      ? "border-white/28 bg-white/[0.12]"
                      : "border-white/10 bg-white/[0.055] hover:bg-white/[0.09]",
                  )}
                  key={file.id}
                  draggable={file.kind === "file"}
                  onDragStart={(event) => {
                    event.dataTransfer.setData("text/veil-file-id", file.id);
                    event.dataTransfer.effectAllowed = "move";
                  }}
                  onClick={() => setSelectedId(file.id)}
                  type="button"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-black">
                      {file.kind === "folder" ? (
                        <Folder className="size-5" />
                      ) : filePreviewType(file) === "image" ? (
                        <ImageIcon className="size-5" />
                      ) : filePreviewType(file) === "model" ? (
                        <Boxes className="size-5" />
                      ) : (
                        <FileText className="size-5" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">
                        {file.name}
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        {file.size} / {file.modified} / {file.location ?? "Desktop"}
                      </span>
                    </span>
                  </div>
                </button>
              ))}
              {!visibleFiles.length && (
                <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.035] p-5 text-sm leading-6 text-slate-500">
                  Drop files into {activeLocation} or import them with the
                  button above.
                </div>
              )}
            </div>
          </div>
          <aside className="min-h-0 overflow-y-auto border-l border-white/10 bg-black/24 p-5">
            {selectedFile ? (
              <>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="grid size-14 place-items-center rounded-2xl bg-white text-black">
                    {selectedFile.kind === "folder" ? (
                      <Folder className="size-6" />
                    ) : selectedType === "image" ? (
                      <ImageIcon className="size-6" />
                    ) : selectedType === "model" ? (
                      <Boxes className="size-6" />
                    ) : (
                      <FileText className="size-6" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className="sr-only" htmlFor="file-name">
                      File name
                    </label>
                    <input
                      className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm font-semibold text-white outline-none"
                      disabled={selectedFile.kind === "folder"}
                      id="file-name"
                      onChange={(event) => setDraftName(event.target.value)}
                      value={draftName}
                    />
                  </div>
                </div>
                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Type</dt>
                    <dd className="capitalize text-slate-200">{selectedType}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Size</dt>
                    <dd className="text-slate-200">{selectedFile.size}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Modified</dt>
                    <dd className="text-slate-200">{selectedFile.modified}</dd>
                  </div>
                </dl>
                <div className="mt-5">
                  {selectedType === "image" && (
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        alt={selectedFile.name}
                        className="max-h-80 w-full object-contain"
                        src={selectedFile.dataUrl ?? selectedFile.content}
                      />
                    </div>
                  )}
                  {selectedType === "media" && (
                    <div className="rounded-2xl border border-white/10 bg-black p-4">
                      {selectedFile.mimeType?.startsWith("audio/") ? (
                        <audio className="w-full" controls src={selectedFile.dataUrl ?? selectedFile.content} />
                      ) : (
                        <video
                          className="max-h-80 w-full rounded-xl bg-black"
                          controls
                          src={selectedFile.dataUrl ?? selectedFile.content}
                        />
                      )}
                    </div>
                  )}
                  {selectedType === "model" && (
                    <ModelPreview fileName={selectedFile.name} source={selectedFile.content ?? ""} />
                  )}
                  {selectedType === "text" && (
                    <textarea
                      className="h-80 w-full resize-none rounded-2xl border border-white/10 bg-[#050505] p-4 font-mono text-sm leading-6 text-slate-100 outline-none"
                      onChange={(event) => setDraftContent(event.target.value)}
                      spellCheck={false}
                      value={draftContent}
                    />
                  )}
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button
                    className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-slate-200"
                    onClick={saveSelected}
                    type="button"
                  >
                    Save changes
                  </button>
                  <button
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-200"
                    disabled={selectedFile.kind === "folder"}
                    onClick={() => downloadWorkspaceFile(selectedFile)}
                    type="button"
                  >
                    Download
                  </button>
                  <button
                    className="rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm font-semibold text-slate-200"
                    disabled={selectedFile.kind === "folder"}
                    onClick={duplicateSelected}
                    type="button"
                  >
                    Duplicate
                  </button>
                  <button
                    className="rounded-2xl border border-rose-300/20 bg-rose-300/10 px-4 py-3 text-sm font-semibold text-rose-100 transition hover:bg-rose-300/18"
                    onClick={() => onDeleteFile(selectedFile.id)}
                    type="button"
                  >
                    Delete
                  </button>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-500">No file selected.</p>
            )}
          </aside>
        </div>
      </section>
    </div>
  );
}

function filePreviewType(file?: FileSystemItem) {
  if (!file || file.kind === "folder") {
    return "folder";
  }

  if (file.mimeType?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name)) {
    return "image";
  }

  if (file.mimeType?.startsWith("audio/") || file.mimeType?.startsWith("video/") || /\.(webm|mp4|mov|mp3|wav|ogg)$/i.test(file.name)) {
    return "media";
  }

  if (/\.(obj|gltf|glb|stl)$/i.test(file.name) || file.mimeType?.includes("model")) {
    return "model";
  }

  return "text";
}

function readBrowserFile(file: File, mode: "dataUrl" | "text") {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result ?? ""));

    if (mode === "dataUrl") {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

function ModelPreview({ fileName, source }: { fileName: string; source: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    async function renderModel() {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const THREE = await import("three");
      if (disposed) {
        return;
      }

      const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
      const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        wireframe: true,
      });
      const mesh = new THREE.Mesh(geometry, material);
      scene.add(mesh);
      camera.position.z = 4;

      const resize = () => {
        const rect = canvas.getBoundingClientRect();
        const width = Math.max(1, Math.floor(rect.width));
        const height = Math.max(1, Math.floor(rect.height));
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      const animate = () => {
        if (disposed) {
          return;
        }

        mesh.rotation.x += 0.008;
        mesh.rotation.y += 0.012;
        renderer.render(scene, camera);
        window.requestAnimationFrame(animate);
      };

      resize();
      animate();
      window.addEventListener("resize", resize);
      cleanup = () => {
        window.removeEventListener("resize", resize);
        geometry.dispose();
        material.dispose();
        renderer.dispose();
      };
    }

    void renderModel();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [source]);

  const vertices = source.match(/^v\s+/gm)?.length ?? 0;
  const faces = source.match(/^f\s+/gm)?.length ?? 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
      <canvas className="h-72 w-full" ref={canvasRef} />
      <div className="border-t border-white/10 p-4">
        <p className="text-sm font-semibold text-white">{fileName}</p>
        <p className="mt-1 text-xs text-slate-500">
          3D preview active / {vertices} vertices / {faces} faces
        </p>
      </div>
    </div>
  );
}

function OsSettings({
  accent,
  onAccent,
  onWallpaper,
  wallpaper,
}: {
  accent: string;
  onAccent: (value: string) => void;
  onWallpaper: (wallpaper: WallpaperChoice) => void;
  wallpaper: WallpaperChoice;
}) {
  const wallpaperOptions: Array<{
    id: WallpaperChoice;
    title: string;
    icon: LucideIcon;
  }> = [
    { id: "obsidian", title: "Obsidian streaks", icon: Sparkles },
    { id: "aurora", title: "Aurora glass", icon: ImageIcon },
    { id: "grid", title: "Monochrome grid", icon: Grid3X3 },
    { id: "solar", title: "Solar dusk", icon: Palette },
  ];
  const accents = ["#ffffff", "#5eead4", "#a78bfa", "#fbbf24", "#fb7185"];

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-6 text-white">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
          system settings
        </p>
        <h2 className="mt-2 text-4xl font-semibold tracking-[-0.02em]">
          Personalize VeilOS
        </h2>
        <div className="mt-7 grid gap-5 lg:grid-cols-[1fr_0.75fr]">
          <section className="rounded-[1.4rem] border border-white/10 bg-white/[0.055] p-5">
            <div className="mb-4 flex items-center gap-3">
              <ImageIcon className="size-5 text-white" />
              <h3 className="text-xl font-semibold">Wallpaper</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {wallpaperOptions.map((option) => (
                <button
                  className={cn(
                    "rounded-3xl border p-4 text-left transition",
                    wallpaper === option.id
                      ? "border-white/30 bg-white text-black"
                      : "border-white/10 bg-black/30 text-white hover:bg-white/10",
                  )}
                  key={option.id}
                  onClick={() => onWallpaper(option.id)}
                  type="button"
                >
                  <option.icon className="size-5" />
                  <p className="mt-4 text-sm font-semibold">{option.title}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[1.4rem] border border-white/10 bg-white/[0.055] p-5">
            <div className="mb-4 flex items-center gap-3">
              <Palette className="size-5 text-white" />
              <h3 className="text-xl font-semibold">Accent</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {accents.map((color) => (
                <button
                  aria-label={`Accent ${color}`}
                  className={cn(
                    "size-12 rounded-2xl border transition",
                    accent === color ? "border-white" : "border-white/10",
                  )}
                  key={color}
                  onClick={() => onAccent(color)}
                  style={{ backgroundColor: color }}
                  type="button"
                />
              ))}
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/32 p-4">
              <p className="text-sm font-semibold">Security posture</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Iframes run in strict sandbox mode. Real VM device passthrough
                requires a backend runner or native agent.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function VirtualMachineApp({
  onVmUrl,
  vmUrl,
}: {
  onVmUrl: (url: string) => void;
  vmUrl: string;
}) {
  const [draftUrl, setDraftUrl] = useState(vmUrl);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextUrl =
      draftUrl.startsWith("http://") || draftUrl.startsWith("https://")
        ? draftUrl
        : `https://${draftUrl}`;
    onVmUrl(nextUrl);
  };

  return (
    <div className="flex h-full flex-col bg-[#050505] text-white">
      <div className="shrink-0 border-b border-white/10 bg-white/[0.04] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              virtual machine
            </p>
            <h2 className="text-2xl font-semibold">External sandbox viewer</h2>
          </div>
          <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-xs text-emerald-100">
            remote Chromium
          </span>
        </div>
        <form className="flex gap-2" onSubmit={submit}>
          <label className="sr-only" htmlFor="vm-url">
            VM URL
          </label>
          <input
            className="min-h-11 min-w-0 flex-1 rounded-2xl border border-white/10 bg-black/45 px-4 text-sm text-white outline-none"
            id="vm-url"
            onChange={(event) => setDraftUrl(event.target.value)}
            placeholder="https://www.tiktok.com"
            value={draftUrl}
          />
          <button
            className="rounded-2xl bg-white px-4 text-sm font-semibold text-black transition hover:bg-slate-200 disabled:opacity-50"
            type="submit"
          >
            Launch VM
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            "https://www.tiktok.com",
            "https://www.wikipedia.org",
            "https://developer.mozilla.org",
          ].map((url) => (
            <button
              className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs text-slate-300 transition hover:bg-white hover:text-black"
              key={url}
              onClick={() => {
                setDraftUrl(url);
                onVmUrl(url);
              }}
              type="button"
            >
              {new URL(url).hostname.replace("www.", "")}
            </button>
          ))}
        </div>
      </div>
      <div className="relative min-h-0 flex-1 bg-black">
        <RemoteRunnerFrame
          emptyText="Use Launch VM to start a remote Chromium runner."
          targetUrl={vmUrl}
          title="Cloud VM remote browser stream"
        />
      </div>
    </div>
  );
}

function RemoteRunnerFrame({
  bandwidthMode = "Adaptive",
  emptyText,
  scrollCommand,
  targetUrl,
  title,
  zoom = 1,
}: {
  bandwidthMode?: BandwidthMode;
  emptyText: string;
  scrollCommand?: BrowserScrollCommand | null;
  targetUrl: string;
  title: string;
  zoom?: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [frameUrl, setFrameUrl] = useState("");
  const [pendingUrl, setPendingUrl] = useState("");
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
  const [pendingIndex, setPendingIndex] = useState(0);
  const [sandboxId, setSandboxId] = useState("");
  const [status, setStatus] = useState("Ready to launch cloud renderer.");
  const [error, setError] = useState("");
  const [errorDismissed, setErrorDismissed] = useState(false);
  const streamSettings = useMemo(() => (
    bandwidthMode === "Low data"
      ? { fps: 4, quality: 58 }
      : bandwidthMode === "Battery saver"
        ? { fps: 3, quality: 52 }
        : { fps: 6, quality: 72 }
  ), [bandwidthMode]);

  useEffect(() => {
    let cancelled = false;

    async function launch() {
      await Promise.resolve();
      if (cancelled) {
        return;
      }

      setFrameUrl("");
      setPendingUrl("");
      setPendingUrls([]);
      setPendingIndex(0);
      setSandboxId("");
      setError("");
      setErrorDismissed(false);

      if (!targetUrl || targetUrl === startUrl) {
        setStatus(emptyText);
        return;
      }

      setStatus("Allocating Vercel Sandbox microVM...");

      try {
        const response = await fetch("/api/vm/launch", {
          body: JSON.stringify({ ...streamSettings, url: targetUrl }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        const payload = (await response.json()) as {
          backupRunnerUrls?: string[];
          detail?: string;
          error?: string;
          mode?: string;
          provider?: string;
          providerLatencyMs?: number;
          ready?: boolean;
          runnerUrl?: string;
          sandboxId?: string;
          stream?: { fps: number; quality: number };
        };

        if (!response.ok || !payload.runnerUrl) {
          throw new Error(payload.error ?? "Cloud runner did not return a stream URL.");
        }

        if (cancelled) {
          return;
        }

        const runnerUrls = [payload.runnerUrl, ...(payload.backupRunnerUrls ?? [])].filter(Boolean);
        setPendingUrls(runnerUrls);
        setPendingIndex(0);
        setPendingUrl(runnerUrls[0]);
        setSandboxId(payload.sandboxId ?? "");
        setStatus(
          payload.ready
            ? `Runner is ready on ${payload.provider ?? payload.mode ?? "cloud"}. Opening stream...`
            : `Runner allocated on ${payload.provider ?? payload.mode ?? "cloud"}. Waiting for Chromium to listen...`,
        );
      } catch (launchError) {
        if (cancelled) {
          return;
        }
        setError(launchError instanceof Error ? launchError.message : String(launchError));
        setStatus("Cloud renderer failed to launch.");
      }
    }

    void launch();

    return () => {
      cancelled = true;
    };
  }, [emptyText, streamSettings, targetUrl]);

  useEffect(() => {
    if (!pendingUrl) {
      return;
    }

    let cancelled = false;
    let attempts = 0;

    const check = async () => {
      attempts += 1;
      try {
        const response = await fetch(`${pendingUrl}/health`, { cache: "no-store" });
        const health = (await response.json()) as { error?: string; ok?: boolean };

        if (cancelled) {
          return;
        }

        if (response.ok && health.ok) {
          setFrameUrl(pendingUrl);
          setStatus(`Cloud renderer ready${sandboxId ? ` / ${sandboxId}` : ""}.`);
          return;
        }

        setStatus(
          health.error
            ? `Runner warming: ${health.error.slice(0, 140)}`
            : `Runner warming on port, attempt ${attempts}...`,
        );
      } catch {
        if (!cancelled) {
          setStatus(`Runner warming on port, attempt ${attempts}...`);
        }
      }

      if (!cancelled && attempts < 90) {
        window.setTimeout(check, 2000);
      } else if (!cancelled && pendingIndex < pendingUrls.length - 1) {
        const nextIndex = pendingIndex + 1;
        setPendingIndex(nextIndex);
        setPendingUrl(pendingUrls[nextIndex]);
        setStatus(`Primary runner did not answer. Trying backup ${nextIndex}...`);
      }
    };

    void check();

    return () => {
      cancelled = true;
    };
  }, [pendingIndex, pendingUrl, pendingUrls, sandboxId]);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "veil-browser-zoom", zoom },
      "*",
    );
  }, [frameUrl, zoom]);

  useEffect(() => {
    if (!scrollCommand) {
      return;
    }

    iframeRef.current?.contentWindow?.postMessage(
      {
        deltaX: scrollCommand.deltaX,
        deltaY: scrollCommand.deltaY,
        type: "veil-browser-scroll",
      },
      "*",
    );
  }, [scrollCommand]);

  if (frameUrl) {
    return (
      <iframe
        allow="clipboard-read; clipboard-write; fullscreen"
        className="h-full w-full bg-black"
        key={frameUrl}
        onLoad={() =>
          iframeRef.current?.contentWindow?.postMessage(
            { type: "veil-browser-zoom", zoom },
            "*",
          )
        }
        ref={iframeRef}
        referrerPolicy="no-referrer"
        sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
        src={frameUrl}
        title={title}
      />
    );
  }

  return (
    <div className="grid h-full place-items-center p-6 text-center">
      <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.055] p-8">
        <Cpu className="mx-auto size-16 text-white" />
        <h3 className="mt-5 text-2xl font-semibold">Cloud renderer warming</h3>
        <p className="mt-3 text-sm leading-6 text-slate-400">{status}</p>
        <p className="mt-3 text-xs leading-5 text-slate-500">
          {emptyText} Some sites block local iframes, so cloud mode waits for a
          remote Chromium stream before showing the page.
        </p>
        {error && !errorDismissed && (
          <div className="relative mt-4 rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 pr-10 text-left text-xs leading-5 text-amber-100">
            <button
              aria-label="Dismiss cloud renderer error"
              className="absolute right-2 top-2 grid size-6 place-items-center rounded-md text-amber-100/70 transition hover:bg-white/10 hover:text-white"
              onClick={() => setErrorDismissed(true)}
              type="button"
            >
              <X className="size-3.5" />
            </button>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

function SystemMonitorApp() {
  const [benchmarks, setBenchmarks] = useState<
    Array<{ label: string; value: string }>
  >([]);
  const [running, setRunning] = useState(false);
  const [apiLatency, setApiLatency] = useState<number | null>(null);
  const [publicIp, setPublicIp] = useState("Checking...");
  const [gpu] = useState(() => {
    if (typeof document === "undefined") {
      return "Detecting...";
    }

    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl");

    if (!gl || !("getExtension" in gl)) {
      return "WebGL unavailable";
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    return String(renderer);
  });
  const [memoryUsed] = useState(() => {
    if (typeof performance === "undefined") {
      return "Browser restricted";
    }

    const memory = (performance as Performance & {
      memory?: { jsHeapSizeLimit: number; totalJSHeapSize: number; usedJSHeapSize: number };
    }).memory;

    if (!memory) {
      return "Browser restricted";
    }

    return `${Math.round(memory.usedJSHeapSize / 1024 / 1024)} MB / ${Math.round(
      memory.jsHeapSizeLimit / 1024 / 1024,
    )} MB`;
  });

  const connection =
    typeof navigator === "undefined"
      ? undefined
      : (navigator as Navigator & {
          connection?: { downlink?: number; effectiveType?: string; rtt?: number };
          deviceMemory?: number;
        }).connection;

  useEffect(() => {
    void fetch("https://api.ipify.org?format=json", { cache: "no-store" })
      .then((response) => response.json() as Promise<{ ip?: string }>)
      .then((payload) => setPublicIp(payload.ip ?? "Unavailable"))
      .catch(() => setPublicIp("Unavailable"));
  }, []);

  const runDiagnostics = async () => {
    setRunning(true);
    const results: Array<{ label: string; value: string }> = [];

    const apiStart = performance.now();
    try {
      await fetch("/api/admin/health", { cache: "no-store" });
      const latency = Math.round(performance.now() - apiStart);
      setApiLatency(latency);
      results.push({ label: "API round trip", value: `${latency} ms` });
    } catch {
      results.push({ label: "API round trip", value: "Failed" });
    }

    const cpuStart = performance.now();
    let checksum = 0;
    for (let index = 0; index < 7_500_000; index += 1) {
      checksum += Math.sqrt(index % 997);
    }
    const cpuMs = performance.now() - cpuStart;
    results.push({
      label: "CPU JS benchmark",
      value: `${Math.round(7_500_000 / cpuMs)} ops/ms`,
    });

    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 360;
    const context = canvas.getContext("2d");
    const gpuStart = performance.now();
    if (context) {
      for (let index = 0; index < 32_000; index += 1) {
        context.fillStyle = `hsl(${(index + checksum) % 360} 80% 55%)`;
        context.fillRect((index * 17) % 640, (index * 29) % 360, 24, 24);
      }
      const gpuMs = performance.now() - gpuStart;
      results.push({
        label: "Canvas/GPU draw",
        value: `${Math.round(32_000 / gpuMs)} draws/ms`,
      });
    } else {
      results.push({ label: "Canvas/GPU draw", value: "Unavailable" });
    }

    const storageStart = performance.now();
    try {
      const payload = "x".repeat(256_000);
      localStorage.setItem("veil-benchmark", payload);
      localStorage.removeItem("veil-benchmark");
      results.push({
        label: "Storage write",
        value: `${Math.max(1, Math.round(performance.now() - storageStart))} ms`,
      });
    } catch {
      results.push({ label: "Storage write", value: "Blocked" });
    }

    setBenchmarks(results);
    setRunning(false);
  };

  const specs = [
    ["CPU cores", String(navigator.hardwareConcurrency ?? "Unknown")],
    [
      "Device memory",
      `${(navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? "Unknown"} GB`,
    ],
    ["GPU renderer", gpu],
    ["JS heap", memoryUsed],
    ["Platform", navigator.platform || "Unknown"],
    ["User agent", navigator.userAgent],
  ];

  return (
    <div className="h-full overflow-y-auto bg-[#08090d] p-5 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
              task manager
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Real System Monitor</h2>
          </div>
          <button
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
            disabled={running}
            onClick={() => void runDiagnostics()}
            type="button"
          >
            {running ? "Testing..." : "Run CPU/GPU debug test"}
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ["Online", navigator.onLine ? "Yes" : "No"],
            ["Public IP", publicIp],
            ["API latency", apiLatency === null ? "Not tested" : `${apiLatency} ms`],
            ["Network type", connection?.effectiveType ?? "Browser hidden"],
            ["Downlink", connection?.downlink ? `${connection.downlink} Mbps` : "Unknown"],
            ["RTT", connection?.rtt ? `${connection.rtt} ms` : "Unknown"],
            ["CPU cores", String(navigator.hardwareConcurrency ?? "Unknown")],
            ["GPU", gpu.split(",")[0] ?? gpu],
          ].map(([label, value]) => (
            <div className="rounded-xl border border-white/10 bg-white/[0.055] p-4" key={label}>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="mt-2 break-words font-mono text-lg font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-3 flex items-center gap-2">
              <MonitorUp className="size-5" />
              <h3 className="font-semibold">Build specs</h3>
            </div>
            <div className="space-y-2 text-sm">
              {specs.map(([label, value]) => (
                <div className="grid gap-2 rounded-lg bg-black/30 p-3 md:grid-cols-[150px_1fr]" key={label}>
                  <span className="text-slate-500">{label}</span>
                  <span className="break-words font-mono text-slate-200">{value}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.045] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Activity className="size-5" />
              <h3 className="font-semibold">Benchmark results</h3>
            </div>
            <div className="space-y-2">
              {(benchmarks.length ? benchmarks : [{ label: "Status", value: "Run a debug test" }]).map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-black/30 p-3" key={item.label}>
                  <span className="text-sm text-slate-400">{item.label}</span>
                  <span className="font-mono text-sm font-semibold">{item.value}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-slate-500">
              Browser benchmarks measure the JavaScript and canvas environment available to this web app. Native OS-level CPU, GPU, and Wi-Fi adapter control is blocked by browser sandboxing.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function BrowserWorkspaceApp({ account }: { account?: BrowserAccount }) {
  const shouldReduceMotion = useReducedMotion();
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [tabs, setTabs] = useState<BrowserTab[]>(defaultTabs);
  const [activeTabId, setActiveTabId] = useState(defaultTabs[0].id);
  const [commandOpen, setCommandOpen] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [pointerGlow, setPointerGlow] = useState(true);
  const [cloudMode, setCloudMode] = useState(true);
  const [toolbarHidden, setToolbarHidden] = useState(false);
  const [browserZoom, setBrowserZoom] = useState(1);
  const [browserScrollCommand, setBrowserScrollCommand] =
    useState<BrowserScrollCommand | null>(null);
  const [panelView, setPanelView] = useState<PanelView>("search");
  const [privacyPreset, setPrivacyPreset] = useState<PrivacyPreset>("Balanced");
  const [bandwidthMode, setBandwidthMode] = useState<BandwidthMode>("Adaptive");
  const [sessionState, setSessionState] = useState<SessionState>("live");
  const [elapsed, setElapsed] = useState(2384);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(seedBookmarks);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(
    seedHistoryItems.map((item) => ({ ...item })),
  );
  const [downloads, setDownloads] = useState<DownloadItem[]>([
    {
      id: "download-starter",
      name: "session-report.json",
      size: "24 KB",
      status: "ready",
    },
  ]);
  const [eventLog, setEventLog] = useState<string[]>([
    "Session cx-78f2 connected",
    "WebRTC primary path selected",
    "Disposable profile mounted",
  ]);
  const [terminalLines, setTerminalLines] = useState<string[]>([
    "Veil terminal ready. Type help for commands.",
  ]);

  const activeTab = tabs.find((tab) => tab.id === activeTabId) ?? tabs[0];
  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;

  const lifecycle = useMemo(
    () =>
      lifecycleBase.map((step, index) => {
        if (sessionState === "destroyed") {
          return {
            step,
            status: index < lifecycleBase.length - 1 ? "done" : "active",
          };
        }

        if (sessionState === "suspended") {
          return {
            step,
            status: index < 6 ? "done" : index === 6 ? "paused" : "idle",
          };
        }

        return {
          step,
          status: index < 5 ? "done" : index === 5 ? "active" : "idle",
        };
      }),
    [sessionState],
  );

  useEffect(() => {
    const interval = window.setInterval(() => {
      setElapsed((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "l") {
        event.preventDefault();
        document.getElementById("remote-url")?.focus();
      }

      if ((event.metaKey || event.ctrlKey) && ["+", "="].includes(event.key)) {
        event.preventDefault();
        setBrowserZoom((value) => clampBrowserZoom(value + browserZoomStep));
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "-") {
        event.preventDefault();
        setBrowserZoom((value) => clampBrowserZoom(value - browserZoomStep));
      }

      if ((event.metaKey || event.ctrlKey) && event.key === "0") {
        event.preventDefault();
        setBrowserZoom(1);
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
        setTerminalOpen(false);
        setSettingsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const addLog = (message: string) => {
    setEventLog((items) => [`${nowTime()} ${message}`, ...items].slice(0, 28));
  };

  const settleTab = (id: string) => {
    window.setTimeout(() => {
      setTabs((items) =>
        items.map((tab) => (tab.id === id ? { ...tab, status: "active" } : tab)),
      );
    }, 520);
  };

  const navigateTo = (value: string) => {
    const resolved = resolveNavigation(value);

    if (sessionState === "destroyed") {
      setSessionState("live");
      addLog("Started a fresh browser session");
    }

    setTabs((items) =>
      items.map((tab) => {
        if (tab.id !== activeTabId) {
          return { ...tab, status: "idle" };
        }

        const nextHistory = [
          ...tab.history.slice(0, tab.historyIndex + 1),
          resolved.url,
        ];

        return {
          ...tab,
          ...resolved,
          status: "loading",
          history: nextHistory,
          historyIndex: nextHistory.length - 1,
        };
      }),
    );
    setHistoryItems((items) =>
      [createHistoryItem(resolved.title, resolved.url), ...items].slice(0, 18),
    );
    addLog(`Navigated to ${resolved.title}`);
    settleTab(activeTabId);
  };

  const submitUrl = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    navigateTo(String(formData.get("remote-url") ?? ""));
  };

  const goHistory = (direction: -1 | 1) => {
    const nextIndex = activeTab.historyIndex + direction;
    const nextUrl = activeTab.history[nextIndex];

    if (!nextUrl) {
      return;
    }

    const resolved = resolveNavigation(nextUrl);
    setTabs((items) =>
      items.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              ...resolved,
              historyIndex: nextIndex,
              status: "loading",
            }
          : tab,
      ),
    );
    addLog(direction === -1 ? "Moved back in tab history" : "Moved forward");
    settleTab(activeTabId);
  };

  const refreshTab = () => {
    setTabs((items) =>
      items.map((tab) =>
        tab.id === activeTabId
          ? {
              ...tab,
              reloadKey: tab.reloadKey + 1,
              status: "loading",
            }
          : tab,
      ),
    );
    addLog(`Refreshed ${activeTab.title}`);
    settleTab(activeTabId);
  };

  const addTab = () => {
    const nextTab = createTab();
    setTabs((items) => [
      ...items.map((tab) => ({ ...tab, status: "idle" as const })),
      nextTab,
    ]);
    setActiveTabId(nextTab.id);
    addLog("Opened a new isolated tab");
  };

  const closeTab = (id: string) => {
    setTabs((items) => {
      if (items.length === 1) {
        const reset = createTab({ id });
        setActiveTabId(reset.id);
        addLog("Reset the last open tab");
        return [reset];
      }

      const currentIndex = items.findIndex((tab) => tab.id === id);
      const remaining = items.filter((tab) => tab.id !== id);
      const fallback = remaining[Math.max(0, currentIndex - 1)] ?? remaining[0];

      if (activeTabId === id) {
        setActiveTabId(fallback.id);
      }

      addLog("Closed an isolated tab");
      return remaining;
    });
  };

  const bookmarkActiveTab = () => {
    const exists = bookmarks.some((bookmark) => bookmark.url === activeTab.url);

    if (exists) {
      setPanelView("bookmarks");
      addLog("Bookmark already exists");
      return;
    }

    setBookmarks((items) => [
      {
        title: activeTab.title,
        url: activeTab.url,
        tag: activeTab.kind === "search" ? "Search" : "Saved",
      },
      ...items,
    ]);
    setPanelView("bookmarks");
    addLog(`Bookmarked ${activeTab.title}`);
  };

  const destroySession = () => {
    setSessionState("destroyed");
    setKeyboardOpen(false);
    setPointerGlow(false);
    addLog("Destroyed current disposable session");
  };

  const restartSession = () => {
    setSessionState("live");
    setElapsed(0);
    setPointerGlow(true);
    addLog("Started new disposable session");
  };

  const suspendSession = () => {
    setSessionState("suspended");
    addLog("Session suspended");
  };

  const resumeSession = () => {
    setSessionState("live");
    addLog("Session resumed");
  };

  const clearData = () => {
    setHistoryItems([]);
    setDownloads([]);
    setEventLog(["Local demo history, downloads, and logs cleared"]);
    addLog("Cleared local session data");
  };

  const handleUpload = (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    const nextDownloads = Array.from(files).map((file) => ({
      id: `upload-${file.name}-${file.lastModified}`,
      name: file.name,
      size: `${Math.max(1, Math.round(file.size / 1024))} KB`,
      status: "scanned" as const,
    }));

    setDownloads((items) => [...nextDownloads, ...items].slice(0, 16));
    setPanelView("downloads");
    addLog(`Prepared ${nextDownloads.length} upload item`);
  };

  const runTerminalCommand = (rawCommand: string) => {
    const command = rawCommand.trim().toLowerCase();

    if (!command) {
      return;
    }

    setTerminalLines((lines) => [...lines, `> ${rawCommand}`]);

    if (command === "help") {
      setTerminalLines((lines) => [
        ...lines,
        "Commands: status, new-tab, bookmark, clear, restart, suspend, resume, destroy",
      ]);
      return;
    }

    if (command === "status") {
      setTerminalLines((lines) => [
        ...lines,
        `Session ${sessionState}; tab ${activeTab.title}; mode ${bandwidthMode}`,
      ]);
      return;
    }

    if (command === "new-tab") {
      addTab();
      setTerminalLines((lines) => [...lines, "Opened a new isolated tab."]);
      return;
    }

    if (command === "bookmark") {
      bookmarkActiveTab();
      setTerminalLines((lines) => [...lines, "Bookmark command completed."]);
      return;
    }

    if (command === "clear") {
      clearData();
      setTerminalLines(["Terminal cleared."]);
      return;
    }

    if (command === "restart") {
      restartSession();
      setTerminalLines((lines) => [...lines, "Session restarted."]);
      return;
    }

    if (command === "suspend") {
      suspendSession();
      setTerminalLines((lines) => [...lines, "Session suspended."]);
      return;
    }

    if (command === "resume") {
      resumeSession();
      setTerminalLines((lines) => [...lines, "Session resumed."]);
      return;
    }

    if (command === "destroy") {
      destroySession();
      setTerminalLines((lines) => [...lines, "Session destroyed."]);
      return;
    }

    setTerminalLines((lines) => [
      ...lines,
      `Unknown command: ${rawCommand}. Type help.`,
    ]);
  };

  const runCommand = (command: string) => {
    if (command === "New tab") {
      addTab();
    }

    if (command === "Bookmark page") {
      bookmarkActiveTab();
    }

    if (command === "Low data mode") {
      setBandwidthMode("Low data");
      addLog("Enabled low data mode");
    }

    if (command === "Open terminal") {
      setTerminalOpen(true);
    }

    if (command === "Destroy session") {
      destroySession();
    }

    if (command === "Show downloads") {
      setPanelView("downloads");
    }

    if (command === "Clear local data") {
      clearData();
    }

    setCommandOpen(false);
  };

  const toggleCloudMode = () => {
    const nextValue = !cloudMode;
    setCloudMode(nextValue);
    addLog(
      nextValue
        ? "Cloud isolation enabled for browser frames"
        : "Cloud isolation relaxed for direct frame compatibility",
    );
  };

  const adjustBrowserZoom = (delta: number) => {
    setBrowserZoom((value) => clampBrowserZoom(value + delta));
    addLog(delta > 0 ? "Browser zoomed in" : "Browser zoomed out");
  };

  const resetBrowserZoom = () => {
    setBrowserZoom(1);
    addLog("Browser zoom reset to 100%");
  };

  const scrollBrowser = (direction: -1 | 1) => {
    setBrowserScrollCommand({
      deltaX: 0,
      deltaY: browserScrollStep * direction,
      id: Date.now(),
    });
    addLog(direction > 0 ? "Scrolled browser down" : "Scrolled browser up");
  };

  return (
    <main className="black-streaks relative h-full overflow-hidden bg-black text-white">
      <div className="relative flex h-full min-h-0 flex-col p-0">
        <div className="flex min-h-0 flex-1 flex-col">
          <BrowserStage
            account={account}
            activeTab={activeTab}
            bandwidthMode={bandwidthMode}
            browserScrollCommand={browserScrollCommand}
            browserZoom={browserZoom}
            canGoBack={canGoBack}
            canGoForward={canGoForward}
            cloudMode={cloudMode}
            elapsed={elapsed}
            keyboardOpen={keyboardOpen}
            toolbarHidden={toolbarHidden}
            onAddTab={addTab}
            onBack={() => goHistory(-1)}
            onBookmark={bookmarkActiveTab}
            onCloudMode={toggleCloudMode}
            onCloseTab={closeTab}
            onCommand={() => setCommandOpen(true)}
            onForward={() => goHistory(1)}
            onNavigate={navigateTo}
            onNavigateForm={submitUrl}
            onPanel={(view) => {
              if (view === "settings") {
                setSettingsOpen(true);
                return;
              }
              setPanelView(view);
            }}
            onPointerToggle={() => {
              setPointerGlow((value) => !value);
              addLog("Pointer assist toggled");
            }}
            onRefresh={refreshTab}
            onScrollPage={scrollBrowser}
            onSelectTab={setActiveTabId}
            onClearData={clearData}
            onDestroy={destroySession}
            onResume={resumeSession}
            onSuspend={suspendSession}
            onTerminal={() => setTerminalOpen(true)}
            onToggleToolbar={() => setToolbarHidden((value) => !value)}
            onTune={() => setSettingsOpen(true)}
            onUpload={() => uploadInputRef.current?.click()}
            onVirtualKeyboard={() => setKeyboardOpen((value) => !value)}
            onZoomIn={() => adjustBrowserZoom(browserZoomStep)}
            onZoomOut={() => adjustBrowserZoom(-browserZoomStep)}
            onZoomReset={resetBrowserZoom}
            pointerGlow={pointerGlow}
            sessionState={sessionState}
            shouldReduceMotion={Boolean(shouldReduceMotion)}
            tabs={tabs}
          />
        </div>

        <MobileDock
          onCommand={() => setCommandOpen(true)}
          onNewTab={addTab}
          onPanel={setPanelView}
          onSettings={() => setSettingsOpen(true)}
        />

        <input
          className="hidden"
          multiple
          onChange={(event) => handleUpload(event.target.files)}
          ref={uploadInputRef}
          type="file"
        />
      </div>

      <AnimatePresence>
        {commandOpen && (
          <CommandPalette onClose={() => setCommandOpen(false)} onRun={runCommand} />
        )}
        {terminalOpen && (
          <TerminalModal
            lines={terminalLines}
            onClose={() => setTerminalOpen(false)}
            onRun={runTerminalCommand}
          />
        )}
        {settingsOpen && (
          <BrowserSettingsModal
            bandwidthMode={bandwidthMode}
            onBandwidthMode={setBandwidthMode}
            onClose={() => setSettingsOpen(false)}
            onPrivacyPreset={setPrivacyPreset}
            privacyPreset={privacyPreset}
          />
        )}
        {panelView !== "search" && (
          <BrowserPanelOverlay
            activeTab={activeTab}
            bandwidthMode={bandwidthMode}
            bookmarks={bookmarks}
            downloads={downloads}
            eventLog={eventLog}
            historyItems={historyItems}
            lifecycle={lifecycle}
            onClose={() => setPanelView("search")}
            onNavigate={navigateTo}
            onPrivacyChange={setPrivacyPreset}
            onViewChange={setPanelView}
            panelView={panelView}
            privacyPreset={privacyPreset}
            setBandwidthMode={setBandwidthMode}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

// Legacy browser chrome kept for comparison while the viewport-only browser is active.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TopBar({
  account,
  activeTab,
  canGoBack,
  canGoForward,
  cloudMode,
  elapsed,
  onAddTab,
  onBack,
  onBookmark,
  onCloudMode,
  onCloseTab,
  onForward,
  onNavigate,
  onRefresh,
  onSelectTab,
  onSettings,
  tabs,
}: {
  account?: BrowserAccount;
  activeTab: BrowserTab;
  canGoBack: boolean;
  canGoForward: boolean;
  cloudMode: boolean;
  elapsed: number;
  onAddTab: () => void;
  onBack: () => void;
  onBookmark: () => void;
  onCloudMode: () => void;
  onCloseTab: (id: string) => void;
  onForward: () => void;
  onNavigate: (event: FormEvent<HTMLFormElement>) => void;
  onRefresh: () => void;
  onSelectTab: (id: string) => void;
  onSettings: () => void;
  tabs: BrowserTab[];
}) {
  return (
    <header className="glass-panel z-20 flex min-h-16 flex-col gap-3 rounded-[26px] p-2 lg:flex-row lg:items-center">
      <div className="flex items-center gap-2 px-2">
        <div className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 shadow-[0_0_34px_rgba(255,255,255,0.18)]">
          <ShieldCheck className="size-5 text-white" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-white">Veil</p>
            <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white">
              live
            </span>
          </div>
          <p className="truncate text-xs text-slate-400">private cloud browser</p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1">
        <button
          aria-label="Go back"
          className="hidden size-9 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 disabled:opacity-35 md:grid"
          disabled={!canGoBack}
          onClick={onBack}
          type="button"
        >
          <ArrowLeft className="size-4" />
        </button>
        <button
          aria-label="Go forward"
          className="hidden size-9 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 disabled:opacity-35 md:grid"
          disabled={!canGoForward}
          onClick={onForward}
          type="button"
        >
          <ArrowRight className="size-4" />
        </button>
        <button
          aria-label="Refresh page"
          className="hidden size-9 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 md:grid"
          onClick={onRefresh}
          type="button"
        >
          <RefreshCw className="size-4" />
        </button>

        <div className="flex min-w-[260px] flex-1 items-center gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/35 p-1">
          {tabs.map((tab) => (
            <motion.div
              className={cn(
                "group flex h-9 min-w-32 max-w-56 items-center gap-1 rounded-xl px-2 text-xs transition",
                tab.id === activeTab.id
                  ? "bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.16)]"
                  : "text-slate-400 hover:bg-white/10 hover:text-slate-100",
              )}
              key={tab.id}
              layout
            >
              <button
                aria-current={tab.id === activeTab.id ? "page" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
                onClick={() => onSelectTab(tab.id)}
                type="button"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    tab.status === "loading"
                      ? "bg-amber-300"
                      : tab.status === "active"
                        ? "bg-emerald-300"
                        : "bg-slate-500",
                  )}
                />
                <span className="truncate">{tab.title}</span>
              </button>
              <button
                aria-label={`Close ${tab.title}`}
                className="ml-auto grid size-5 place-items-center rounded-md opacity-0 transition hover:bg-black/10 group-hover:opacity-100"
                onClick={() => onCloseTab(tab.id)}
                type="button"
              >
                <X className="size-3" />
              </button>
            </motion.div>
          ))}
          <button
            aria-label="Create isolated tab"
            className="grid size-9 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-white/10 hover:text-white"
            onClick={onAddTab}
            type="button"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <form
        className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-white/15 bg-black/70 px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        onSubmit={onNavigate}
      >
        <Lock className="size-4 shrink-0 text-emerald-200" />
        <label className="sr-only" htmlFor="remote-url">
          Search or enter URL
        </label>
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
          defaultValue={tabAddress(activeTab)}
          id="remote-url"
          key={activeTab.id + activeTab.reloadKey + activeTab.url}
          name="remote-url"
          placeholder="Search Veil or enter a URL"
          suppressHydrationWarning
        />
        <button
          aria-label="Open in browser"
          className="grid size-8 shrink-0 place-items-center rounded-xl bg-white text-black transition hover:bg-slate-200"
          type="submit"
        >
          <Search className="size-4" />
        </button>
      </form>

      <div className="grid grid-cols-4 gap-2 px-1 text-xs sm:flex sm:items-center">
        <StatusPill icon={Wifi} label="31 ms" tone="emerald" />
        <StatusPill icon={Clock3} label={formatTimer(elapsed)} tone="slate" />
        <button
          aria-label="Run sites from cloud isolate"
          aria-pressed={cloudMode}
          className={cn(
            "flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl border px-3 transition",
            cloudMode
              ? "border-white/15 bg-white text-black"
              : "border-white/10 bg-white/8 text-slate-200 hover:bg-white/14",
          )}
          onClick={onCloudMode}
          type="button"
        >
          <Cloud className="size-4 shrink-0" />
          <span className="hidden truncate sm:block">
            {cloudMode ? "Cloud on" : "Cloud"}
          </span>
        </button>
        <button
          className="flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-3 text-slate-200 transition hover:bg-white/14"
          onClick={onBookmark}
          type="button"
        >
          <Bookmark className="size-4 shrink-0" />
          <span className="hidden truncate sm:block">Save</span>
        </button>
        <button
          aria-label="Browser settings"
          className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/8 text-slate-200 transition hover:bg-white/14"
          onClick={onSettings}
          type="button"
        >
          <Settings className="size-4" />
        </button>
        <StatusPill
          icon={UserRound}
          label={account?.username ? `@${account.username}` : "@guest"}
          tone="white"
        />
      </div>
    </header>
  );
}

function StatusPill({
  icon: Icon,
  label,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  tone: "emerald" | "slate" | "white";
}) {
  const toneClass =
    tone === "emerald"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : tone === "white"
        ? "border-white/15 bg-white text-black"
        : "border-white/10 bg-white/8 text-slate-200";

  return (
    <div
      className={cn(
        "flex h-10 min-w-0 items-center justify-center gap-2 rounded-2xl border px-3",
        toneClass,
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="truncate font-mono">{label}</span>
    </div>
  );
}

// Legacy compact sidebar kept for future alternate browser layouts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Sidebar({
  collapsed,
  onSelect,
  onToggle,
  selected,
}: {
  collapsed: boolean;
  onSelect: (view: PanelView) => void;
  onToggle: () => void;
  selected: PanelView;
}) {
  return (
    <aside
      className={cn(
        "glass-panel hidden h-full min-h-0 shrink-0 flex-col gap-3 rounded-[26px] p-3 transition-all duration-300 lg:flex",
        collapsed ? "w-[76px]" : "w-[260px]",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs uppercase text-slate-500">workspace</p>
            <button
              className="mt-1 flex max-w-full items-center gap-2 rounded-xl text-left text-sm font-semibold text-white"
              type="button"
            >
              <span className="truncate">Private browser</span>
              <ChevronDown className="size-4 text-slate-400" />
            </button>
          </div>
        )}
        <button
          aria-label="Collapse sidebar"
          className="grid size-10 shrink-0 place-items-center rounded-2xl border border-white/10 bg-white/8 text-slate-200 transition hover:bg-white/14"
          onClick={onToggle}
          type="button"
        >
          <Menu className="size-4" />
        </button>
      </div>

      <nav aria-label="Primary" className="flex flex-col gap-1">
        {sidebarItems.map((item) => (
          <button
            className={cn(
              "group flex h-11 items-center gap-3 rounded-2xl px-3 text-sm transition",
              selected === item.id
                ? "bg-white text-black shadow-[0_0_24px_rgba(255,255,255,0.16)]"
                : "text-slate-400 hover:bg-white/8 hover:text-slate-100",
              collapsed && "justify-center px-0",
            )}
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <item.icon className="size-4 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </nav>

      {!collapsed && (
        <div className="mt-auto rounded-3xl border border-white/10 bg-black/35 p-3">
          <div className="flex items-start gap-3">
            <div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-white/10 text-white">
              <EyeOff className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white">Disposable mode</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">
                Tabs and local demo data can be cleared instantly.
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function BrowserStage({
  account,
  activeTab,
  bandwidthMode,
  browserScrollCommand,
  browserZoom,
  canGoBack,
  canGoForward,
  cloudMode,
  elapsed,
  keyboardOpen,
  onAddTab,
  onBack,
  onBookmark,
  onClearData,
  onCloudMode,
  onCloseTab,
  onCommand,
  onDestroy,
  onForward,
  onNavigate,
  onNavigateForm,
  onPanel,
  onPointerToggle,
  onRefresh,
  onResume,
  onScrollPage,
  onSelectTab,
  onSuspend,
  onTerminal,
  onToggleToolbar,
  onTune,
  onUpload,
  onVirtualKeyboard,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  pointerGlow,
  sessionState,
  shouldReduceMotion,
  tabs,
  toolbarHidden,
}: {
  account?: BrowserAccount;
  activeTab: BrowserTab;
  bandwidthMode: BandwidthMode;
  browserScrollCommand: BrowserScrollCommand | null;
  browserZoom: number;
  canGoBack: boolean;
  canGoForward: boolean;
  cloudMode: boolean;
  elapsed: number;
  keyboardOpen: boolean;
  onAddTab: () => void;
  onBack: () => void;
  onBookmark: () => void;
  onClearData: () => void;
  onCloudMode: () => void;
  onCloseTab: (id: string) => void;
  onCommand: () => void;
  onDestroy: () => void;
  onForward: () => void;
  onNavigate: (value: string) => void;
  onNavigateForm: (event: FormEvent<HTMLFormElement>) => void;
  onPanel: (view: PanelView) => void;
  onPointerToggle: () => void;
  onRefresh: () => void;
  onResume: () => void;
  onScrollPage: (direction: -1 | 1) => void;
  onSelectTab: (id: string) => void;
  onSuspend: () => void;
  onTerminal: () => void;
  onToggleToolbar: () => void;
  onTune: () => void;
  onUpload: () => void;
  onVirtualKeyboard: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  pointerGlow: boolean;
  sessionState: SessionState;
  shouldReduceMotion: boolean;
  tabs: BrowserTab[];
  toolbarHidden: boolean;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  return (
    <section className="relative min-h-0 flex-1 overflow-hidden bg-black text-white">
      <div className="remote-frame absolute inset-0 overflow-hidden rounded-none border-0 shadow-none">
        {!toolbarHidden && (
        <div className="absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-black/88 px-3 py-2 backdrop-blur-2xl">
          <div className="flex min-w-0 items-center gap-2">
            <div className="hidden items-center gap-1.5 px-1 sm:flex">
              <span className="size-2.5 rounded-full bg-rose-300" />
              <span className="size-2.5 rounded-full bg-amber-300" />
              <span className="size-2.5 rounded-full bg-emerald-300" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/[0.045] p-1">
              {tabs.map((tab) => (
                <motion.div
                  className={cn(
                    "group flex h-8 min-w-28 max-w-48 items-center gap-1 rounded-lg px-2 text-xs transition",
                    tab.id === activeTab.id
                      ? "bg-white text-black"
                      : "text-slate-400 hover:bg-white/10 hover:text-white",
                  )}
                  key={tab.id}
                  layout
                >
                  <button
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    onClick={() => onSelectTab(tab.id)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        tab.status === "loading"
                          ? "bg-amber-300"
                          : tab.status === "active"
                            ? "bg-emerald-300"
                            : "bg-slate-500",
                      )}
                    />
                    <span className="truncate">{tab.title}</span>
                  </button>
                  <button
                    aria-label={`Close ${tab.title}`}
                    className="grid size-5 place-items-center rounded-md opacity-0 transition hover:bg-black/10 group-hover:opacity-100"
                    onClick={() => onCloseTab(tab.id)}
                    type="button"
                  >
                    <X className="size-3" />
                  </button>
                </motion.div>
              ))}
              <button
                aria-label="New tab"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white"
                onClick={onAddTab}
                type="button"
              >
                <Plus className="size-4" />
              </button>
            </div>
            <span className="hidden rounded-lg bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-slate-300 md:inline">
              {formatTimer(elapsed)}
            </span>
            <span className="hidden max-w-28 truncate rounded-lg bg-white px-2 py-1 text-[11px] font-semibold text-black sm:inline">
              @{account?.username ?? "guest"}
            </span>
          </div>

          <div className="mt-2 grid gap-2 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
            <div className="flex gap-1">
              <IconButton icon={ArrowLeft} label="Back" onClick={onBack} disabled={!canGoBack} />
              <IconButton icon={ArrowRight} label="Forward" onClick={onForward} disabled={!canGoForward} />
              <IconButton icon={RefreshCw} label="Refresh" onClick={onRefresh} />
              <div className="hidden items-center gap-1 rounded-xl border border-white/10 bg-white/[0.04] p-1 sm:flex">
                <IconButton icon={ArrowUp} label="Scroll up" onClick={() => onScrollPage(-1)} />
                <IconButton icon={ArrowDown} label="Scroll down" onClick={() => onScrollPage(1)} />
                <IconButton
                  disabled={browserZoom <= browserZoomMin}
                  icon={ZoomOut}
                  label="Zoom out"
                  onClick={onZoomOut}
                />
                <button
                  className="h-8 min-w-12 rounded-lg px-2 text-center font-mono text-[11px] font-semibold text-white transition hover:bg-white hover:text-black"
                  onClick={onZoomReset}
                  title="Reset zoom"
                  type="button"
                >
                  {Math.round(browserZoom * 100)}%
                </button>
                <IconButton
                  disabled={browserZoom >= browserZoomMax}
                  icon={ZoomIn}
                  label="Zoom in"
                  onClick={onZoomIn}
                />
              </div>
            </div>

            <form
              className="flex min-w-0 items-center gap-2 rounded-xl border border-white/15 bg-white px-3 py-1.5 text-black"
              onSubmit={onNavigateForm}
            >
              <Lock className="size-4 shrink-0 text-emerald-700" />
              <label className="sr-only" htmlFor="remote-url">
                Search or enter URL
              </label>
              <input
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-500"
                defaultValue={tabAddress(activeTab)}
                id="remote-url"
                key={activeTab.id + activeTab.reloadKey + activeTab.url}
                name="remote-url"
                placeholder="Search or enter a website"
                suppressHydrationWarning
              />
              <button
                aria-label="Open"
                className="grid size-8 shrink-0 place-items-center rounded-lg bg-black text-white"
                type="submit"
              >
                <Search className="size-4" />
              </button>
            </form>

            <div className="relative flex justify-end gap-1">
              <IconButton active={cloudMode} icon={Cloud} label={cloudMode ? "Cloud mode on" : "Cloud mode"} onClick={onCloudMode} />
              <IconButton icon={Bookmark} label="Bookmark" onClick={onBookmark} />
              <IconButton icon={History} label="History" onClick={() => onPanel("history")} />
              <IconButton icon={Download} label="Downloads" onClick={() => onPanel("downloads")} />
              <IconButton icon={SlidersHorizontal} label="Settings" onClick={onTune} />
              <IconButton icon={EyeOff} label="Hide toolbar" onClick={onToggleToolbar} />
              <IconButton
                active={advancedOpen}
                icon={Menu}
                label="More browser actions"
                onClick={() => setAdvancedOpen((value) => !value)}
              />
              {advancedOpen && (
                <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-white/10 bg-[#08090d]/96 p-2 shadow-[0_24px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">
                  {[
                    { icon: Command, label: "Command palette", action: onCommand },
                    { icon: Shield, label: "Privacy dashboard", action: () => onPanel("privacy") },
                    { icon: TerminalSquare, label: "Terminal", action: onTerminal },
                    { icon: FileUp, label: "Upload file", action: onUpload },
                    { icon: MousePointer2, label: pointerGlow ? "Disable pointer assist" : "Pointer assist", action: onPointerToggle },
                    { icon: Keyboard, label: keyboardOpen ? "Hide keyboard" : "Virtual keyboard", action: onVirtualKeyboard },
                    { icon: Fingerprint, label: "Clear local data", action: onClearData },
                    {
                      icon: sessionState === "suspended" ? Play : Pause,
                      label: sessionState === "suspended" ? "Resume session" : "Suspend session",
                      action: sessionState === "suspended" ? onResume : onSuspend,
                    },
                    { icon: Trash2, label: "Destroy session", action: onDestroy },
                  ].map((item) => (
                    <button
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-200 transition hover:bg-white/10 hover:text-white"
                      key={item.label}
                      onClick={() => {
                        item.action();
                        setAdvancedOpen(false);
                      }}
                      type="button"
                    >
                      <item.icon className="size-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                  <div className="mt-1 border-t border-white/10 px-3 py-2 text-[11px] text-slate-500">
                    {bandwidthMode} · cloud tools stay enabled
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        <button
          className="absolute right-3 top-3 z-40 flex items-center gap-2 rounded-2xl border border-white/12 bg-black/70 px-3 py-2 text-xs text-white shadow-[0_16px_44px_rgba(0,0,0,0.4)] backdrop-blur-xl transition hover:bg-white hover:text-black"
          onClick={onToggleToolbar}
          type="button"
        >
          {toolbarHidden ? (
            <>
              <Menu className="size-4" />
              Show toolbar
            </>
          ) : (
            <>
              <EyeOff className="size-4" />
              Hide
            </>
          )}
        </button>

        <BrowserDisplay
          activeTab={activeTab}
          bandwidthMode={bandwidthMode}
          cloudMode={cloudMode}
          browserScrollCommand={browserScrollCommand}
          browserZoom={browserZoom}
          keyboardOpen={keyboardOpen}
          onNavigate={onNavigate}
          pointerGlow={pointerGlow}
          sessionState={sessionState}
          shouldReduceMotion={shouldReduceMotion}
          toolbarHidden={toolbarHidden}
        />
      </div>
    </section>
  );
}

function BrowserDisplay({
  activeTab,
  bandwidthMode,
  browserScrollCommand,
  browserZoom,
  cloudMode,
  keyboardOpen,
  onNavigate,
  pointerGlow,
  sessionState,
  shouldReduceMotion,
  toolbarHidden,
}: {
  activeTab: BrowserTab;
  bandwidthMode: BandwidthMode;
  browserScrollCommand: BrowserScrollCommand | null;
  browserZoom: number;
  cloudMode: boolean;
  keyboardOpen: boolean;
  onNavigate: (value: string) => void;
  pointerGlow: boolean;
  sessionState: SessionState;
  shouldReduceMotion: boolean;
  toolbarHidden: boolean;
}) {
  const forceCloud = activeTab.kind === "site" && requiresCloudRenderer(activeTab.url);
  const useRemoteRenderer = cloudMode;
  const directFrameScrollRef = useRef<HTMLDivElement | null>(null);
  const [dismissedWarningKey, setDismissedWarningKey] = useState("");
  const warningKey = `${activeTab.id}:${activeTab.url}:direct-cloud-warning`;

  useEffect(() => {
    if (!browserScrollCommand || useRemoteRenderer) {
      return;
    }

    directFrameScrollRef.current?.scrollBy({
      behavior: "smooth",
      left: browserScrollCommand.deltaX,
      top: browserScrollCommand.deltaY,
    });
  }, [browserScrollCommand, useRemoteRenderer]);

  return (
    <div className={cn("absolute inset-0", toolbarHidden ? "pt-0" : "pt-[112px] lg:pt-[96px]")}>
      <div className="relative h-full overflow-hidden bg-black">
        {activeTab.kind === "site" && sessionState === "live" && (
          <>
            {useRemoteRenderer ? (
              <RemoteRunnerFrame
                bandwidthMode={bandwidthMode}
                emptyText={
                  "Cloud mode is the compatibility path for sites that block iframes."
                }
                scrollCommand={browserScrollCommand}
                targetUrl={activeTab.url}
                title={activeTab.title}
                zoom={browserZoom}
              />
            ) : (
              <div className="h-full w-full overflow-auto bg-white" ref={directFrameScrollRef}>
                <iframe
                  allow="camera 'none'; microphone 'none'; geolocation 'none'; payment 'none'; usb 'none'; autoplay 'none'; encrypted-media 'none'; clipboard-read 'none'; clipboard-write 'none'"
                  className="block bg-white"
                  key={`${activeTab.id}-${activeTab.reloadKey}-${activeTab.url}-direct`}
                  loading="eager"
                  referrerPolicy="strict-origin-when-cross-origin"
                  sandbox="allow-forms allow-popups allow-same-origin allow-scripts"
                  src={activeTab.url}
                  style={{
                    height: `${100 / browserZoom}%`,
                    minHeight: "100%",
                    minWidth: "100%",
                    transform: `scale(${browserZoom})`,
                    transformOrigin: "top left",
                    width: `${100 / browserZoom}%`,
                  }}
                  title={activeTab.title}
                />
              </div>
            )}
            {!cloudMode && forceCloud && dismissedWarningKey !== warningKey && (
              <div className="absolute inset-x-4 top-4 z-20 rounded-xl border border-amber-300/20 bg-black/82 p-4 pr-12 text-sm leading-6 text-amber-100 backdrop-blur-xl">
                <button
                  aria-label="Dismiss browser warning"
                  className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg text-amber-100/70 transition hover:bg-white/10 hover:text-white"
                  onClick={() => setDismissedWarningKey(warningKey)}
                  type="button"
                >
                  <X className="size-4" />
                </button>
                This site is known to block embedded direct-browser frames. Direct
                mode is on, so it may show &quot;refused to connect&quot;; turn Cloud on to
                load it through the remote renderer.
              </div>
            )}
            <div className="pointer-events-none absolute bottom-4 right-4 z-20 rounded-full border border-white/20 bg-black/70 px-3 py-2 text-xs font-medium text-white backdrop-blur">
              {useRemoteRenderer
                ? `Remote Chromium cloud renderer / ${Math.round(browserZoom * 100)}%`
                : `Direct iframe mode / ${Math.round(browserZoom * 100)}%`}
            </div>
          </>
        )}

        {activeTab.kind === "start" && sessionState === "live" && (
          <StartPage onNavigate={onNavigate} shouldReduceMotion={shouldReduceMotion} />
        )}

        {activeTab.kind === "search" && sessionState === "live" && (
          <SearchResultsPage query={activeTab.query ?? ""} onNavigate={onNavigate} />
        )}

        {sessionState !== "live" && (
          <SessionOverlay
            sessionState={sessionState}
            onRestart={() => onNavigate(startUrl)}
          />
        )}

        {pointerGlow && sessionState === "live" && !shouldReduceMotion && (
          <motion.div
            animate={{ x: [80, 460, 280, 720], y: [120, 260, 410, 210] }}
            className="pointer-events-none absolute left-0 top-0 z-30"
            transition={{
              duration: 11,
              ease: "easeInOut",
              repeat: Infinity,
              repeatType: "mirror",
            }}
          >
            <MousePointer2 className="size-6 fill-white text-white drop-shadow-[0_0_18px_rgba(255,255,255,0.86)]" />
          </motion.div>
        )}

        {keyboardOpen && sessionState === "live" && <VirtualKeyboard />}
      </div>
    </div>
  );
}

function StartPage({
  onNavigate,
  shouldReduceMotion,
}: {
  onNavigate: (value: string) => void;
  shouldReduceMotion: boolean;
}) {
  const [query, setQuery] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onNavigate(query);
  };

  return (
    <div className="black-streaks relative flex h-full items-start justify-center overflow-y-auto px-5 py-8">
      <div className="relative z-10 w-full max-w-5xl">
        <motion.div
          animate={shouldReduceMotion ? undefined : { opacity: [0.9, 1, 0.9] }}
          className="mx-auto max-w-3xl text-center"
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-[1.35rem] border border-white/15 bg-white text-black shadow-[0_0_55px_rgba(255,255,255,0.28)]">
            <Sparkles className="size-7" />
          </div>
          <p className="mb-3 text-xs uppercase tracking-[0.34em] text-slate-400">
            remote browser workspace
          </p>
          <h1 className="text-4xl font-semibold tracking-[-0.02em] text-white sm:text-5xl 2xl:text-7xl">
            Search the web in a clean cloud frame.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400">
            Type a search, paste a URL, open tabs, save pages, upload files, and control the disposable session from one polished workspace.
          </p>
        </motion.div>

        <form
          className="mx-auto mt-9 flex max-w-3xl items-center gap-2 rounded-[1.6rem] border border-white/15 bg-white p-2 text-black shadow-[0_26px_90px_rgba(0,0,0,0.45)]"
          onSubmit={submit}
        >
          <Search className="ml-3 size-5 shrink-0 text-slate-500" />
          <label className="sr-only" htmlFor="center-search">
            Search or enter URL
          </label>
          <input
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-slate-500"
            id="center-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search or enter a website"
            value={query}
          />
          <button
            className="h-12 rounded-[1.1rem] bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            type="submit"
          >
            Open
          </button>
        </form>

        <div className="mx-auto mt-8 grid max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {quickLinks.map((link) => (
            <button
              className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-4 text-left transition hover:-translate-y-0.5 hover:bg-white/[0.12]"
              key={link.url}
              onClick={() => onNavigate(link.url)}
              type="button"
            >
              <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-black">
                {link.tag}
              </span>
              <p className="mt-4 text-sm font-semibold text-white">{link.title}</p>
              <p className="mt-2 truncate font-mono text-xs text-slate-500">
                {link.url}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SearchResultsPage({
  onNavigate,
  query,
}: {
  onNavigate: (value: string) => void;
  query: string;
}) {
  const results = useMemo(
    () =>
      searchTemplates.map((result, index) => ({
        ...result,
        title: query ? `${result.title} for "${query}"` : result.title,
        score: `${98 - index * 7}%`,
      })),
    [query],
  );

  return (
    <div className="h-full overflow-y-auto bg-[#050505] px-5 py-8 text-white">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
          veil search
        </p>
        <h2 className="mt-3 text-4xl font-semibold tracking-[-0.02em]">
          Results for {query || "your search"}
        </h2>
        <form
          className="mt-6 flex max-w-3xl items-center gap-2 rounded-[1.4rem] border border-white/12 bg-white p-2 text-black"
          onSubmit={(event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            onNavigate(String(formData.get("search") ?? ""));
          }}
        >
          <Search className="ml-3 size-5 shrink-0 text-slate-500" />
          <label className="sr-only" htmlFor="results-search">
            Search again
          </label>
          <input
            className="min-h-11 min-w-0 flex-1 bg-transparent outline-none"
            defaultValue={query}
            id="results-search"
            name="search"
          />
          <button
            className="h-11 rounded-[1rem] bg-black px-4 text-sm font-semibold text-white"
            type="submit"
          >
            Search
          </button>
        </form>

        <div className="mt-8 grid gap-4">
          {results.map((result) => (
            <button
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-5 text-left transition hover:border-white/25 hover:bg-white/[0.09]"
              key={result.url}
              onClick={() => onNavigate(result.url)}
              type="button"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-black">
                  {result.score} match
                </span>
                <span className="truncate font-mono text-xs text-slate-500">
                  {result.url}
                </span>
              </div>
              <h3 className="text-xl font-semibold text-white">{result.title}</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                {result.body}
              </p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionOverlay({
  onRestart,
  sessionState,
}: {
  onRestart: () => void;
  sessionState: SessionState;
}) {
  return (
    <div className="absolute inset-0 z-40 grid place-items-center bg-black/82 p-6 text-center backdrop-blur">
      <div className="max-w-md rounded-[2rem] border border-white/12 bg-white/[0.07] p-7 shadow-[0_24px_100px_rgba(0,0,0,0.5)]">
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-white text-black">
          {sessionState === "destroyed" ? (
            <Trash2 className="size-6" />
          ) : (
            <Pause className="size-6" />
          )}
        </div>
        <h2 className="text-2xl font-semibold text-white">
          Session {sessionState}
        </h2>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          The page stream is paused here. Start a fresh session to continue browsing in this prototype.
        </p>
        <button
          className="mt-5 h-11 rounded-2xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-slate-200"
          onClick={onRestart}
          type="button"
        >
          Start session
        </button>
      </div>
    </div>
  );
}

function VirtualKeyboard() {
  const rows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

  return (
    <div className="absolute inset-x-3 bottom-3 z-40 rounded-[1.4rem] border border-white/10 bg-black/76 p-3 backdrop-blur">
      <div className="space-y-2">
        {rows.map((row) => (
          <div className="flex justify-center gap-1.5" key={row}>
            {row.split("").map((letter) => (
              <button
                className="grid size-9 place-items-center rounded-xl bg-white/10 text-xs text-white transition hover:bg-white hover:text-black"
                key={letter}
                type="button"
              >
                {letter}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Legacy metric badge kept with the old external action strip.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function MetricBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-slate-200">
      <p className="text-[10px] uppercase text-slate-500">{label}</p>
      <p className="mt-0.5 truncate font-mono text-xs">{value}</p>
    </div>
  );
}

function IconButton({
  active,
  disabled,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={cn(
        "grid size-9 place-items-center rounded-xl border border-white/10 text-slate-300 transition hover:bg-white hover:text-black disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/[0.04] disabled:hover:text-slate-300",
        active ? "bg-white text-black" : "bg-white/[0.04]",
      )}
      disabled={disabled}
      onClick={onClick}
      title={label}
      type="button"
    >
      <Icon className="size-4" />
    </button>
  );
}

// Legacy option strip kept for future split-toolbar variants.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function BrowserOptionStrip({
  onCommand,
  onSelect,
  selected,
}: {
  onCommand: () => void;
  onSelect: (view: PanelView) => void;
  selected: PanelView;
}) {
  return (
    <section className="glass-panel rounded-[24px] p-2">
      <div className="flex gap-2 overflow-x-auto">
        <button
          className="flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.06] px-3 text-sm text-slate-200 transition hover:bg-white hover:text-black"
          onClick={onCommand}
          type="button"
        >
          <Command className="size-4" />
          Commands
        </button>
        {sidebarItems.map((item) => (
          <button
            className={cn(
              "flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-3 text-sm transition",
              selected === item.id
                ? "border-white/20 bg-white text-black"
                : "border-white/10 bg-white/[0.06] text-slate-200 hover:bg-white/12",
            )}
            key={item.id}
            onClick={() => onSelect(item.id)}
            type="button"
          >
            <item.icon className="size-4" />
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}

// Legacy external action strip kept for future compact layouts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function ActionStrip({
  onClearData,
  onDestroy,
  onLogs,
  onNewTab,
  onResume,
  onSuspend,
  onTerminal,
  onUpload,
  sessionState,
}: {
  onClearData: () => void;
  onDestroy: () => void;
  onLogs: () => void;
  onNewTab: () => void;
  onResume: () => void;
  onSuspend: () => void;
  onTerminal: () => void;
  onUpload: () => void;
  sessionState: SessionState;
}) {
  const actions = [
    { label: "New tab", icon: Plus, onClick: onNewTab },
    { label: "Upload", icon: FileUp, onClick: onUpload },
    { label: "Terminal", icon: TerminalSquare, onClick: onTerminal },
    { label: "Logs", icon: Code2, onClick: onLogs },
    {
      label: sessionState === "suspended" ? "Resume" : "Suspend",
      icon: sessionState === "suspended" ? Play : Pause,
      onClick: sessionState === "suspended" ? onResume : onSuspend,
    },
    { label: "Clear data", icon: Fingerprint, onClick: onClearData },
    { label: "Destroy", icon: Trash2, onClick: onDestroy, danger: true },
  ];

  return (
    <section className="glass-panel rounded-[26px] p-3">
      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7">
        {actions.map((action) => (
          <button
            className={cn(
              "flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-sm transition",
              action.danger
                ? "border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/18"
                : "border-white/10 bg-white/[0.05] text-slate-200 hover:bg-white/12 hover:text-white",
            )}
            key={action.label}
            onClick={action.onClick}
            type="button"
          >
            <action.icon className="size-4 shrink-0" />
            <span className="truncate">{action.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function BrowserPanelOverlay({
  activeTab,
  bandwidthMode,
  bookmarks,
  downloads,
  eventLog,
  historyItems,
  lifecycle,
  onClose,
  onNavigate,
  onPrivacyChange,
  onViewChange,
  panelView,
  privacyPreset,
  setBandwidthMode,
}: {
  activeTab: BrowserTab;
  bandwidthMode: BandwidthMode;
  bookmarks: BookmarkItem[];
  downloads: DownloadItem[];
  eventLog: string[];
  historyItems: HistoryItem[];
  lifecycle: Array<{ step: string; status: string }>;
  onClose: () => void;
  onNavigate: (value: string) => void;
  onPrivacyChange: (preset: PrivacyPreset) => void;
  onViewChange: (view: PanelView) => void;
  panelView: PanelView;
  privacyPreset: PrivacyPreset;
  setBandwidthMode: (mode: BandwidthMode) => void;
}) {
  return (
    <motion.section
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="absolute inset-x-3 bottom-20 z-50 mx-auto grid max-h-[72vh] max-w-5xl grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-[28px] border border-white/14 bg-[#07090d]/96 shadow-[0_30px_120px_rgba(0,0,0,0.72)] backdrop-blur-2xl lg:bottom-6"
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
    >
      <div className="flex items-center justify-between gap-3 border-b border-white/10 p-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
            browser control center
          </p>
          <h2 className="text-xl font-semibold text-white">
            Full screen browser options
          </h2>
        </div>
        <button
          aria-label="Close browser options"
          className="grid size-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.06] text-slate-300 hover:bg-white hover:text-black"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="grid min-h-0 gap-3 overflow-y-auto p-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        <SessionControl
          bandwidthMode={bandwidthMode}
          onBandwidthMode={setBandwidthMode}
          onPrivacyChange={onPrivacyChange}
          privacyPreset={privacyPreset}
        />
        <PanelDeck
          activeTab={activeTab}
          bookmarks={bookmarks}
          downloads={downloads}
          eventLog={eventLog}
          historyItems={historyItems}
          lifecycle={lifecycle}
          onNavigate={onNavigate}
          onViewChange={onViewChange}
          panelView={panelView}
        />
      </div>
    </motion.section>
  );
}

// Legacy side rail kept for future alternate browser layouts.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function RightRail({
  activeTab,
  bandwidthMode,
  bookmarks,
  downloads,
  eventLog,
  historyItems,
  lifecycle,
  onNavigate,
  onPrivacyChange,
  onViewChange,
  panelView,
  privacyPreset,
  setBandwidthMode,
}: {
  activeTab: BrowserTab;
  bandwidthMode: BandwidthMode;
  bookmarks: BookmarkItem[];
  downloads: DownloadItem[];
  eventLog: string[];
  historyItems: HistoryItem[];
  lifecycle: Array<{ step: string; status: string }>;
  onNavigate: (value: string) => void;
  onPrivacyChange: (preset: PrivacyPreset) => void;
  onViewChange: (view: PanelView) => void;
  panelView: PanelView;
  privacyPreset: PrivacyPreset;
  setBandwidthMode: (mode: BandwidthMode) => void;
}) {
  return (
    <aside className="hidden min-h-0 min-w-0 flex-col gap-3 2xl:flex">
      <SessionControl
        bandwidthMode={bandwidthMode}
        onBandwidthMode={setBandwidthMode}
        onPrivacyChange={onPrivacyChange}
        privacyPreset={privacyPreset}
      />
      <PanelDeck
        activeTab={activeTab}
        bookmarks={bookmarks}
        downloads={downloads}
        eventLog={eventLog}
        historyItems={historyItems}
        lifecycle={lifecycle}
        onNavigate={onNavigate}
        onViewChange={onViewChange}
        panelView={panelView}
      />
    </aside>
  );
}

function SessionControl({
  bandwidthMode,
  onBandwidthMode,
  onPrivacyChange,
  privacyPreset,
}: {
  bandwidthMode: BandwidthMode;
  onBandwidthMode: (mode: BandwidthMode) => void;
  onPrivacyChange: (preset: PrivacyPreset) => void;
  privacyPreset: PrivacyPreset;
}) {
  return (
    <section className="glass-panel rounded-[26px] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-slate-500">session controls</p>
          <h2 className="mt-1 text-lg font-semibold text-white">
            Browser tuning
          </h2>
        </div>
        <Zap className="size-5 text-white" />
      </div>

      <div className="space-y-4">
        <SegmentedControl
          label="Privacy"
          options={["Balanced", "Strict", "Disposable"]}
          value={privacyPreset}
          onChange={onPrivacyChange}
        />
        <SegmentedControl
          label="Bandwidth"
          options={["Adaptive", "Low data", "Battery saver"]}
          value={bandwidthMode}
          onChange={onBandwidthMode}
        />
      </div>
    </section>
  );
}

function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs uppercase text-slate-500">{label}</p>
      <div className="grid gap-1 rounded-2xl border border-white/10 bg-black/35 p-1">
        {options.map((option) => (
          <button
            className={cn(
              "min-h-9 rounded-xl px-2 text-xs transition",
              option === value
                ? "bg-white text-black"
                : "text-slate-400 hover:bg-white/8 hover:text-slate-100",
            )}
            key={option}
            onClick={() => onChange(option)}
            type="button"
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function PanelDeck({
  activeTab,
  bookmarks,
  downloads,
  eventLog,
  historyItems,
  lifecycle,
  onNavigate,
  onViewChange,
  panelView,
}: {
  activeTab: BrowserTab;
  bookmarks: BookmarkItem[];
  downloads: DownloadItem[];
  eventLog: string[];
  historyItems: HistoryItem[];
  lifecycle: Array<{ step: string; status: string }>;
  onNavigate: (value: string) => void;
  onViewChange: (view: PanelView) => void;
  panelView: PanelView;
}) {
  const tabs: Array<{ id: PanelView; label: string }> = [
    { id: "search", label: "Search" },
    { id: "bookmarks", label: "Saved" },
    { id: "sessions", label: "Life" },
    { id: "ops", label: "Ops" },
  ];

  return (
    <section className="glass-panel min-h-0 flex-1 overflow-hidden rounded-[26px] p-4">
      <div className="mb-3 flex gap-1 rounded-2xl border border-white/10 bg-black/35 p-1">
        {tabs.map((tab) => (
          <button
            className={cn(
              "min-h-9 flex-1 rounded-xl px-2 text-xs transition",
              tab.id === panelView
                ? "bg-white text-black"
                : "text-slate-400 hover:bg-white/8 hover:text-white",
            )}
            key={tab.id}
            onClick={() => onViewChange(tab.id)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {panelView === "search" && (
        <PanelBlock icon={Globe2} title="Current Page">
          <p className="truncate rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-3 font-mono text-xs text-slate-300">
            {activeTab.kind === "start" ? startUrl : activeTab.url}
          </p>
          <div className="mt-4 grid gap-2">
            {quickLinks.map((link) => (
              <button
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-3 py-3 text-left transition hover:bg-white/10"
                key={link.url}
                onClick={() => onNavigate(link.url)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm text-white">
                    {link.title}
                  </span>
                  <span className="block truncate font-mono text-xs text-slate-500">
                    {link.url}
                  </span>
                </span>
                <ExternalLink className="size-4 shrink-0 text-slate-400" />
              </button>
            ))}
          </div>
        </PanelBlock>
      )}

      {panelView === "bookmarks" && (
        <PanelBlock icon={BookMarked} title="Bookmarks">
          <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {bookmarks.map((bookmark) => (
              <button
                className="w-full rounded-2xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:bg-white/10"
                key={`${bookmark.url}-${bookmark.title}`}
                onClick={() => onNavigate(bookmark.url)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-white">
                    {bookmark.title}
                  </p>
                  <span className="rounded-full bg-white px-2 py-1 text-[11px] text-black">
                    {bookmark.tag}
                  </span>
                </div>
                <p className="mt-1 truncate font-mono text-xs text-slate-500">
                  {bookmark.url}
                </p>
              </button>
            ))}
          </div>
        </PanelBlock>
      )}

      {panelView === "history" && (
        <PanelBlock icon={History} title="History">
          <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {historyItems.length ? (
              historyItems.map((item) => (
                <button
                  className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white/[0.05] px-3 py-3 text-left transition hover:bg-white/10"
                  key={`${item.title}-${item.time}`}
                  onClick={() => item.url && onNavigate(item.url)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs text-slate-300">
                      {item.title}
                    </span>
                    <span className="font-mono text-[11px] text-slate-600">
                      {item.time}
                    </span>
                  </span>
                  <span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[11px] text-emerald-100">
                    {item.risk}
                  </span>
                </button>
              ))
            ) : (
              <EmptyState text="History is empty." />
            )}
          </div>
        </PanelBlock>
      )}

      {panelView === "downloads" && (
        <PanelBlock icon={Download} title="Downloads">
          <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {downloads.length ? (
              downloads.map((download) => (
                <div
                  className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                  key={download.id}
                >
                  <p className="truncate text-sm font-medium text-white">
                    {download.name}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span>{download.size}</span>
                    <span className="rounded-full bg-white/10 px-2 py-1 text-slate-300">
                      {download.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No downloads or uploads yet." />
            )}
          </div>
        </PanelBlock>
      )}

      {panelView === "sessions" && (
        <PanelBlock icon={Activity} title="Lifecycle">
          <div className="max-h-[430px] space-y-3 overflow-y-auto pr-1">
            {lifecycle.map((item) => (
              <div className="flex items-center gap-3" key={item.step}>
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border",
                    item.status === "done" &&
                      "border-emerald-300/30 bg-emerald-300/10 text-emerald-100",
                    item.status === "active" &&
                      "border-white/40 bg-white text-black",
                    item.status === "paused" &&
                      "border-amber-300/30 bg-amber-300/10 text-amber-100",
                    item.status === "idle" &&
                      "border-slate-500/30 bg-slate-500/10 text-slate-300",
                  )}
                >
                  {item.status === "done" ? (
                    <Check className="size-3.5" />
                  ) : (
                    <span className="size-1.5 rounded-full bg-current" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-100">{item.step}</p>
                  <p className="text-xs text-slate-500">{item.status}</p>
                </div>
              </div>
            ))}
          </div>
        </PanelBlock>
      )}

      {panelView === "privacy" && (
        <PanelBlock icon={Shield} title="Privacy">
          <div className="grid gap-3">
            {privacyControls.map((control) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-4"
                key={control.label}
              >
                <p className="text-sm text-slate-400">{control.label}</p>
                <p className={cn("mt-2 text-lg font-semibold", control.accent)}>
                  {control.value}
                </p>
              </div>
            ))}
          </div>
        </PanelBlock>
      )}

      {panelView === "ops" && (
        <PanelBlock icon={Network} title="Operations">
          <div className="grid gap-3">
            {adminMetrics.map((metric) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                key={metric.label}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-slate-400">{metric.label}</p>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-[11px] text-slate-300">
                    {metric.delta}
                  </span>
                </div>
                <p className="mt-3 font-mono text-2xl font-semibold text-white">
                  {metric.value}
                </p>
              </div>
            ))}
            <div className="max-h-36 overflow-y-auto rounded-2xl border border-white/10 bg-black/35 p-3 font-mono text-[11px] leading-5 text-slate-400">
              {eventLog.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </div>
        </PanelBlock>
      )}

      {panelView === "settings" && (
        <PanelBlock icon={Settings} title="Settings">
          <EmptyState text="Use the settings button in the top bar for full browser settings." />
        </PanelBlock>
      )}
    </section>
  );
}

function PanelBlock({
  children,
  icon: Icon,
  title,
}: {
    children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
        <Icon className="size-5 text-white" />
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-sm text-slate-400">
      {text}
    </div>
  );
}

function MobileDock({
  onCommand,
  onNewTab,
  onPanel,
  onSettings,
}: {
  onCommand: () => void;
  onNewTab: () => void;
  onPanel: (panel: PanelView) => void;
  onSettings: () => void;
}) {
  const items = [
    { label: "Search", icon: Search, onClick: () => onPanel("search") },
    { label: "Tabs", icon: Layers3, onClick: onNewTab },
    { label: "Command", icon: Command, onClick: onCommand },
    { label: "History", icon: History, onClick: () => onPanel("history") },
    { label: "Settings", icon: Settings, onClick: onSettings },
  ];

  return (
    <nav
      aria-label="Mobile"
      className="glass-panel sticky bottom-3 z-30 grid grid-cols-5 gap-1 rounded-[24px] p-2 lg:hidden"
    >
      {items.map((item) => (
        <button
          aria-label={item.label}
          className="grid min-h-12 place-items-center rounded-2xl text-slate-300 transition hover:bg-white/10 hover:text-white"
          key={item.label}
          onClick={item.onClick}
          type="button"
        >
          <item.icon className="size-5" />
        </button>
      ))}
    </nav>
  );
}

function CommandPalette({
  onClose,
  onRun,
}: {
  onClose: () => void;
  onRun: (command: string) => void;
}) {
  const [query, setQuery] = useState("");
  const commands = [
    "New tab",
    "Bookmark page",
    "Low data mode",
    "Open terminal",
    "Destroy session",
    "Show downloads",
    "Clear local data",
  ];
  const filtered = commands.filter((command) =>
    command.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-start bg-black/65 px-3 py-16 backdrop-blur-sm sm:px-6"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="presentation"
      onMouseDown={onClose}
    >
      <motion.div
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-panel mx-auto w-full max-w-2xl overflow-hidden rounded-[28px]"
        exit={{ opacity: 0, y: 14, scale: 0.98 }}
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4 py-4">
          <Command className="size-5 text-white" />
          <label className="sr-only" htmlFor="command-query">
            Command
          </label>
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
            id="command-query"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search commands"
            value={query}
          />
          <button
            aria-label="Close command palette"
            className="grid size-9 place-items-center rounded-xl text-slate-400 transition hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-[420px] overflow-y-auto p-2">
          {filtered.map((command) => (
            <button
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition hover:bg-white/10"
              key={command}
              onClick={() => onRun(command)}
              type="button"
            >
              <span className="grid size-10 place-items-center rounded-2xl bg-white text-black">
                <Command className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-white">
                  {command}
                </span>
                <span className="mt-1 block truncate text-xs text-slate-500">
                  browser action
                </span>
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TerminalModal({
  lines,
  onClose,
  onRun,
}: {
  lines: string[];
  onClose: () => void;
  onRun: (command: string) => void;
}) {
  const [command, setCommand] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onRun(command);
    setCommand("");
  };

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="presentation"
      onMouseDown={onClose}
    >
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl overflow-hidden rounded-[1.7rem] border border-white/30 bg-[#050505] shadow-[0_28px_120px_rgba(0,0,0,0.82)] ring-1 ring-white/15"
        exit={{ opacity: 0, y: 18 }}
        initial={{ opacity: 0, y: 18 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.06] px-5 py-4">
          <div className="flex items-center gap-2">
            <TerminalSquare className="size-5 text-white" />
            <h2 className="text-sm font-semibold text-white">Cloud terminal</h2>
          </div>
          <button
            aria-label="Close terminal"
            className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="min-h-[300px] max-h-[380px] overflow-y-auto bg-black p-5 font-mono text-xs leading-6 text-emerald-100">
          {lines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
        <form
          className="flex items-center gap-2 border-t border-white/10 p-4"
          onSubmit={submit}
        >
          <span className="font-mono text-xs text-slate-500">veil$</span>
          <input
            autoFocus
            className="min-h-10 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.05] px-3 font-mono text-sm text-white outline-none"
            onChange={(event) => setCommand(event.target.value)}
            placeholder="help"
            value={command}
          />
          <button
            className="h-10 rounded-xl bg-white px-4 text-sm font-semibold text-black"
            type="submit"
          >
            Run
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

function BrowserSettingsModal({
  bandwidthMode,
  onBandwidthMode,
  onClose,
  onPrivacyPreset,
  privacyPreset,
}: {
  bandwidthMode: BandwidthMode;
  onBandwidthMode: (mode: BandwidthMode) => void;
  onClose: () => void;
  onPrivacyPreset: (preset: PrivacyPreset) => void;
  privacyPreset: PrivacyPreset;
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex justify-end bg-black/55 p-4 backdrop-blur"
      exit={{ opacity: 0 }}
      initial={{ opacity: 0 }}
      role="presentation"
      onMouseDown={onClose}
    >
      <motion.aside
        animate={{ x: 0 }}
        className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-[1.7rem] border border-white/12 bg-[#070707] shadow-[0_28px_120px_rgba(0,0,0,0.62)]"
        exit={{ x: 28 }}
        initial={{ x: 28 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
              Browser settings
            </p>
            <h2 className="text-2xl font-semibold text-white">Controls</h2>
          </div>
          <button
            aria-label="Close settings"
            className="grid size-9 place-items-center rounded-xl text-slate-400 hover:bg-white/10 hover:text-white"
            onClick={onClose}
            type="button"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          <SettingsBlock icon={Shield} title="Privacy mode">
            <SegmentedControl
              label="Preset"
              options={["Balanced", "Strict", "Disposable"]}
              value={privacyPreset}
              onChange={onPrivacyPreset}
            />
          </SettingsBlock>

          <SettingsBlock icon={Wifi} title="Stream quality">
            <SegmentedControl
              label="Bandwidth"
              options={["Adaptive", "Low data", "Battery saver"]}
              value={bandwidthMode}
              onChange={onBandwidthMode}
            />
          </SettingsBlock>

          <SettingsBlock icon={Network} title="Architecture">
            <div className="space-y-2">
              {architectureNodes.map((node, index) => (
                <div className="flex gap-3 rounded-2xl bg-white/[0.05] p-3" key={node.name}>
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold text-black">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">{node.name}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      {node.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </SettingsBlock>

          <SettingsBlock icon={Globe2} title="Workspaces">
            <div className="space-y-2">
              {workspaces.map((workspace) => (
                <div
                  className="flex items-center justify-between rounded-2xl bg-white/[0.05] px-3 py-3"
                  key={workspace.name}
                >
                  <span className="text-sm text-white">{workspace.name}</span>
                  <span className="font-mono text-xs text-slate-400">
                    {workspace.sessions} sessions
                  </span>
                </div>
              ))}
            </div>
          </SettingsBlock>
        </div>
      </motion.aside>
    </motion.div>
  );
}

function SettingsBlock({
  children,
  icon: Icon,
  title,
}: {
    children: ReactNode;
  icon: LucideIcon;
  title: string;
}) {
  return (
    <section className="rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="grid size-9 place-items-center rounded-full bg-white text-black">
          <Icon className="size-4" />
        </span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {children}
    </section>
  );
}
