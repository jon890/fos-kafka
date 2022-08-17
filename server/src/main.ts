import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { OUTER_SERVICE } from './constants/service.const';
import { TradingModule } from './trading/trading.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const microService =
    await NestFactory.createMicroservice<MicroserviceOptions>(TradingModule, {
      transport: Transport.REDIS,
      options: {
        host: OUTER_SERVICE.REDIS_TRADING.name,
        port: OUTER_SERVICE.REDIS_TRADING.port,
        retryAttempts: 5,
        retryDelay: 10,
      },
    });

  app.connectMicroservice(microService);

  await app.startAllMicroservices();
  await app.listen(3001, () => {
    console.log('🔥 Nest Application Listening on http://localhost:3001');
  });
}

bootstrap();
