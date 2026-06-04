/**
 * One-off: attach verified BD mobile login to existing tenant + admin users.
 * Numbers use local prefix 015... (third digit of the mobile part is 5).
 */
import pg from 'pg';

const TENANT_EMAIL = 'ten1@gmail.com';
const TENANT_PHONE = '+8801511111112';

const ADMIN_EMAIL = 'admin.test.rentnao@gmail.com';
const ADMIN_PHONE = '+8801522222223';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: url });
  const c = await pool.connect();

  const upsertPhone = async (email: string, phone: string) => {
    const u = await c.query<{ user_id: string }>(
      `SELECT user_id FROM "User" WHERE contact_email = $1 LIMIT 1`,
      [email]
    );
    if (!u.rows.length) {
      throw new Error(`User not found for email: ${email}`);
    }
    const userId = u.rows[0].user_id;

    const cred = await c.query<{ password_hash: string }>(
      `SELECT password_hash FROM "Credentials"
       WHERE user_id = $1 AND identifier_type = 'EMAIL' LIMIT 1`,
      [userId]
    );
    if (!cred.rows.length) {
      throw new Error(`No EMAIL credentials for user: ${email}`);
    }
    const passwordHash = cred.rows[0].password_hash;

    await c.query(
      `DELETE FROM "Credentials" WHERE identifier_type = 'PHONE' AND identifier = $1`,
      [phone]
    );
    await c.query(
      `DELETE FROM "Credentials" WHERE user_id = $1 AND identifier_type = 'PHONE'`,
      [userId]
    );

    await c.query(`UPDATE "User" SET contact_phone = NULL WHERE contact_phone = $1`, [phone]);

    await c.query(`UPDATE "User" SET contact_phone = $1, updated_at = NOW() WHERE user_id = $2`, [
      phone,
      userId,
    ]);

    await c.query(
      `INSERT INTO "Credentials" (id, user_id, identifier, identifier_type, password_hash, verified_at, created_at, updated_at)
       VALUES (gen_random_uuid()::text, $1, $2, 'PHONE', $3, NOW(), NOW(), NOW())`,
      [userId, phone, passwordHash]
    );
  };

  try {
    await c.query('BEGIN');
    await upsertPhone(TENANT_EMAIL, TENANT_PHONE);
    await upsertPhone(ADMIN_EMAIL, ADMIN_PHONE);
    await c.query('COMMIT');
    console.log(
      JSON.stringify(
        {
          ok: true,
          tenant: { email: TENANT_EMAIL, phone: TENANT_PHONE },
          admin: { email: ADMIN_EMAIL, phone: ADMIN_PHONE },
          note: 'Password is unchanged — same as the existing EMAIL login for each account.',
        },
        null,
        2
      )
    );
  } catch (e: unknown) {
    await c.query('ROLLBACK');
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
}

main();
