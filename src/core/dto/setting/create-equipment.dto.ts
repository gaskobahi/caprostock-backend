import { ApiProperty, PickType } from '@nestjs/swagger';
import { Equipment } from '../../entities/setting/equipment.entity';
import { IsOptional, IsString } from 'class-validator';

export class CreateEquipmentDto extends PickType(Equipment, [
  'displayName',
] as const) {
  @IsOptional()
  @ApiProperty({
    type: () => String,
    description: ` type de l'équipement `,
  })
  equipmenttypeId: string;

  @IsOptional()
  @ApiProperty({
    type: () => String,
    description: ` section de lequipement `,
  })
  sectionId: string;

  @IsOptional()
  @IsString()
  @ApiProperty({
    type: () => String,
    description: ` description `,
  })
  description: string;
}
