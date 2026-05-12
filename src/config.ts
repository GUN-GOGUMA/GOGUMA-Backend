import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv();

const envSchema = z.object({
  HOST: z.string().default("0.0.0.0"),
  PORT: z.coerce.number().int().positive().default(3000),
  GOOGLE_API_KEY: z.string().min(1, "GOOGLE_API_KEY is required."),
  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),
  DEFAULT_BOT_ID: z.string().default("gsm-guide"),
});

export const env = envSchema.parse(process.env);
