import type {
  UserRoleType,
  OnboardingStatusType,
  KycVerificationStatusType,
} from '@/types/enums';

export interface Principal {
  userId: string;
  role: UserRoleType;
  onboardingStatus: OnboardingStatusType;
  kycVerificationStatus: KycVerificationStatusType;
  jti?: string;
  iat?: number;
  exp?: number;
}

declare module 'hono' {
  interface ContextVariableMap {
    user: Principal;
    authToken: string;
  }
}
