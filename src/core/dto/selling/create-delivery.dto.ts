import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Delivery } from 'src/core/entities/selling/delivery.entity';
import { DeliveryToProduct } from 'src/core/entities/selling/delivery-to-product.entity';
import { DeliveryToAdditionalCost } from 'src/core/entities/selling/delivery-to-addtionnal-cost.entity';
import { CreateCustomerDto } from './create-customer.dto';
import { CreateSellingToAdditionalCostDto } from './create-selling.dto';

export class DeliveryTransportDto extends PartialType(
  OmitType(CreateCustomerDto, [] as const),
) {
  @IsNotEmpty()
  @IsUUID()
  @ValidateIf((p: CreateCustomerDto) => !p.firstName && !p.phoneNumber)
  @ApiPropertyOptional()
  id: string;
}
export class CreateDeliveryDto extends PickType(Delivery, [
  'reference',
  //'transporterId',
  'description',
] as const) {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `sellingId optional si vente direct` })
  sellingId?: string;
  //@IsOptional()
  //@IsString()
  //@ApiPropertyOptional({ description: `sellingId optional si vente direct` })
  transporterId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `client destination si vente` })
  destinationBranchId?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date prévu de la reception` })
  plannedFor?: Date;

  @IsOptional()
  @IsDateString()
  @ApiProperty({ description: `date de la sortie` })
  date: Date;
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

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSellingToAdditionalCostDto)
  @ApiProperty({
    type: () => [CreateSellingToAdditionalCostDto],
    description: `Cout aditionel de la selling`,
  })
  sellingToAdditionalCosts: CreateSellingToAdditionalCostDto;

  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => DeliveryTransportDto)
  @ApiProperty({ type: () => DeliveryTransportDto })
  transporter: DeliveryTransportDto;
}

export class CreateDeliveryToProductDto extends PickType(DeliveryToProduct, [
  'quantity',
  'productId',
  'equipmentId',
  'sku',
  'cost',
] as const) {}

export class CreateDeliveryToAdditionalCostDto extends PickType(
  DeliveryToAdditionalCost,
  ['sellingToAdditionalCostId', 'amount'] as const,
) {}
