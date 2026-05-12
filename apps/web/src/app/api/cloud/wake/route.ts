import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

const providerEnv = [
  ["Render", "RENDER_VM_WORKER_URL"],
  ["Koyeb", "KOYEB_VM_WORKER_URL"],
  ["Primary worker", "VM_WORKER_URL"],
  ["Worker 1", "VM_WORKER_URL_1"],
  ["Worker 2", "VM_WORKER_URL_2"],
  ["Worker 3", "VM_WORKER_URL_3"],
  ["Worker 4", "VM_WORKER_URL_4"],
  ["Worker 5", "VM_WORKER_URL_5"],
] as const;

type ProviderStatus = {
  env: string;
  error?: string;
  latencyMs: number;
  name: string;
  online: boolean;
  status: "online" | "warming" | "offline";
  url: string;
};

function workerAuthToken() {
  return (process.env.VM_WORKER_AUTH_TOKEN ?? process.env.WORKER_AUTH_TOKEN ?? "").trim();
}

function configuredProviders() {
  const direct = providerEnv
    .map(([name, env]) => ({
      env,
      name,
      url: process.env[env]?.trim() ?? "",
    }))
    .filter((provider) => provider.url);

  const pooled = (process.env.VM_WORKER_URLS ?? "")
    .split(/[\n,]/)
    .map((url) => url.trim())
    .filter(Boolean)
    .map((url, index) => ({
      env: "VM_WORKER_URLS",
      name: `Pool worker ${index + 1}`,
      url,
    }));

  const seen = new Set<string>();
  return [...direct, ...pooled].filter((provider) => {
    if (seen.has(provider.url)) {
      return false;
    }
    seen.add(provider.url);
    return true;
  });
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkProvider(
  provider: ReturnType<typeof configuredProviders>[number],
  timeoutMs: number,
): Promise<ProviderStatus> {
  const controller = new AbortController();
  const started = Date.now();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${provider.url}/health`, {
      cache: "no-store",
      headers: workerAuthToken()
        ? {
            "x-veil-worker-token": workerAuthToken(),
          }
        : undefined,
      signal: controller.signal,
    });
    const health = (await response.json().catch(() => ({}))) as {
      error?: string;
      ok?: boolean;
      status?: string;
    };
    const online = response.ok && Boolean(health.ok);
    return {
      ...provider,
      error: health.error,
      latencyMs: Date.now() - started,
      online,
      status: online ? "online" : response.ok ? "warming" : "offline",
    };
  } catch (error) {
    return {
      ...provider,
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - started,
      online: false,
      status: "offline",
    };
  } finally {
    clearTimeout(timer);
  }
}

async function checkProviders(
  providers: ReturnType<typeof configuredProviders>,
  timeoutMs: number,
) {
  return Promise.all(providers.map((provider) => checkProvider(provider, timeoutMs)));
}

export async function POST() {
  const providers = configuredProviders();

  if (!providers.length) {
    return NextResponse.json({
      configured: 0,
      message: "No free worker URLs are configured yet.",
      providers: [],
      status: "missing",
    });
  }

  let statuses = await checkProviders(providers, 15000);

  for (let attempt = 0; attempt < 20 && !statuses.some((provider) => provider.online); attempt += 1) {
    await delay(2500);
    statuses = await checkProviders(providers, 5000);
  }

  const online = statuses.filter((provider) => provider.online);

  return NextResponse.json({
    configured: providers.length,
    message: online.length
      ? `${online[0].name} is awake.`
      : "Workers were pinged, but none are ready yet.",
    providers: statuses,
    status: online.length ? "online" : "warming",
  });
}
