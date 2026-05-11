import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { timingSafeEqual } from "node:crypto";
import { RemoteBrowserSession } from "./browser-session.js";
import { StreamBridge } from "./stream-bridge.js";

type BrowserSession = {
  createdAt: string;
  expiresAt: string;
  id: string;
  isolation: {
    container: true;
    cookiePartition: string;
    cpuShares: number;
    disposableStorage: boolean;
    egressPolicy: "restricted" | "standard";
    memoryMb: number;
  };
  mode: "temporary";
  region: string;
  status: "booting";
  userId: string;
  workspaceId: string;
};

function createIsolationPolicy(workspaceId: string) {
  return {
    container: true as const,
    cookiePartition: `workspace-${workspaceId}`,
    cpuShares: 512,
    disposableStorage: true,
    egressPolicy: "restricted" as const,
    memoryMb: 1024,
  };
}

const session: BrowserSession = {
  id: process.env.SESSION_ID ?? "cx-local",
  userId: process.env.USER_ID ?? "local-user",
  workspaceId: process.env.WORKSPACE_ID ?? "private",
  mode: "temporary",
  status: "booting",
  region: process.env.REGION ?? "local",
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
  isolation: createIsolationPolicy(process.env.WORKSPACE_ID ?? "private"),
};

const browser = new RemoteBrowserSession({
  session,
  scratchRoot: process.env.SCRATCH_ROOT ?? "/tmp/veil-sessions",
  initialUrl: process.env.INITIAL_URL ?? "https://example.com",
});

const bridge = new StreamBridge(browser);
const port = Number(process.env.PORT ?? 3000);
let currentUrl = process.env.INITIAL_URL ?? "https://example.com";
let lastError = "";
let currentQuality = clampNumber(Number(process.env.FRAME_QUALITY ?? 72), 72, 35, 90);
let maxFps = clampNumber(Number(process.env.MAX_FPS ?? 6), 6, 1, 12);
const workerAuthToken = (process.env.WORKER_AUTH_TOKEN ?? process.env.VM_WORKER_AUTH_TOKEN ?? "").trim();
let browserReady = false;
let browserBooting = false;

async function bootBrowser() {
  if (browserReady || browserBooting) {
    return;
  }

  browserBooting = true;
  lastError = "";

  try {
    const page = await browser.launch();
    browserReady = true;
    console.log(
      JSON.stringify({
        event: "worker-browser-ready",
        sessionId: session.id,
        title: await page.title(),
      }),
    );
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    console.error(JSON.stringify({ event: "worker-browser-failed", error: lastError }));
  } finally {
    browserBooting = false;
  }
}

