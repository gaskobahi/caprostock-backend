import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateConsultDto } from './create-consult.dto';

export class UpdateConsultDto extends PartialType(
  OmitType(CreateConsultDto, [] as const),
) {}
