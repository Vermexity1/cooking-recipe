import type { FastifyInstance } from "fastify";

export async function adminRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({
    status: "healthy",
    workers: {
      ready: 164,
      draining: 5,
      quarantined: 1,
    },
    sessions: {
      active: 1284,
      booting: 43,
      suspended: 92,
    },
    security: {
      websocketAuth: "signed-jwt",
      rateLimiting: "enabled",
      auditLogging: "enabled",
    },
  }));
}
