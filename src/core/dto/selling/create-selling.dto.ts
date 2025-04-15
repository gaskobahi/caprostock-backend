import { ApiProperty, ApiPropertyOptional, PickType } from '@nestjs/swagger';
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
import { SellingStatusEnum } from 'src/core/definitions/enums';
import { Selling } from 'src/core/entities/selling/selling.entity';
import { SellingToProduct } from 'src/core/entities/selling/selling-to-product.entity';
import { SellingToAdditionalCost } from 'src/core/entities/selling/selling-to-addtionnal-cost.entity';

export class CreateSellingDto extends PickType(Selling, [
  'reference',
  'date',
  'description',
  'customerId',
  'destinationBranchId',
] as const) {
  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ description: `Date prévu de la reception` })
  plannedFor?: Date = new Date(Date.now() + 24 * 60 * 60 * 1000);

  @IsOptional()
  @IsString()
  @ApiProperty({ required: true })
  action: SellingStatusEnum;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: () => String,
    required: false,
    description: ` destination de la demande (equipement) `,
  })
  equipmentId: string;

  @IsOptional()
  @ApiPropertyOptional({ description: `Statut` })
  @IsString()
  @ApiProperty({ required: false })
  status: SellingStatusEnum;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CreateSellingToProductDto)
  @ApiProperty({
    type: () => [CreateSellingToProductDto],
    description: `Produits de la commande`,
  })
  sellingToProducts: CreateSellingToProductDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSellingToAdditionalCostDto)
  @ApiProperty({
    type: () => [CreateSellingToAdditionalCostDto],
    description: `Cout additionel de la commande`,
  })
  sellingToAdditionalCosts: CreateSellingToAdditionalCostDto[];
}

export class CreateSellingToProductDto extends PickType(SellingToProduct, [
  'quantity',
  'cost',
  'productId',
  'sku',
  'equipmentId',
] as const) {
  @IsOptional()
  @IsNumber({}, { message: 'incoming must be a number' })
  todelivery: number;
}

export class CreateSellingToAdditionalCostDto extends PickType(
  SellingToAdditionalCost,
  ['amount', 'displayName'] as const,
) {}
