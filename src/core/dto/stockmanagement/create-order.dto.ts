import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
import { Order } from '../../entities/stockmanagement/order.entity';
import { OrderToProduct } from '../../entities/stockmanagement/order-to-product.entity';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatusEnum } from 'src/core/definitions/enums';

export class CreateOrderDto extends PickType(Order, [
  'reference',
  'date',
  'description',
  'supplierId',
  'destinationBranchId',
] as const) {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date prévu de la reception` })
  plannedFor: Date;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: true })
  action: OrderStatusEnum;

  @IsOptional()
  @ApiPropertyOptional({ description: `Statut` })
  @IsString()
  @ApiProperty({ required: false })
  status: OrderStatusEnum;

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
  'cost',
  'productId',
  'sku',
] as const) {
  @IsOptional()
  @IsNumber({}, { message: 'incoming must be a number' })
  toreceive: number;
}
