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
} from './create-inventory-count.dto';

export class UpdateInventoryCountDto extends PartialType(
  OmitType(CreateInventoryCountDto, [,] as const),
) {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => UpdateProductToInventoryCountDto)
  @ApiProperty({
    type: () => [UpdateProductToInventoryCountDto],
    description: `Liste des produits lorsqu'il s'agit d'un stock d'ajustment`,
  })
  productToInventoryCounts: UpdateProductToInventoryCountDto[];
}

export class UpdateProductToInventoryCountDto extends PartialType(
  OmitType(CreateProductToInventoryCountDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
