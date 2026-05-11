import { buildServer } from "./services/server.js";

const app = await buildServer();
const port = Number(process.env.PORT ?? 4000);

await app.listen({ host: "0.0.0.0", port });
app.log.info({ port }, "Veil API control plane listening");
