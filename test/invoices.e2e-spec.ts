import type { ContractorResponseDto } from '../src/contractors/dto/contractor-response.dto';
import type { InvoiceResponseDto } from '../src/invoices/dto/invoice-response.dto';
import type { ErrorResponseDto, TestActors } from './e2e-setup';
import {
  authHeader,
  buildCreateInvoicePayload,
  createContractorAsManager,
  createTestActors,
  e2eRequest,
  setupE2eSuite,
  upsertSellerProfileForCustomer,
} from './e2e-setup';

const customerCredentials = {
  email: 'invoice-customer@example.com',
  password: 'CustomerPass1234',
};

describe('Invoices', () => {
  const e2e = setupE2eSuite();
  let actors: TestActors;
  let contractor: ContractorResponseDto;

  beforeAll(async () => {
    actors = await createTestActors(e2e.app, customerCredentials);
    await upsertSellerProfileForCustomer(e2e.app, actors.customerToken);
    contractor = await createContractorAsManager(e2e.app, actors.managerToken);
  });

  it('creates invoice with snapshots, line items and calculated totals', async () => {
    const payload = buildCreateInvoicePayload(contractor.id);

    const response = await e2eRequest(e2e.app)
      .post('/invoices')
      .set('Authorization', authHeader(actors.customerToken))
      .send(payload)
      .expect(201);

    const body = response.body as InvoiceResponseDto;

    expect(body).toHaveProperty('id');
    expect(body).toHaveProperty('customerId');
    expect(body).toHaveProperty('createdAt');
    expect(body).toHaveProperty('updatedAt');

    const customer = await e2e.prisma.customer.findUnique({
      where: { accountId: actors.customer.id },
    });

    expect(customer).not.toBeNull();

    const invoice = await e2e.prisma.invoice.findUnique({
      where: { id: body.id },
      include: {
        seller: true,
        buyer: true,
        lineItems: true,
      },
    });

    expect(invoice).not.toBeNull();
    expect(invoice).toMatchObject({
      invoiceNumber: payload.invoiceNumber,
      status: 'ISSUED',
      seller: {
        name: 'Seller Sp. z o.o.',
        nip: '7740001454',
        address: '1 Seller Street, 00-001 Warsaw',
        bankAccountNumber: 'PL61109010140000071219812874',
      },
      buyer: {
        contractorId: contractor.id,
        name: contractor.name,
        nip: contractor.nip,
        address: contractor.address,
        postalCode: contractor.postalCode,
        city: contractor.city,
        country: contractor.country,
      },
    });
    expect(invoice!.netAmount.toFixed(2)).toBe('200.00');
    expect(invoice!.vatAmount.toFixed(2)).toBe('46.00');
    expect(invoice!.grossAmount.toFixed(2)).toBe('246.00');
    expect(invoice!.lineItems).toHaveLength(1);
    expect(invoice!.lineItems[0]).toMatchObject({
      lineNumber: 1,
      name: 'IT Service',
      unitOfMeasure: 'pcs.',
      vatRate: 'VAT_23',
    });
    expect(invoice!.lineItems[0].netAmount.toFixed(2)).toBe('200.00');
  });

  it('lists own invoices via GET /invoices/me', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const body = response.body as InvoiceResponseDto[];

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toHaveProperty('id');
    expect(body[0]).toHaveProperty('customerId');
  });

  it('returns 409 when invoice number already exists for customer', async () => {
    const payload = buildCreateInvoicePayload(contractor.id, {
      invoiceNumber: 'INV/1/2026',
    });

    const response = await e2eRequest(e2e.app)
      .post('/invoices')
      .set('Authorization', authHeader(actors.customerToken))
      .send(payload)
      .expect(409);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 409,
      message: 'Invoice number already exists',
    });
  });

  it('returns 400 for invalid invoice payload', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/invoices')
      .set('Authorization', authHeader(actors.customerToken))
      .send({
        buyerId: contractor.id,
        invoiceNumber: 'INV/INVALID',
        issueDate: 'not-a-date',
        saleDate: '2026-09-10',
        lineItems: [],
      })
      .expect(400);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 400,
    });
  });
});

describe('Invoices without seller profile', () => {
  const e2e = setupE2eSuite({ cleanupAfterEach: true });
  let actors: TestActors;
  let contractor: ContractorResponseDto;

  beforeEach(async () => {
    actors = await createTestActors(e2e.app, {
      email: `no-seller-${Date.now()}@example.com`,
      password: 'CustomerPass1234',
    });
    contractor = await createContractorAsManager(e2e.app, actors.managerToken, {
      name: 'Buyer Without Seller',
      nip: '701-006-95-86',
      address: '20 Buyer Street',
      postalCode: '00-002',
      city: 'Warsaw',
      country: 'PL',
    });
  });

  it('returns 404 when seller profile is missing', async () => {
    const response = await e2eRequest(e2e.app)
      .post('/invoices')
      .set('Authorization', authHeader(actors.customerToken))
      .send(buildCreateInvoicePayload(contractor.id))
      .expect(404);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 404,
      message: 'Seller profile not found',
    });
  });
});
