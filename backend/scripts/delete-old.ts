import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetOwner = await prisma.user.findFirst({
    where: { contact_phone: '+8801722222222' },
    include: { owner_profile: true },
  });

  if (!targetOwner || !targetOwner.owner_profile) {
    console.log("Target owner not found.");
    return;
  }

  const targetOwnerProfileId = targetOwner.owner_profile.owner_id;

  const propertiesToDelete = await prisma.property.findMany({
    where: { owner_id: { not: targetOwnerProfileId } },
    select: { property_id: true }
  });

  const propertyIds = propertiesToDelete.map(p => p.property_id);

  if (propertyIds.length > 0) {
    const deletedConvos = await prisma.conversation.deleteMany({
      where: { property_id: { in: propertyIds } }
    });
    
    const deletedProperties = await prisma.property.deleteMany({
      where: { property_id: { in: propertyIds } }
    });

    console.log(`Deleted ${deletedConvos.count} conversations and ${deletedProperties.count} properties (with their associated listings).`);
  } else {
    console.log('No properties to delete.');
  }
}

main().finally(() => prisma.$disconnect());
