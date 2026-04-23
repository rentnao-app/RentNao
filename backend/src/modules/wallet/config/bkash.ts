/**
 * bKash Payment API Configuration
 * Handles credentials and endpoints for bKash integration
 */

import { z } from 'zod';

const bkashConfigSchema = z.object({
  // bKash API Credentials
  appKey: z.string().min(1, 'BKASH_APP_KEY is required'),
  appSecret: z.string().min(1, 'BKASH_APP_SECRET is required'),
  username: z.string().min(1, 'BKASH_USERNAME is required'),
  password: z.string().min(1, 'BKASH_PASSWORD is required'),
  
  // API Endpoints (sandbox/production)
  baseUrl: z.string().url('Invalid bKash base URL'),
  
  // Callback configuration
  callbackUrl: z.string().url('Invalid callback URL').optional(),
  
  // IP whitelist for webhooks (comma-separated)
  webhookIpWhitelist: z.string().optional().default(''),
});

export type BKashConfig = z.infer<typeof bkashConfigSchema>;

function validateBKashConfig(): BKashConfig {
  const config = bkashConfigSchema.safeParse({
    appKey: process.env.BKASH_APP_KEY,
    appSecret: process.env.BKASH_APP_SECRET,
    username: process.env.BKASH_USERNAME,
    password: process.env.BKASH_PASSWORD,
    baseUrl: process.env.BKASH_BASE_URL,
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

/**
 * Get list of whitelisted IPs for webhook validation
 */
export function getWhitelistedIps(): string[] {
  if (!bkashConfig.webhookIpWhitelist) {
    return [];
  }
  return bkashConfig.webhookIpWhitelist
    .split(',')
    .map((ip) => ip.trim())
    .filter((ip) => ip.length > 0);
}
