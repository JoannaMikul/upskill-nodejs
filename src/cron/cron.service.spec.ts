import type { ConfigService } from '@nestjs/config';
import type { InvoiceReminderService } from './invoice-reminder.service';
import { CronService } from './cron.service';

const REMINDER_DAY = new Date(2026, 0, 28);

describe('CronService', () => {
  const run = jest.fn().mockResolvedValue(undefined);

  function createService(cronEnabled?: string): CronService {
    const configService = {
      get: jest.fn().mockReturnValue(cronEnabled),
    } as unknown as ConfigService;

    const invoiceReminderService = {
      run,
    } as unknown as InvoiceReminderService;

    return new CronService(invoiceReminderService, configService);
  }

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(REMINDER_DAY);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('runs the reminder when CRON_ENABLED is unset', async () => {
    const service = createService(undefined);

    await service.handleInvoiceReminder();

    expect(run).toHaveBeenCalledWith(REMINDER_DAY);
  });

  it('skips the reminder when CRON_ENABLED is false', async () => {
    const service = createService('false');

    await service.handleInvoiceReminder();

    expect(run).not.toHaveBeenCalled();
  });
});
