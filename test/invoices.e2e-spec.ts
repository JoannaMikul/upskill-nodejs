import { VatRate } from '@prisma/client';
import type { ContractorResponseDto } from '../src/contractors/dto/contractor-response.dto';
import type { InvoiceResponseDto } from '../src/invoices/dto/invoice-response.dto';
import type { ErrorResponseDto, TestActors } from './e2e-setup';
import {
  activateCustomer,
  authHeader,
  buildCreateInvoicePayload,
  createContractorAsManager,
  createTestActors,
  e2eRequest,
  loginUser,
  registerUser,
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

  it('lists own invoices via GET /invoices/me with full VAT payload', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const body = response.body as InvoiceResponseDto[];

    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);
    expect(body[0]).toMatchObject({
      invoiceNumber: 'INV/1/2026',
      issueDate: '2026-09-10',
      saleDate: '2026-09-10',
      status: 'ISSUED',
      netAmount: '200.00',
      vatAmount: '46.00',
      grossAmount: '246.00',
      seller: {
        name: 'Seller Sp. z o.o.',
        nip: '7740001454',
      },
      buyer: {
        contractorId: contractor.id,
        name: contractor.name,
      },
    });
    expect(body[0].lineItems).toHaveLength(1);
    expect(body[0].lineItems[0]).toMatchObject({
      lineNumber: 1,
      name: 'IT Service',
      quantity: '2',
      unitNetPrice: '100.00',
      vatRate: 'VAT_23',
      netAmount: '200.00',
    });
  });

  it('returns invoice details via GET /invoices/:id for owner', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const invoiceId = (listResponse.body as InvoiceResponseDto[])[0].id;

    const response = await e2eRequest(e2e.app)
      .get(`/invoices/${invoiceId}`)
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const body = response.body as InvoiceResponseDto;

    expect(body.id).toBe(invoiceId);
    expect(body.seller.name).toBe('Seller Sp. z o.o.');
    expect(body.lineItems).toHaveLength(1);
  });

  it('allows manager to read any invoice via GET /invoices/:id', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const invoiceId = (listResponse.body as InvoiceResponseDto[])[0].id;

    await e2eRequest(e2e.app)
      .get(`/invoices/${invoiceId}`)
      .set('Authorization', authHeader(actors.managerToken))
      .expect(200);
  });

  it('returns 404 when customer requests another customers invoice', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const invoiceId = (listResponse.body as InvoiceResponseDto[])[0].id;

    const otherCustomerCredentials = {
      email: `other-invoice-customer-${Date.now()}@example.com`,
      password: 'CustomerPass1234',
    };
    const otherCustomer = await registerUser(e2e.app, otherCustomerCredentials);
    await activateCustomer(e2e.app, actors.managerToken, otherCustomer.id);
    const otherLogin = await loginUser(e2e.app, otherCustomerCredentials);

    const response = await e2eRequest(e2e.app)
      .get(`/invoices/${invoiceId}`)
      .set('Authorization', authHeader(otherLogin.accessToken))
      .expect(404);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 404,
      message: 'Invoice not found',
    });
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

  it('updates ISSUED invoice via PATCH /invoices/:id', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const invoiceId = (listResponse.body as InvoiceResponseDto[])[0].id;

    const updatePayload = buildCreateInvoicePayload(contractor.id, {
      invoiceNumber: 'INV/2/2026',
      lineItems: [
        {
          lineNumber: 1,
          name: 'Updated IT Service',
          unitOfMeasure: 'h',
          quantity: '4',
          unitNetPrice: '75',
          vatRate: VatRate.VAT_23,
        },
      ],
    });

    const response = await e2eRequest(e2e.app)
      .patch(`/invoices/${invoiceId}`)
      .set('Authorization', authHeader(actors.customerToken))
      .send(updatePayload)
      .expect(200);

    const body = response.body as InvoiceResponseDto;

    expect(body.invoiceNumber).toBe('INV/2/2026');
    expect(body.netAmount).toBe('300.00');
    expect(body.vatAmount).toBe('69.00');
    expect(body.grossAmount).toBe('369.00');
    expect(body.lineItems).toHaveLength(1);
    expect(body.lineItems[0]).toMatchObject({
      name: 'Updated IT Service',
      quantity: '4',
      unitNetPrice: '75.00',
    });

    const lineItemCount = await e2e.prisma.invoiceLineItem.count({
      where: { invoiceId },
    });
    expect(lineItemCount).toBe(1);
  });

  it('returns 409 when updating VERIFIED invoice', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const invoiceId = (listResponse.body as InvoiceResponseDto[])[0].id;

    await e2e.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'VERIFIED' },
    });

    const response = await e2eRequest(e2e.app)
      .patch(`/invoices/${invoiceId}`)
      .set('Authorization', authHeader(actors.customerToken))
      .send(buildCreateInvoicePayload(contractor.id))
      .expect(409);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 409,
      message: 'Verified invoice cannot be updated',
    });
  });

  it('returns 404 when customer patches another customers invoice', async () => {
    const listResponse = await e2eRequest(e2e.app)
      .get('/invoices/me')
      .set('Authorization', authHeader(actors.customerToken))
      .expect(200);

    const invoiceId = (listResponse.body as InvoiceResponseDto[])[0].id;

    const otherCustomerCredentials = {
      email: `patch-other-${Date.now()}@example.com`,
      password: 'CustomerPass1234',
    };
    const otherCustomer = await registerUser(e2e.app, otherCustomerCredentials);
    await activateCustomer(e2e.app, actors.managerToken, otherCustomer.id);
    await upsertSellerProfileForCustomer(
      e2e.app,
      (await loginUser(e2e.app, otherCustomerCredentials)).accessToken,
    );
    const otherLogin = await loginUser(e2e.app, otherCustomerCredentials);

    const response = await e2eRequest(e2e.app)
      .patch(`/invoices/${invoiceId}`)
      .set('Authorization', authHeader(otherLogin.accessToken))
      .send(buildCreateInvoicePayload(contractor.id))
      .expect(404);

    expect(response.body as ErrorResponseDto).toMatchObject({
      statusCode: 404,
      message: 'Invoice not found',
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
