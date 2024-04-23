import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateFeatureDto } from './create-feature.dto';

export class UpdateFeatureDto extends PartialType(
  OmitType(CreateFeatureDto, [] as const),
) {}
