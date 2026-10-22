import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const DOCS_PATH = 'api/docs';

// Docs are on unless NODE_ENV=production; SWAGGER_ENABLED=true|false
// overrides, and any other non-empty value counts as false.
export function isSwaggerEnabled(env: NodeJS.ProcessEnv): boolean {
  if (env.SWAGGER_ENABLED) {
    return env.SWAGGER_ENABLED === 'true';
  }

  return env.NODE_ENV !== 'production';
}

// Serves the Swagger UI at /api/docs and the OpenAPI JSON at /api/docs/json.
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Trello-lite API')
    .setDescription('Task management API with Admin and Member roles.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(DOCS_PATH, app, document, {
    jsonDocumentUrl: `${DOCS_PATH}/json`,
    swaggerOptions: { persistAuthorization: true },
  });
}
