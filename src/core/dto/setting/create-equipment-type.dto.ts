import { PickType } from '@nestjs/swagger';
import { EquipmentType } from 'src/core/entities/setting/equipment-type.entity';

export class CreateEquipmentTypeDto extends PickType(EquipmentType, [
  'name',
  'displayName',
] as const) {}
