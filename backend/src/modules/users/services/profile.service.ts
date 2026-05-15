import { db } from '@/db/client';
import { storage } from '@/db/s3';
import { AppError } from '@/errors/base';
import { REQUIRED_DOCUMENTS_BY_ROLE, DOCUMENT_DESCRIPTIONS } from '../utils/constants';
import type { UserRoleType, IdentityDocumentTypeType } from '@/types/enums';
import type { ProfilePhotoUploadUrlRequest } from '../schemas';

function createId() {
  return crypto.randomUUID();
}

export async function getProfilePhotoUploadUrl(
  userId: string,
  request: ProfilePhotoUploadUrlRequest
): Promise<{ uploadUrl: string; expiresIn: number; fileKey: string }> {
  const { fileName, mimeType } = request;

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
    throw new AppError(400, 'Invalid profile photo type. Allowed: image/jpeg, image/png, image/webp');
  }

  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const fileKey = `profiles/${userId}/avatar-${timestamp}.${extension}`;

  const presigned = await storage.presignUpload(fileKey, {
    fileName,
    mimeType,
    maxSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
  });

  return {
    uploadUrl: presigned.uploadUrl,
    expiresIn: presigned.expiresIn,
    fileKey,
  };
}

export async function getProfilePhotoDownloadUrl(
  userId: string
): Promise<{ downloadUrl: string; expiresIn: number }> {
  const profileResult = await db.query(
    'SELECT profile_picture_path FROM "BaseUserProfile" WHERE user_id = $1',
    [userId]
  );

  if (profileResult.rows.length === 0) {
    throw new AppError(404, 'User profile not found');
  }

  const key = profileResult.rows[0].profile_picture_path;
  if (!key) {
    throw new AppError(404, 'Profile photo not found');
  }

  const downloadUrl = await storage.presignDownload(key, 3600);

  return {
    downloadUrl,
    expiresIn: 3600,
  };
}

async function ensureWalletAccount(client: any, userId: string) {
  await client.query(
    `INSERT INTO "WalletAccount" (id, user_id, status, currency, available_balance)
     VALUES ($1, $2, 'ACTIVE', 'BDT', 0)
     ON CONFLICT (user_id) DO NOTHING`,
    [createId(), userId]
  );
}

export interface ProfileData {
  // Base profile fields
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  religion?: string;
  profession?: string;
  jobCategory?: string;
  profilePhotoKey?: string;
  currentLat?: number;
  currentLng?: number;
  currentArea?: string;
  
  // Tenant-specific
  incomeRange?: string;
  employmentStatus?: string;
  familyStatus?: string;
  familySize?: number;
  
  // Owner-specific
  ownerCategory?: string;
}

export interface ProfileCompletionSection {
  isComplete: boolean;
  filledFields: string[];
  missingFields: string[];
}

export interface ProfileCompletionStatus {
  base: ProfileCompletionSection;
  roleSpecific: ProfileCompletionSection;
  overall: boolean;
}

/**
 * Check completion for base profile (all roles)
 */
function checkBaseCompletion(profile: any): ProfileCompletionSection {
  const requiredFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'religion', 'profession', 'job_category', 'profile_picture_path', 'current_lat', 'current_lng', 'current_area'];
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    if (profile[field]) {
      filledFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  return {
    isComplete: missingFields.length === 0,
    filledFields,
    missingFields,
  };
}

/**
 * Check completion for tenant profile
 */
