import { Catch, ExceptionFilter, ArgumentsHost, Logger, HttpException } from '@nestjs/common';
import type { UwsResponse } from 'uwestjs';

@Catch()
export class ExceptionLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger(ExceptionLoggingFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<{ method?: string; url?: string }>();
    const response = ctx.getResponse<UwsResponse>();

    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    this.logger.error(
      `${status} ${exception instanceof Error ? exception.message : String(exception)}`,
      exception instanceof Error ? exception.stack : undefined,
      `Request: ${request?.method ?? 'UNKNOWN'} ${request?.url ?? 'UNKNOWN'}`,
    );

    response.status(status).json(
      exception instanceof HttpException
        ? exception.getResponse()
        : { statusCode: 500, message: 'Internal server error' },
    );
  }
}
