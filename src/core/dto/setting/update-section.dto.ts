import { CreateSectionDto } from './create-section.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export class UpdateSectionDto extends PartialType(
  OmitType(CreateSectionDto, [] as const),
) {}
