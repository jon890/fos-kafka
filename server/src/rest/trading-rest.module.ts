import { Module } from '@nestjs/common';
import { TradingModule } from 'src/trading/trading.module';
import { TradingService } from 'src/trading/trading.service';
import { TradingRestController } from './trading-rest.controller';

@Module({
  imports: [TradingModule],
  controllers: [TradingRestController],
  providers: [TradingService],
})
export class TradingRestModule {}
