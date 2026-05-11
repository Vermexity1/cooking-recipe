import { NextResponse } from "next/server";

export const runtime = "nodejs";

const providerEnv = [
  ["Render", "RENDER_VM_WORKER_URL"],
  ["Koyeb", "KOYEB_VM_WORKER_URL"],
  ["Oracle Cloud", "OCI_VM_WORKER_URL"],
  ["Primary worker", "VM_WORKER_URL"],
  ["Worker 1", "VM_WORKER_URL_1"],
  ["Worker 2", "VM_WORKER_URL_2"],
  ["Worker 3", "VM_WORKER_URL_3"],
  ["Worker 4", "VM_WORKER_URL_4"],
  ["Worker 5", "VM_WORKER_URL_5"],
] as const;

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

async function checkProvider(url: string) {
  const controller = new AbortController();
  const started = Date.now();
  const timer = setTimeout(() => controller.abort(), 1800);

  try {
    const response = await fetch(`${url}/health`, {
      cache: "no-store",
      headers: workerAuthToken()
        ? {
            "x-veil-worker-token": workerAuthToken(),
          }
        : undefined,
      signal: controller.signal,
    });
    const health = (await response.json().catch(() => ({}))) as { ok?: boolean };
    return {
      latencyMs: Date.now() - started,
      online: response.ok && Boolean(health.ok),
    };
  } catch {
    return {
      latencyMs: Date.now() - started,
      online: false,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function GET() {
  const providers = await Promise.all(
    configuredProviders().map(async (provider) => ({
      ...provider,
      ...(await checkProvider(provider.url)),
    })),
  );

  return NextResponse.json({
    configured: providers.length,
    providers,
    storagePolicy: "runtime frames, screenshots, and browser process data are ephemeral and not stored by this app",
  });
}
