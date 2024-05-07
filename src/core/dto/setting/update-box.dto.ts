import { CreateBoxDto } from './create-box.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export class UpdateBoxDto extends PartialType(
  OmitType(CreateBoxDto, [] as const),
) {}
