import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Production } from 'src/core/entities/stockmanagement/production.entity';
import { ProductionToProduct } from 'src/core/entities/stockmanagement/production-to-product.entity';

export class CreateProductionDto extends PickType(Production, [
  'destinationBranchId',
  'type',
] as const) {
  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateProductionToProductDto)
  @ApiProperty({
    type: () => [CreateProductionToProductDto],
    description: `Les differents produit de cet adjustement de stock`,
  })
  productionToProducts: CreateProductionToProductDto[];
}

export class CreateProductionToProductDto extends PickType(
  ProductionToProduct,
  ['productId', 'quantity', 'cost', 'sku'] as const,
) {}
