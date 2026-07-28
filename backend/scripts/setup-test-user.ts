/**
 * Dev helper: verify phone + fully approve a tenant test account.
 * Usage: bun run scripts/setup-test-user.ts
 */
import pg from 'pg';

const TEST_PHONE = '+8801533334444';
const TEST_PASSWORD = 'TestUser123!';
const ADMIN_PHONE = '+8801599988776';
const ADMIN_PASSWORD = 'AdminTest123!';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const passwordHash = await Bun.password.hash(TEST_PASSWORD, {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });
  const adminPasswordHash = await Bun.password.hash(ADMIN_PASSWORD, {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tenant = await client.query<{ user_id: string }>(
      `SELECT user_id FROM "User" WHERE contact_phone = $1 LIMIT 1`,
      [TEST_PHONE]
    );

    if (!tenant.rows.length) {
      throw new Error(`Tenant not found for phone ${TEST_PHONE}. Register first via POST /auth/register.`);
    }

    const tenantId = tenant.rows[0].user_id;

    await client.query(
      `UPDATE "Credentials"
       SET verified_at = COALESCE(verified_at, NOW()), updated_at = NOW()
       WHERE user_id = $1 AND identifier_type = 'PHONE' AND identifier = $2`,
      [tenantId, TEST_PHONE]
    );

    await client.query(
      `UPDATE "User"
       SET onboarding_status = 'COMPLETED',
           kyc_verification_status = 'APPROVED',
           is_active = true,
           updated_at = NOW()
       WHERE user_id = $1`,
      [tenantId]
    );

    await client.query(
      `INSERT INTO "BaseUserProfile" (id, user_id, first_name, last_name, created_at, updated_at)
       VALUES (gen_random_uuid()::text, $1, 'Test', 'Tenant', NOW(), NOW())
       ON CONFLICT (user_id) DO UPDATE
       SET first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           updated_at = NOW()`,
      [tenantId]
    );

    let admin = await client.query<{ user_id: string }>(
      `SELECT user_id FROM "User" WHERE role = 'ADMIN' AND deleted_at IS NULL ORDER BY created_at ASC LIMIT 1`
    );

    let adminId = admin.rows[0]?.user_id;

    if (!adminId) {
      const created = await client.query<{ user_id: string }>(
        `INSERT INTO "User" (user_id, role, onboarding_status, kyc_verification_status, is_active, contact_phone, created_at, updated_at)
         VALUES (gen_random_uuid()::text, 'ADMIN', 'COMPLETED', 'APPROVED', true, $1, NOW(), NOW())
         RETURNING user_id`,
        [ADMIN_PHONE]
      );
      adminId = created.rows[0].user_id;

      await client.query(
        `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash, verified_at, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'PHONE', $3, NOW(), NOW(), NOW())`,
        [adminId, ADMIN_PHONE, adminPasswordHash]
      );

      await client.query(
        `INSERT INTO "BaseUserProfile" (id, user_id, first_name, last_name, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, 'Test', 'Admin', NOW(), NOW())
         ON CONFLICT (user_id) DO NOTHING`,
        [adminId]
      );
    } else {
      await client.query(
        `UPDATE "User"
         SET onboarding_status = 'COMPLETED',
             kyc_verification_status = 'APPROVED',
             is_active = true,
             contact_phone = COALESCE(contact_phone, $2),
             updated_at = NOW()
         WHERE user_id = $1`,
        [adminId, ADMIN_PHONE]
      );

      const adminCred = await client.query(
        `SELECT id FROM "Credentials" WHERE user_id = $1 AND identifier_type = 'PHONE' LIMIT 1`,
        [adminId]
      );

      if (adminCred.rows.length) {
        await client.query(
          `UPDATE "Credentials"
           SET identifier = $2, password_hash = $3, verified_at = NOW(), updated_at = NOW()
           WHERE user_id = $1 AND identifier_type = 'PHONE'`,
          [adminId, ADMIN_PHONE, adminPasswordHash]
        );
      } else {
        await client.query(
          `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash, verified_at, created_at, updated_at)
           VALUES (gen_random_uuid()::text, $1, $2, 'PHONE', $3, NOW(), NOW(), NOW())`,
          [adminId, ADMIN_PHONE, adminPasswordHash]
        );
      }
    }

    await client.query('COMMIT');

    console.log(
      JSON.stringify(
        {
          ok: true,
          tenant: {
            phone: TEST_PHONE,
            password: TEST_PASSWORD,
            userId: tenantId,
            onboardingStatus: 'COMPLETED',
            kycStatus: 'APPROVED',
          },
          admin: {
            phone: ADMIN_PHONE,
            password: ADMIN_PASSWORD,
            userId: adminId,
          },
          loginHint: 'Use phone + password on /login (identifierType auto-detected).',
        },
        null,
        2
      )
    );
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
