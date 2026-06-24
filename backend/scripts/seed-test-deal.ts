import pg from 'pg';

const TENANT_ID = '04377efd-c576-4fbc-a627-b9614c9ab05f';
const DEAL_ID = 'test-deal-1';

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL || 'postgresql://user:password@127.0.0.1:5433/rentnao',
  });
  await client.connect();

  const userRes = await client.query(
    `SELECT user_id, role FROM "User" WHERE user_id = $1`,
    [TENANT_ID]
  );
  if (userRes.rows.length === 0) {
    throw new Error(`Tenant not found: ${TENANT_ID}`);
  }
  console.log('Tenant:', userRes.rows[0]);

  const listingRes = await client.query(
    `SELECT l.listing_id, l.property_id, op.user_id AS owner_user_id, p.title
     FROM "Listing" l
     JOIN "Property" p ON p.property_id = l.property_id
     JOIN "OwnerProfile" op ON op.owner_id = p.owner_id
     WHERE l.listing_status = 'ACTIVE'
     ORDER BY l.created_at DESC
     LIMIT 1`
  );

  if (listingRes.rows.length === 0) {
    throw new Error('No active listing found. Create a listing first.');
  }

  const { listing_id, property_id, owner_user_id, title } = listingRes.rows[0];
  console.log('Using listing:', { listing_id, property_id, owner_user_id, title });

  const existing = await client.query(`SELECT deal_id FROM "Deal" WHERE deal_id = $1`, [DEAL_ID]);
  if (existing.rows.length > 0) {
    console.log('\nDeal already exists. Use this ID in the test page:\n');
    console.log(DEAL_ID);
    await client.end();
    return;
  }

  await client.query(
    `INSERT INTO "Deal" (deal_id, property_id, listing_id, owner_id, tenant_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [DEAL_ID, property_id, listing_id, owner_user_id, TENANT_ID]
  );

  console.log('\nTest deal created. Use this ID in the test page:\n');
  console.log(DEAL_ID);
  console.log('\nDetails:', {
    deal_id: DEAL_ID,
    property_id,
    listing_id,
    owner_id: owner_user_id,
    tenant_id: TENANT_ID,
  });

  await client.end();
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
