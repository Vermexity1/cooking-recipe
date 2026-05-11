import type { RemoteBrowserSession } from "./browser-session.js";

type InputEventEnvelope =
  | { sessionId: string; type: "clipboard" }
  | { sessionId: string; type: "keyboard" | "mouse" | "scroll" };

export class StreamBridge {
  constructor(private readonly browser: RemoteBrowserSession) {}

  async nextFallbackFrame(quality = 72) {
    const bytes = await this.browser.screenshotFrame(quality);

    return {
      encoding: "jpeg-delta" as const,
      width: 1440,
      height: 1000,
      bytes,
      capturedAt: new Date().toISOString(),
    };
  }

  async applyInput(event: InputEventEnvelope) {
    if (event.type === "clipboard") {
      return { accepted: true, type: event.type };
    }

    return { accepted: true, type: event.type };
  }

  async click(x: number, y: number) {
    await this.browser.click(x, y);
    return { accepted: true, type: "click" as const };
  }

  async scroll(x: number, y: number, deltaX: number, deltaY: number) {
    await this.browser.scroll(x, y, deltaX, deltaY);
    return { accepted: true, type: "scroll" as const };
  }

  async key(key: string) {
    await this.browser.key(key);
    return { accepted: true, type: "key" as const };
  }
}
