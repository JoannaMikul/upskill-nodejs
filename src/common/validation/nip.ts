import { z } from 'zod';

const NIP_WEIGHTS = [6, 5, 7, 8, 3, 4, 5, 6, 7] as const;
const NORMALIZED_NIP_PATTERN = /^\d{10}$/;

export function normalizeNip(value: string): string {
  return value.replace(/\D/g, '');
}

function hasValidNipChecksum(normalizedNip: string): boolean {
  if (!NORMALIZED_NIP_PATTERN.test(normalizedNip)) {
    return false;
  }

  const sum = NIP_WEIGHTS.reduce(
    (total, weight, index) => total + Number(normalizedNip[index]) * weight,
    0,
  );

  const checksum = sum % 11;

  if (checksum === 10) {
    return false;
  }

  return checksum === Number(normalizedNip[9]);
}

export function isValidNip(value: string): boolean {
  return hasValidNipChecksum(normalizeNip(value));
}

export function parseNip(value: string): string {
  const normalizedNip = normalizeNip(value);

  if (!hasValidNipChecksum(normalizedNip)) {
    throw new Error(`Invalid NIP: ${value}`);
  }

  return normalizedNip;
}

export const NipSchema = z
  .string()
  .transform(normalizeNip)
  .refine(
    (normalizedNip) => NORMALIZED_NIP_PATTERN.test(normalizedNip),
    'NIP must contain 10 digits',
  )
  .refine(hasValidNipChecksum, 'Invalid NIP checksum');

export type Nip = z.infer<typeof NipSchema>;
