import { db } from '../src/db/client';
import { createBulkNotifications } from '../src/modules/notifications/notifications.service';
import { getAllActiveUserIds } from '../src/modules/notifications/notifications.service';

async function main() {
  console.log('1. Fetching user counts...');
  const allUsers = await getAllActiveUserIds();
  const tenants = await getAllActiveUserIds('TENANT');
  
  console.log(`Found ${allUsers.length} total active users.`);
  console.log(`Found ${tenants.length} tenants.\n`);

  if (allUsers.length === 0) {
    console.log('No users in database. Creating a dummy user for testing...');
    await db.query(`
      INSERT INTO "User" (user_id, role, contact_phone, kyc_verification_status) 
      VALUES ('test-user-1', 'TENANT', '+123456789', 'APPROVED')
    `);
    allUsers.push('test-user-1');
    tenants.push('test-user-1');
  }

  console.log('2. Testing "Broadcast to ALL users"...');
  const allResult = await createBulkNotifications(allUsers, 'Platform Update', 'This goes to everyone!', { url: '/news' }, true);
  console.log(`✅ Success! Sent to ${allResult.sent} users (Failed: ${allResult.failed})\n`);

  console.log('3. Testing "Broadcast to TENANTS only"...');
  const tenantResult = await createBulkNotifications(tenants, 'Tenant Notice', 'This goes to tenants only!', { url: '/dashboard' }, true);
  console.log(`✅ Success! Sent to ${tenantResult.sent} tenants (Failed: ${tenantResult.failed})\n`);

  process.exit(0);
}

main();
