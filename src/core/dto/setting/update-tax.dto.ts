import { CreateTaxDto } from './create-tax.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export class UpdateTaxDto extends PartialType(
  OmitType(CreateTaxDto, [] as const),
) {}
