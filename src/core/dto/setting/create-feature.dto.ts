import { PickType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { Feature } from 'src/core/entities/setting/feature.entity';

export class CreateFeatureDto extends PickType(Feature, [
  'pseudoName',
  'displayName',
  'description',
  'isEnable',
] as const) {}
