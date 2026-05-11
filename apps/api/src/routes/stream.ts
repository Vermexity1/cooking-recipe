import type { FastifyInstance } from "fastify";
import { buildInitialStreamState, isInputEvent } from "@veil/streaming";

export async function streamRoutes(app: FastifyInstance) {
  app.get("/:sessionId/offer", async (request) => {
    const { sessionId } = request.params as { sessionId: string };

    return {
      offer: {
        sessionId,
        transport: "webrtc",
        sdp: "generated-by-stream-relay",
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      },
    };
  });

  app.get("/:sessionId/events", { websocket: true }, (socket, request) => {
    const { sessionId } = request.params as { sessionId: string };
    const state = buildInitialStreamState(sessionId);

    socket.send(JSON.stringify({ type: "stream-ready", state }));

    socket.on("message", (raw) => {
      const payload = JSON.parse(raw.toString()) as unknown;

      if (!isInputEvent(payload)) {
        socket.send(JSON.stringify({ type: "input-rejected", reason: "invalid" }));
        return;
      }

      request.log.debug({ sessionId, inputType: payload.type }, "remote input accepted");
      socket.send(JSON.stringify({ type: "input-ack", inputType: payload.type }));
    });
  });
}
