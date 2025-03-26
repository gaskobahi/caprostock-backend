import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Delivery } from 'src/core/entities/selling/delivery.entity';
import { DeliveryToProduct } from 'src/core/entities/selling/delivery-to-product.entity';
import { DeliveryToAdditionalCost } from 'src/core/entities/selling/delivery-to-addtionnal-cost.entity';

export class CreateDeliveryDto extends PickType(Delivery, [
  'reference',
  'sellingId',
] as const) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateDeliveryToProductDto)
  @ApiProperty({
    type: () => [CreateDeliveryToProductDto],
    description: `Produits de la delivery`,
  })
  deliveryToProducts: CreateDeliveryToProductDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateDeliveryToAdditionalCostDto)
  @ApiProperty({
    type: () => [CreateDeliveryToAdditionalCostDto],
    description: `Cout aditionel de la delivery`,
  })
  deliveryToAdditionalCosts: CreateDeliveryToAdditionalCostDto[];
}

export class CreateDeliveryToProductDto extends PickType(DeliveryToProduct, [
  'quantity',
  'productId',
  'sku',
] as const) {}

export class CreateDeliveryToAdditionalCostDto extends PickType(
  DeliveryToAdditionalCost,
  ['sellingToAdditionalCostId'] as const,
) {}
