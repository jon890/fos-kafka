import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NodeRedisProvivderFacatory } from './node-redis.provider';

// TODO
// Sequlieze Module 등을 참고하여
// Redis Client 객체가 하나만 생성되도록 하기
@Module({
  imports: [ConfigModule],
  providers: [NodeRedisProvivderFacatory],
  exports: [NodeRedisProvivderFacatory],
})
export class RedisModule {}
