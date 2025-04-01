import { CreateEquipmentDto } from './create-equipment.dto';
import { OmitType, PartialType } from '@nestjs/swagger';

export class UpdateEquipmentDto extends PartialType(
  OmitType(CreateEquipmentDto, [] as const),
) {}
