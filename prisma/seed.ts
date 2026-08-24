import { config } from 'dotenv';
import { PrismaService } from '../src/prisma/prisma.service';
import { UsersService } from '../src/users/users.service';

config();

const DEFAULT_MANAGER_EMAIL = 'manager@example.com';
const DEFAULT_MANAGER_PASSWORD = 'ManagerPass123';

async function main(): Promise<void> {
  const prisma = new PrismaService();
  await prisma.onModuleInit();

  try {
    const usersService = new UsersService(prisma);
    const { MANAGER_EMAIL, MANAGER_PASSWORD } = process.env;
    const email = (MANAGER_EMAIL ?? DEFAULT_MANAGER_EMAIL).toLowerCase();
    const password = MANAGER_PASSWORD ?? DEFAULT_MANAGER_PASSWORD;

    const manager = await usersService.seedManager(email, password);

    console.log(`Manager seeded: ${manager.email} (${manager.id})`);
  } finally {
    await prisma.onModuleDestroy();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
