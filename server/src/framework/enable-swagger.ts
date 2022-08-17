import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/**
 * OpenApi Swagger 모듈을 초기화한다
 * @param app : Nest Application
 */
export function enableSwagger(app: INestApplication): INestApplication {
  const config = new DocumentBuilder()
    .setTitle('Trading Engine API')
    .setDescription('거래 체결 엔진 API를 제공하는 프로젝트 입니다')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    // extraModels: [ApiResultResponse, ApiErrorResponse],
  });
  SwaggerModule.setup('api-docs', app, document);

  return app;
}
