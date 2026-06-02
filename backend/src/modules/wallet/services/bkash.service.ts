/**
 * bKash Payment API Integration Service
 * Handles communication with bKash Payment API
 */

import crypto from 'crypto';
import { bkashConfig } from '../config/bkash';
import { AppError } from '@/errors/base';

interface BKashPaymentCreateRequest {
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
}

interface BKashPaymentCreateResponse {
  statusCode?: string;
  statusMessage?: string;
  bkashURL?: string;
  paymentID?: string;
  callbackURL?: string;
  successCallbackURL?: string;
  failureCallbackURL?: string;
  cancelledCallbackURL?: string;
  transactionStatus?: string;
}

interface BKashTokenResponse {
  id_token?: string;
  refresh_token?: string;
  token_type?: string;
  expires_in?: string;
}

interface BKashRefreshTokenRequest {
  app_key: string;
  app_secret: string;
  refresh_token: string;
}

interface BKashExecuteResponse {
  statusCode?: string;
  statusMessage?: string;
  paymentID?: string;
  transactionID?: string;
  trxID?: string;
  transactionStatus?: string;
  amount?: string;
  currency?: string;
  customerNumber?: string;
  merchantInvoiceNumber?: string;
  createTime?: string;
  updateTime?: string;
}

function buildBearerAuthHeader(token: string): string {
  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
}

/**
 * Get OAuth token from bKash
 */
async function getOAuthToken(): Promise<string> {
  const requestBody = {
    app_key: bkashConfig.appKey,
    app_secret: bkashConfig.appSecret,
  };

  const response = await fetch(`${bkashConfig.baseUrl}/checkout/token/grant`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'username': bkashConfig.username,
      'password': bkashConfig.password,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(500, `bKash OAuth failed: ${error}`);
  }

  const data = (await response.json()) as BKashTokenResponse;
  if (!data.id_token) {
    throw new AppError(500, 'bKash OAuth: missing id_token');
  }

  return data.id_token;
}

/**
 * Refresh OAuth token from bKash
 */
export async function refreshOAuthToken(refreshToken: string): Promise<BKashTokenResponse> {
  const requestBody: BKashRefreshTokenRequest = {
    app_key: bkashConfig.appKey,
    app_secret: bkashConfig.appSecret,
    refresh_token: refreshToken,
  };

  const response = await fetch(`${bkashConfig.baseUrl}/checkout/token/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'username': bkashConfig.username,
      'password': bkashConfig.password,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new AppError(500, `bKash token refresh failed: ${error}`);
  }

  return (await response.json()) as BKashTokenResponse;
}

/**
 * Create payment intent with bKash
 */
export async function createPaymentIntent(
  amount: number,
  merchantInvoiceNumber: string
): Promise<{ paymentId: string }> {
  try {
    const token = await getOAuthToken();

    const requestBody: BKashPaymentCreateRequest = {
      amount: amount.toString(),
      currency: 'BDT',
      intent: 'sale',
      merchantInvoiceNumber,
    };

    const response = await fetch(`${bkashConfig.baseUrl}/checkout/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': buildBearerAuthHeader(token),
        'X-APP-Key': bkashConfig.appKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(500, `bKash payment creation failed: ${error}`);
    }

    const data = (await response.json()) as BKashPaymentCreateResponse;

    if (data.statusCode && data.statusCode !== '0000') {
      throw new AppError(400, `bKash error: ${data.statusMessage || 'Create payment failed'}`);
    }

    if (!data.paymentID) {
      throw new AppError(500, 'bKash: missing paymentID in create response');
    }

    return {
      paymentId: data.paymentID,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `bKash integration error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Execute payment after user completes bKash flow
 * (Called from webhook or client callback)
 */
export async function executePayment(paymentId: string): Promise<BKashExecuteResponse> {
  try {
    const token = await getOAuthToken();

    const response = await fetch(`${bkashConfig.baseUrl}/checkout/payment/execute/${encodeURIComponent(paymentId)}`, {
      method: 'POST',
      headers: {
        'Authorization': buildBearerAuthHeader(token),
        'X-APP-Key': bkashConfig.appKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(500, `bKash payment execution failed: ${error}`);
    }

    const data = (await response.json()) as BKashExecuteResponse;
    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `bKash execution error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Query payment status from bKash
 */
export async function queryPayment(paymentId: string): Promise<BKashExecuteResponse> {
  try {
    const token = await getOAuthToken();

    const response = await fetch(`${bkashConfig.baseUrl}/checkout/payment/query/${encodeURIComponent(paymentId)}`, {
      method: 'GET',
      headers: {
        'Authorization': buildBearerAuthHeader(token),
        'X-APP-Key': bkashConfig.appKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(500, `bKash payment query failed: ${error}`);
    }

    const data = (await response.json()) as BKashExecuteResponse;
    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `bKash query error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Void payment in bKash
 */
export async function voidPayment(paymentId: string): Promise<BKashExecuteResponse> {
  try {
    const token = await getOAuthToken();

    const response = await fetch(`${bkashConfig.baseUrl}/checkout/payment/void/${encodeURIComponent(paymentId)}`, {
      method: 'POST',
      headers: {
        'Authorization': buildBearerAuthHeader(token),
        'X-APP-Key': bkashConfig.appKey,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new AppError(500, `bKash payment void failed: ${error}`);
    }

    const data = (await response.json()) as BKashExecuteResponse;
    return data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(500, `bKash void error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Validate webhook signature from bKash
 * Uses HMAC-SHA256 with app secret
 */
export function validateWebhookSignature(
  payload: Record<string, any>,
  signature: string
): boolean {
  // Create sorted key string for HMAC
  const sortedKeys = Object.keys(payload).sort();
  const signatureString = sortedKeys.map((key) => `${key}=${payload[key]}`).join(',');

  const computedSignature = crypto
    .createHmac('sha256', bkashConfig.appSecret)
    .update(signatureString)
    .digest('hex');

  return computedSignature === signature;
}