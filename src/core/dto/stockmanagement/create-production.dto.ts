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
import { ProductToProduction } from 'src/core/entities/stockmanagement/product-to-production.entity';

export class CreateProductionDto extends PickType(Production, [
  'branchId',
  'type',
] as const) {
  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateProductToProductionDto)
  @ApiProperty({
    type: () => [CreateProductToProductionDto],
    description: `Les differents produit de cet adjustement de stock`,
  })
  productToProductions: CreateProductToProductionDto[];
}

export class CreateProductToProductionDto extends PickType(
  ProductToProduction,
  ['productId', 'quantity', 'cost', 'sku'] as const,
) {}
