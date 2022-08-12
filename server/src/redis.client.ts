import {
  Ctx,
  MessagePattern,
  Payload,
  RedisContext,
} from '@nestjs/microservices';

export default class RedisClient {
  constructor() {
    console.log('START REDIS CLIENT!!');
  }

  @MessagePattern('trading')
  getTrading(@Payload() data: any, @Ctx() context: RedisContext) {
    console.log(`Channel: ${context.getChannel()}`);
  }
}
