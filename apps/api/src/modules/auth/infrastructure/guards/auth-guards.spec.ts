import 'reflect-metadata';

import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { isPublic, Protected } from '../../../../shared-kernal/infrastructure/decorators/public.decorator';
import { Roles } from '../../../../shared-kernal/infrastructure/decorators/roles.decorator';
import type { UsersRepositoryPort } from '../../application/ports/users.repository.port';
import { RolesGuard } from './roles.guard';
import { shouldBypassJwtAuth } from './jwt-auth.guard';

type ControllerClass = {
  prototype: object;
};

@isPublic()
class PublicController {
  publicEndpoint() { return null; }
  protectedEndpoint() { return null; }
  adminEndpoint() { return null; }
  memberEndpoint() { return null; }
}

class DefaultController {
  publicEndpoint() { return null; }
}

applyMethodDecorator(PublicController, 'protectedEndpoint', Protected());
applyMethodDecorator(PublicController, 'adminEndpoint', Roles('ADMIN'));
applyMethodDecorator(PublicController, 'memberEndpoint', Roles('ADMIN', 'USER'));
applyMethodDecorator(DefaultController, 'publicEndpoint', isPublic());

describe('auth guard metadata', () => {
  const reflector = new Reflector();

  it('allows public controller methods to bypass JWT by default', () => {
    const context = createContext(PublicController, 'publicEndpoint');

    expect(shouldBypassJwtAuth(reflector, context)).toBe(true);
  });

  it('lets a method-level Protected decorator override a public controller', () => {
    const context = createContext(PublicController, 'protectedEndpoint');

    expect(shouldBypassJwtAuth(reflector, context)).toBe(false);
  });

  it('requires JWT when a public controller method declares roles', () => {
    const context = createContext(PublicController, 'adminEndpoint');

    expect(shouldBypassJwtAuth(reflector, context)).toBe(false);
  });

  it('allows public methods on protected-by-default controllers to bypass JWT', () => {
    const context = createContext(DefaultController, 'publicEndpoint');

    expect(shouldBypassJwtAuth(reflector, context)).toBe(true);
  });
});

describe('RolesGuard', () => {
  it('allows routes with no role metadata', async () => {
    const usersRepository = createUsersRepository();
    const guard = new RolesGuard(usersRepository, new Reflector());

    await expect(
      guard.canActivate(createContext(PublicController, 'publicEndpoint')),
    ).resolves.toBe(true);
    expect(usersRepository.findById).not.toHaveBeenCalled();
  });

  it('denies role routes without an authenticated user', async () => {
    const guard = new RolesGuard(createUsersRepository(), new Reflector());

    await expect(
      guard.canActivate(createContext(PublicController, 'adminEndpoint')),
    ).resolves.toBe(false);
  });

  it('checks required roles against the persisted user role', async () => {
    const usersRepository = createUsersRepository('ADMIN');
    const guard = new RolesGuard(usersRepository, new Reflector());

    await expect(
      guard.canActivate(
        createContext(PublicController, 'adminEndpoint', {
          user: { id: 'user-id' },
        }),
      ),
    ).resolves.toBe(true);
  });

  it('allows any declared role to satisfy the route', async () => {
    const usersRepository = createUsersRepository('USER');
    const guard = new RolesGuard(usersRepository, new Reflector());

    await expect(
      guard.canActivate(
        createContext(PublicController, 'memberEndpoint', {
          user: { id: 'user-id' },
        }),
      ),
    ).resolves.toBe(true);
  });
});

function applyMethodDecorator(
  controller: ControllerClass,
  methodName: string,
  decorator: MethodDecorator,
): void {
  const descriptor = Object.getOwnPropertyDescriptor(
    controller.prototype,
    methodName,
  );

  if (!descriptor) throw new Error(`Missing method descriptor: ${methodName}`);
  decorator(controller.prototype, methodName, descriptor);
}

function createContext(
  controller: ControllerClass,
  methodName: string,
  request: Record<string, unknown> = {},
): ExecutionContext {
  return {
    getClass: () => controller,
    getHandler: () =>
      (controller.prototype as Record<string, unknown>)[methodName],
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

function createUsersRepository(role?: 'ADMIN' | 'USER') {
  return {
    findById: jest.fn(async () =>
      role
        ? {
            role,
          }
        : null,
    ),
  } as unknown as jest.Mocked<UsersRepositoryPort>;
}
