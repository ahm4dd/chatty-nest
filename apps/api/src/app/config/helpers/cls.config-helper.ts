import { ClsModuleOptions, ClsService } from 'nestjs-cls';

export function createClsConfig(): ClsModuleOptions {
  return {
    global: true,
    middleware: {
      mount: true,
      generateId: true,
      idGenerator: (req) => {
        return req.headers['x-request-id'] || crypto.randomUUID();
      },
      setup: setupClsModule,
    },
  };
}

// TODO: replace `any` with the actual type of the request object, e.g., `Request` from Express or Fastify, etc.
function setupClsModule(cls: ClsService, request: any): void {
  cls.set('requestId', cls.getId());
  cls.set('userAgent', request.headers['user-agent'] || 'unknown');
  cls.set('ip', request.ip || request.connection.remoteAddress || 'unknown');
  cls.set('url', request.url || request.originalUrl || 'unknown');
  // TODO: add more context info if needed, e.g., correlationId, W3C headers and trace context, etc.
}
