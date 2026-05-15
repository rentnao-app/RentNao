import { PrismaClient } from '@prisma/client';
import { verifyPassword } from '../modules/auth/utils/password';

const db = new PrismaClient();

async function testLogin() {
  const identifier = '01700000001';
  const password = 'Password123!';

  console.log(`Testing login for ${identifier}`);

  // 1. Fetch user directly
  const userRows = await db.$queryRawUnsafe(`
    SELECT 
      u.user_id, u.role, u.is_active, u.deleted_at,
      c.password_hash, c.verified_at, c.identifier_type
     FROM "User" u
     JOIN "Credentials" c ON u.user_id = c.user_id
     WHERE c.identifier = $1
     LIMIT 1
  `, identifier);

  const user = (userRows as any[])[0];

  if (!user) {
    console.error('❌ User not found in DB!');
    return;
  }

  console.log('✅ User found in DB:', {
    user_id: user.user_id,
    role: user.role,
    is_active: user.is_active,
    verified_at: user.verified_at,
  });

  // 2. Verify password using the exact same function the auth service uses
  try {
    const isValid = await verifyPassword(password, user.password_hash);
    if (isValid) {
      console.log('✅ Password verified successfully!');
    } else {
      console.error('❌ Password verification failed! The hash is invalid for this password.');
      console.log('Hash from DB:', user.password_hash);
    }
  } catch (e) {
    console.error('❌ Error during password verification:', e);
  }
}

testLogin()
  .catch(console.error)
  .finally(() => db.$disconnect());
