import type {
  ErrorResponseDto,
  TestActors,
  UserResponseDto,
} from './e2e-setup';
import {
  authHeader,
  createTestActors,
  e2eRequest,
  setupE2eSuite,
} from './e2e-setup';

const customerCredentials = {
  email: 'customer@example.com',
  password: 'CustomerPass1234',
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
});
