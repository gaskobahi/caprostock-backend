import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStockMovementDto } from './create-stockMovement.dto';

export class UpdateStockMovementDto extends PartialType(
  OmitType(CreateStockMovementDto, [] as const),
) {}
