/**
 * bKash Payment API configuration.
 * Uses placeholder values during image build when env vars are not set.
 */

import { z } from 'zod';

const bkashConfigSchema = z.object({
  appKey: z.string().min(1, 'BKASH_APP_KEY is required'),
  appSecret: z.string().min(1, 'BKASH_APP_SECRET is required'),
  username: z.string().min(1, 'BKASH_USERNAME is required'),
  password: z.string().min(1, 'BKASH_PASSWORD is required'),
  baseUrl: z.string().url('Invalid bKash base URL'),
  callbackUrl: z.string().url('Invalid callback URL').optional(),
  webhookIpWhitelist: z.string().optional().default(''),
});

export type BKashConfig = z.infer<typeof bkashConfigSchema>;

function validateBKashConfig(): BKashConfig {
  const config = bkashConfigSchema.safeParse({
    appKey: process.env.BKASH_APP_KEY || 'build-placeholder-key',
    appSecret: process.env.BKASH_APP_SECRET || 'build-placeholder-secret',
    username: process.env.BKASH_USERNAME || 'build-placeholder-user',
    password: process.env.BKASH_PASSWORD || 'build-placeholder-pass',
    baseUrl: process.env.BKASH_BASE_URL || 'https://checkout.sandbox.bka.sh/v1.2.0-beta',
    callbackUrl: process.env.BKASH_CALLBACK_URL,
    webhookIpWhitelist: process.env.BKASH_WEBHOOK_IP_WHITELIST,
  });

  if (!config.success) {
    console.error('Invalid bKash configuration:', config.error.flatten());
    throw new Error('Invalid bKash configuration');
  }

  return config.data;
}

export const bkashConfig = validateBKashConfig();

export function getWhitelistedIps(): string[] {
  if (!bkashConfig.webhookIpWhitelist) {
    return [];
  }
  return bkashConfig.webhookIpWhitelist
    .split(',')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);
}
