import { config } from 'dotenv';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

config();

const BCRYPT_ROUNDS = 12;

const DEFAULT_MANAGER_EMAIL = 'manager@example.com';
const DEFAULT_MANAGER_PASSWORD = 'ManagerPass123';

async function main(): Promise<void> {
  const prisma = new PrismaClient();

  const { MANAGER_EMAIL, MANAGER_PASSWORD } = process.env ?? {};

  const email = (MANAGER_EMAIL ?? DEFAULT_MANAGER_EMAIL).toLowerCase();
  const password = MANAGER_PASSWORD ?? DEFAULT_MANAGER_PASSWORD;
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const manager = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role: Role.MANAGER,
    },
    create: {
      email,
      passwordHash,
      role: Role.MANAGER,
    },
  });

  console.log(`Manager seeded: ${manager.email} (${manager.id})`);

  await prisma.$disconnect();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
