import { PrismaClient, PropertyType, AreaName, BuildingFacing, TenantType, ListingStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding listings...');

  // Find the specific owner by phone number
  const ownerUser = await prisma.user.findFirst({
    where: { contact_phone: '+8801722222222' },
    include: { owner_profile: true },
  });

  if (!ownerUser) {
    console.error('No owner user found. Please run the user seeds first.');
    return;
  }

  let ownerProfileId = ownerUser.owner_profile?.owner_id;

  // Ensure owner profile exists
  if (!ownerProfileId) {
    const newProfile = await prisma.ownerProfile.create({
      data: {
        user_id: ownerUser.user_id,
        owner_category: 'RESIDENTIAL',
      },
    });
    ownerProfileId = newProfile.owner_id;
  }

  console.log(`Using owner profile ID: ${ownerProfileId}`);

  // Create a property
  const property = await prisma.property.create({
    data: {
      owner_id: ownerProfileId,
      property_type: PropertyType.APARTMENT,
      property_size_sqft: 1200,
      room_count: 3,
      bathroom_count: 2,
      balcony_count: 2,
      area_name: AreaName.DHANMONDI,
      exact_lat: 23.7465,
      exact_lng: 90.3760,
      title: 'Beautiful 3 BHK in Dhanmondi',
      description: 'A spacious, well-lit apartment with modern amenities. Perfect for families.',
      address: 'Road 8A, Dhanmondi, Dhaka',
      building_floors: 6,
      building_facing: BuildingFacing.SOUTH,
      has_lift: true,
      has_generator: true,
      has_security_guard: true,
      intended_tenant_type: TenantType.FAMILY,
      images: {
        create: [
          {
            storage_path: 'mock/path/image1.jpg',
            file_name: 'image1.jpg',
            display_order: 1,
            is_primary: true,
          },
          {
            storage_path: 'mock/path/image2.jpg',
            file_name: 'image2.jpg',
            display_order: 2,
            is_primary: false,
          }
        ]
      }
    }
  });

  console.log(`Created property ID: ${property.property_id}`);

  // Create an active listing for this property
  const listing = await prisma.listing.create({
    data: {
      property_id: property.property_id,
      rent: 35000,
      listing_start_date: new Date(),
      listing_status: ListingStatus.ACTIVE,
      view_count: 15,
    }
  });

  console.log(`Created listing ID: ${listing.listing_id} with rent: ${listing.rent}`);

  // Second Property & Listing
  const propertyTwo = await prisma.property.create({
    data: {
      owner_id: ownerProfileId,
      property_type: PropertyType.APARTMENT,
      property_size_sqft: 850,
      room_count: 2,
      bathroom_count: 1,
      balcony_count: 1,
      area_name: AreaName.GULSHAN,
      exact_lat: 23.7925,
      exact_lng: 90.4078,
      title: 'Cozy 2 BHK in Gulshan',
      description: 'Perfect bachelor pad or couple apartment in a prime location.',
      address: 'Road 12, Gulshan 1, Dhaka',
      building_floors: 10,
      building_facing: BuildingFacing.EAST,
      has_lift: true,
      has_generator: true,
      has_security_guard: true,
      intended_tenant_type: TenantType.BACHELOR,
    }
  });

  const listingTwo = await prisma.listing.create({
    data: {
      property_id: propertyTwo.property_id,
      rent: 28000,
      listing_start_date: new Date(),
      listing_status: ListingStatus.ACTIVE,
    }
  });

  console.log(`Created 2nd listing ID: ${listingTwo.listing_id} with rent: ${listingTwo.rent}`);

  console.log('Listing seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
