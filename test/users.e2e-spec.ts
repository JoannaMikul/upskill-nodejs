import {
  ApiErrorResponseBody,
  authHeader,
  createTestActors,
  e2eRequest,
  RegisterResponseBody,
  setupE2eSuite,
  TestActors,
} from './e2e-setup';

const subcontractorCredentials = {
  email: 'subcontractor@example.com',
  password: 'SubPass1234',
};

describe('Users', () => {
  const e2e = setupE2eSuite();
  let actors: TestActors;

  beforeAll(async () => {
    actors = await createTestActors(e2e.app, subcontractorCredentials);
  });

  it('returns 200 for GET /users/me with valid token', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users/me')
      .set('Authorization', authHeader(actors.subcontractorToken))
      .expect(200);

    expect(response.body as RegisterResponseBody).toMatchObject({
      id: actors.subcontractor.id,
      email: subcontractorCredentials.email,
      role: 'SUBCONTRACTOR',
    });
  });

  it('returns 401 for GET /users/me without token', async () => {
    const response = await e2eRequest(e2e.app).get('/users/me').expect(401);

    expect(response.body as ApiErrorResponseBody).toMatchObject({
      statusCode: 401,
    });
  });

  it('allows Manager to look up user by id', async () => {
    const response = await e2eRequest(e2e.app)
      .get(`/users/${actors.subcontractor.id}`)
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    expect(response.body as RegisterResponseBody).toMatchObject({
      id: actors.subcontractor.id,
      email: subcontractorCredentials.email,
      role: 'SUBCONTRACTOR',
    });
  });

  it('allows Manager to look up user by email query param', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users')
      .query({ email: subcontractorCredentials.email })
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    expect(response.body as RegisterResponseBody).toMatchObject({
      id: actors.subcontractor.id,
      email: subcontractorCredentials.email,
      role: 'SUBCONTRACTOR',
    });
  });

  it('returns 403 when Subcontractor looks up user by id', async () => {
    const response = await e2eRequest(e2e.app)
      .get(`/users/${actors.subcontractor.id}`)
      .set('Authorization', authHeader(actors.subcontractorToken))
      .expect(403);

    expect(response.body as ApiErrorResponseBody).toMatchObject({
      statusCode: 403,
    });
  });

  it('returns 403 when Subcontractor looks up user by email', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users')
      .query({ email: subcontractorCredentials.email })
      .set('Authorization', authHeader(actors.subcontractorToken))
      .expect(403);

    expect(response.body as ApiErrorResponseBody).toMatchObject({
      statusCode: 403,
    });
  });

  it('returns 404 when Manager looks up non-existent user by id', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/users/00000000-0000-0000-0000-000000000000')
      .set('Authorization', authHeader(actors.managerToken))
      .expect(404);

    expect(response.body as ApiErrorResponseBody).toMatchObject({
      statusCode: 404,
    });
  });
});
