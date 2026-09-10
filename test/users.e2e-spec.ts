import { InvoiceReminderService } from '../src/cron/invoice-reminder.service';
import type { CustomerListItemResponseDto } from '../src/users/dto/customer-list-item-response.dto';
import type {
  ErrorResponseDto,
  TestActors,
  UserResponseDto,
} from './e2e-setup';
import {
  activateCustomer,
  authHeader,
  createTestActors,
  e2eRequest,
  loginUser,
  MANAGER_EMAIL,
  MANAGER_PASSWORD,
  registerUser,
  setupE2eSuite,
} from './e2e-setup';

const customerCredentials = {
  email: 'customer@example.com',
  password: 'CustomerPass1234',
};

const sellerProfile = {
  name: 'Allegro sp. z o.o.',
  nip: '774-000-14-54',
  address: '1 Test Street, 00-001 Warsaw',
  bankAccountNumber: 'PL61109010140000071219812874',
};

describe('Users', () => {
  const e2e = setupE2eSuite();
  let actors: TestActors;

  beforeAll(async () => {
    actors = await createTestActors(e2e.app, customerCredentials);
  });

  it('returns 200 for GET /users/me with valid token', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    expect(response.body as UserResponseDto).toMatchObject({
      id: actors.customer.id,
      email: customerCredentials.email,
      role: 'CUSTOMER',
      isActive: true,
    });
  });

  it('returns 401 for GET /users/me without token', async () => {
    const response = await e2eRequest(e2e.app).get('/users/me').expect(401);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 401,
    });
  });

  it('allows Manager to look up user by id', async () => {
    const response = await e2eRequest(e2e.app)
      .get(`/users/${actors.customer.id}`)
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    expect(response.body as UserResponseDto).toMatchObject({
      id: actors.customer.id,
      email: customerCredentials.email,
      role: 'CUSTOMER',
      isActive: true,
    });
  });

  it('allows Manager to look up user by email query param', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users')
      .query({ email: customerCredentials.email })
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    expect(response.body as UserResponseDto).toMatchObject({
      id: actors.customer.id,
      email: customerCredentials.email,
      role: 'CUSTOMER',
    });
  });

  it('returns 403 when Customer looks up user by id', async () => {
    const response = await e2eRequest(e2e.app)
      .get(`/users/${actors.customer.id}`)
      .set('Authorization', authHeader(actors.customerToken))
      .expect(403);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 403,
    });
  });

  it('returns 403 when Customer looks up user by email', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users')
      .query({ email: customerCredentials.email })
      .set('Authorization', authHeader(actors.customerToken))
      .expect(403);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 403,
    });
  });

  it('returns 404 when Manager looks up non-existent user by id', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', authHeader(actors.managerToken))
      .expect(404);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 404,
    });
  });

  it('allows Manager to list customers with isActive flag', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users/customers')
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    const customers = response.body as CustomerListItemResponseDto[];

    expect(customers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: actors.customer.id,
          email: customerCredentials.email,
          isActive: true,
        }),
      ]),
    );
  });

  it('returns 403 when Customer lists customers', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users/customers')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(403);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 403,
    });
  });

  it('allows Customer to upsert seller profile and read it back via GET /users/me', async () => {
    const patchResponse = await e2eRequest(e2e.app)
      .patch('/users/me/seller-profile')
      .set('Authorization', authHeader(actors.customerToken))
      .send(sellerProfile)
      .expect(200);

    expect(patchResponse.body as UserResponseDto).toMatchObject({
      sellerProfile: {
        name: sellerProfile.name,
        nip: '7740001454',
        address: sellerProfile.address,
        bankAccountNumber: sellerProfile.bankAccountNumber,
      },
    });

    const meResponse = await e2eRequest(e2e.app)
      .get('/users/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    expect(meResponse.body as UserResponseDto).toMatchObject({
      sellerProfile: {
        name: sellerProfile.name,
        nip: '7740001454',
        address: sellerProfile.address,
        bankAccountNumber: sellerProfile.bankAccountNumber,
      },
    });
  });
});

describe('Users access control', () => {
  const e2e = setupE2eSuite({ cleanupAfterEach: true });

  it('rejects login until Manager activates newly registered Customer', async () => {
    const pendingCustomer = {
      email: 'pending-customer@example.com',
      password: 'CustomerPass1234',
    };

    const registered = await registerUser(e2e.app, pendingCustomer);

    expect(registered.isActive).toBe(false);

    await e2eRequest(e2e.app)
      .post('/auth/login')
      .send(pendingCustomer)
      .expect(401);

    const managerLogin = await loginUser(e2e.app, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
    });

    await activateCustomer(e2e.app, managerLogin.accessToken, registered.id);

    const customerLogin = await loginUser(e2e.app, pendingCustomer);

    expect(customerLogin.accessToken).toEqual(expect.any(String));
  });

  it('invalidates existing JWT after Manager deactivates Customer', async () => {
    const credentials = {
      email: 'deactivate-me@example.com',
      password: 'CustomerPass1234',
    };

    const managerLogin = await loginUser(e2e.app, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
    });
    const registered = await registerUser(e2e.app, credentials);
    await activateCustomer(e2e.app, managerLogin.accessToken, registered.id);
    const customerLogin = await loginUser(e2e.app, credentials);

    await e2eRequest(e2e.app)
      .get('/users/me')
      .set('Authorization', authHeader(customerLogin.accessToken))
      .expect(200);

    await e2eRequest(e2e.app)
      .patch(`/users/${registered.id}/access`)
      .set('Authorization', authHeader(managerLogin.accessToken))
      .send({ isActive: false })
      .expect(200);

    await e2eRequest(e2e.app)
      .get('/users/me')
      .set('Authorization', authHeader(customerLogin.accessToken))
      .expect(401);
  });

  it('does not send cron reminder to inactive Customer', async () => {
    const credentials = {
      email: 'inactive-cron@example.com',
      password: 'CustomerPass1234',
    };

    const managerLogin = await loginUser(e2e.app, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
    });
    const registered = await registerUser(e2e.app, credentials);

    const reminderService = e2e.app.get(InvoiceReminderService);
    const referenceDate = new Date();

    await reminderService.run(referenceDate);

    const customer = await e2e.prisma.customer.findUnique({
      where: { accountId: registered.id },
    });

    expect(customer).not.toBeNull();

    let notifications = await e2e.prisma.notification.findMany({
      where: { customerId: customer!.id },
    });

    expect(notifications).toHaveLength(0);

    await activateCustomer(e2e.app, managerLogin.accessToken, registered.id);

    await reminderService.run(referenceDate);

    notifications = await e2e.prisma.notification.findMany({
      where: { customerId: customer!.id },
    });

    expect(notifications).toHaveLength(1);
  });
});

describe('Users Manager access endpoint', () => {
  const e2e = setupE2eSuite({ cleanupAfterEach: true });

  it('returns 400 when Manager tries to change access for another Manager', async () => {
    const managerLogin = await loginUser(e2e.app, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
    });

    const managerAccount = await e2e.prisma.account.findUniqueOrThrow({
      where: { email: MANAGER_EMAIL },
    });

    const response = await e2eRequest(e2e.app)
      .patch(`/users/${managerAccount.id}/access`)
      .set('Authorization', authHeader(managerLogin.accessToken))
      .send({ isActive: false })
      .expect(400);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 400,
      message: 'Access can only be changed for customer accounts',
    });
  });
});
