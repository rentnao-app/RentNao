import pg from 'pg';

type SeedConfig = {
  email: string;
  role: 'TENANT' | 'OWNER';
  password: string;
  contactPhone?: string | null;
  firstName: string;
  lastName: string;
  profession: string;
  jobCategory: string;
  profilePhotoUrl: string;
  currentLat: number;
  currentLng: number;
  currentArea: string;
};

async function ensureUser(client: pg.PoolClient, cfg: SeedConfig) {
  const hash = await Bun.password.hash(cfg.password, {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  let userId: string;
  const existingCred = await client.query(
    `SELECT user_id FROM "Credentials" WHERE identifier_type = $1 AND identifier = $2 LIMIT 1`,
    ['EMAIL', cfg.email]
  );

  if (existingCred.rows.length > 0) {
    userId = existingCred.rows[0].user_id as string;
    await client.query(
      `UPDATE "Credentials"
       SET password_hash = $1,
           verified_at = NOW(),
           updated_at = NOW()
       WHERE identifier_type = $2 AND identifier = $3`,
      [hash, 'EMAIL', cfg.email]
    );
  } else {
    const insertedUser = await client.query(
      `INSERT INTO "User" (user_id, role, onboarding_status, kyc_verification_status, contact_email, contact_phone, is_active)
       VALUES (gen_random_uuid()::text, $1, 'COMPLETED', 'APPROVED', $2, $3, true)
       RETURNING user_id`,
      [cfg.role, cfg.email, cfg.contactPhone ?? null]
    );
    userId = insertedUser.rows[0].user_id as string;

    await client.query(
      `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash, verified_at)
       VALUES (gen_random_uuid()::text, $1, $2, 'EMAIL', $3, NOW())`,
      [userId, cfg.email, hash]
    );
  }

  await client.query(
    `UPDATE "User"
     SET role = $1,
         onboarding_status = 'COMPLETED',
         kyc_verification_status = 'APPROVED',
         contact_email = $2,
         contact_phone = COALESCE($3, contact_phone),
         is_active = true,
         deleted_at = NULL,
         updated_at = NOW(),
         last_login_at = NOW()
     WHERE user_id = $4`,
    [cfg.role, cfg.email, cfg.contactPhone ?? null, userId]
  );

  await client.query(
    `INSERT INTO "BaseUserProfile" (
      id, user_id, first_name, last_name, date_of_birth, gender, religion, profession,
      job_category, profile_picture_path, current_lat, current_lng, current_area
    ) VALUES (
      gen_random_uuid()::text, $1, $2, $3, '1995-05-15'::date, 'MALE', 'Islam', $4,
      $5, $6, $7, $8, $9
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      date_of_birth = EXCLUDED.date_of_birth,
      gender = EXCLUDED.gender,
      religion = EXCLUDED.religion,
      profession = EXCLUDED.profession,
      job_category = EXCLUDED.job_category,
      profile_picture_path = EXCLUDED.profile_picture_path,
      current_lat = EXCLUDED.current_lat,
      current_lng = EXCLUDED.current_lng,
      current_area = EXCLUDED.current_area,
      updated_at = NOW()`,
    [
      userId,
      cfg.firstName,
      cfg.lastName,
      cfg.profession,
      cfg.jobCategory,
      cfg.profilePhotoUrl,
      cfg.currentLat,
      cfg.currentLng,
      cfg.currentArea,
    ]
  );

  if (cfg.role === 'TENANT') {
    await client.query(`DELETE FROM "OwnerProfile" WHERE user_id = $1`, [userId]);
    await client.query(
      `INSERT INTO "TenantProfile" (tenant_id, user_id, income_range, employment_status, family_status, family_size)
       VALUES (gen_random_uuid()::text, $1, 'RANGE_40K_60K', 'EMPLOYED', 'FAMILY', 3)
       ON CONFLICT (user_id)
       DO UPDATE SET
         income_range = EXCLUDED.income_range,
         employment_status = EXCLUDED.employment_status,
         family_status = EXCLUDED.family_status,
         family_size = EXCLUDED.family_size`,
      [userId]
    );
  } else {
    await client.query(`DELETE FROM "TenantProfile" WHERE user_id = $1`, [userId]);
    await client.query(
      `INSERT INTO "OwnerProfile" (owner_id, user_id, owner_category)
       VALUES (gen_random_uuid()::text, $1, 'RESIDENTIAL')
       ON CONFLICT (user_id)
       DO UPDATE SET owner_category = EXCLUDED.owner_category`,
      [userId]
    );
  }

  await client.query(
    `INSERT INTO "WalletAccount" (id, user_id, status, currency, available_balance)
     VALUES (gen_random_uuid()::text, $1, 'ACTIVE', 'BDT', 5000)
     ON CONFLICT (user_id)
     DO UPDATE SET
       status = 'ACTIVE',
       currency = 'BDT',
       available_balance = CASE
         WHEN "WalletAccount".available_balance < 5000 THEN 5000
         ELSE "WalletAccount".available_balance
       END,
       updated_at = NOW()`,
    [userId]
  );

  const submissionResult = await client.query(
    `INSERT INTO "VerificationSubmission" (
      id, user_id, submission_status, submitted_at, reviewed_at, reviewed_by, rejection_reason, created_at, updated_at
    ) VALUES (
      gen_random_uuid()::text, $1, 'APPROVED', NOW(), NOW(), 'seed-admin', NULL, NOW(), NOW()
    )
    ON CONFLICT (user_id)
    DO UPDATE SET
      submission_status = 'APPROVED',
      submitted_at = NOW(),
      reviewed_at = NOW(),
      reviewed_by = 'seed-admin',
      rejection_reason = NULL,
      updated_at = NOW()
    RETURNING id`,
    [userId]
  );

  const submissionId = submissionResult.rows[0].id as string;
  await client.query(`DELETE FROM "UserIdentityDocument" WHERE user_id = $1`, [userId]);

  const docs = cfg.role === 'TENANT' ? ['NATIONAL_ID'] : ['NATIONAL_ID', 'PROOF_OF_OWNERSHIP'];
  for (const docType of docs) {
    await client.query(
      `INSERT INTO "UserIdentityDocument" (
        id, user_id, submission_id, document_type, document_number, file_path, file_name,
        mime_type, file_size_bytes, verification_status, uploaded_at, reviewed_at, reviewed_by, created_at, updated_at
      ) VALUES (
        gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
        'image/png', 120000, 'APPROVED', NOW(), NOW(), 'seed-admin', NOW(), NOW()
      )`,
      [
        userId,
        submissionId,
        docType,
        `DOC-${docType}-${Date.now()}`,
        `kyc/${userId}/${docType.toLowerCase()}-seed.png`,
        `${docType.toLowerCase()}-seed.png`,
      ]
    );
  }

  return { userId, email: cfg.email, role: cfg.role, password: cfg.password };
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tenant = await ensureUser(client, {
      email: 'ten1@gmail.com',
      role: 'TENANT',
      password: '11111111',
      firstName: 'Test',
      lastName: 'Tenant',
      profession: 'Software Engineer',
      jobCategory: 'TECHNOLOGY',
      profilePhotoUrl: 'https://example.com/tenant.png',
      currentLat: 23.7806,
      currentLng: 90.407,
      currentArea: 'Dhaka',
    });

    const owner = await ensureUser(client, {
      email: 'own1@gmail.com',
      role: 'OWNER',
      password: '11111111',
      firstName: 'Test',
      lastName: 'Owner',
      profession: 'Business Owner',
      jobCategory: 'SELF_EMPLOYED',
      profilePhotoUrl: 'https://example.com/owner.png',
      currentLat: 23.755,
      currentLng: 90.375,
      currentArea: 'Dhaka',
    });

    const ownerOwn3 = await ensureUser(client, {
      email: 'own3@gmail.com',
      role: 'OWNER',
      password: '11111111',
      contactPhone: '01234567890',
      firstName: 'Test',
      lastName: 'OwnerThree',
      profession: 'Business Owner',
      jobCategory: 'SELF_EMPLOYED',
      profilePhotoUrl: 'https://example.com/owner.png',
      currentLat: 23.755,
      currentLng: 90.375,
      currentArea: 'Dhaka',
    });

    await client.query('COMMIT');
    console.log(JSON.stringify({ ok: true, tenant, owner, ownerOwn3 }, null, 2));
  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error(error?.message || error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
