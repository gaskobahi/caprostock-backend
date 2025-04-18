import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDiscountDto } from './create-discount.dto';

export class UpdateDiscountDto extends PartialType(
  OmitType(CreateDiscountDto, [] as const),
) {}
