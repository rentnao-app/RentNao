import { PrismaClient } from '@prisma/client';
import { db, closeDbConnection } from '@/db/client';
import { 
  createProperty, 
  createListingForProperty, 
  listMyProperties, 
  listPublicListings,
  getPublicListingDetail,
  unlockListingForTenant
} from '@/modules/properties/services/property.service';

const prisma = new PrismaClient();

async function run() {
  console.log('--- Starting Billboard Type Inference & Backend Test ---');

  // 1. Create mock Owner and Tenant
  const mockOwnerEmail = 'owner_billboard_test@example.com';
  const mockTenantEmail = 'tenant_billboard_test@example.com';

  // Clean up previous runs
  await prisma.user.deleteMany({
    where: { contact_email: { in: [mockOwnerEmail, mockTenantEmail] } }
  });

  const ownerUser = await prisma.user.create({
    data: {
      contact_email: mockOwnerEmail,
      role: 'OWNER',
      is_active: true,
      owner_profile: { create: { owner_score: 100 } },
      wallet_account: { create: { available_balance: 5000 } } // for listing fee
    },
    include: { owner_profile: true }
  });
  console.log('✅ Created mock OWNER');

  const tenantUser = await prisma.user.create({
    data: {
      contact_email: mockTenantEmail,
      role: 'TENANT',
      is_active: true,
      tenant_profile: { create: { tenant_score: 95 } },
      wallet_account: { create: { available_balance: 1000 } } // for unlock fee
    }
  });
  console.log('✅ Created mock TENANT');

  // 2. Owner creates Billboard Property
  console.log('\n--- Owner Creating Billboard ---');
  
  // Seed FeePolicy so listing works
  await db.query(`
    INSERT INTO "FeePolicy" (id, code, version, name, fixed_amount, is_active, effective_from) 
    VALUES ('test-fee-id', 'LISTING_CREATE', 1, 'Test Fee', 0, true, NOW())
    ON CONFLICT (code, version) DO NOTHING
  `);
  const property = await createProperty(ownerUser.user_id, {
    title: 'Huge Digital Billboard in Gulshan',
    description: 'Perfect for ad campaigns. High traffic area.',
    address: 'Gulshan 1 Circle',
    propertySizeSqft: 250,
    roomCount: 0,
    bathroomCount: 0,
    balconyCount: 0,
    areaName: 'GULSHAN',
    exactLat: 23.7806,
    exactLng: 90.4194,
    buildingFloors: 1,
    buildingFacing: 'SOUTH',
    hasLift: false,
    hasGenerator: true,
    hasSecurityGuard: true,
    intendedTenantType: 'BOTH',
    floorNo: 2,
    propertyType: 'COMMERCIAL_SPACE',
    billboardType: 'DIGITAL',
    billboardSize: '10x20 ft',
  } as any);
  
  console.log('✅ Property created:', property.propertyId);
  console.log('Billboard Type:', (property as any).billboardType);
  console.log('Billboard Size:', (property as any).billboardSize);

  // 3. Owner creates a listing for it
  console.log('\n--- Owner Listing the Billboard ---');
  const listing = await createListingForProperty(ownerUser.user_id, 'OWNER', property.propertyId, {
    rent: 120000,
    securityDepositMonths: 2,
    listingStartDate: new Date().toISOString(),
  } as any);
  console.log('✅ Listing created:', listing.listingId);
  console.log('Rent:', listing.rent);
  console.log('Security Deposit Amount:', (listing as any).securityDepositAmount);

  // 4. Owner views their properties
  console.log('\n--- Owner Viewing Their Properties ---');
  const myProps = await listMyProperties(ownerUser.user_id);
  console.log('✅ My Properties Count:', myProps.total);
  if (myProps.total > 0) {
    console.log('First property billboardType:', (myProps.items[0] as any).billboardType);
  }

  // 5. Tenant views the public feed
  console.log('\n--- Tenant Searching Listings ---');
  const publicFeed = await listPublicListings({ areaName: 'GULSHAN' } as any);
  console.log('✅ Public Listings Found:', publicFeed.total);
  const foundListing = publicFeed.items.find((i: any) => i.listingId === listing.listingId);
  if (foundListing) {
    console.log('Found our billboard in feed! Type:', (foundListing as any).billboardType);
  }

  // 6. Tenant unlocks the listing
  console.log('\n--- Tenant Unlocking Listing ---');
  try {
    const unlockData = await unlockListingForTenant(tenantUser.user_id, 'TENANT', listing.listingId);
    console.log('✅ Listing Unlocked!');
  } catch (err: any) {
    console.log('Unlock failed:', err.message);
  }

  // 7. Tenant views listing detail
  console.log('\n--- Tenant Viewing Listing Detail ---');
  const detail = await getPublicListingDetail(listing.listingId);
  console.log('✅ Listing Detail fetched for:', detail.title);
  console.log('Billboard Type:', (detail as any).billboardType);
  console.log('Billboard Size:', (detail as any).billboardSize);
  console.log('Total Deposit:', (detail as any).securityDepositAmount);

  console.log('\n--- Tests Complete Successfully ---');
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
    await closeDbConnection();
  });
