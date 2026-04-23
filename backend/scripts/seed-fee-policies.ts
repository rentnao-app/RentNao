import pg from 'pg';

async function ensureActiveFeePolicy(
  client: pg.PoolClient,
  code: string,
  name: string,
  amount: number
) {
  const activeResult = await client.query(
    `SELECT id
     FROM "FeePolicy"
     WHERE code = $1
       AND is_active = true
       AND effective_from <= NOW()
       AND (effective_to IS NULL OR effective_to > NOW())
     LIMIT 1`,
    [code]
  );

  if (activeResult.rows.length > 0) {
    return;
  }

  const versionResult = await client.query(
    `SELECT COALESCE(MAX(version), 0) + 1 AS next_version
     FROM "FeePolicy"
     WHERE code = $1`,
    [code]
  );

  const nextVersion = Number(versionResult.rows[0].next_version || 1);

  await client.query(
    `INSERT INTO "FeePolicy" (
      id, code, version, name, currency, base_amount, is_active, effective_from, effective_to, created_by, created_at
    ) VALUES (
      gen_random_uuid()::text, $1, $2, $3, 'BDT', $4, true, NOW() - INTERVAL '1 day', NULL, 'manual-seed', NOW()
    )`,
    [code, nextVersion, name, amount]
  );
}

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureActiveFeePolicy(client, 'LISTING_CREATE', 'Listing Creation Fee', 50);
    await ensureActiveFeePolicy(client, 'LISTING_UNLOCK', 'Listing Unlock Fee', 50);

    const result = await client.query(
      `SELECT code, version, base_amount, is_active, effective_from, effective_to
       FROM "FeePolicy"
       WHERE code IN ('LISTING_CREATE', 'LISTING_UNLOCK')
       ORDER BY code, version`
    );
    await client.query('COMMIT');

    console.log(JSON.stringify({ ok: true, feePolicies: result.rows }, null, 2));
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
