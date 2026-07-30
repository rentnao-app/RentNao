import { env } from '../../../config/env.js';
import type { IdentityVerifyInput, KycBdResponse } from '../schemas/index.js';
import { kycBdResponseSchema } from '../schemas/index.js';

export class KycBdService {
  /**
   * Validates the format of a Bangladesh NID number.
   * - Smart NID: 10 digits
   * - Legacy NID: 13 digits
   * - Legacy NID (with birth year): 17 digits
   */
  public static isValidNidFormat(nid: string): boolean {
    const cleanNid = nid.trim().replace(/[\s-]/g, '');
    if (!/^\d+$/.test(cleanNid)) return false;
    return [10, 13, 17].includes(cleanNid.length);
  }

  /**
   * Calls the KYC.bd API to verify a user's identity.
   */
  public static async verifyIdentity(
    input: IdentityVerifyInput
  ): Promise<KycBdResponse> {
    const apiKey = env.KYC_BD_API_KEY;
    const baseUrl = (env.KYC_BD_BASE_URL || 'https://sandbox.kyc.bd/api/v1').replace(/\/$/, '');
    
    // Defaulting to the text-based verify endpoint for Option 3
    const endpoint = '/identity/verify';
    const targetUrl = `${baseUrl}${endpoint}`;

    if (!apiKey) {
      console.warn('KYC_BD_API_KEY is not configured in environment variables.');
      return {
        status: 'error',
        error: 'Missing API Key configuration',
      };
    }

    if (!this.isValidNidFormat(input.nationalId)) {
      return {
        status: 'error',
        error: 'Invalid NID format provided.',
      };
    }

    const requestPayload = {
      full_name: input.fullName,
      date_of_birth: input.dateOfBirth,
      national_id: input.nationalId,
      mobile: input.mobile || '', // Send empty if not available
      consent: true, // User consented during the UI upload process
      reference_id: input.referenceId,
    };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestPayload),
      });

      const rawResponseData = await response.json();
      const parsedData = kycBdResponseSchema.safeParse(rawResponseData);

      if (!parsedData.success) {
        console.error('[KYC.BD Schema Error]:', parsedData.error);
        return {
          status: 'error',
          error: 'Received unexpected response format from verification service.',
        };
      }

      const responseData = parsedData.data;

      // If HTTP fails, ensure we return an error status so caller can fallback
      if (!response.ok) {
        return {
          status: 'error',
          error: responseData.error || responseData.message || `HTTP ${response.status} ${response.statusText}`,
        };
      }

      return responseData;
    } catch (error: any) {
      console.error('[KYC.BD API Error]:', error.message || error);
      // Return a structured error rather than throwing, so verification.service.ts
      // can gracefully fallback to UNDER_REVIEW mode.
      return {
        status: 'error',
        error: 'Failed to connect to verification service.',
      };
    }
  }
}