function clampNumber(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

function safeTokenEqual(candidate: string) {
  if (!workerAuthToken || !candidate) {
    return !workerAuthToken;
  }

  const expected = Buffer.from(workerAuthToken);
  const actual = Buffer.from(candidate);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function readCookies(request: IncomingMessage) {
  return Object.fromEntries(
    String(request.headers.cookie ?? "")
      .split(";")
      .map((entry) => entry.trim().split("="))
      .filter(([key, value]) => key && value)
      .map(([key, value]) => [key, decodeURIComponent(value)]),
  );
}

function requestToken(request: IncomingMessage, url: URL) {
  const headerToken = request.headers["x-veil-worker-token"];
  const cookieToken = readCookies(request).veil_worker_auth;
  return (
    (Array.isArray(headerToken) ? headerToken[0] : headerToken) ??
    url.searchParams.get("access_token") ??
    cookieToken ??
    ""
  );
}

function requestIsAuthorized(request: IncomingMessage, url: URL) {
  return !workerAuthToken || safeTokenEqual(requestToken(request, url));
}

function writeUnauthorized(response: ServerResponse) {
  response.writeHead(401, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify({ error: "Unauthorized worker request", ok: false }));
}

function writeNotReady(response: ServerResponse) {
  response.writeHead(503, {
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(
    JSON.stringify({
      error: lastError || "Remote browser is still booting",
      ok: false,
      status: browserBooting ? "booting" : "not-ready",
    }),
  );
}

function authCookieHeader() {
  return `veil_worker_auth=${encodeURIComponent(workerAuthToken)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`;
}

function html() {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Veil Cloud Runner</title>
    <style>
      html, body { margin: 0; height: 100%; overflow: hidden; background: #050505; color: white; font-family: Inter, Arial, sans-serif; }
      .bar { height: 56px; display: flex; align-items: center; gap: 8px; box-sizing: border-box; padding: 8px; background: rgba(0,0,0,.88); border-bottom: 1px solid rgba(255,255,255,.12); }
      input { flex: 1; height: 38px; border: 1px solid rgba(255,255,255,.16); border-radius: 14px; background: #111; color: white; padding: 0 12px; }
      button { height: 38px; border: 0; border-radius: 14px; background: white; color: black; font-weight: 700; padding: 0 14px; }
      .stage { height: calc(100% - 56px); display: grid; place-items: center; background: #111; }
      img { width: 100%; height: 100%; object-fit: contain; cursor: crosshair; }
      .status { position: fixed; right: 12px; bottom: 12px; max-width: min(520px, calc(100% - 24px)); border: 1px solid rgba(255,255,255,.16); border-radius: 16px; background: rgba(0,0,0,.76); padding: 10px 12px; font-size: 12px; color: #d1d5db; }
    </style>
  </head>
  <body>
    <form class="bar" id="nav">
      <input id="url" value="${currentUrl.replaceAll('"', "&quot;")}" />
      <button>Navigate</button>
    </form>
    <div class="stage"><img id="frame" alt="Remote browser frame" /></div>
    <div class="status" id="status">Cloud runner connected.</div>
    <script>
      const frame = document.getElementById("frame");
      const status = document.getElementById("status");
      const params = new URLSearchParams(location.search);
      let quality = Math.min(90, Math.max(35, Number(params.get("quality") || ${currentQuality})));
      let maxFps = Math.min(12, Math.max(1, Number(params.get("fps") || ${maxFps})));
      let timer = 0;
      let loadingFrame = false;
      let lastInput = Date.now();
      function delay() {
        if (document.hidden) return 2500;
        const idle = Date.now() - lastInput;
        if (idle > 120000) return 4000;
        if (idle > 12000) return 1200;
        if (idle > 2500) return 600;
        return Math.max(90, Math.round(1000 / maxFps));
      }
      function scheduleRefresh() {
        clearTimeout(timer);
        timer = setTimeout(refresh, delay());
      }
      function refresh() {
        if (document.hidden || loadingFrame) {
          scheduleRefresh();
          return;
        }
        loadingFrame = true;
        const next = new Image();
        next.onload = () => {
          loadingFrame = false;
          frame.src = next.src;
          scheduleRefresh();
        };
        next.onerror = () => {
          loadingFrame = false;
          scheduleRefresh();
        };
        next.src = "/frame.jpg?t=" + Date.now() + "&quality=" + quality;
      }
      function point(event) {
        const rect = frame.getBoundingClientRect();
        const naturalWidth = frame.naturalWidth || 1440;
        const naturalHeight = frame.naturalHeight || 1000;
        const scale = Math.min(rect.width / naturalWidth, rect.height / naturalHeight);
        const width = naturalWidth * scale;
        const height = naturalHeight * scale;
        return {
          x: Math.round((event.clientX - rect.left - (rect.width - width) / 2) / scale),
          y: Math.round((event.clientY - rect.top - (rect.height - height) / 2) / scale),
        };
      }
      async function post(path, body) {
        lastInput = Date.now();
        await fetch(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }).catch(() => null);
        if (!loadingFrame) setTimeout(refresh, 80);
      }
      refresh();
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) refresh();
      });
      frame.addEventListener("click", (event) => post("/click", point(event)));
      frame.addEventListener("wheel", (event) => {
        event.preventDefault();
        post("/scroll", { ...point(event), deltaX: event.deltaX, deltaY: event.deltaY });
      }, { passive: false });
      window.addEventListener("keydown", (event) => {
        if (document.activeElement && document.activeElement.id === "url") return;
        if (event.key.length === 1 || ["Enter", "Backspace", "Tab", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Escape"].includes(event.key)) {
          event.preventDefault();
          post("/key", { key: event.key });
        }
      });
      document.getElementById("nav").addEventListener("submit", async (event) => {
        event.preventDefault();
        lastInput = Date.now();
        status.textContent = "Navigating in remote Chromium...";
        await fetch("/navigate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ url: document.getElementById("url").value }),
        });
        refresh();
      });
      setInterval(async () => {
        const health = await fetch("/health").then((response) => response.json()).catch(() => null);
        if (health) {
          if (typeof health.quality === "number") quality = health.quality;
          if (typeof health.maxFps === "number") maxFps = health.maxFps;
          status.textContent = health.error ? "Remote error: " + health.error : "Rendering " + health.url;
        }
      }, 2500);
    </script>
  </body>
</html>`;
}

function readBody(request: IncomingMessage) {
  return new Promise<string>((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk.toString();
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost");

  try {
    if (url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(
        JSON.stringify({
          ok: browserReady,
          error: lastError,
          maxFps,
          quality: currentQuality,
          sessionId: session.id,
          status: browserReady ? "ready" : browserBooting ? "booting" : "not-ready",
          url: currentUrl,
        }),
      );
      return;
    }

    if (!requestIsAuthorized(request, url)) {
      writeUnauthorized(response);
      return;
    }

    const headersWithAuthCookie =
      workerAuthToken && safeTokenEqual(url.searchParams.get("access_token") ?? "")
        ? { "set-cookie": authCookieHeader() }
        : undefined;

    if (url.pathname === "/navigate" && request.method === "POST") {
      if (!browserReady) {
        writeNotReady(response);
        return;
      }

      const raw = await readBody(request);
      const body = JSON.parse(raw || "{}") as { url?: string };
      const nextUrl = String(body.url ?? currentUrl);
      currentUrl =
        nextUrl.startsWith("http://") || nextUrl.startsWith("https://")
          ? nextUrl
          : `https://${nextUrl}`;
      lastError = "";
      await browser.navigate(currentUrl).catch((error) => {
        lastError = error instanceof Error ? error.message : String(error);
      });
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, error: lastError, url: currentUrl }));
      return;
    }

    if (url.pathname === "/frame.jpg") {
      if (!browserReady) {
        writeNotReady(response);
        return;
      }

      const quality = clampNumber(
        Number(url.searchParams.get("quality") ?? currentQuality),
        currentQuality,
        35,
        90,
      );
      const frame = await bridge.nextFallbackFrame(quality);
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": "image/jpeg",
      });
      response.end(frame.bytes);
      return;
    }

    if (url.pathname === "/click" && request.method === "POST") {
      if (!browserReady) {
        writeNotReady(response);
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}") as {
        x?: number;
        y?: number;
      };
      await bridge.click(Number(body.x ?? 0), Number(body.y ?? 0));
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    if (url.pathname === "/scroll" && request.method === "POST") {
      if (!browserReady) {
        writeNotReady(response);
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}") as {
        deltaX?: number;
        deltaY?: number;
        x?: number;
        y?: number;
      };
      await bridge.scroll(
        Number(body.x ?? 0),
        Number(body.y ?? 0),
        Number(body.deltaX ?? 0),
        Number(body.deltaY ?? 0),
      );
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    if (url.pathname === "/key" && request.method === "POST") {
      if (!browserReady) {
        writeNotReady(response);
        return;
      }

      const body = JSON.parse((await readBody(request)) || "{}") as {
        key?: string;
      };
      await bridge.key(String(body.key ?? ""));
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    const requestedUrl = url.searchParams.get("url");
    if (requestedUrl && requestedUrl !== currentUrl && browserReady) {
      currentUrl =
        requestedUrl.startsWith("http://") || requestedUrl.startsWith("https://")
          ? requestedUrl
          : `https://${requestedUrl}`;
      void browser.navigate(currentUrl).catch((error) => {
        lastError = error instanceof Error ? error.message : String(error);
      });
    }

    currentQuality = clampNumber(
      Number(url.searchParams.get("quality") ?? currentQuality),
      currentQuality,
      35,
      90,
    );
    maxFps = clampNumber(Number(url.searchParams.get("fps") ?? maxFps), maxFps, 1, 12);

    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      ...headersWithAuthCookie,
    });
    response.end(html());
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ error: lastError }));
  }
}).listen(port, () => {
  console.log(
    JSON.stringify({
      event: "worker-http-ready",
      port,
      sessionId: session.id,
    }),
  );
  void bootBrowser();
});

process.on("SIGTERM", async () => {
  if (browserReady) {
    await bridge.nextFallbackFrame().catch(() => null);
  }
  await browser.close();
  process.exit(0);
});
