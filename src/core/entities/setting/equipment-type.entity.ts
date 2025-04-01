import { Column, Entity, Index, OneToMany } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { CoreEntity } from '../base/core.entity';
import { instanceToPlain } from 'class-transformer';
import { Equipment } from './equipment.entity';

@Entity({
  orderBy: { createdAt: 'DESC', updatedAt: 'DESC' },
})
export class EquipmentType extends CoreEntity {
  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Name` })
  @Index()
  @Column({ name: 'name' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: `Libellé` })
  @Column({ name: 'display_name' })
  displayName: string;

  @ApiProperty({ required: false, type: () => [Equipment] })
  @OneToMany(() => Equipment, (equipment) => equipment.equipmentType, {
    cascade: true,
  })
  equipments: Equipment[];
  toJSON() {
    return instanceToPlain(this);
  }
  // END Methods **************************************
}
