import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
  PickType,
} from '@nestjs/swagger';
import { Reception } from '../../entities/stockmanagement/reception.entity';
import { ReceptionToProduct } from '../../entities/stockmanagement/reception-to-product.entity';
import {
  IsArray,
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
import { ReceptionToAdditionalCost } from 'src/core/entities/stockmanagement/reception-to-addtionnal-cost.entity';
import { CreateOrderToAdditionalCostDto } from './create-order.dto';
import { CreateSupplierDto } from './create-supplier.dto';

export class ReceptionSupplierDto extends PartialType(
  OmitType(CreateSupplierDto, [] as const),
) {
  @IsNotEmpty()
  @IsUUID()
  @ValidateIf((p: CreateSupplierDto) => !p.firstName && !p.phoneNumber)
  @ApiPropertyOptional()
  id: string;
}
export class CreateReceptionDto extends PickType(Reception, [
  'reference',
  // 'orderId',
  'date',
] as const) {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: `orderId optional si reception direct` })
  orderId?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: `permet de savoir si reception qui a genere la commande direct`,
  })
  orderSourceId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: `reference optional si reception direct`,
  })
  orderReference?: string;
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: ` destinationId si commande direct` })
  destinationBranchId?: string;

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

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateOrderToAdditionalCostDto)
  @ApiProperty({
    type: () => [CreateOrderToAdditionalCostDto],
    description: `Cout aditionel de la order`,
  })
  orderToAdditionalCosts: CreateOrderToAdditionalCostDto;

  @IsObject()
  @IsNotEmptyObject()
  @ValidateNested()
  @Type(() => ReceptionSupplierDto)
  @ApiProperty({ type: () => ReceptionSupplierDto })
  supplier: ReceptionSupplierDto;
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
