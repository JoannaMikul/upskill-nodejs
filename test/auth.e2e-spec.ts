import {
  AuthLoginResponseDto,
  e2eRequest,
  ErrorResponseDto,
  MANAGER_EMAIL,
  MANAGER_PASSWORD,
  setupE2eSuite,
  UserResponseDto,
} from './e2e-setup';

const customer = {
  email: 'customer@example.com',
  password: 'CustomerPass1234',
};

describe('Auth', () => {
  const e2e = setupE2eSuite({ cleanupAfterEach: true });

  it('registers a Customer and returns 201 without access token', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(customer)
      .expect(201);

    const body = response.body as UserResponseDto;

    expect(body).toMatchObject({
      email: customer.email,
      role: 'CUSTOMER',
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

    const body = response.body as AuthLoginResponseDto;

    expect(body).toHaveProperty('accessToken');
    expect(typeof body.accessToken).toBe('string');
    expect(body.user).toMatchObject({
      email: MANAGER_EMAIL,
      role: 'MANAGER',
    });
  });

  it('logs in registered Customer and returns JWT', async () => {
    await e2eRequest(e2e.app).post('/auth/register').send(customer).expect(201);

    const response = await e2eRequest(e2e.app)
      .post('/auth/login')
      .send(customer)
      .expect(200);

    const body = response.body as AuthLoginResponseDto;

    expect(body).toHaveProperty('accessToken');
    expect(body.user).toMatchObject({
      email: customer.email,
      role: 'CUSTOMER',
    });
  });

  it('returns 409 when registering duplicate email', async () => {
    await e2eRequest(e2e.app).post('/auth/register').send(customer).expect(201);

    const response = await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(customer)
      .expect(409);

    const body = response.body as ErrorResponseDto;

    expect(body).toMatchObject({
      statusCode: 409,
      message: 'Email already registered',
    });
  });

  it('returns 401 when login password is wrong', async () => {
    await e2eRequest(e2e.app).post('/auth/register').send(customer).expect(201);

    const response = await e2eRequest(e2e.app)
      .post('/auth/login')
      .send({
        email: customer.email,
        password: 'WrongPassword123',
      })
      .expect(401);

    const body = response.body as ErrorResponseDto;

    expect(body).toMatchObject({
      statusCode: 401,
      message: 'Invalid email or password',
    });
  });
});
