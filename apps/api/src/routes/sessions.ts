import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { createIsolationPolicy } from "@veil/shared";
import type { BrowserSession } from "@veil/types";

const createSessionSchema = z.object({
  userId: z.string().min(1),
  workspaceId: z.string().min(1),
  mode: z.enum(["temporary", "persistent", "developer"]).default("temporary"),
  region: z.string().min(2).default("iad"),
});

const sessions = new Map<string, BrowserSession>();

export async function sessionRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    sessions: Array.from(sessions.values()),
  }));

  app.post("/", async (request, reply) => {
    const parsed = createSessionSchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.code(400).send({
        error: "Invalid session request",
        issues: parsed.error.flatten(),
      });
    }

    const now = new Date();
    const session: BrowserSession = {
      id: `cx-${randomUUID().slice(0, 8)}`,
      userId: parsed.data.userId,
      workspaceId: parsed.data.workspaceId,
      mode: parsed.data.mode,
      status: "allocating",
      region: parsed.data.region,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 45 * 60 * 1000).toISOString(),
      isolation: createIsolationPolicy(parsed.data.workspaceId, parsed.data.mode),
    };

    sessions.set(session.id, session);

    request.log.info(
      {
        sessionId: session.id,
        workspaceId: session.workspaceId,
        mode: session.mode,
      },
      "browser session allocated",
    );

    return reply.code(201).send({ session });
  });

  app.post("/:id/suspend", async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = sessions.get(id);

    if (!session) {
      return reply.code(404).send({ error: "Session not found" });
    }

    const next = { ...session, status: "suspended" as const };
    sessions.set(id, next);
    return { session: next };
  });

  app.delete("/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const session = sessions.get(id);

    if (!session) {
      return reply.code(404).send({ error: "Session not found" });
    }

    sessions.set(id, { ...session, status: "destroying" });
    sessions.delete(id);
    return reply.code(202).send({ status: "destroying", id });
  });
}
