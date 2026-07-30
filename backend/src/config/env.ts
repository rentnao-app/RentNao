/**
 * Environment configuration with validation
 */

import type { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PUBLIC_API_ORIGIN: z.string().url().optional(),
  DATABASE_URL: z.url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d') as z.ZodType<SignOptions['expiresIn']>,
  CORS_ORIGIN: z.string().default('*'),
  // Google OAuth (optional; required only if using "Continue with Google")
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  SUPABASE_URL: z.url().optional(),
  SUPABASE_KEY: z.string().optional(),
  // S3-compatible storage (local MinIO/LocalStack)
  S3_INTERNAL_ENDPOINT: z.string().url().optional(),
  S3_PUBLIC_ENDPOINT: z.string().url().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY: z.string().optional(),
  S3_SECRET_KEY: z.string().optional(),
  AWS_REGION: z.string().optional(),
  S3_REQUIRED: z.string().default('false').transform((val) => val.toLowerCase() === 'true'),
  // Redis configuration
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0').transform((val) => parseInt(val, 10)),
  REDIS_MAX_RETRIES: z.string().default('3').transform((val) => parseInt(val, 10)),
  REDIS_CONNECT_TIMEOUT: z.string().default('10000').transform((val) => parseInt(val, 10)),
  // SMS OTP provider configuration
  SMS_OTP_ENABLED: z.string().default('false').transform((val) => val.toLowerCase() === 'true'),
  SMS_OTP_PROVIDER: z.enum(['CONSOLE', 'BULKSMSBD']).default('CONSOLE'),
  BULKSMSBD_API_URL: z.string().url().default('http://bulksmsbd.net/api/smsapi'),
  BULKSMSBD_API_KEY: z.string().optional(),
  BULKSMSBD_SENDER_ID: z.string().optional(),
  // KYC.bd Configuration
  KYC_BD_API_KEY: z.string().optional(),
  KYC_BD_BASE_URL: z.string().url().default('https://sandbox.kyc.bd/api/v1'),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('Invalid environment variables:', z.treeifyError(parsed.error));
    throw new Error('Invalid environment variables');
  }

  return parsed.data;
}

export const env = validateEnv();
