import { Module } from '@nestjs/common';
import { Metaverse2ApiClient } from './metaverse2-api.client';

/**
 * 메타버스2의 다른 서비스를 호출할 클라이언트를 관리하는 모듈
 */
@Module({
  controllers: [],
  providers: [Metaverse2ApiClient],
  exports: [Metaverse2ApiClient],
})
export class Metaverse2ClientModule {}
