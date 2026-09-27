import type { INestApplication } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';
import { Test } from '@nestjs/testing';
import supertest from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import type { AuthLoginResponseDto } from '../src/auth/dto/auth-login-response.dto';
import type { ErrorResponseDto } from '../src/common/filters/http-exception.filter';
import type { UserResponseDto } from '../src/users/dto/user-response.dto';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma/prisma.service';

const DEFAULT_MANAGER_EMAIL = 'manager@example.com';
const DEFAULT_MANAGER_PASSWORD = 'ManagerPass123';

export const MANAGER_EMAIL = (
  process.env.MANAGER_EMAIL ?? DEFAULT_MANAGER_EMAIL
).toLowerCase();
export const MANAGER_PASSWORD =
  process.env.MANAGER_PASSWORD ?? DEFAULT_MANAGER_PASSWORD;

export function e2eRequest(app: INestApplication) {
  const server = app.getHttpServer() as App;
  return supertest(server);
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface TestActors {
  managerToken: string;
  customer: UserResponseDto;
  customerToken: string;
}

export function authHeader(token: string): string {
  return `Bearer ${token}`;
}

export async function registerUser(
  app: INestApplication,
  credentials: AuthCredentials,
): Promise<UserResponseDto> {
  const response = await e2eRequest(app)
    .post('/auth/register')
    .send(credentials)
    .expect(201);

  return response.body as UserResponseDto;
}

export async function loginUser(
  app: INestApplication,
  credentials: AuthCredentials,
): Promise<AuthLoginResponseDto> {
  const response = await e2eRequest(app)
    .post('/auth/login')
    .send(credentials)
    .expect(200);

  return response.body as AuthLoginResponseDto;
}

export async function createTestActors(
  app: INestApplication,
  customerCredentials: AuthCredentials,
): Promise<TestActors> {
  const managerLogin = await loginUser(app, {
    email: MANAGER_EMAIL,
    password: MANAGER_PASSWORD,
  });
  const customer = await registerUser(app, customerCredentials);
  const customerLogin = await loginUser(app, customerCredentials);

  return {
    managerToken: managerLogin.accessToken,
    customer,
    customerToken: customerLogin.accessToken,
  };
}

export interface SetupE2eSuiteOptions {
  cleanupAfterEach?: boolean;
}

export class E2eSuite {
  app!: INestApplication;
  prisma!: PrismaService;
}

export function setupE2eSuite(options: SetupE2eSuiteOptions = {}): E2eSuite {
  const suite = new E2eSuite();

  beforeAll(async () => {
    const created = await createE2eApp();
    suite.app = created.app;
    suite.prisma = created.prisma;
    await cleanupTestUsers(suite.prisma);
    await suite.app
      .get(UsersService)
      .seedManager(MANAGER_EMAIL, MANAGER_PASSWORD);
  });

  if (options.cleanupAfterEach) {
    afterEach(async () => {
      await cleanupTestUsers(suite.prisma);
    });
  }

  afterAll(async () => {
    await cleanupTestUsers(suite.prisma);
    await suite.app.close();
  });

  return suite;
}

export async function createE2eApp(): Promise<{
  app: INestApplication;
  prisma: PrismaService;
}> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  const prisma = app.get(PrismaService);

  return { app, prisma };
}

export async function cleanupTestInvoicesAndNotifications(
  prisma: PrismaService,
): Promise<void> {
  const testCustomerFilter = {
    customer: {
      account: {
        email: {
          not: MANAGER_EMAIL,
        },
      },
    },
  };

  await prisma.notification.deleteMany({
    where: testCustomerFilter,
  });

  await prisma.invoice.deleteMany({
    where: testCustomerFilter,
  });
}

export async function cleanupTestUsers(prisma: PrismaService): Promise<void> {
  await cleanupTestInvoicesAndNotifications(prisma);

  await prisma.account.deleteMany({
    where: {
      email: {
        not: MANAGER_EMAIL,
      },
    },
  });
}

export type { AuthLoginResponseDto, ErrorResponseDto, UserResponseDto };
