import type {
  AuthLoginResponseDto,
  ErrorResponseDto,
  UserResponseDto,
} from './e2e-setup';
import {
  activateCustomer,
  e2eRequest,
  loginUser,
  MANAGER_EMAIL,
  MANAGER_PASSWORD,
  setupE2eSuite,
} from './e2e-setup';

const customer = {
  email: 'customer@example.com',
  password: 'CustomerPass1234',
};

describe('Auth', () => {
  const e2e = setupE2eSuite({ cleanupAfterEach: true });

  it('registers a Customer as inactive and returns 201 without access token', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(customer)
      .expect(201);

    const body = response.body as UserResponseDto;

    expect(body).toMatchObject({
      email: customer.email,
      role: 'CUSTOMER',
      isActive: false,
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
      isActive: true,
    });
  });

  it('logs in registered Customer after Manager activation and returns JWT', async () => {
    const registerResponse = await e2eRequest(e2e.app)
      .post('/auth/register')
      .send(customer)
      .expect(201);

    const registered = registerResponse.body as UserResponseDto;

    await e2eRequest(e2e.app).post('/auth/login').send(customer).expect(401);

    const managerLogin = await loginUser(e2e.app, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
    });

    await activateCustomer(e2e.app, managerLogin.accessToken, registered.id);

    const response = await e2eRequest(e2e.app)
      .post('/auth/login')
      .send(customer)
      .expect(200);

    const body = response.body as AuthLoginResponseDto;

    expect(body).toHaveProperty('accessToken');
    expect(body.user).toMatchObject({
      email: customer.email,
      role: 'CUSTOMER',
      isActive: true,
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
