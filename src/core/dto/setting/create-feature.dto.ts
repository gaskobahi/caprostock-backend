import { PickType } from '@nestjs/swagger';
import { Feature } from 'src/core/entities/setting/feature.entity';

export class CreateFeatureDto extends PickType(Feature, [
  'pseudoName',
  'displayName',
  'description',
  'isEnable',
] as const) {}
