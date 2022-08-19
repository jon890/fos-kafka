import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { OUTER_SERVICE } from './constants/service.const';
import { CustomRpcExceptionFilter } from './exception/custom-rpc-exception.filter';
import { enableSwagger } from './framework/enable-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app
    .useGlobalFilters(new CustomRpcExceptionFilter())
    .connectMicroservice<MicroserviceOptions>({
      transport: Transport.REDIS,
      options: {
        host: OUTER_SERVICE.REDIS_TRADING.name,
        port: OUTER_SERVICE.REDIS_TRADING.port,
      },
    });

  enableSwagger(app);

  await app.startAllMicroservices();
  await app.listen(3001, () => {
    Logger.debug('🔥 Nest Application Listening on http://localhost:3001');
  });
}

bootstrap();
