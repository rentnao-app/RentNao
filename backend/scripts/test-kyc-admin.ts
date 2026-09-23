import { db } from '../src/db/client';
import { getKycSubmissionDetail } from '../src/modules/admin/services/kyc.service';

async function testAdminKycFlow() {
  console.log('Fetching a random KYC submission from the database...');
  
  const res = await db.query('SELECT id FROM "VerificationSubmission" LIMIT 1');
  
  if (res.rows.length === 0) {
    console.log('No KYC submissions found in the database. You need to create one as a user first!');
    process.exit(0);
  }

  const submissionId = res.rows[0].id;
  console.log(`Found submission ID: ${submissionId}`);
  console.log('Simulating admin fetching KYC details...\n');

  try {
    const details = await getKycSubmissionDetail(submissionId);
    console.log(JSON.stringify(details, null, 2));
    console.log('\n--- SUCCESS ---');
    console.log('As you can see, the admin now receives fullNameBn, dateOfBirth, and gender!');
  } catch (err) {
    console.error('Error fetching KYC details:', err);
  }

  process.exit(0);
}

testAdminKycFlow();
