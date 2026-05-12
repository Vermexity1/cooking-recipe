import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";
export const maxDuration = 300;

const launchSchema = z.object({
  url: z.string().min(1).default("https://www.tiktok.com"),
  quality: z.number().int().min(35).max(90).optional(),
  fps: z.number().int().min(1).max(12).optional(),
});

function normalizeUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

function clampNumber(value: number, fallback: number, min: number, max: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.round(value)));
}

type WorkerProvider = {
  name: string;
  url: string;
};

function splitUrls(value?: string) {
  return (value ?? "")
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean);
}

function workerAuthToken() {
  return (process.env.VM_WORKER_AUTH_TOKEN ?? process.env.WORKER_AUTH_TOKEN ?? "").trim();
}

function configuredWorkerProviders() {
  const providers: WorkerProvider[] = [
    { name: "Primary worker", url: process.env.VM_WORKER_URL ?? "" },
    { name: "Render", url: process.env.RENDER_VM_WORKER_URL ?? "" },
    { name: "Koyeb", url: process.env.KOYEB_VM_WORKER_URL ?? "" },
    { name: "Worker 1", url: process.env.VM_WORKER_URL_1 ?? "" },
    { name: "Worker 2", url: process.env.VM_WORKER_URL_2 ?? "" },
    { name: "Worker 3", url: process.env.VM_WORKER_URL_3 ?? "" },
    { name: "Worker 4", url: process.env.VM_WORKER_URL_4 ?? "" },
    { name: "Worker 5", url: process.env.VM_WORKER_URL_5 ?? "" },
    ...splitUrls(process.env.VM_WORKER_URLS).map((url, index) => ({
      name: `Pool worker ${index + 1}`,
      url,
    })),
  ];

  const seen = new Set<string>();
  return providers
    .map((provider) => ({ ...provider, url: provider.url.trim() }))
    .filter((provider) => {
      if (!provider.url || seen.has(provider.url)) {
        return false;
      }
      seen.add(provider.url);
      return true;
    });
}

function runnerUrlWithParams(
  baseUrl: string,
  targetUrl: string,
  options: { fps: number; quality: number },
) {
  const runnerUrl = new URL(baseUrl);
  runnerUrl.searchParams.set("url", targetUrl);
  runnerUrl.searchParams.set("fps", String(options.fps));
  runnerUrl.searchParams.set("quality", String(options.quality));
  const token = workerAuthToken();
  if (token) {
    runnerUrl.searchParams.set("access_token", token);
  }
  return runnerUrl.toString();
}

