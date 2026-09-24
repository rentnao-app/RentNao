import pg from 'pg';

const EMAIL = 'demo.tenant@rentnao.com';
const PHONE = '+8801719990001';
const PASSWORD = 'DemoTenant1!';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const hash = await Bun.password.hash(PASSWORD, {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  const pool = new pg.Pool({ connectionString: url });
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let userId: string;
    const existing = await client.query(
      `SELECT user_id FROM "Credentials" WHERE identifier_type = 'EMAIL' AND identifier = $1 LIMIT 1`,
      [EMAIL]
    );

    if (existing.rows.length > 0) {
      userId = existing.rows[0].user_id as string;
      await client.query(
        `UPDATE "Credentials"
         SET password_hash = $1, verified_at = NOW(), updated_at = NOW()
         WHERE identifier_type = 'EMAIL' AND identifier = $2`,
        [hash, EMAIL]
      );
    } else {
      const inserted = await client.query(
        `INSERT INTO "User" (user_id, role, onboarding_status, kyc_verification_status, contact_email, contact_phone, is_active)
         VALUES (gen_random_uuid()::text, 'TENANT', 'COMPLETED', 'APPROVED', $1, $2, true)
         RETURNING user_id`,
        [EMAIL, PHONE]
      );
      userId = inserted.rows[0].user_id as string;
      await client.query(
        `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash, verified_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'EMAIL', $3, NOW())`,
        [userId, EMAIL, hash]
      );
    }

    await client.query(
      `UPDATE "User"
       SET role = 'TENANT',
           onboarding_status = 'COMPLETED',
           kyc_verification_status = 'APPROVED',
           contact_email = $1,
           contact_phone = $2,
           is_active = true,
           deleted_at = NULL,
           updated_at = NOW()
       WHERE user_id = $3`,
      [EMAIL, PHONE, userId]
    );

    const phoneCred = await client.query(
      `SELECT id FROM "Credentials" WHERE user_id = $1 AND identifier_type = 'PHONE' LIMIT 1`,
      [userId]
    );
    if (phoneCred.rows.length > 0) {
      await client.query(
        `UPDATE "Credentials"
         SET identifier = $1, password_hash = $2, verified_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        [PHONE, hash, phoneCred.rows[0].id]
      );
    } else {
      await client.query(
        `DELETE FROM "Credentials" WHERE identifier_type = 'PHONE' AND identifier = $1`,
        [PHONE]
      );
      await client.query(
        `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash, verified_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'PHONE', $3, NOW())`,
        [userId, PHONE, hash]
      );
    }

    await client.query(
      `INSERT INTO "BaseUserProfile" (
        id, user_id, first_name, last_name, date_of_birth, gender, religion, profession,
        job_category, current_lat, current_lng, current_area
      ) VALUES (
        gen_random_uuid()::text, $1, 'Demo', 'Tenant', '1996-08-20'::date, 'MALE', 'Islam', 'Product Designer',
        'TECHNOLOGY', 23.7806, 90.407, 'Dhanmondi, Dhaka'
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        profession = EXCLUDED.profession,
        job_category = EXCLUDED.job_category,
        current_area = EXCLUDED.current_area,
        updated_at = NOW()`,
      [userId]
    );

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

    await client.query(
      `INSERT INTO "WalletAccount" (id, user_id, status, currency, available_balance)
       VALUES (gen_random_uuid()::text, $1, 'ACTIVE', 'BDT', 5000)
       ON CONFLICT (user_id)
       DO UPDATE SET status = 'ACTIVE', updated_at = NOW()`,
      [userId]
    );

    await client.query('COMMIT');
    console.log(JSON.stringify({ ok: true, userId, email: EMAIL, phone: PHONE, password: PASSWORD }, null, 2));
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
