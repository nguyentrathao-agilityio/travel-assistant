import { type INestApplication, NotFoundException } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { toErrorResponse } from './common/http/api-exception.filter.js';
import {
  DOCS_PATH,
  isSwaggerEnabled,
  setupSwagger,
} from './common/swagger/setup-swagger.js';

export const API_PREFIX = 'api/v1';

function isUnder(path: string, base: string): boolean {
  return path === `/${base}` || path.startsWith(`/${base}/`);
}

// App-level settings that cannot live in a module. Used by main.ts and e2e
// tests so both serve the same routes.
export function configureApp<T extends INestApplication>(app: T): T {
  app.setGlobalPrefix(API_PREFIX);
  const docsEnabled = isSwaggerEnabled(process.env);

  // Nest only handles unknown routes under the prefix; without this, other
  // paths get Express's default HTML 404 instead of the error envelope.
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (
      isUnder(req.path, API_PREFIX) ||
      (docsEnabled && isUnder(req.path, DOCS_PATH))
    ) {
      return next();
    }
    const { status, body } = toErrorResponse(
      new NotFoundException(`Cannot ${req.method} ${req.path}`),
    );
    res.status(status).json(body);
  });

  if (docsEnabled) {
    setupSwagger(app);
  }

  return app;
}