async function waitForRunner(runnerUrl: string, timeoutMs = 1500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${runnerUrl}/health`, {
      cache: "no-store",
      headers: workerAuthToken()
        ? {
            "x-veil-worker-token": workerAuthToken(),
          }
        : undefined,
      signal: controller.signal,
    });
    const health = (await response.json()) as { ok?: boolean };
    return response.ok && Boolean(health.ok);
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function waitForSandboxRunner(runnerUrl: string) {
  for (let attempt = 0; attempt < 28; attempt += 1) {
    const ready = await waitForRunner(runnerUrl, 5000);

    if (ready) {
      return true;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  return false;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rankHealthyWorkers(providers: WorkerProvider[], timeoutMs = 1500) {
  const ranked = await Promise.all(
    providers.map(async (provider, index) => {
      const started = Date.now();
      const ok = await waitForRunner(provider.url, timeoutMs);
      return {
        ...provider,
        index,
        latencyMs: Date.now() - started,
        ok,
      };
    }),
  );

  return ranked
    .filter((provider) => provider.ok)
    .sort((left, right) => left.latencyMs - right.latencyMs || left.index - right.index);
}

async function wakeHealthyWorkers(providers: WorkerProvider[]) {
  let ranked = await rankHealthyWorkers(providers, 1800);

  if (ranked.length) {
    return ranked;
  }

  for (let attempt = 0; attempt < 24; attempt += 1) {
    ranked = await rankHealthyWorkers(providers, attempt < 2 ? 15000 : 5000);

    if (ranked.length) {
      return ranked;
    }

    await delay(2500);
  }

  return [];
}

const runnerServer = String.raw`
import http from "node:http";
import { chromium } from "playwright";

const port = Number(process.env.PORT || 3000);
let targetUrl = process.env.TARGET_URL || "https://www.tiktok.com";
let frameQuality = Math.min(90, Math.max(35, Number(process.env.FRAME_QUALITY || 72)));
let maxFps = Math.min(12, Math.max(1, Number(process.env.MAX_FPS || 6)));
if (!Number.isFinite(frameQuality)) frameQuality = 72;
if (!Number.isFinite(maxFps)) maxFps = 6;
let browser;
let page;
let context;
let mainPage;
let activeIsPopup = false;
let lastError = "";
let pageZoom = 1;

async function boot() {
  browser = await chromium.launch({
    headless: true,
    args: ["--disable-dev-shm-usage", "--no-sandbox"],
  });
  context = await browser.newContext({
    viewport: { width: 1600, height: 950 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  });
  mainPage = await context.newPage();
  page = mainPage;
  context.on("page", async (newPage) => {
    await activatePage(newPage, true);
  });
  await navigate(targetUrl);
}

async function activatePage(nextPage, popup = false) {
  page = nextPage;
  activeIsPopup = popup;
  if (popup) {
    try {
      await page.setViewportSize({ width: 760, height: 720 });
    } catch {}
  }
  await applyPageZoom(pageZoom);
  await settlePage();
}

async function settlePage() {
  if (!page) {
    return;
  }

  try {
    await page.waitForLoadState("domcontentloaded", { timeout: 8000 });
  } catch {}

  try {
    targetUrl = page.url();
  } catch {}
}

async function navigate(url) {
  targetUrl = url.startsWith("http://") || url.startsWith("https://") ? url : "https://" + url;
  lastError = "";
  try {
    await page.goto(targetUrl, { waitUntil: "domcontentloaded", timeout: 45000 });
    await applyPageZoom(pageZoom);
    await settlePage();
  } catch (error) {
    lastError = error instanceof Error ? error.message : String(error);
    await settlePage();
  }
}

async function applyPageZoom(value) {
  pageZoom = Math.min(2, Math.max(0.5, Math.round(Number(value || 1) * 100) / 100));
  try {
    await page?.evaluate((zoom) => {
      document.documentElement.style.zoom = String(zoom);
    }, pageZoom);
  } catch {}
}

function html() {
  const safeUrl = targetUrl.replaceAll("'", "&#39;");
  return [
    "<!doctype html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>Cloud VM Runner</title>",
    "<style>html,body{margin:0;height:100%;background:#050505;color:white;font-family:Inter,Arial,sans-serif;overflow:hidden}.bar{height:54px;display:flex;gap:8px;align-items:center;padding:8px;background:rgba(0,0,0,.88);border-bottom:1px solid rgba(255,255,255,.12);box-sizing:border-box}input{flex:1;height:36px;border:1px solid rgba(255,255,255,.16);border-radius:12px;background:#111;color:white;padding:0 12px;min-width:120px}button{height:36px;border:0;border-radius:12px;background:white;color:black;font-weight:700;padding:0 14px}.ghost{background:#1f2937;color:white}.zoom{display:flex;align-items:center;gap:4px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.06);padding:3px}.zoom button{width:32px;padding:0}.zoom span{min-width:48px;text-align:center;font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace;color:#e5e7eb}.stage{height:calc(100% - 54px);display:grid;place-items:center;background:#111;overflow:hidden;position:relative}img{width:100%;height:100%;object-fit:contain;cursor:crosshair;display:block;color:transparent;font-size:0;opacity:0;transition:opacity .18s ease}img.ready{opacity:1}.loading{position:absolute;inset:0;display:grid;place-items:center;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.08),transparent 36%),#080808;color:#d1d5db;font-size:13px;letter-spacing:.02em}.status{position:absolute;right:12px;bottom:12px;background:rgba(0,0,0,.72);border:1px solid rgba(255,255,255,.16);border-radius:14px;padding:10px 12px;font-size:12px;color:#d1d5db}</style>",
    "</head><body><form class='bar' id='nav'><input id='url' value='",
    safeUrl,
    "'/><button>Navigate</button><button class='ghost' id='closePopup' type='button'>Close popup</button><div class='zoom' aria-label='Zoom controls'><button class='ghost' id='zoomOut' type='button'>-</button><span id='zoomLabel'>100%</span><button class='ghost' id='zoomIn' type='button'>+</button></div></form>",
    "<div class='stage' aria-label='Remote browser stream'><img id='frame' alt='' draggable='false'/><div class='loading' id='loading'>Connecting to remote browser...</div><div class='status' id='status'>Booting remote Chromium...</div></div>",
    "<script>const img=document.getElementById('frame');const loading=document.getElementById('loading');const urlInput=document.getElementById('url');const status=document.getElementById('status');const closePopup=document.getElementById('closePopup');const zoomOut=document.getElementById('zoomOut');const zoomIn=document.getElementById('zoomIn');const zoomLabel=document.getElementById('zoomLabel');const params=new URLSearchParams(location.search);let zoom=1;let hasFrame=false;let misses=0;let loadingFrame=false;let timer=0;let lastInput=Date.now();let quality=Math.min(90,Math.max(35,Number(params.get('quality')||72)));let maxFps=Math.min(12,Math.max(1,Number(params.get('fps')||6)));function clampZoom(v){return Math.min(2,Math.max(.5,Math.round(Number(v||1)*100)/100))}function renderZoom(){zoomLabel.textContent=Math.round(zoom*100)+'%'}function delay(){if(document.hidden)return 2500;const idle=Date.now()-lastInput;if(idle>120000)return 4000;if(idle>12000)return 1200;if(idle>2500)return 600;return Math.max(90,Math.round(1000/maxFps))}function scheduleTick(){clearTimeout(timer);timer=setTimeout(tick,delay())}function tick(){if(document.hidden||loadingFrame){scheduleTick();return}loadingFrame=true;const next=new Image();next.onload=()=>{loadingFrame=false;misses=0;hasFrame=true;img.src=next.src;img.classList.add('ready');loading.style.display='none';scheduleTick()};next.onerror=()=>{loadingFrame=false;misses+=1;if(!hasFrame){loading.style.display='grid';loading.textContent='Waiting for remote browser...'}else if(misses>6){status.textContent='Reconnecting to frame stream...'}scheduleTick()};next.src='/frame.jpg?t='+Date.now()+'&quality='+quality}function point(e){const r=img.getBoundingClientRect();const nw=img.naturalWidth||1600,nh=img.naturalHeight||950;const s=Math.min(r.width/nw,r.height/nh);const w=nw*s,h=nh*s;return{x:Math.round((e.clientX-r.left-(r.width-w)/2)/s),y:Math.round((e.clientY-r.top-(r.height-h)/2)/s)}}async function post(path,body){lastInput=Date.now();await fetch(path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).catch(()=>null);if(!loadingFrame)window.setTimeout(tick,80)}function setZoom(next){zoom=clampZoom(next);renderZoom();post('/zoom',{zoom})}tick();document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});img.addEventListener('click',e=>post('/click',point(e)));img.addEventListener('wheel',e=>{e.preventDefault();post('/scroll',{...point(e),deltaX:e.deltaX,deltaY:e.deltaY})},{passive:false});zoomOut.addEventListener('click',()=>setZoom(zoom-.1));zoomIn.addEventListener('click',()=>setZoom(zoom+.1));window.addEventListener('message',e=>{const data=e.data||{};if(data.type==='veil-browser-zoom')setZoom(data.zoom);if(data.type==='veil-browser-scroll')post('/scroll',{x:800,y:475,deltaX:Number(data.deltaX||0),deltaY:Number(data.deltaY||0)})});window.addEventListener('keydown',e=>{const meta=e.ctrlKey||e.metaKey;if(meta&&(e.key==='+'||e.key==='=')){e.preventDefault();setZoom(zoom+.1);return}if(meta&&e.key==='-'){e.preventDefault();setZoom(zoom-.1);return}if(meta&&e.key==='0'){e.preventDefault();setZoom(1);return}if(document.activeElement&&document.activeElement.id==='url')return;if(e.key.length===1||['Enter','Backspace','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown','Home','End','Escape',' '].includes(e.key)){e.preventDefault();post('/key',{key:e.key})}});closePopup.addEventListener('click',()=>post('/close-popup',{}));document.getElementById('nav').addEventListener('submit',async(e)=>{e.preventDefault();lastInput=Date.now();status.textContent='Navigating in cloud VM...';loading.style.display=hasFrame?'none':'grid';await fetch('/navigate',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({url:urlInput.value})});tick();});setInterval(async()=>{if(document.hidden)return;const r=await fetch('/health').then(r=>r.json()).catch(()=>null);if(r){if(r.url&&document.activeElement!==urlInput)urlInput.value=r.url;if(typeof r.zoom==='number'){zoom=clampZoom(r.zoom);renderZoom()}if(typeof r.quality==='number')quality=r.quality;if(typeof r.maxFps==='number')maxFps=r.maxFps;closePopup.style.display=r.popup?'inline-block':'none';if(misses<=6)status.textContent=r.error?'Remote error: '+r.error:(r.popup?'Popup window: ':'Cloud VM rendering ')+r.url;}},2500)</script></body></html>",
  ].join("");
}

boot().catch((error) => {
  lastError = error instanceof Error ? error.message : String(error);
});

http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", "http://localhost");

  if (url.pathname === "/health") {
    response.writeHead(200, {
      "access-control-allow-origin": "*",
      "cache-control": "no-store",
      "content-type": "application/json",
    });
    response.end(JSON.stringify({ ok: Boolean(page), popup: activeIsPopup, url: targetUrl, error: lastError, zoom: pageZoom, quality: frameQuality, maxFps }));
    return;
  }

  if (url.pathname === "/navigate" && request.method === "POST") {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", async () => {
      const body = JSON.parse(raw || "{}");
      await navigate(String(body.url || targetUrl));
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, url: targetUrl, error: lastError }));
    });
    return;
  }

  if (url.pathname === "/click" && request.method === "POST") {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", async () => {
      const body = JSON.parse(raw || "{}");
      const popup = page?.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
      await page?.mouse.click(Number(body.x || 0), Number(body.y || 0));
      const nextPage = await popup;
      if (nextPage) {
        await activatePage(nextPage, true);
      }
      await settlePage();
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, url: targetUrl, error: lastError }));
    });
    return;
  }

  if (url.pathname === "/scroll" && request.method === "POST") {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", async () => {
      const body = JSON.parse(raw || "{}");
      await page?.mouse.move(Number(body.x || 0), Number(body.y || 0));
      await page?.mouse.wheel(Number(body.deltaX || 0), Number(body.deltaY || 0));
      await settlePage();
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, url: targetUrl, error: lastError }));
    });
    return;
  }

  if (url.pathname === "/zoom" && request.method === "POST") {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", async () => {
      const body = JSON.parse(raw || "{}");
      await applyPageZoom(Number(body.zoom || 1));
      await settlePage();
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, url: targetUrl, error: lastError, zoom: pageZoom }));
    });
    return;
  }

  if (url.pathname === "/key" && request.method === "POST") {
    let raw = "";
    request.on("data", (chunk) => { raw += chunk; });
    request.on("end", async () => {
      const body = JSON.parse(raw || "{}");
      const key = String(body.key || "");
      if (key.length === 1) {
        await page?.keyboard.type(key);
      } else if (key) {
        await page?.keyboard.press(key);
      }
      await settlePage();
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true, url: targetUrl, error: lastError }));
    });
    return;
  }

  if (url.pathname === "/close-popup" && request.method === "POST") {
    if (activeIsPopup && page && mainPage && page !== mainPage) {
      try {
        await page.close();
      } catch {}
      page = mainPage;
      activeIsPopup = false;
      await settlePage();
    }
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, url: targetUrl, error: lastError }));
    return;
  }

  if (url.pathname === "/frame.jpg") {
    if (!page) {
      response.writeHead(503, { "content-type": "text/plain" });
      response.end("Browser is still booting");
      return;
    }
    try {
      const requestedQuality = Number(url.searchParams.get("quality") || frameQuality);
      const quality = Number.isFinite(requestedQuality)
        ? Math.min(90, Math.max(35, Math.round(requestedQuality)))
        : frameQuality;
      const frame = await page.screenshot({ type: "jpeg", quality, fullPage: false });
      response.writeHead(200, {
        "cache-control": "no-store",
        "content-type": "image/jpeg",
      });
      response.end(frame);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      response.writeHead(503, {
        "cache-control": "no-store",
        "content-type": "text/plain",
      });
      response.end("Frame not ready");
    }
    return;
  }

  const requestedTarget = url.searchParams.get("url");
  const requestedQuality = url.searchParams.get("quality");
  const requestedFps = url.searchParams.get("fps");
  if (requestedQuality) {
    const parsedQuality = Number(requestedQuality);
    if (Number.isFinite(parsedQuality)) {
      frameQuality = Math.min(90, Math.max(35, Math.round(parsedQuality)));
    }
  }
  if (requestedFps) {
    const parsedFps = Number(requestedFps);
    if (Number.isFinite(parsedFps)) {
      maxFps = Math.min(12, Math.max(1, Math.round(parsedFps)));
    }
  }
  if (requestedTarget && requestedTarget !== targetUrl) {
    void navigate(requestedTarget);
  }

  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(html());
}).listen(port, () => {
  console.log(JSON.stringify({ event: "vm-runner-ready", port, targetUrl }));
});
`;

export async function POST(request: Request) {
  const parsed = launchSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid VM launch request", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const targetUrl = normalizeUrl(parsed.data.url);
  const streamOptions = {
    fps: parsed.data.fps ?? Number(process.env.MAX_FPS || 6),
    quality: parsed.data.quality ?? Number(process.env.FRAME_QUALITY || 72),
  };
  streamOptions.fps = clampNumber(streamOptions.fps, 6, 1, 12);
  streamOptions.quality = clampNumber(streamOptions.quality, 72, 35, 90);
  const configuredWorkers = configuredWorkerProviders();
  const healthyWorkers = configuredWorkers.length
    ? await wakeHealthyWorkers(configuredWorkers)
    : [];

  if (healthyWorkers.length) {
    const [primaryWorker, ...backupWorkers] = healthyWorkers;
    return NextResponse.json({
      backupRunnerUrls: backupWorkers
        .slice(0, 5)
        .map((worker) => runnerUrlWithParams(worker.url, targetUrl, streamOptions)),
      mode: "worker-pool",
      provider: primaryWorker.name,
      providerLatencyMs: primaryWorker.latencyMs,
      runnerUrl: runnerUrlWithParams(primaryWorker.url, targetUrl, streamOptions),
      stream: streamOptions,
      targetUrl,
    });
  }

  try {
    const { Sandbox } = await import("@vercel/sandbox");
    const sandbox = await Sandbox.create({
      ports: [3000],
      runtime: "node24",
      env: {
        FRAME_QUALITY: String(streamOptions.quality),
        MAX_FPS: String(streamOptions.fps),
        TARGET_URL: targetUrl,
      },
    });

    await sandbox.writeFiles([
      {
        path: "package.json",
        content: Buffer.from(
          JSON.stringify({
            type: "module",
            scripts: { start: "node server.js" },
            dependencies: { playwright: "^1.52.0" },
          }),
        ),
      },
      { path: "server.js", content: Buffer.from(runnerServer) },
    ]);

    await sandbox.runCommand({
      cmd: "bash",
      args: [
        "-lc",
        "dnf install -y nss nspr atk at-spi2-atk cups-libs libdrm libxkbcommon libX11 libXcomposite libXdamage libXext libXfixes libXrandr mesa-libgbm pango cairo alsa-lib gtk3 && npm install --omit=dev && npx playwright install chromium && node server.js",
      ],
      detached: true,
      sudo: true,
    });

    const runnerUrl = sandbox.domain(3000);
    const ready = await waitForSandboxRunner(runnerUrl);

    return NextResponse.json({
      backupRunnerUrls: configuredWorkers
        .slice(0, 5)
        .map((worker) => runnerUrlWithParams(worker.url, targetUrl, streamOptions)),
      mode: "vercel-sandbox",
      ready,
      runnerUrl,
      sandboxId: sandbox.sandboxId,
      status: sandbox.status,
      stream: streamOptions,
      targetUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Cloud VM runner could not be launched. Set RENDER_VM_WORKER_URL, KOYEB_VM_WORKER_URL, or VM_WORKER_URL to a deployed free Playwright worker, or use the included Vercel Sandbox fallback.",
        detail: error instanceof Error ? error.message : String(error),
        targetUrl,
      },
      { status: 501 },
    );
  }
}
