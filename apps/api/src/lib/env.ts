import { z } from "zod";
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  JWT_ACCESS_SECRET: z.string().min(1),
  JWT_REFRESH_SECRET: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  PORT: z.string().default("3001"),
});
export const env = envSchema.parse(process.env);
