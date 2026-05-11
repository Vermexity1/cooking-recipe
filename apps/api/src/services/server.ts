import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import websocket from "@fastify/websocket";
import Fastify from "fastify";
import { securityHeaders } from "@veil/config";
import { adminRoutes } from "../routes/admin.js";
import { bookmarkRoutes } from "../routes/bookmarks.js";
import { sessionRoutes } from "../routes/sessions.js";
import { streamRoutes } from "../routes/stream.js";

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
    },
  });

  app.addHook("onRequest", async (_request, reply) => {
    Object.entries(securityHeaders).forEach(([key, value]) => {
      reply.header(key, value);
    });
  });

  await app.register(cors, {
    origin: process.env.WEB_ORIGIN?.split(",") ?? false,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 240,
    timeWindow: "1 minute",
  });

  await app.register(websocket);

  await app.register(sessionRoutes, { prefix: "/sessions" });
  await app.register(streamRoutes, { prefix: "/stream" });
  await app.register(bookmarkRoutes, { prefix: "/bookmarks" });
  await app.register(adminRoutes, { prefix: "/admin" });

  app.get("/health", async () => ({
    status: "healthy",
    service: "api",
    time: new Date().toISOString(),
  }));

  return app;
}
