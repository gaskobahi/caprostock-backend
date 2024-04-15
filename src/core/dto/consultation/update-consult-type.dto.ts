import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateConsultTypeDto } from './create-consult-type.dto';

export class UpdateConsultTypeDto extends PartialType(
  OmitType(CreateConsultTypeDto, [] as const),
) {}
