// docs.controller.ts
import { Controller, Get, Header } from '@nestjs/common';
import { DocsService } from './docs.service';
import { type OpenAPIObject } from '@nestjs/swagger';
import { isPublic } from '../../shared-kernal/infrastructure/decorators/public.decorator';

@isPublic()
@Controller()
export class DocsController {
  constructor(private readonly docsService: DocsService) {}

  @Get('openapi.json')
  @Header('Content-Type', 'application/json')
  getSpec(): OpenAPIObject {
    return this.docsService.getDocument();
  }

  @Get('reference')
  @Header('Content-Type', 'text/html')
  getScalar(): string {
    return `
      <!doctype html>
      <html>
        <head>
          <title>Chat API Reference</title>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>
          <script
            id="api-reference"
            data-url="/api/openapi.json"
          ></script>
          <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
        </body>
      </html>
    `;
  }
}
