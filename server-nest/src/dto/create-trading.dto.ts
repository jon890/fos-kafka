import { ApiProperty } from '@nestjs/swagger';

export class CreateTradingDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  price: number;

  constructor(partial: Partial<CreateTradingDto>) {
    Object.assign(this, partial);
  }
}

export class CreateResourceTradingDto extends CreateTradingDto {
  @ApiProperty()
  type: number;

  constructor(partial: CreateResourceTradingDto) {
    super(partial);
    Object.assign(this, partial);
  }
}
