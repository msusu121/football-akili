// src/config/env.ts
import path from 'path';
import { config as dotenv } from 'dotenv';
import { z } from 'zod';

// Load .env early, from project root by default
dotenv({ path: process.env.ENV_PATH || path.resolve(process.cwd(), '.env') });

// Small helpers
const toBool = (v: unknown, def = false) => {
  if (typeof v !== 'string') return def;
  const s = v.trim().toLowerCase();
  return s === '1' || s === 'true' || s === 'yes';
};
const toInt = (v: unknown, def: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : def;
};

// Define and validate all environment variables once
const EnvSchema = z.object({
  NODE_ENV: z.string().default('production'),
  PORT: z.preprocess((v) => toInt(v, 4000), z.number().int().positive()),

  APP_NAME: z.string().default('Mombasa United'),
  WEB_URL: z.string().url().default('https://mombasaunited.com'),

  // Mail identity (visible From header)
  MAIL_FROM: z.string().min(1), 

  // SMTP credentials (required; we always post them to the relay)
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.preprocess((v) => toInt(v, 587), z.number().int().positive()),
  SMTP_USER: z.string().min(1),
  SMTP_PASS: z.string().min(1),                 // if it has '#', QUOTE it in .env
  SMTP_SSL: z.preprocess((v) => toBool(v, false), z.boolean()),
  SMTP_STARTTLS: z.preprocess((v) => toBool(v, true), z.boolean()),

  // Relay (Flask)
  RELAY_URL: z.string().url(),                  // can be .../send or base; client handles both
  RELAY_SECRET: z.string().min(1),
});

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  // Pretty print first error and exit fast
  const issues = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const cfg = {
  ...parsed.data,
  isProd: parsed.data.NODE_ENV === 'production',
  smtpBlock: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT,
    username: parsed.data.SMTP_USER,
    password: parsed.data.SMTP_PASS,
    ssl: parsed.data.SMTP_SSL,
    starttls: parsed.data.SMTP_STARTTLS,
    debug: parsed.data.NODE_ENV !== 'production',
  },
} as const;
