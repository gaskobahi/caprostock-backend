import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateReasonDto } from './create-reason.dto';

export class UpdateReasonDto extends PartialType(
  OmitType(CreateReasonDto, [] as const),
) {}
