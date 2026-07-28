import {
  ApiErrorResponseBody,
  e2eRequest,
  LoginResponseBody,
  MANAGER_EMAIL,
  MANAGER_PASSWORD,
  RegisterResponseBody,
  setupE2eSuite,
} from './e2e-setup';

const subcontractor = {
  email: 'subcontractor@example.com',
  password: 'SubPass1234',
};

describe('Auth', () => {
  const e2e = setupE2eSuite({ cleanupAfterEach: true });

  it('registers a Subcontractor and returns 201 without access token', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(subcontractor)
      .expect(201);

    const body = response.body as RegisterResponseBody;

    expect(body).toMatchObject({
      email: subcontractor.email,
      role: 'SUBCONTRACTOR',
    });
    expect(body).toHaveProperty('id');
    expect(body).not.toHaveProperty('passwordHash');
    expect(body).not.toHaveProperty('accessToken');
  });

  it('logs in seeded Manager and returns JWT', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/auth/login')
      .send({
        email: MANAGER_EMAIL,
        password: MANAGER_PASSWORD,
      })
      .expect(200);

    const body = response.body as LoginResponseBody;

    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.user).toMatchObject({
      email: MANAGER_EMAIL,
      role: 'MANAGER',
    });
  });

  it('logs in registered Subcontractor and returns JWT', async () => {
    await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(subcontractor)
      .expect(201);

    const response = await e2eRequest(e2e.app)
      .post('/auth/login')
      .send(subcontractor)
      .expect(200);

    const body = response.body as LoginResponseBody;

    expect(body).toHaveProperty('accessToken');
    expect(body.user).toMatchObject({
      email: subcontractor.email,
      role: 'SUBCONTRACTOR',
    });
  });

  it('returns 409 when registering duplicate email', async () => {
    await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(subcontractor)
      .expect(201);

    const response = await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(subcontractor)
      .expect(409);

    const body = response.body as ApiErrorResponseBody;

    expect(body).toMatchObject({
      statusCode: 409,
      message: 'Email already registered',
    });
  });

  it('returns 401 when login password is wrong', async () => {
    await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(subcontractor)
      .expect(201);

    const response = await e2eRequest(e2e.app)
      .post('/auth/login')
      .send({
        email: subcontractor.email,
        password: 'WrongPassword123',
      })
      .expect(401);

    const body = response.body as ApiErrorResponseBody;

    expect(body).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });
});
