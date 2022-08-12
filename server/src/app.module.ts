import { Module } from '@nestjs/common';
import RedisClient from './redis.client';

@Module({
  imports: [],
  controllers: [],
  providers: [RedisClient],
})
export class AppModule {}
