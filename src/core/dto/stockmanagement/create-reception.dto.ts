import { ApiProperty, PickType } from '@nestjs/swagger';
import { Reception } from '../../entities/stockmanagement/reception.entity';
import { ReceptionToProduct } from '../../entities/stockmanagement/reception-to-product.entity';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ReceptionToAdditionalCost } from 'src/core/entities/stockmanagement/reception-to-addtionnal-cost.entity';

export class CreateReceptionDto extends PickType(Reception, [
  'reference',
  'orderId',
  'date',
] as const) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateReceptionToProductDto)
  @ApiProperty({
    type: () => [CreateReceptionToProductDto],
    description: `Produits de la reception`,
  })
  receptionToProducts: CreateReceptionToProductDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateReceptionToAdditionalCostDto)
  @ApiProperty({
    type: () => [CreateReceptionToAdditionalCostDto],
    description: `Cout aditionel de la reception`,
  })
  receptionToAdditionalCosts: CreateReceptionToAdditionalCostDto[];
}

export class CreateReceptionToProductDto extends PickType(ReceptionToProduct, [
  'quantity',
  'productId',
  'sku',
  'cost',
] as const) {}

export class CreateReceptionToAdditionalCostDto extends PickType(
  ReceptionToAdditionalCost,
  ['orderToAdditionalCostId', 'amount'] as const,
) {}
