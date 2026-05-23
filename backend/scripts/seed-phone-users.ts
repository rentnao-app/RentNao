import { PrismaClient, UserRole, OnboardingStatus, KycVerificationStatus, IdentifierType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding phone users...');

  const passwordHash = await Bun.password.hash('11111111', {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  const usersToSeed = [
    {
      phone: '+8801711111111',
      role: UserRole.TENANT,
      firstName: 'Phone',
      lastName: 'Tenant',
      kycStatus: KycVerificationStatus.APPROVED,
    },
    {
      phone: '+8801722222222',
      role: UserRole.OWNER,
      firstName: 'Phone',
      lastName: 'Owner',
      kycStatus: KycVerificationStatus.APPROVED,
    },
    {
      phone: '+8801733333333',
      role: UserRole.ADMIN,
      firstName: 'Phone',
      lastName: 'Admin',
      kycStatus: KycVerificationStatus.APPROVED,
    }
  ];

  for (const u of usersToSeed) {
    console.log(`Creating user: ${u.phone}`);
    
    await prisma.user.create({
      data: {
        role: u.role,
        onboarding_status: OnboardingStatus.COMPLETED,
        kyc_verification_status: u.kycStatus,
        is_active: true,
        contact_phone: u.phone,
        credentials: {
          create: {
            identifier: u.phone,
            identifier_type: IdentifierType.PHONE,
            password_hash: passwordHash,
            verified_at: new Date(),
          }
        },
        base_profile: {
          create: {
            first_name: u.firstName,
            last_name: u.lastName,
          }
        },
        wallet_account: {
          create: {
            available_balance: 5000,
          }
        }
      }
    });
  }

  console.log('Phone seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
