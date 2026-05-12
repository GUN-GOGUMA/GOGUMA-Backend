import { readFile } from "node:fs/promises";
import path from "node:path";

import { z } from "zod";

import type { BotConfig } from "../types/bot";

const knowledgeDocumentSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  tags: z.array(z.string().min(1)).optional(),
});

const botConfigSchema = z.object({
  botId: z.string().min(1),
  displayName: z.string().min(1),
  personality: z.string().min(1),
  fallbackMessage: z.string().min(1).optional(),
  knowledgeBase: z.array(knowledgeDocumentSchema).min(1),
});

const botsDir = path.resolve(process.cwd(), "data", "bots");

export async function loadBotConfig(botId: string): Promise<BotConfig> {
  const filePath = path.join(botsDir, `${botId}.json`);
  const raw = await readFile(filePath, "utf-8");
  const parsed = JSON.parse(raw);

  return botConfigSchema.parse(parsed);
}

