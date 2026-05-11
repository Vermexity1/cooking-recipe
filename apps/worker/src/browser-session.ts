import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { chromium, type BrowserContext, type Page } from "playwright";

type BrowserSession = {
  id: string;
  isolation: {
    disposableStorage: boolean;
  };
};

export type WorkerSessionConfig = {
  session: BrowserSession;
  scratchRoot: string;
  initialUrl?: string;
};

export class RemoteBrowserSession {
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  constructor(private readonly config: WorkerSessionConfig) {}

  get storagePath() {
    return join(this.config.scratchRoot, this.config.session.id);
  }

  async launch() {
    await mkdir(this.storagePath, { recursive: true });

    this.context = await chromium.launchPersistentContext(this.storagePath, {
      headless: true,
      chromiumSandbox: true,
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      permissions: [],
      acceptDownloads: true,
      ignoreHTTPSErrors: false,
      args: [
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--disable-background-networking",
        "--disable-sync",
        "--no-first-run",
        "--mute-audio",
      ],
    });

    this.page = this.context.pages()[0] ?? (await this.context.newPage());
    await this.page.goto(this.config.initialUrl ?? "https://example.com", {
      waitUntil: "domcontentloaded",
    });

    return this.page;
  }

  async navigate(url: string) {
    if (!this.page) {
      throw new Error("Browser session has not launched");
    }

    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async screenshotFrame(quality = 72) {
    if (!this.page) {
      throw new Error("Browser session has not launched");
    }

    const safeQuality = Number.isFinite(quality)
      ? Math.min(90, Math.max(35, Math.round(quality)))
      : 72;

    return this.page.screenshot({ type: "jpeg", quality: safeQuality });
  }

  async click(x: number, y: number) {
    if (!this.page) {
      throw new Error("Browser session has not launched");
    }

    await this.page.mouse.click(x, y);
  }

  async scroll(x: number, y: number, deltaX: number, deltaY: number) {
    if (!this.page) {
      throw new Error("Browser session has not launched");
    }

    await this.page.mouse.move(x, y);
    await this.page.mouse.wheel(deltaX, deltaY);
  }

  async key(key: string) {
    if (!this.page) {
      throw new Error("Browser session has not launched");
    }

    if (key.length === 1) {
      await this.page.keyboard.type(key);
      return;
    }

    await this.page.keyboard.press(key);
  }

  async close() {
    await this.context?.close();
    this.context = null;
    this.page = null;

    if (this.config.session.isolation.disposableStorage) {
      await rm(this.storagePath, { force: true, recursive: true });
    }
  }
}
