import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  CreateProductToStockAdjustmentDto,
  CreateStockAdjustmentDto,
} from './create-stock-adjustment.dto';
import { Type } from 'class-transformer';

export class UpdateStockAdjustmentDto extends PartialType(
  OmitType(CreateStockAdjustmentDto, [,] as const),
) {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateProductToStockAdjustmentDto)
  @ApiProperty({
    type: () => [UpdateProductToStockAdjustmentDto],
    description: `Liste des produits lorsqu'il s'agit d'un stock d'ajustment`,
  })
  productToStockAdjustments: UpdateProductToStockAdjustmentDto[];
}

export class UpdateProductToStockAdjustmentDto extends PartialType(
  OmitType(CreateProductToStockAdjustmentDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
