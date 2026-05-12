import type { FastifyInstance } from "fastify";
import { z } from "zod";

import { generateReply } from "../services/geminiService";

const chatRequestSchema = z.object({
  botId: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/).optional(),
  channelId: z.string().optional(),
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function registerChatRoutes(app: FastifyInstance) {
  app.post("/chat/respond", async (request, reply) => {
    const payload = chatRequestSchema.parse(request.body);

    const response = await generateReply({
      botId: payload.botId,
      channelId: payload.channelId,
      message: payload.message,
      metadata: payload.metadata,
    });

    return reply.send({
      ok: true,
      data: {
        reply: response.text,
        model: response.model,
        sources: response.sources,
      },
    });
  });
}

