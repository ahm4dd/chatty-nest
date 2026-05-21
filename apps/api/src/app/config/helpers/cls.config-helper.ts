import { ExecutionContext } from '@nestjs/common';
import { ClsModuleOptions, ClsService } from 'nestjs-cls';
import { UwsRequest } from 'uwestjs';

export function createClsConfig(): ClsModuleOptions {
  return {
    global: true,
    interceptor: {
      mount: true,
      generateId: true,
      idGenerator: (context) => {
        const request = getRequestFromContext(context);
        const requestId = request.headers?.['x-request-id'];

        return typeof requestId === 'string' ? requestId : crypto.randomUUID();
      },
      setup: setupClsModule,
    },
  };
}

function setupClsModule(cls: ClsService, context: ExecutionContext): void {
  const request = getRequestFromContext(context);

  cls.set('requestId', cls.getId());
  cls.set('userAgent', request.headers?.['user-agent'] || 'unknown');
  cls.set('ip', request.ip || request.connection?.remoteAddress || 'unknown');
  cls.set('url', request.url || request.originalUrl || 'unknown');
  // TODO: add more context info if needed, e.g., correlationId, W3C headers and trace context, etc.
}

function getRequestFromContext(context: ExecutionContext): UwsRequest {
  return context.switchToHttp().getRequest<UwsRequest>();
}
