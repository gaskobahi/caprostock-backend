import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  CreateInventoryCountDto,
  CreateProductToInventoryCountDto,
  CreateHistoryToInventoryCountDto,
} from './create-inventory-count.dto';
import { InventoryCountStatusEnum } from 'src/core/definitions/enums';

export class UpdateInventoryCountDto extends PartialType(
  OmitType(CreateInventoryCountDto, [,] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  status: InventoryCountStatusEnum;

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

export class UpdateHistoryToInventoryCountDto extends PartialType(
  OmitType(CreateHistoryToInventoryCountDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
