import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType, PickType } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  CreateInventoryCountDto,
  CreateProductToInventoryCountDto,
} from './create-inventory-count.dto';
import { HistoryToInventoryCount } from 'src/core/entities/stockmanagement/history-to-inventorycount.entity';
import { InventoryCountStatusEnum } from 'src/core/definitions/enums';

export class UpdateInventoryCountDto extends PartialType(
  OmitType(CreateInventoryCountDto, [,] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  status: InventoryCountStatusEnum

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateProductToInventoryCountDto)
  @ApiProperty({
    type: () => [UpdateProductToInventoryCountDto],
    description: `Liste des produits lorsqu'il s'agit d'un stock d'ajustment`,
  })
  productToInventoryCounts: UpdateProductToInventoryCountDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateHistoryToInventoryCountDto)
  @ApiProperty({
    type: () => [UpdateHistoryToInventoryCountDto],
    description: `Les differents historique  de cet inventaire de stock`,
  })
  historyToInventoryCounts: UpdateHistoryToInventoryCountDto[];
}

export class UpdateProductToInventoryCountDto extends PartialType(
  OmitType(CreateProductToInventoryCountDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}

export class UpdateHistoryToInventoryCountDto extends PickType(
  HistoryToInventoryCount,
  ['productId', 'counted', 'sku'] as const,
) {
  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, description: `Appartient deja à la liste` })
  isBelong: boolean;
}
