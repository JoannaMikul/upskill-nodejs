import { NipSchema, isValidNip, normalizeNip, parseNip } from './nip';

describe('normalizeNip', () => {
  it('removes dashes and spaces', () => {
    expect(normalizeNip('123-45-67-891')).toBe('1234567891');
    expect(normalizeNip('123 45 67 891')).toBe('1234567891');
  });

  it('returns digits-only input unchanged', () => {
    expect(normalizeNip('1234567891')).toBe('1234567891');
  });
});

describe('isValidNip', () => {
  it.each(['1234567891', '7740001454'])('accepts valid NIP %s', (value) => {
    expect(isValidNip(value)).toBe(true);
  });

  it.each(['123-45-67-891', '123 45 67 891'])(
    'accepts formatted valid NIP %s',
    (value) => {
      expect(isValidNip(value)).toBe(true);
    },
  );

  it.each(['1234567890', '1234567892', 'abcdefghij'])(
    'rejects invalid checksum or non-digit input %s',
    (value) => {
      expect(isValidNip(value)).toBe(false);
    },
  );

  it.each(['123456789', '12345678911', ''])(
    'rejects invalid length %s',
    (value) => {
      expect(isValidNip(value)).toBe(false);
    },
  );

  it('rejects NIP when weighted sum modulo 11 equals 10', () => {
    expect(isValidNip('3333333333')).toBe(false);
  });
});

describe('parseNip', () => {
  it('returns normalized NIP for valid input', () => {
    expect(parseNip('123-45-67-891')).toBe('1234567891');
  });

  it('throws for invalid NIP', () => {
    expect(() => parseNip('1234567890')).toThrow('Invalid NIP: 1234567890');
  });
});

describe('NipSchema', () => {
  it('parses and normalizes a valid NIP', () => {
    expect(NipSchema.parse('123-45-67-891')).toBe('1234567891');
  });

  it('rejects invalid checksum with a validation error', () => {
    const result = NipSchema.safeParse('1234567890');

    expect(result.success).toBe(false);
  });

  it('rejects invalid length with a validation error', () => {
    const result = NipSchema.safeParse('123456789');

    expect(result.success).toBe(false);
  });
});
