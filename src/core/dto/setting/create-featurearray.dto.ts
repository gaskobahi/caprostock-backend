import { ApiProperty, PickType } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { Feature } from 'src/core/entities/setting/feature.entity';

export class CreateFeatureArrayDto extends PickType(Feature, [] as const) {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateFeaturesDto)
  @ApiProperty({
    type: () => [CreateFeaturesDto],
    description: `Les features`,
  })
  features: CreateFeaturesDto[];
}

export class CreateFeaturesDto extends PickType(Feature, [
  'id',
  'pseudoName',
  'displayName',
  'description',
  'isEnable',
] as const) {}
