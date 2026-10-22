import { Module, ValidationPipe } from '@nestjs/common';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { AuthModule } from './auth/auth.module.js';
import { BoardsModule } from './boards/boards.module.js';
import { ApiExceptionFilter } from './common/http/api-exception.filter.js';
import { validationExceptionFactory } from './common/http/validation-exception.factory.js';
import { UsersModule } from './users/users.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: 'YOUR_APP_KEY',
      appSecret: 'YOUR_APP_SECRET',
      serviceId: 'nestjs-ai-training',
    }),
    UsersModule,
    AuthModule,
    BoardsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      // whitelist strips unknown fields (e.g. a client-supplied `role`).
      useValue: new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: validationExceptionFactory,
      }),
    },
    // Formats every error as `{ errors: { code, message, details? } }`.
    { provide: APP_FILTER, useClass: ApiExceptionFilter },
  ],
})
export class AppModule {}
