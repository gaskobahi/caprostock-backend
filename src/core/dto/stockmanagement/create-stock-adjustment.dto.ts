import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StockAdjustment } from 'src/core/entities/stockmanagement/stockadjustment.entity';
import { ProductToStockAdjustment } from 'src/core/entities/stockmanagement/product-to-stockadjustment.entity';

export class CreateStockAdjustmentDto extends PickType(StockAdjustment, [
  'reasonId',
  'branchId',
] as const) {
  @IsOptional()
  @IsString()
  description: string;
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateProductToStockAdjustmentDto)
  @ApiProperty({
    type: () => [CreateProductToStockAdjustmentDto],
    description: `Les differents produit de cet adjustement de stock`,
  })
  productToStockAdjustments: CreateProductToStockAdjustmentDto[];
}

export class CreateProductToStockAdjustmentDto extends PickType(
  ProductToStockAdjustment,
  ['productId', 'quantity', 'cost'] as const,
) {
  @IsOptional()
  @IsNumber()
  sku: number;
  @IsOptional()
  @IsNumber()
  inStock: number;
  @IsOptional()
  @IsBoolean()
  hasVariant: boolean;
  @IsOptional()
  @IsBoolean()
  variantId: string;
}
