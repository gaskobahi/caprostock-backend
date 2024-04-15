import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  CreateAttributeDto,
  CreateAttributeValueDto,
} from './create-attribute.dto';
import { IsArray, IsOptional, IsUUID, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateAttributeDto extends PartialType(
  OmitType(CreateAttributeDto, ['values'] as const),
) {
  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateAttributeValueDto)
  values: UpdateAttributeValueDto[];
}

export class UpdateAttributeValueDto extends PartialType(
  OmitType(CreateAttributeValueDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
