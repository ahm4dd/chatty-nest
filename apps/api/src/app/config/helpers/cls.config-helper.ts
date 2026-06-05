import { ExecutionContext } from '@nestjs/common';
import { ClsModuleOptions, ClsService } from 'nestjs-cls';
import { UwsRequest } from 'uwestjs';

export function createClsConfig(): ClsModuleOptions {
  return {
    global: true,
    guard: {
      mount: true,
      generateId: true,
      idGenerator: (context: ExecutionContext) => {
        const req = getRequestFromContext(context);
        const requestId = req.headers?.['x-request-id'];

        return typeof requestId === 'string' ? requestId : crypto.randomUUID();
      },
      setup: setupClsModule,
    },
  };
}

function setupClsModule(cls: ClsService, context: ExecutionContext): void {
  const req = getRequestFromContext(context);

  cls.set('requestId', cls.getId());
  cls.set('userAgent', req.headers?.['user-agent'] || 'unknown');
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedIp = Array.isArray(forwarded)
    ? forwarded[0]
    : forwarded?.split(',')[0]?.trim();

  cls.set('ip', forwardedIp || (req.headers['x-real-ip'] as string) || 'unknown');
  cls.set('url', req.url || 'unknown');
}

function getRequestFromContext(context: ExecutionContext): UwsRequest {
  return context.switchToHttp().getRequest<UwsRequest>();
}
