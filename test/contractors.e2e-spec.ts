import type { ContractorResponseDto } from '../src/contractors/dto/contractor-response.dto';
import type { ErrorResponseDto, TestActors } from './e2e-setup';
import {
  authHeader,
  createTestActors,
  e2eRequest,
  setupE2eSuite,
} from './e2e-setup';

const customerCredentials = {
  email: 'contractor-customer@example.com',
  password: 'CustomerPass1234',
};

const createContractorPayload = {
  name: 'Test Contractor Ltd.',
  nip: '123-456-78-91',
  address: '10 Example Street',
  postalCode: '00-001',
  city: 'Warsaw',
  country: 'PL',
  email: 'contractor@example.com',
};

describe('Contractors', () => {
  const e2e = setupE2eSuite();
  let actors: TestActors;

  beforeAll(async () => {
    await e2e.prisma.contractor.deleteMany();
    actors = await createTestActors(e2e.app, customerCredentials);
  });

  afterAll(async () => {
    await e2e.prisma.contractor.deleteMany();
  });

  it('allows Manager to create contractor and normalizes NIP', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/contractors')
      .set('Authorization', authHeader(actors.managerToken))
      .send(createContractorPayload)
      .expect(201);

    const body = response.body as ContractorResponseDto;

    expect(body).toMatchObject({
      name: createContractorPayload.name,
      nip: '1234567891',
      address: createContractorPayload.address,
      postalCode: createContractorPayload.postalCode,
      city: createContractorPayload.city,
      country: 'PL',
      email: createContractorPayload.email,
    });
    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');
  });

  it('allows Manager to list contractors', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/contractors')
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    const body = response.body as ContractorResponseDto[];

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toMatchObject({
      name: createContractorPayload.name,
      nip: '1234567891',
    });
  });

  it('allows Manager to get contractor by id', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/contractors')
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    const [contractor] = listResponse.body as ContractorResponseDto[];

    const response = await e2eRequest(e2e.app)
      .get(`/contractors/${contractor.id}`)
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    expect(response.body as ContractorResponseDto).toMatchObject({
      id: contractor.id,
      nip: '1234567891',
    });
  });

  it('allows Manager to update contractor', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/contractors')
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);

    const [contractor] = listResponse.body as ContractorResponseDto[];

    const response = await e2eRequest(e2e.app)
      .patch(`/contractors/${contractor.id}`)
      .set('Authorization', authHeader(actors.managerToken))
      .send({ name: 'Updated Contractor' })
      .expect(200);

    expect(response.body as ContractorResponseDto).toMatchObject({
      id: contractor.id,
      name: 'Updated Contractor',
      nip: '1234567891',
    });
  });

  it('returns 403 when Customer tries to create contractor', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/contractors')
      .set('Authorization', authHeader(actors.customerToken))
      .send({
        ...createContractorPayload,
        nip: '7740001454',
        name: 'Customer Attempt',
      })
      .expect(403);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 403,
    });
  });

  it('returns 403 when Customer tries to list contractors', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/contractors')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(403);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 403,
    });
  });

  it('returns 409 when Manager creates contractor with duplicate NIP', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/contractors')
      .set('Authorization', authHeader(actors.managerToken))
      .send({
        ...createContractorPayload,
        name: 'Duplicate NIP Attempt',
      })
      .expect(409);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 409,
      message: 'NIP already registered',
    });
  });

  it('returns 404 when Manager gets non-existent contractor', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/contractors/00000000-0000-0000-0000-000000000000')
      .set('Authorization', authHeader(actors.managerToken))
      .expect(404);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 404,
      message: 'Contractor not found',
    });
  });

  it('returns 404 when Manager updates non-existent contractor', async () => {
    const response = await e2eRequest(e2e.app)
      .patch('/contractors/00000000-0000-0000-0000-000000000000')
      .set('Authorization', authHeader(actors.managerToken))
      .send({ name: 'Missing' })
      .expect(404);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 404,
      message: 'Contractor not found',
    });
  });
});
