import Fastify from "fastify";

import { registerChatRoutes } from "./routes/chat";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  app.get("/health", async () => ({
    ok: true,
  }));

  registerChatRoutes(app);

  return app;
}

