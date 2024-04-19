import { PickType } from '@nestjs/swagger';
import { Discount } from '../../entities/product/discount.entity';

export class CreateDiscountDto extends PickType(Discount, [
  'displayName',
  'type',
  'posaccess',
  'value'
] as const) {}
