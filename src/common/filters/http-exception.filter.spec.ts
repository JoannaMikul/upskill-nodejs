import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';
import { z } from 'zod';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  const filter = new HttpExceptionFilter();

  const createHost = () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });

    return {
      json,
      status,
      host: {
        switchToHttp: () => ({
          getResponse: () => ({ status }),
        }),
      } as never,
    };
  };

  it('maps Zod validation errors to field/message pairs', () => {
    const schema = z.object({
      email: z.email(),
      password: z.string().min(8),
    });

    let zodError: unknown;
    try {
      schema.parse({ email: 'not-an-email', password: 'short' });
    } catch (error) {
      zodError = error;
    }

    const { json, status, host } = createHost();

    filter.catch(new ZodValidationException(zodError), host);

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      statusCode: 400,
      message: 'Validation failed',
      errors: [
        expect.objectContaining({ field: 'email' }),
        expect.objectContaining({ field: 'password' }),
      ],
    });
  });

  it('returns unified shape for standard HttpExceptions', () => {
    const { json, status, host } = createHost();

    filter.catch(new NotFoundException('User not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      message: 'User not found',
      errors: [],
    });
  });

  it('preserves status codes for auth and conflict errors', () => {
    const unauthorizedHost = createHost();
    filter.catch(
      new UnauthorizedException('Invalid credentials'),
      unauthorizedHost.host,
    );
    expect(unauthorizedHost.status).toHaveBeenCalledWith(401);

    const conflictHost = createHost();
    filter.catch(
      new ConflictException('Email already exists'),
      conflictHost.host,
    );
    expect(conflictHost.status).toHaveBeenCalledWith(409);
  });
});
