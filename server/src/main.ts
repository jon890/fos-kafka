import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CustomRpcExceptionFilter } from './exception/custom-rpc-exception.filter';
import { enableSwagger } from './framework/enable-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new CustomRpcExceptionFilter());

  enableSwagger(app);

  await app.listen(3001, () => {
    Logger.debug('🔥 Nest Application Listening on http://localhost:3001');
  });
}

bootstrap();
