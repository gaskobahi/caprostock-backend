import { PickType } from '@nestjs/swagger';
import { Selling } from 'src/core/entities/selling/selling.entity';

export class ValidateSellingDto extends PickType(Selling, [
  'remark',
] as const) {}
