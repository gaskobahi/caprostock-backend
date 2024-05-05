import { PickType } from '@nestjs/swagger';
import { Loyalty } from 'src/core/entities/setting/loyalty.entity';

export class CreateLoyaltyDto extends PickType(Loyalty, [
  'uniqueName',
  'displayName',
  'pointBalance',
] as const) {}
