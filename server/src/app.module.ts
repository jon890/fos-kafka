import { Module } from '@nestjs/common';
import { TradingRestModule } from './rest/trading-rest.module';
import { TradingModule } from './trading/trading.module';

@Module({
  imports: [TradingRestModule, TradingModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
