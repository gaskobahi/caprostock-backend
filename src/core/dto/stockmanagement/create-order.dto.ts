import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Order } from '../../entities/stockmanagement/order.entity';
import { OrderToProduct } from '../../entities/stockmanagement/order-to-product.entity';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNotEmptyObject,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderStatusEnum } from 'src/core/definitions/enums';
import { OrderToAdditionalCost } from 'src/core/entities/stockmanagement/order-to-addtionnal-cost.entity';
import { CreateSupplierDto } from './create-supplier.dto';

export class OrderSupplierDto extends PartialType(
  OmitType(CreateSupplierDto, [] as const),
) {
  @IsNotEmpty()
  @IsUUID()
  @ValidateIf((p: CreateSupplierDto) => !p.firstName && !p.phoneNumber)
  @ApiPropertyOptional()
  id: string;
}

export class CreateOrderDto extends PickType(Order, [
  'reference',
  'date',
  'description',
  //'supplierId',
  'destinationBranchId',
] as const) {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date prévu de la reception` })
  plannedFor?: Date = new Date(Date.now() + 24 * 60 * 60 * 1000);

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

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderToAdditionalCostDto)
  @ApiProperty({
    type: () => [CreateOrderToAdditionalCostDto],
    description: `Cout additionel de la commande`,
  })
  orderToAdditionalCosts: CreateOrderToAdditionalCostDto[];
  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => OrderSupplierDto)
  @ApiProperty({ type: () => OrderSupplierDto })
  supplier: OrderSupplierDto;
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

export class CreateOrderToAdditionalCostDto extends PickType(
  OrderToAdditionalCost,
  ['amount', 'displayName'] as const,
) {}
