import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateLoyaltyDto } from './create-loyalty.dto';

export class UpdateLoyaltyDto extends PartialType(
  OmitType(CreateLoyaltyDto, [] as const),
) {}
