import type { FastifyInstance } from "fastify";

export async function bookmarkRoutes(app: FastifyInstance) {
  app.get("/", async () => ({
    bookmarks: [
      {
        id: "bm-security",
        title: "Security playbook",
        url: "veil://vault/security",
        workspaceId: "private",
      },
    ],
  }));
}
