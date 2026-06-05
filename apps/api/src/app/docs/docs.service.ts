// docs.service.ts
import { Injectable } from '@nestjs/common';
import { OpenAPIObject } from '@nestjs/swagger';

@Injectable()
export class DocsService {
  private document: OpenAPIObject | null = null;

  setDocument(doc: OpenAPIObject): void {
    this.document = doc;
  }

  getDocument(): OpenAPIObject {
    if (!this.document) {
      throw new Error('OpenAPI document has not been initialized.');
    }
    return this.document;
  }
}
