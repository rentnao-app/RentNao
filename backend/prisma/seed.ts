import { PrismaClient, UserRole, OnboardingStatus, KycVerificationStatus, IdentifierType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seed started...');

  // 1. Clean existing data (optional, but good for idempotent seeds)
  // Note: Testimonials have Cascade delete on User, so we can just delete users.
  // Wait, some tables might have Restrict.
  // Let's just create new ones with unique emails.

  const passwordHash = await Bun.password.hash('Password123!', {
    algorithm: 'argon2id',
    memoryCost: 65536,
    timeCost: 3,
  });

  const users = [
    {
      email: 'admin@rentnao.com',
      role: UserRole.ADMIN,
      firstName: 'System',
      lastName: 'Admin',
      kycStatus: KycVerificationStatus.APPROVED,
      isActive: true,
    },
    {
      email: 'verified_user@example.com',
      role: UserRole.TENANT,
      firstName: 'John',
      lastName: 'Verified',
      kycStatus: KycVerificationStatus.APPROVED,
      isActive: true,
    },
    {
      email: 'another_verified@example.com',
      role: UserRole.TENANT,
      firstName: 'Jane',
      lastName: 'Approved',
      kycStatus: KycVerificationStatus.APPROVED,
      isActive: true,
    },
    {
      email: 'pending_user@example.com',
      role: UserRole.TENANT,
      firstName: 'Paul',
      lastName: 'Pending',
      kycStatus: KycVerificationStatus.PENDING,
      isActive: true,
    },
    {
      email: 'inactive_user@example.com',
      role: UserRole.TENANT,
      firstName: 'Iris',
      lastName: 'Inactive',
      kycStatus: KycVerificationStatus.APPROVED,
      isActive: false,
    }
  ];

  for (const u of users) {
    console.log(`Creating user: ${u.email}`);
    
    const user = await prisma.user.create({
      data: {
        role: u.role,
        onboarding_status: OnboardingStatus.COMPLETED,
        kyc_verification_status: u.kycStatus,
        is_active: u.isActive,
        contact_email: u.email,
        credentials: {
          create: {
            identifier: u.email,
            identifier_type: IdentifierType.EMAIL,
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
            available_balance: 1000,
          }
        }
      }
    });
    
    console.log(`Created user with ID: ${user.user_id}`);
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
