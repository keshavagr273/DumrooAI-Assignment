import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000').transform(Number),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),

  // Auth
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_COOKIE_MAX_AGE_MS: z.string().default('604800000').transform(Number),

  // MongoDB
  MONGODB_URI: z.string().url(),

  // Supabase
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().default('feedback-attachments'),

  // Teams
  TEAMS_FEEDBACK_WEBHOOK_URL: z.string().url(),

  // Feedback
  FEEDBACK_MAX_ATTACHMENTS: z.string().default('5').transform(Number),
  FEEDBACK_MAX_FILE_SIZE_MB: z.string().default('5').transform(Number),
  FEEDBACK_DESCRIPTION_MIN_LENGTH: z.string().default('10').transform(Number),
  FEEDBACK_DESCRIPTION_MAX_LENGTH: z.string().default('5000').transform(Number),
  FEEDBACK_SIGNED_URL_EXPIRES_SECONDS: z.string().default('3600').transform(Number),
  FEEDBACK_UPLOAD_URL_EXPIRES_SECONDS: z.string().default('300').transform(Number),
  FEEDBACK_ORPHAN_CLEANUP_GRACE_MINUTES: z.string().default('60').transform(Number),
  FEEDBACK_RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform(Number),
  FEEDBACK_RATE_LIMIT_MAX_REQUESTS: z.string().default('20').transform(Number),
});

let env;

try {
  env = envSchema.parse(process.env);
} catch (err) {
  console.error('❌  Invalid environment variables:\n', err.flatten().fieldErrors);
  process.exit(1);
}

export default env;

