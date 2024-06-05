import { ApiProperty, PickType } from '@nestjs/swagger';
import { Reception } from '../../entities/stockmanagement/reception.entity';
import { ReceptionToProduct } from '../../entities/stockmanagement/reception-to-product.entity';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReceptionDto extends PickType(Reception, [
  'reference',
  'orderId',
] as const) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateReceptionToProductDto)
  @ApiProperty({
    type: () => [CreateReceptionToProductDto],
    description: `Produits de la commande`,
  })
  receptionToProducts: CreateReceptionToProductDto[];
}

export class CreateReceptionToProductDto extends PickType(ReceptionToProduct, [
  'quantity',
  'productId',
  'sku',
] as const) {}
