import { env } from '@/config/env';
import { isValidBDPhone, normalizeBDPhone } from '../utils/validators';

type OtpPurpose = 'PHONE_VERIFICATION' | 'PASSWORD_RESET';

function toBulkSmsBdNumber(identifier: string): string {
  // Reuse central validation/normalization first, then apply provider-specific 880... format.
  const normalized = normalizeBDPhone(identifier);
  return normalized.startsWith('+') ? normalized.slice(1) : normalized;
}

function buildOtpMessage(otp: string, purpose: OtpPurpose, ttlSeconds: number): string {
  const ttlMinutes = Math.max(1, Math.ceil(ttlSeconds / 60));
  if (purpose === 'PASSWORD_RESET') {
    return `Your RentNao password reset code is ${otp}. It expires in ${ttlMinutes} minute(s).`;
  }
  return `Your RentNao verification code is ${otp}. It expires in ${ttlMinutes} minute(s).`;
}

async function sendViaBulkSmsBd(phoneNumber: string, message: string): Promise<void> {
  const apiKey = env.BULKSMSBD_API_KEY?.trim();
  const senderId = env.BULKSMSBD_SENDER_ID?.trim();

  if (!apiKey || !senderId) {
    throw new Error('BulkSMSBD is enabled but BULKSMSBD_API_KEY or BULKSMSBD_SENDER_ID is missing');
  }

  const body = new URLSearchParams({
    api_key: apiKey,
    senderid: senderId,
    number: phoneNumber,
    message,
  });

  const response = await fetch(env.BULKSMSBD_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const responseText = await response.text().catch(() => '');
  if (!response.ok) {
    throw new Error(`BulkSMSBD request failed (${response.status}): ${responseText || response.statusText}`);
  }
}

export async function sendPhoneOtp(args: {
  identifier: string;
  otp: string;
  purpose: OtpPurpose;
  ttlSeconds: number;
}): Promise<void> {
  if (!isValidBDPhone(args.identifier)) {
    throw new Error(`Invalid BD phone number for OTP send: ${args.identifier}`);
  }

  const normalized = toBulkSmsBdNumber(args.identifier);
  const message = buildOtpMessage(args.otp, args.purpose, args.ttlSeconds);

  if (!env.SMS_OTP_ENABLED || env.SMS_OTP_PROVIDER === 'CONSOLE') {
    console.log(`[OTP:${args.purpose}] ${normalized}: ${args.otp}`);
    return;
  }

  try {
    if (env.SMS_OTP_PROVIDER === 'BULKSMSBD') {
      await sendViaBulkSmsBd(normalized, message);
      console.log(`[SMS:${args.purpose}] OTP sent to ${normalized} via BULKSMSBD`);
      return;
    }

    console.log(`[OTP:${args.purpose}] ${normalized}: ${args.otp}`);
  } catch (error: any) {
    console.error(`[SMS:${args.purpose}] Provider send failed, fallback to console OTP`, {
      provider: env.SMS_OTP_PROVIDER,
      number: normalized,
      error: error?.message || String(error),
    });
    console.log(`[OTP:${args.purpose}] ${normalized}: ${args.otp}`);
  }
}
