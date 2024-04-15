import { OmitType, PartialType } from '@nestjs/swagger';
import { CreatePinDto } from './create-pin.dto';

export class UpdatePinDto extends PartialType(
  OmitType(CreatePinDto, [] as const),
) {}
