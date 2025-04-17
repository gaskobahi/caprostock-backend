import { ApiProperty, PickType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ReasonTypeEnum } from 'src/core/definitions/enums';
import { StockMovement } from 'src/core/entities/stockmovement/stockmovement.entity';

export class CreateStockMovementDto extends PickType(StockMovement, [
  'productId',
  'sku',
  'type',
  'quantity',
  'source',
  'sourceId',
  'branchId',
  'reference',
  'cost',
] as const) {
  @IsOptional()
  @ApiProperty({
    type: () => String,
    description: `raison du mouvement `,
  })
  reason?: ReasonTypeEnum;
  @IsOptional()
  @ApiProperty({
    type: () => Number,
    description: `cout total `,
  })
  @IsNumber()
  totalCost?: number;

  @IsOptional()
  @IsBoolean()
  isManual: boolean;
}
