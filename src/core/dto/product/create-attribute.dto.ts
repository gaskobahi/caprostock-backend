import { ApiProperty, PickType } from '@nestjs/swagger';
import { Attribute } from '../../entities/product/attribute.entity';
import { AttributeValue } from '../../entities/product/attribute-value.entity';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAttributeDto extends PickType(Attribute, [
  'displayName',
  'description',
] as const) {
  @IsOptional()
  @IsArray()
  @ApiProperty({
    type: () => [CreateAttributeValueDto],
    description: `Valeurs de l'attribut`,
  })
  @IsArray()
  @ValidateNested()
  @Type(() => CreateAttributeValueDto)
  values: CreateAttributeValueDto[];
}

export class CreateAttributeValueDto extends PickType(AttributeValue, [
  'value',
  'rank',
] as const) {}