function checkTenantCompletion(profile: any): ProfileCompletionSection {
  const requiredFields = ['income_range', 'employment_status', 'family_status', 'family_size'];
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    if (profile[field]) {
      filledFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  return {
    isComplete: missingFields.length === 0,
    filledFields,
    missingFields,
  };
}

/**
 * Check completion for owner profile
 */
function checkOwnerCompletion(profile: any): ProfileCompletionSection {
  const requiredFields = ['owner_category'];
  const filledFields: string[] = [];
  const missingFields: string[] = [];

  requiredFields.forEach((field) => {
    if (profile[field]) {
      filledFields.push(field);
    } else {
      missingFields.push(field);
    }
  });

  return {
    isComplete: missingFields.length === 0,
    filledFields,
    missingFields,
  };
}

/**
 * Get profile completion status for a user (three-part: base, roleSpecific, overall)
 */
export async function getProfileCompletionStatus(
  userId: string,
  role: UserRoleType
): Promise<ProfileCompletionStatus> {
  const profileTable = role === 'TENANT' ? 'TenantProfile' : role === 'OWNER' ? 'OwnerProfile' : null;

  if (!profileTable) {
    return {
      base: { isComplete: false, filledFields: [], missingFields: [] },
      roleSpecific: { isComplete: false, filledFields: [], missingFields: [] },
      overall: false,
    };
  }

  // Check base profile
  const baseProfileResult = await db.query(
    'SELECT * FROM "BaseUserProfile" WHERE user_id = $1',
    [userId]
  );

  if (baseProfileResult.rows.length === 0) {
    return {
      base: { isComplete: false, filledFields: [], missingFields: [] },
      roleSpecific: { isComplete: false, filledFields: [], missingFields: [] },
      overall: false,
    };
  }

  const baseCompletion = checkBaseCompletion(baseProfileResult.rows[0]);

  // Check role-specific profile
  const roleProfileResult = await db.query(
    `SELECT * FROM "${profileTable}" WHERE user_id = $1`,
    [userId]
  );

  let roleCompletion: ProfileCompletionSection;
  if (roleProfileResult.rows.length === 0) {
    roleCompletion = {
      isComplete: false,
      filledFields: [],
      missingFields: role === 'TENANT' 
        ? ['income_range', 'employment_status', 'family_status', 'family_size'] 
        : ['owner_category'],
    };
  } else {
    roleCompletion = role === 'TENANT' 
      ? checkTenantCompletion(roleProfileResult.rows[0])
      : checkOwnerCompletion(roleProfileResult.rows[0]);
  }

  const overall = baseCompletion.isComplete && roleCompletion.isComplete;

  return {
    base: baseCompletion,
    roleSpecific: roleCompletion,
    overall,
  };
}

/**
 * Get required documents for a user role
 */
export function getRequiredDocuments(role: UserRoleType) {
  const requiredTypes = REQUIRED_DOCUMENTS_BY_ROLE[role] || [];
  return requiredTypes.map((type) => ({
    documentType: type,
    description: DOCUMENT_DESCRIPTIONS[type],
  }));
}

/**
 * Create or update user profile (all-or-nothing: validates completion after insert/update)
 */
export async function createOrUpdateProfile(
  userId: string,
  role: UserRoleType,
  data: ProfileData
): Promise<void> {
  const client = await db.connect();
  try {
    await client.query('BEGIN');

    // Update or create BaseUserProfile
    const baseProfileResult = await client.query(
      `SELECT id FROM "BaseUserProfile" WHERE user_id = $1`,
      [userId]
    );

    if (baseProfileResult.rows.length > 0) {
      // Update existing base profile
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (data.firstName) {
        updateFields.push(`first_name = $${paramIndex++}`);
        updateValues.push(data.firstName);
      }
      if (data.lastName) {
        updateFields.push(`last_name = $${paramIndex++}`);
        updateValues.push(data.lastName);
      }
      if (data.dateOfBirth) {
        updateFields.push(`date_of_birth = $${paramIndex++}::date`);
        updateValues.push(data.dateOfBirth);
      }
      if (data.gender) {
        updateFields.push(`gender = $${paramIndex++}`);
        updateValues.push(data.gender);
      }
      if (data.religion) {
        updateFields.push(`religion = $${paramIndex++}`);
        updateValues.push(data.religion);
      }
      if (data.profession) {
        updateFields.push(`profession = $${paramIndex++}`);
        updateValues.push(data.profession);
      }
      if (data.jobCategory) {
        updateFields.push(`job_category = $${paramIndex++}`);
        updateValues.push(data.jobCategory);
      }
      if (data.profilePhotoKey) {
        updateFields.push(`profile_picture_path = $${paramIndex++}`);
        updateValues.push(data.profilePhotoKey);
      }
      if (data.currentLat !== undefined) {
        updateFields.push(`current_lat = $${paramIndex++}`);
        updateValues.push(data.currentLat);
      }
      if (data.currentLng !== undefined) {
        updateFields.push(`current_lng = $${paramIndex++}`);
        updateValues.push(data.currentLng);
      }
      if (data.currentArea) {
        updateFields.push(`current_area = $${paramIndex++}`);
        updateValues.push(data.currentArea);
      }

      updateValues.push(userId);
      if (updateFields.length > 0) {
        await client.query(
          `UPDATE "BaseUserProfile" SET ${updateFields.join(', ')}, updated_at = NOW() WHERE user_id = $${paramIndex}`,
          updateValues
        );
      }
    } else {
      // Create new base profile
      await client.query(
        `INSERT INTO "BaseUserProfile" (
          id, user_id, first_name, last_name, date_of_birth, gender, religion, profession, 
          job_category, profile_picture_path, current_lat, current_lng, current_area
        ) VALUES ($1, $2, $3, $4, $5::date, $6, $7, $8, $9, $10, $11, $12, $13)`,
        [
          createId(),
          userId,
          data.firstName || null,
          data.lastName || null,
          data.dateOfBirth || null,
          data.gender || null,
          data.religion || null,
          data.profession || null,
          data.jobCategory || null,
          data.profilePhotoKey || null,
          data.currentLat || null,
          data.currentLng || null,
          data.currentArea || null,
        ]
      );
    }

    // Handle role-specific profile
    const profileTable = role === 'TENANT' ? 'TenantProfile' : 'OwnerProfile';
    const profileCheckResult = await client.query(
      `SELECT user_id FROM "${profileTable}" WHERE user_id = $1`,
      [userId]
    );

    if (profileCheckResult.rows.length === 0) {
      // Create role-specific profile
      if (role === 'TENANT') {
        await client.query(
          `INSERT INTO "TenantProfile" (
            tenant_id, user_id, income_range, employment_status, family_status, family_size
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            createId(),
            userId,
            data.incomeRange || null,
            data.employmentStatus || null,
            data.familyStatus || null,
            data.familySize || null,
          ]
        );
      } else if (role === 'OWNER') {
        await client.query(
          `INSERT INTO "OwnerProfile" (owner_id, user_id, owner_category) VALUES ($1, $2, $3)`,
          [createId(), userId, data.ownerCategory || null]
        );
      }
        await ensureWalletAccount(client, userId);
    } else {
      // Update role-specific profile
      if (role === 'TENANT') {
        const tenantFields: string[] = [];
        const tenantValues: any[] = [];
        let tenantParamIndex = 1;

        if (data.incomeRange) {
          tenantFields.push(`income_range = $${tenantParamIndex++}`);
          tenantValues.push(data.incomeRange);
        }
        if (data.employmentStatus) {
          tenantFields.push(`employment_status = $${tenantParamIndex++}`);
          tenantValues.push(data.employmentStatus);
        }
        if (data.familyStatus) {
          tenantFields.push(`family_status = $${tenantParamIndex++}`);
          tenantValues.push(data.familyStatus);
        }
        if (data.familySize !== undefined) {
          tenantFields.push(`family_size = $${tenantParamIndex++}`);
          tenantValues.push(data.familySize);
        }

        if (tenantFields.length > 0) {
          tenantValues.push(userId);
          await client.query(
            `UPDATE "TenantProfile" SET ${tenantFields.join(', ')} WHERE user_id = $${tenantParamIndex}`,
            tenantValues
          );
        }
          await ensureWalletAccount(client, userId);
      } else if (role === 'OWNER') {
        if (data.ownerCategory) {
          await client.query(
            `UPDATE "OwnerProfile" SET owner_category = $1 WHERE user_id = $2`,
            [data.ownerCategory, userId]
          );
        }
          await ensureWalletAccount(client, userId);
      }
    }

    // Update User onboarding status
    await client.query(
      `UPDATE "User" SET onboarding_status = 'PROFILE_PENDING', updated_at = NOW() 
       WHERE user_id = $1 AND onboarding_status IN ('PHONE_REQUIRED', 'PHONE_VERIFICATION_PENDING')`,
      [userId]
    );

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/**
 * Get uploaded documents for a user
 */
export async function getUserDocuments(userId: string) {
  const result = await db.query(
    `SELECT id, document_type, verification_status, uploaded_at, rejection_reason
     FROM "UserIdentityDocument" 
     WHERE user_id = $1 
     ORDER BY uploaded_at DESC`,
    [userId]
  );

  return result.rows;
}

/**
 * Get merged profile details (base + role-specific) for display.
 */
export async function getProfileDetails(userId: string, role: UserRoleType) {
  const baseResult = await db.query(
    `SELECT
      first_name, last_name, date_of_birth, gender, religion, profession,
      job_category, profile_picture_path, current_lat, current_lng, current_area
     FROM "BaseUserProfile"
     WHERE user_id = $1`,
    [userId]
  );

  const base = baseResult.rows[0] || {};

  let roleSpecific: any = {};
  if (role === 'TENANT') {
    const tenantResult = await db.query(
      `SELECT income_range, employment_status, family_status, family_size
       FROM "TenantProfile"
       WHERE user_id = $1`,
      [userId]
    );
    roleSpecific = tenantResult.rows[0] || {};
  } else if (role === 'OWNER') {
    const ownerResult = await db.query(
      `SELECT owner_category
       FROM "OwnerProfile"
       WHERE user_id = $1`,
      [userId]
    );
    roleSpecific = ownerResult.rows[0] || {};
  }

  return {
    firstName: base.first_name || null,
    lastName: base.last_name || null,
    dateOfBirth: base.date_of_birth || null,
    gender: base.gender || null,
    religion: base.religion || null,
    profession: base.profession || null,
    jobCategory: base.job_category || null,
    profilePhotoKey: base.profile_picture_path || null,
    currentLat: base.current_lat ?? null,
    currentLng: base.current_lng ?? null,
    currentArea: base.current_area || null,
    incomeRange: roleSpecific.income_range || null,
    employmentStatus: roleSpecific.employment_status || null,
    familyStatus: roleSpecific.family_status || null,
    familySize: roleSpecific.family_size ?? null,
    ownerCategory: roleSpecific.owner_category || null,
  };
}
