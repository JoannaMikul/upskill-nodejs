import { VatRate } from '@prisma/client';
import type { ActivityLogResponseDto } from '../src/audit/dto/activity-log-response.dto';
import type { ContractorResponseDto } from '../src/contractors/dto/contractor-response.dto';
import type { InvoiceResponseDto } from '../src/invoices/dto/invoice-response.dto';
import {
  activateCustomer,
  authHeader,
  buildCreateInvoicePayload,
  createContractorAsManager,
  e2eRequest,
  loginUser,
  MANAGER_EMAIL,
  MANAGER_PASSWORD,
  registerUser,
  setupE2eSuite,
  upsertSellerProfileForCustomer,
} from './e2e-setup';

const customerCredentials = {
  email: 'audit-customer@example.com',
  password: 'CustomerPass1234',
};

describe('Audit', () => {
  const e2e = setupE2eSuite();
  let managerToken: string;
  let customerAccountId: string;
  let customerToken: string;
  let contractor: ContractorResponseDto;

  beforeAll(async () => {
    const managerLogin = await loginUser(e2e.app, {
      email: MANAGER_EMAIL,
      password: MANAGER_PASSWORD,
    });
    managerToken = managerLogin.accessToken;

    const customer = await registerUser(e2e.app, customerCredentials);
    customerAccountId = customer.id;
    await activateCustomer(e2e.app, managerToken, customer.id);
    const customerLogin = await loginUser(e2e.app, customerCredentials);
    customerToken = customerLogin.accessToken;

    await e2e.prisma.contractor.deleteMany();
    await upsertSellerProfileForCustomer(e2e.app, customerToken);
    contractor = await createContractorAsManager(e2e.app, managerToken);

    const createResponse = await e2eRequest(e2e.app)
      .post('/invoices')
      .set('Authorization', authHeader(customerToken))
      .send(buildCreateInvoicePayload(contractor.id))
      .expect(201);

    const invoiceId = (createResponse.body as InvoiceResponseDto).id;

    await e2eRequest(e2e.app)
      .patch(`/invoices/${invoiceId}`)
      .set('Authorization', authHeader(customerToken))
      .send(
        buildCreateInvoicePayload(contractor.id, {
          invoiceNumber: 'AUDIT/2/2026',
          lineItems: [
            {
              lineNumber: 1,
              name: 'Audit Service',
              unitOfMeasure: 'h',
              quantity: '1',
              unitNetPrice: '100',
              vatRate: VatRate.VAT_23,
            },
          ],
        }),
      )
      .expect(200);

    await e2eRequest(e2e.app)
      .patch(`/invoices/${invoiceId}/verify`)
      .set('Authorization', authHeader(managerToken))
      .expect(200);
  });

  it('returns customer activity filtered by accountId for manager', async () => {
    const response = await e2eRequest(e2e.app)
      .get('/audit/activity')
      .query({ accountId: customerAccountId })
      .set('Authorization', authHeader(managerToken))
      .expect(200);

    const body = response.body as ActivityLogResponseDto[];
    const actions = body.map((entry) => entry.action);

    expect(actions).toEqual(
      expect.arrayContaining(['LOGIN', 'INVOICE_CREATED', 'INVOICE_UPDATED']),
    );
    expect(body.every((entry) => entry.accountId === customerAccountId)).toBe(
      true,
    );
  });

  it('includes INVOICE_VERIFIED for manager account', async () => {
    const managerAccount = await e2e.prisma.account.findUnique({
      where: { email: MANAGER_EMAIL },
    });

    const response = await e2eRequest(e2e.app)
      .get('/audit/activity')
      .query({ accountId: managerAccount!.id })
      .set('Authorization', authHeader(managerToken))
      .expect(200);

    const body = response.body as ActivityLogResponseDto[];
    const actions = body.map((entry) => entry.action);

    expect(actions).toContain('INVOICE_VERIFIED');
  });

  it('returns 403 when customer requests audit activity', async () => {
    await e2eRequest(e2e.app)
      .get('/audit/activity')
      .set('Authorization', authHeader(customerToken))
      .expect(403);
  });
});
