import { ApiProperty, PickType } from '@nestjs/swagger';
import { Order } from '../../entities/supply/order.entity';
import { OrderToProduct } from '../../entities/supply/order-to-product.entity';
import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderDto extends PickType(Order, [
  'reference',
  'title',
  'date',
  'description',
  'source',
  'sourceBranchId',
  'sourceSupplierId',
  'saleId',
  'saleToProductId',
] as const) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateOrderToProductDto)
  @ApiProperty({
    type: () => [CreateOrderToProductDto],
    description: `Produits de la commande`,
  })
  orderToProducts: CreateOrderToProductDto[];
}

export class CreateOrderToProductDto extends PickType(OrderToProduct, [
  'quantity',
  'price',
  'productId',
] as const) {}
