import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOrderDto, CreateOrderToProductDto } from './create-order.dto';

export class UpdateOrderDto extends PartialType(
  OmitType(CreateOrderDto, [
    'reference',
    'date',
    'orderToProducts',
    'saleId',
    'saleToProductId',
  ] as const),
) {
  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateOrderToProductDto)
  @ApiProperty({
    type: () => [UpdateOrderToProductDto],
    description: `Produits de la commande`,
  })
  orderToProducts: UpdateOrderToProductDto[];
}

export class UpdateOrderToProductDto extends PartialType(
  OmitType(CreateOrderToProductDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
