import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  CreateProductToProductionDto,
  CreateProductionDto,
} from './create-production.dto';
import { Type } from 'class-transformer';

export class UpdateProductionDto extends PartialType(
  OmitType(CreateProductionDto, [,] as const),
) {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateProductToProductionDto)
  @ApiProperty({
    type: () => [UpdateProductToProductionDto],
    description: `Liste des produits lorsqu'il s'agit d'un stock d'ajustment`,
  })
  productToProductions: UpdateProductToProductionDto[];
}

export class UpdateProductToProductionDto extends PartialType(
  OmitType(CreateProductToProductionDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
