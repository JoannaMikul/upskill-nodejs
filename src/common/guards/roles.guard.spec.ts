import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import type { JwtPayload } from '../types/authenticated-user.interface';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);
  const jwtSub = '550e8400-e29b-41d4-a716-446655440000';

  const createContext = (user?: JwtPayload): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as ExecutionContext;

  it('allows access when no @Roles metadata is set', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows access when user has a required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MANAGER]);

    expect(
      guard.canActivate(
        createContext({
          sub: jwtSub,
          role: Role.MANAGER,
        }),
      ),
    ).toBe(true);
  });

  it('denies access when user role does not match', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MANAGER]);

    expect(
      guard.canActivate(
        createContext({
          sub: jwtSub,
          role: Role.CUSTOMER,
        }),
      ),
    ).toBe(false);
  });
});
