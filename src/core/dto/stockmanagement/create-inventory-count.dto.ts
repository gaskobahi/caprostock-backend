import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InventoryCount } from 'src/core/entities/stockmanagement/inventorycount.entity';
import { ProductToInventoryCount } from 'src/core/entities/stockmanagement/product-to-inventoryCount.entity';
import { InventoryCountTypeEnum } from 'src/core/definitions/enums';
import { HistoryToInventoryCount } from 'src/core/entities/stockmanagement/history-to-inventorycount.entity';

export class CreateInventoryCountDto extends PickType(InventoryCount, [
  'branchId',
  'type',
] as const) {
  @IsOptional()
  @ApiProperty({ required: false })
  @IsString()
  status: string;
  @IsOptional()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateIf(
    (p: CreateInventoryCountDto) => p.type == InventoryCountTypeEnum.partial,
  )
  @ValidateNested()
  @Type(() => CreateProductToInventoryCountDto)
  @ApiProperty({
    type: () => [CreateProductToInventoryCountDto],
    description: `Les differents produit de cet inventaire de stock`,
  })
  productToInventoryCounts: CreateProductToInventoryCountDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateHistoryToInventoryCountDto)
  @ApiProperty({
    type: () => [CreateHistoryToInventoryCountDto],
    description: `Les differents produit de cet inventaire de stock`,
  })
  historyToInventoryCounts: CreateHistoryToInventoryCountDto[];
}

export class CreateProductToInventoryCountDto extends PickType(
  ProductToInventoryCount,
  ['productId', 'inStock', 'sku'] as const,
) {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Appartient deja à la liste` })
  isBelong: boolean;

  @IsNotEmpty()
  @ApiProperty({ required: false })
  @IsBoolean()
  hasVariant: boolean;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsNumber()
  counted: number;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsNumber()
  difference: number;

  @IsOptional()
  @ApiProperty({ required: false })
  @IsNumber()
  differenceCost: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  variantId: string;
}

export class CreateHistoryToInventoryCountDto extends PickType(
  HistoryToInventoryCount,
  ['productId', 'sku'] as const,
) {
  @IsOptional()
  @ApiProperty({ required: false })
  @IsNumber()
  quantity: number;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Appartient deja à la liste` })
  isBelong: boolean;
}
