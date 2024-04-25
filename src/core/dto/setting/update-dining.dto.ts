import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateDiningDto } from './create-dining.dto';

export class UpdateDiningDto extends PartialType(
  OmitType(CreateDiningDto, [] as const),
) {}
