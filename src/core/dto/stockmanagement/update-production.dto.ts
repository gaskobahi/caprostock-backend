import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  CreateProductionToProductDto,
  CreateProductionDto,
} from './create-production.dto';
import { Type } from 'class-transformer';

export class UpdateProductionDto extends PartialType(
  OmitType(CreateProductionDto, [,] as const),
) {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateProductionToProductDto)
  @ApiProperty({
    type: () => [UpdateProductionToProductDto],
    description: `Liste des produits lorsqu'il s'agit d'un stock d'ajustment`,
  })
  productionToProducts: UpdateProductionToProductDto[];
}

export class UpdateProductionToProductDto extends PartialType(
  OmitType(CreateProductionToProductDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
