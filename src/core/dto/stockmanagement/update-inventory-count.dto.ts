import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';

import {
  CreateInventoryCountDto,
  CreateProductToInventoryCountDto,
} from './create-inventory-count.dto';

export class UpdateInventoryCountDto extends PartialType(
  OmitType(CreateInventoryCountDto, ['historyToInventoryCounts'] as const),
) {}

export class UpdateProductToInventoryCountDto extends PartialType(
  OmitType(CreateProductToInventoryCountDto, [] as const),
) {
  @IsOptional()
  @IsUUID()
  @ApiProperty({ required: false })
  id: string;
}
